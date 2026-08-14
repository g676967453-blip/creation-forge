"""
batch_generate_buildings.py — 建筑皮肤批量生成编排

输入 prompts JSON（data/castle_skins_prompts.json），按「同一 prompt 跑 N 次」
方法论调用 Lovart chat 生成变体。特性：
  - 并发 5（Lovart 实测上限 5-6），波间间隔 batch-gap 秒
  - progress.jsonl 追加式进度，支持断点续跑（跳过已 done 且文件存在者）
  - 错误码处理：1200000200 指数退避重试；1200000136/146 计费错误立即中止
  - chat 超时 → result --thread-id 续查
  - 每任务独立 tmp 下载目录，完成后移动到 {skin}_v1_{seq}.png

用法：
  python batch_generate_buildings.py \
    --prompts data/castle_skins_prompts.json \
    --output-dir outputs/buildings/castle-skins/_drafts \
    --progress outputs/buildings/castle-skins/_drafts/progress.jsonl \
    --concurrency 5 --variants 5 --batch-gap 30 \
    --skin-filter penglai-isle,canal-water-town   # 可选：只跑指定皮肤（试点）
    --dry-run                                     # 只打印任务清单不调 API

依赖：仅标准库。LOVART_ACCESS_KEY / LOVART_SECRET_KEY 从父进程环境继承。
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

SKILL_DIR = Path("C:/Users/admin/.claude/skills/lovart-api")
SKILL_CLI = SKILL_DIR / "agent_skill.py"

ERR_CONCURRENT = "1200000200"   # 并发任务上限
ERR_NO_CREDITS = "1200000136"   # 积分不足
ERR_NO_QUOTA = "1200000146"     # 免费额度用完


def log(msg: str):
    print(f"[batch] {msg}", flush=True)


def append_progress(progress_path: Path, entry: dict):
    with open(progress_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def load_done(progress_path: Path):
    """读取进度文件 → {(skin, seq): 最后一条记录}"""
    done = {}
    if not progress_path.exists():
        return done
    with open(progress_path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue  # 容错坏行
            done[(rec.get("skin"), rec.get("seq"))] = rec
    return done


def run_cli(args: list, timeout: int):
    """运行 agent_skill.py，返回 (stdout, stderr, returncode)。超时返回 (None, None, 'timeout')"""
    try:
        p = subprocess.run(
            [sys.executable, str(SKILL_CLI)] + args,
            capture_output=True, text=True, encoding="utf-8", errors="replace",
            timeout=timeout,
        )
        return p.stdout, p.stderr, p.returncode
    except subprocess.TimeoutExpired as e:
        out = (e.stdout or b"") if isinstance(e.stdout, bytes) else (e.stdout or "")
        return out, "", "timeout"


def parse_chat_json(stdout: str):
    """从 chat 输出中提取最外层 JSON 对象（输出为 pretty-print 且含嵌套对象）"""
    if not stdout:
        return None
    start = stdout.find("{")
    if start < 0:
        return None
    try:
        # raw_decode 解析第一个完整 JSON 值，自动忽略尾部多余内容
        obj, _ = json.JSONDecoder().raw_decode(stdout[start:])
        return obj
    except json.JSONDecodeError:
        return None


def check_fatal_error(text: str):
    """返回计费/权限类致命错误码，否则 None"""
    for code in (ERR_NO_CREDITS, ERR_NO_QUOTA):
        if code in text:
            return code
    return None


def generate_task(skin: dict, seq: int, output_dir: Path, tmp_base: Path,
                  model: str, chat_timeout: int, result_retries: int,
                  result_interval: int, progress_path: Path):
    """生成单个变体。返回 True 表示成功。"""
    skin_id, prompt = skin["id"], skin["prompt_en"]
    fname = f"{skin_id}_v1_{seq}.png"
    final_path = output_dir / fname
    tmpdir = tmp_base / f"{skin_id}_v1_{seq}"
    tmpdir.mkdir(parents=True, exist_ok=True)
    prefer = json.dumps({"IMAGE": [model]}, separators=(",", ":"))

    def record(status: str, **extra):
        entry = {"skin": skin_id, "seq": seq, "status": status,
                 "attempts": attempts, "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}
        entry.update(extra)
        append_progress(progress_path, entry)

    attempts = 0
    while attempts < 3:
        attempts += 1
        if attempts > 1:
            backoff = min(30 * attempts, 120)
            log(f"{fname} 第 {attempts} 次尝试，退避 {backoff}s（并发限流）")
            time.sleep(backoff)
        record("running", thread_id=None, local_path=None, error=None)
        stdout, stderr, rc = run_cli(
            ["chat", "--prompt", prompt, "--prefer-models", prefer,
             "--json", "--download", "--output-dir", str(tmpdir)],
            timeout=chat_timeout + 60,
        )
        combined = (stdout or "") + "\n" + (stderr or "")

        # 计费类错误 → 全跑中止
        fatal = check_fatal_error(combined)
        if fatal:
            log(f"致命错误 {fatal}（积分/额度不足），中止全部任务")
            record("failed", error=fatal)
            return "ABORT"

        data = parse_chat_json(stdout or "")
        thread_id = (data or {}).get("thread_id")
        final_status = (data or {}).get("final_status")

        # 并发限流 → 退避重试
        if ERR_CONCURRENT in combined or final_status == "concurrent_limit":
            record("retry", error=ERR_CONCURRENT, thread_id=thread_id)
            continue

        if rc == "timeout" or final_status == "timeout":
            record("timeout", thread_id=thread_id)
            # 续查循环
            if thread_id:
                for i in range(result_retries):
                    log(f"{fname} 超时，result 续查 {i+1}/{result_retries}")
                    time.sleep(result_interval)
                    out2, err2, rc2 = run_cli(
                        ["result", "--thread-id", thread_id, "--json",
                         "--download", "--output-dir", str(tmpdir)],
                        timeout=120,
                    )
                    d2 = parse_chat_json(out2 or "")
                    if (d2 or {}).get("final_status") == "done":
                        data = d2
                        break
                else:
                    record("failed", error="timeout after result retries", thread_id=thread_id)
                    return False

        # 成功 → 移动文件到最终位置
        if (data or {}).get("final_status") == "done":
            local = None
            for dl in (data.get("downloaded") or []):
                local = dl.get("local_path") or local
            url = None
            for dl in (data.get("downloaded") or []):
                url = dl.get("url") or url
            if local and Path(local).exists():
                Path(local).replace(final_path)
                record("done", thread_id=data.get("thread_id"), url=url,
                       local_path=str(final_path))
                log(f"OK {fname} ({final_path.stat().st_size//1024} KB)")
                return True
            record("failed", error="downloaded file missing", thread_id=thread_id)
            return False

        # pending_confirmation → 停下问人
        if final_status == "pending_confirmation":
            record("pending", thread_id=thread_id, error="需用户确认后 confirm")
            log(f"{fname} 需要确认（pending_confirmation），thread={thread_id}，跳过并记录")
            return False

        # 其他未知失败
        record("failed", error=(stderr or stdout or "unknown")[:300], thread_id=thread_id)
        log(f"FAIL {fname}: {(stderr or '')[:200]}")
        return False

    record("failed", error="max retries (concurrent limit)", thread_id=thread_id)
    return False


def main():
    parser = argparse.ArgumentParser(description="建筑皮肤批量生成编排")
    parser.add_argument("--prompts", required=True, help="prompts JSON 路径")
    parser.add_argument("--output-dir", required=True, help="输出目录（纯英文路径）")
    parser.add_argument("--progress", help="进度文件路径（默认 output-dir/progress.jsonl）")
    parser.add_argument("--concurrency", type=int, default=5)
    parser.add_argument("--variants", type=int, default=5)
    parser.add_argument("--batch-gap", type=int, default=30, help="波间间隔秒")
    parser.add_argument("--model", default="generate_image_gpt_image_2")
    parser.add_argument("--chat-timeout", type=int, default=300, help="chat CLI 轮询超时秒")
    parser.add_argument("--result-retries", type=int, default=10)
    parser.add_argument("--result-interval", type=int, default=30)
    parser.add_argument("--skin-filter", help="逗号分隔的 skin id 列表（只跑这些）")
    parser.add_argument("--dry-run", action="store_true", help="只打印任务清单不调 API")
    args = parser.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    if not SKILL_CLI.exists():
        log(f"ERROR: 找不到 Lovart skill CLI：{SKILL_CLI}")
        sys.exit(1)

    data = json.load(open(args.prompts, encoding="utf-8"))
    skins = data["skins"]
    if args.skin_filter:
        keep = {s.strip() for s in args.skin_filter.split(",") if s.strip()}
        skins = [s for s in skins if s["id"] in keep]
        log(f"只处理 {len(skins)} 个皮肤：{', '.join(s['id'] for s in skins)}")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    tmp_base = output_dir / "_tmp"
    tmp_base.mkdir(parents=True, exist_ok=True)
    progress_path = Path(args.progress) if args.progress else output_dir / "progress.jsonl"

    # 任务清单
    tasks = []
    done = load_done(progress_path)
    for skin in skins:
        n = skin.get("variants", args.variants)
        for seq in range(1, n + 1):
            prev = done.get((skin["id"], seq))
            fname = f"{skin['id']}_v1_{seq}.png"
            if prev and prev.get("status") == "done" and (output_dir / fname).exists():
                continue  # 断点续跑：跳过已完成
            tasks.append((skin, seq))
    log(f"待跑任务 {len(tasks)} 个（并发 {args.concurrency}，波间隔 {args.batch_gap}s）")

    if args.dry_run:
        for skin, seq in tasks:
            print(f"  - {skin['id']}_v1_{seq}.png | {skin['name_zh']} | {skin['prompt_en'][:60]}...")
        sys.exit(0)
    if not tasks:
        log("无待跑任务（全部已完成）")
        sys.exit(0)

    # 波次执行（每波 concurrency 个并行 subprocess 由 run_cli 阻塞 → 简单按波串行提交）
    # 简化实现：每波内顺序调用 run_cli（每次独立进程轮询），波间 sleep batch_gap。
    # 注：chat 本身阻塞轮询，波内串行等待与并行等待总时长相近，且天然规避并发超限。
    import concurrent.futures
    fatal_abort = False
    total, ok = len(tasks), 0
    for i in range(0, total, args.concurrency):
        wave = tasks[i:i + args.concurrency]
        log(f"波次 {i // args.concurrency + 1}/{(total + args.concurrency - 1) // args.concurrency}："
            f"{', '.join(s['id'] + f'_{seq}' for s, seq in wave)}")
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as ex:
            futures = [ex.submit(generate_task, skin, seq, output_dir, tmp_base,
                                 args.model, args.chat_timeout, args.result_retries,
                                 args.result_interval, progress_path)
                       for skin, seq in wave]
            for fut in concurrent.futures.as_completed(futures):
                r = fut.result()
                if r == "ABORT":
                    fatal_abort = True
                elif r is True:
                    ok += 1
        if fatal_abort:
            log("检测到计费类致命错误，中止。进度已保留，可切模式后续跑。")
            sys.exit(2)
        if i + args.concurrency < total:
            log(f"波间隔 {args.batch_gap}s ...")
            time.sleep(args.batch_gap)

    log(f"完成：成功 {ok}/{total}。进度文件：{progress_path}")


if __name__ == "__main__":
    main()
