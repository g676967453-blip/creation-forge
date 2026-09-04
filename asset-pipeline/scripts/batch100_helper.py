# -*- coding: utf-8 -*-
# batch100_helper.py — 角色原画 100 批量生成助手（asset-pipeline 角色原画探索线）
# 用法:
#   python3 batch100_helper.py gen            # 生成随机参数表 + 分组
#   python3 batch100_helper.py groups         # 打印分组概览
#   python3 batch100_helper.py prompt <i>     # 打印第 i 组(或未完成部分)的 chat prompt
#   python3 batch100_helper.py tool <i>       # 打印第 i 组的 --include-tools 模型名
#   python3 batch100_helper.py rename <i>     # 从 stdin 读 chat JSON，按序重命名并记录状态
#   python3 batch100_helper.py refbatch       # 重建为 gpt2×ref 参考线稿风批量
#   python3 batch100_helper.py westbatch      # 重建为 gpt2×west 欧美卡通批量
#   python3 batch100_helper.py summary        # 打印总进度
import csv
import json
import random
import sys
from pathlib import Path

# 项目根 = 本脚本所在目录的上一级（兼容本机 ever-forge / 公司 ceshi 双环境，不硬编码盘符）
BASE = Path(__file__).resolve().parent.parent
OUT = BASE / "outputs/demo-character-concept/portraits/batch-100"
TABLE = OUT / "batch_table.csv"
GROUPS = OUT / "batch_groups.json"

CLASS_DESC = {
    "warrior": "a sturdy warrior with a long katana, aggressive forward stance",
    "assassin": "an agile assassin with twin short daggers, crouched springy pose",
    "support": "a calm support priest with floating paper talismans and a ritual staff",
    "strategist": "a composed strategist with a feathered fan, layered scholar robes",
    "general": "a commanding general with a great banner-spear and a heavy cape",
}

FACTION_CFG = {
    "mech": {
        "palette": "color palette: ink black #1a1a1e + tarnished gold #b87333, cold cyan accent only on mechanical parts",
        "mutation": {
            30: "single mutation point: right eye replaced by a cold cyan mechanical eye",
            50: "half body mutated: entire right arm mechanized, brass skeleton, hydraulic tubes and gears, black oil seeping from the shoulder",
            70: "most of body mutated: mechanical frame replacing most of the body, chest cracked open with clockwork gears, right arm a brass cannon arm",
            90: "fully mutated: whole body a machine form, only one human eye left visible",
        },
    },
    "bone": {
        "palette": "color palette: ink black #12121a + bone white #e8e4d8, gold accent only on pupils",
        "mutation": {
            30: "single mutation point: left cheek covered by a small white bone plate",
            50: "half body mutated: left half body covered in white bone exoskeleton, ribs turned outward as armor, left arm ossified with a bone blade at the elbow",
            70: "most of body mutated: bone exoskeleton covering most of the body, both arms ossified, a curved bone horn growing from the mask",
            90: "fully mutated: whole body a bone-armored form, only the human left hand kept",
        },
    },
    "carapace": {
        "palette": "color palette: ink black #0d0d12 + dark brown #3b2f23, dark purple accent only on glowing seams",
        "mutation": {
            30: "single mutation point: right shoulder covered by a dark segmented carapace plate",
            50: "half body mutated: right half body covered in segmented insect carapace, right arm an armored claw",
            70: "most of body mutated: insect carapace covering most of the body, both arms armored, tall carapace spikes on the shoulders",
            90: "fully mutated: whole body an insect-carapace form, only the human face kept",
        },
    },
    "flesh": {
        "palette": "color palette: deep purple black #1a1018 + dark red #7a1f1f, crimson accent only on glowing eyes",
        "mutation": {
            30: "single mutation point: right arm skin cracked with pulsing red muscle",
            50: "half body mutated: right arm burst into dark red flesh tendrils, muscles twitching, red spines sprouting from the shoulder",
            70: "most of body mutated: dark red flesh tissue covering most of the body, red tendrils from the back, glowing veins",
            90: "fully mutated: whole body a writhing red flesh form, only one human eye kept",
        },
    },
}

# 强化头身比句式（v2）：裸短语 "X heads tall" 被模型无视（实测 2.0~8.5 头身漂移），
# 改为客观锚点 = 头高占全身高百分比 + 体型描述，同时防过Q（<3）与写实（>4.5）两个方向
HEADS = [
    (3, "3 heads tall total, head height equals one third of full body height, compact stocky build, chunky rounded limbs"),
    (3.5, "3.5 heads tall total, head height equals about 29% of full body height, stocky rounded build, stubby limbs"),
    (4, "4 heads tall total, head height equals one quarter of full body height, stocky rounded build, short sturdy limbs"),
    (4.5, "4.5 heads tall total, head height equals about 22% of full body height, stocky build, moderately short limbs"),
]

# 第三轮校准（v3）：按模型×风格实际漂移方向覆盖句式与画风前缀
# 实测：分数锚点句式对韩系/欧美系有效；风格化3D 的 toy-like 前缀拉向Q版(2.0-2.5)；MJ×韩系无视压缩(7.0)
_Q_FIX = {  # 过Q组：中性比例句 + 显式排除 chibi
    3: "3 heads tall, head height equals one third of full body height, normal-sized head on a short body, sturdy proportionate limbs, not chibi",
    3.5: "3.5 heads tall, head height equals about 29% of full body height, normal-sized head on a short body, sturdy proportionate limbs, not chibi",
    4: "4 heads tall, head height equals one quarter of full body height, normal-sized head on a short body, sturdy proportionate limbs, not chibi",
    4.5: "4.5 heads tall, head height equals about 22% of full body height, normal-sized head on a short body, sturdy proportionate limbs, not chibi",
}
_COMPRESS = {  # 写实组：加大压缩拉力
    3: "3 heads tall, head height equals one third of full body height, big head small body, short sturdy limbs",
    3.5: "3.5 heads tall, head height equals about 29% of full body height, big head small body, short sturdy limbs",
    4: "4 heads tall, head height equals one quarter of full body height, big head small body, short sturdy limbs",
    4.5: "4.5 heads tall, head height equals about 22% of full body height, big head small body, short sturdy limbs",
}
# v6 中间档（2026-08-16，gpt2×ref 校准）：_Q_FIX 去掉 not chibi
# 实测：gpt2×ref 用 _Q_FIX 上漂（4.0→5.0），用 _COMPRESS 下漂（4.5→2.5），中间档 4.0→4.0 / 4.5→4.0 ✅
_MID = {
    3: "3 heads tall, head height equals one third of full body height, normal-sized head on a short body, sturdy proportionate limbs",
    3.5: "3.5 heads tall, head height equals about 29% of full body height, normal-sized head on a short body, sturdy proportionate limbs",
    4: "4 heads tall, head height equals one quarter of full body height, normal-sized head on a short body, sturdy proportionate limbs",
    4.5: "4.5 heads tall, head height equals about 22% of full body height, normal-sized head on a short body, sturdy proportionate limbs",
}
# gpt2×west 专属档（2026-08-16 校准轮定稿，6 张单图实测）：
# _Q_FIX 系统性 +0.5 拉长（写3.0→3.5 / 3.5→4.0 / 4.0→4.5 / 4.5→5.0）；_MID 下漂（写4.0→3.0 / 4.5→4.0）。
# 定稿：qfix 句写目标值-0.5 补偿，3.0 档写 2.5 句（40% 锚点，保留 not chibi 抗Q）
_GPT2_WEST = {
    3: "2.5 heads tall, head height equals about 40% of full body height, normal-sized head on a short body, sturdy proportionate limbs, not chibi",
    3.5: _Q_FIX[3],
    4: _Q_FIX[3.5],
    4.5: _Q_FIX[4],
}
# v5 比例句覆盖（2026-08-16，v4 风格块定稿后的比例复校）：
# v4 实测：s3d 组 3.0-3.5 ✅（_Q_FIX 继续有效）；west 组被拉长到 5.5-6.0 → 改 _COMPRESS；
# kr 组被压成 2.5 → 删 cute 词 + _Q_FIX；mj-kr 历史一贯写实 → 维持 _COMPRESS
RATIO_OVERRIDE = {
    ("nbp", "s3d"): _Q_FIX,
    ("mj", "s3d"): _Q_FIX,
    ("gpt2", "s3d"): _Q_FIX,
    ("nbp", "west"): _COMPRESS,
    ("mj", "west"): _COMPRESS,
    # gpt2×west 2026-08-16 校准轮定稿（6 张单图实测）：
    # _COMPRESS 全部压成 2.5（west 风格块自带卡通Q倾向，gpt2 严格服从，与 mj×west 拉长方向相反）；
    # _Q_FIX 系统性 +0.5 拉长 → 用 _GPT2_WEST 写目标值-0.5 补偿
    ("gpt2", "west"): _GPT2_WEST,
    ("nbp", "kr"): _Q_FIX,
    ("gpt2", "kr"): _Q_FIX,
    ("mj", "kr"): _COMPRESS,
    # v6 ref 线稿风（2026-08-16 校准）：3.0 临界区需抗Q（_MID 下漂 2.5），3.5-4.5 用中间档
    ("gpt2", "ref"): {3: _Q_FIX[3], 3.5: _MID[3.5], 4: _MID[4], 4.5: _MID[4.5]},
}

# 韩系专属提亮配色（用户 2026-08-16 决策）：保持 2主色+1点缀 结构，主色换明亮系
KR_PALETTE_OVERRIDE = {
    "mech": "color palette: bright brass gold #e8a33d + warm copper #c07a3e, cold cyan accent only on mechanical parts",
    "bone": "color palette: bright bone white #f5f0e0 + warm ivory #e8e4d8, gold accent only on pupils",
    "carapace": "color palette: vibrant violet #8b5cf6 + deep purple #5b3fa8, glowing cyan accent only on glowing seams",
    "flesh": "color palette: bright crimson #e0484e + soft rose pink #f2a0a0, golden accent only on glowing eyes",
}

# 欧美卡通专属提亮配色（用户 2026-08-16 决策，agent 实测 8/8 违反 vibrant 后）：
# 同 kr 模式，主色换高饱和撞色系，点缀色保持原纪律
WEST_PALETTE_OVERRIDE = {
    "mech": "color palette: bright golden yellow #f0b429 + vivid copper orange #d97b29, cold cyan accent only on mechanical parts",
    "bone": "color palette: bright ivory #f6f1e3 + warm amber #d4a24e, gold accent only on pupils",
    "carapace": "color palette: vivid purple #8b2ff5 + bright magenta #e0489e, glowing cyan accent only on glowing seams",
    "flesh": "color palette: hot crimson #d92f2f + vivid pink #ff5e8a, golden accent only on glowing eyes",
}

# v4 长句+否定风格块（2026-08-16，agent 风格诊断后重建）：
# 共同教训：暗色角色内容（鬼面+玄黑和服）会把短风格词拖进写实暗黑，
# 必须用长句钉死渲染方式 + 强否定排除写实/暗黑方向
STYLE_BLOCKS = {
    "s3d": ("stylized 3D game character render in the style of a high-end mobile game, "
            "smooth matte plastic toy figurine look, soft PBR materials with gentle diffuse lighting, "
            "subtle subsurface scattering on skin, clean rim light along the silhouette, "
            "bright playful color grading, crisp studio lighting, clean readable silhouette, high detail. "
            "Negative: photorealistic, realistic skin texture, 2D painting, painterly brushstrokes, "
            "dark fantasy, muted colors, gritty, extra limbs, deformed anatomy, text, watermark"),
    "west": ("western cartoon character concept art in the style of Cartoon Network and Overwatch, "
             "bold black ink outlines around every shape, complete refined linework, fine detailed ink lines on every edge, "
             "thick expressive impasto brushstrokes, vibrant highly saturated color palette, exaggerated cartoon features, "
             "strong graphic shapes, clean readable silhouette. "
             "Negative: muted tones, dark palette, realistic shading, smooth digital rendering, "
             "anime style, broken outlines, incomplete sketchy linework, extra limbs, deformed anatomy, text, watermark"),
    "kr": ("Korean MMORPG game art in the style of Dragon Nest, "
           "bright cel shading with soft painted gradients, glossy armor materials, clean anime line art, "
           "vivid saturated fantasy palette with pastel accents, airy bright lighting, "
           "polished game character illustration. "
           "Negative: photorealistic, dark fantasy, gritty, horror, muted colors, dark palette, Japanese dark anime, "
           "chibi, oversized head, extra limbs, deformed anatomy, text, watermark"),
    # v6 参考线稿风（2026-08-16，用户新给参考图 cankao/收藏到 Psychoramen.jpg，agent 提取）：
    # 中等偏细线条+外粗内细、高度闭合无断线、干净数码矢量感线稿、平涂上色线稿清晰可见、装饰线密集
    "ref": ("polished game character illustration with anime game art line quality, "
            "clean precise line art, closed line contours, medium line weight with variation, "
            "outer contour lines slightly thicker than inner detail lines, crisp digital inking, "
            "vector-like line precision, sharp line edges, detailed internal structure lines, "
            "decorative pattern linework on focal areas, flat coloring with pure black outlines, "
            "lineart stays sharp and clearly visible over the flat colors, "
            "professional finished line art. "
            "Negative: thick bold outlines, rough sketchy lines, broken sketch lines, painterly brushstrokes, "
            "lineless painting, photorealistic, 3D render, gritty, dark fantasy, muted colors, "
            "extra limbs, deformed anatomy, text, watermark"),
}

MODELS = ["mj", "nbp", "gpt2"]
TOOLS = {
    "mj": "generate_image_midjourney",
    "nbp": "generate_image_nano_banana_pro",
    "gpt2": "generate_image_gpt_image_2",
}


def mini_prompt(r):
    cfg = FACTION_CFG[r["faction"]]
    corr = r["corr"]
    # 七档百分比映射到四档句式：30/40→点状, 50/60→半身, 70/80→大面积, 90→全身
    tier = min(t for t in (30, 50, 70, 90) if corr <= t)
    ov = RATIO_OVERRIDE.get((r["model"], r["style"]))
    phrase = ov[r["heads"]] if ov else r["heads_phrase"]
    if r["style"] == "kr":
        palette = KR_PALETTE_OVERRIDE[r["faction"]]
        kimono = "deep navy blue kimono"
    elif r["style"] == "west":
        palette = WEST_PALETTE_OVERRIDE[r["faction"]]
        kimono = "black-brown kimono"
    else:
        palette = cfg["palette"]
        kimono = "black-brown kimono"
    return (
        f"{corr}% corruption: {cfg['mutation'][tier]}, {palette}, "
        f"black oni mask with two yellow horns, {kimono}, {phrase}, "
        f"{r['class_desc']}, side view fighting game stance, "
        f"full body centered, 1:1 square canvas, pure white background, no text"
    )


def gen_table():
    OUT.mkdir(parents=True, exist_ok=True)
    rng = random.Random(20260815)
    rows = []
    for no in range(1, 101):
        cls = rng.choice(list(CLASS_DESC))
        fac = rng.choice(list(FACTION_CFG))
        corr = rng.choice([30, 40, 50, 60, 70, 80, 90])
        heads_n, heads_phrase = rng.choice(HEADS)
        model = rng.choice(MODELS)
        style = rng.choice(list(STYLE_BLOCKS))
        r = {
            "no": no,
            "class": cls,
            "faction": fac,
            "corr": corr,
            "heads": heads_n,
            "heads_phrase": heads_phrase,
            "model": model,
            "style": style,
            "class_desc": CLASS_DESC[cls],
        }
        r["filename"] = f"demo-character-concept_portrait_b{no:03d}_{cls}-{fac}{corr}_{model}-{style}.png"
        r["mini"] = mini_prompt(r)
        rows.append(r)

    with open(TABLE, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["no", "class", "faction", "corr", "heads", "model", "style", "filename"])
        for r in rows:
            w.writerow([r["no"], r["class"], r["faction"], r["corr"], r["heads"], r["model"], r["style"], r["filename"]])

    # 分组：按 (model, style)，保持全局顺序
    groups = {}
    for r in rows:
        key = (r["model"], r["style"])
        groups.setdefault(key, []).append(r)
    gs = []
    for (model, style), grs in groups.items():
        gs.append({"model": model, "style": style, "rows": grs, "thread_id": None, "done": 0})
    with open(GROUPS, "w", encoding="utf-8") as f:
        json.dump(gs, f, ensure_ascii=False, indent=2)

    print(f"表已生成: {TABLE}")
    print(f"分组数: {len(gs)}")
    for g in gs:
        print(f"  [{g['model']:>4}-{g['style']:>4}] {len(g['rows'])} 张 (b{g['rows'][0]['no']:03d} ... b{g['rows'][-1]['no']:03d})")


def load_groups():
    return json.loads(GROUPS.read_text(encoding="utf-8"))


def state_path(i):
    return OUT / f"state_{i}.json"


def load_state(i):
    p = state_path(i)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return {"thread_id": None, "done": 0}


def save_state(i, st):
    state_path(i).write_text(json.dumps(st, ensure_ascii=False, indent=2), encoding="utf-8")


def pending_rows(g, st):
    return g["rows"][st.get("done", 0):]


def build_prompt(g, rows):
    lines = [f"{idx}. {r['mini']}" for idx, r in enumerate(rows, 1)]
    style = STYLE_BLOCKS[g["style"]]
    return (
        f"请直接用下面的英文规格生成 {len(rows)} 张角色原画，每行规格生成一张图，"
        f"不要改写每行规格内容，原样传递给图片模型。共享画风前缀：{style}\n\n"
        + "\n".join(lines)
    )


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "summary"
    groups = load_groups() if GROUPS.exists() else []

    if cmd == "gen":
        gen_table()
    elif cmd == "groups":
        for i, g in enumerate(groups):
            st = load_state(i)
            print(f"[{i}] {g['model']}-{g['style']} {len(g['rows'])}张 done={st.get('done', 0)} thread={st.get('thread_id')}")
    elif cmd == "prompt":
        i = int(sys.argv[2])
        g = groups[i]
        st = load_state(i)
        rows = pending_rows(g, st)
        print(build_prompt(g, rows))
    elif cmd == "tool":
        i = int(sys.argv[2])
        print(TOOLS[groups[i]["model"]])
    elif cmd == "rename":
        i = int(sys.argv[2])
        g = groups[i]
        st = load_state(i)
        data = json.load(sys.stdin)
        fs = data.get("final_status")
        print(f"[组{i} {g['model']}-{g['style']}] status={fs} generation_succeeded={data.get('generation_succeeded')}")
        if fs == "pending_confirmation":
            print("!! PENDING_CONFIRMATION — 停止并询问用户积分确认")
            return
        st["thread_id"] = data.get("thread_id")
        dl = {d["url"]: d for d in data.get("downloaded", [])}
        arts = []
        for it in data.get("items", []):
            if it.get("type") == "generator":
                for a in it.get("artifacts", []):
                    arts.append(a.get("content"))
        rows = pending_rows(g, st)
        # 续跑时线程会返回全部历史产物：只认 downloaded 中 new=true 的新文件（全新线程则全部为 new）
        fresh = [u for u in arts if dl.get(u, {}).get("new")]
        done = 0
        for idx, url in enumerate(fresh):
            if idx >= len(rows):
                print(f"  超出规格的额外产物: {url}")
                continue
            src = dl[url]["local_path"]
            target = OUT / rows[idx]["filename"]
            Path(src).rename(target)
            done += 1
        # 清理剩余 hash 文件（均为历史重复下载或未匹配产物）
        for hf in OUT.glob("lovart_*.png"):
            hf.unlink()
        st["done"] = st.get("done", 0) + done
        save_state(i, st)
        print(f"  已重命名 {done}/{len(rows)}，累计 {st['done']}/{len(g['rows'])}")
        if st["done"] < len(g["rows"]):
            print(f"  !! 还差 {len(g['rows']) - st['done']} 张，用 --thread-id {st['thread_id']} 续跑 prompt {i}")
    elif cmd == "fixminis":
        # 从 CSV 主表重建分组：重新生成 mini 提示词（应用校准句式）。
        # 可选参数 = 需要重跑的组索引；未列出的组视为已完成（保留 v2 文件，状态直接标 done）
        regen = {int(x) for x in sys.argv[2:]}
        rows = []
        with open(TABLE, newline="", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                r["no"] = int(r["no"])
                r["corr"] = int(r["corr"])
                r["heads"] = float(r["heads"])
                hmap = {n: p for n, p in HEADS}
                r["heads_phrase"] = hmap[r["heads"]]
                r["class_desc"] = CLASS_DESC[r["class"]]
                r["mini"] = mini_prompt(r)
                rows.append(r)
        groups = {}
        for r in rows:
            key = (r["model"], r["style"])
            groups.setdefault(key, []).append(r)
        gs = [{"model": m, "style": s, "rows": grs} for (m, s), grs in groups.items()]
        with open(GROUPS, "w", encoding="utf-8") as f:
            json.dump(gs, f, ensure_ascii=False, indent=2)
        for i, g in enumerate(gs):
            st = {"thread_id": None, "done": 0}
            if i not in regen:
                st["done"] = len(g["rows"])
            save_state(i, st)
        print(f"分组已重建（{len(gs)} 组），重跑组: {sorted(regen)}，其余 {len(gs)-len(regen)} 组保留 v2 标为完成")
    elif cmd == "refbatch":
        # v6 参考线稿风批量重建（2026-08-16）：100 行全部改为 gpt2×ref，
        # 设计系统（派系/浸染度/头身比）不变，比例句按 gpt2×ref 校准映射，
        # 每 10 张一组（gpt2 单次线程历史经验 10-14 张会超时，10 张较稳）
        CHUNK = 10
        rows = []
        with open(TABLE, newline="", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                r["no"] = int(r["no"])
                r["corr"] = int(r["corr"])
                r["heads"] = float(r["heads"])
                hmap = {n: p for n, p in HEADS}
                r["heads_phrase"] = hmap[r["heads"]]
                r["class_desc"] = CLASS_DESC[r["class"]]
                r["model"] = "gpt2"
                r["style"] = "ref"
                r["filename"] = f"demo-character-concept_portrait_b{r['no']:03d}_{r['class']}-{r['faction']}{r['corr']}_gpt2-ref.png"
                r["mini"] = mini_prompt(r)
                rows.append(r)
        gs = []
        for i in range(0, len(rows), CHUNK):
            gs.append({"model": "gpt2", "style": "ref", "rows": rows[i:i + CHUNK]})
        with open(GROUPS, "w", encoding="utf-8") as f:
            json.dump(gs, f, ensure_ascii=False, indent=2)
        for i, g in enumerate(gs):
            save_state(i, {"thread_id": None, "done": 0})
        print(f"refbatch 已重建：{len(gs)} 组 × ~{CHUNK} 张，全部 gpt2×ref，状态已重置")
    elif cmd == "westbatch":
        # v6.5 欧美卡通批量重建（2026-08-16 用户决策：20 小样目视后整批换 west，ref 版归档）：
        # 100 行全部改为 gpt2×west，设计系统（派系/浸染度/头身比）不变，
        # 比例句沿用 v5 对 west 的 _COMPRESS 校准（west 易拉长 5.5-6.0）；
        # 注意 gpt2×west 无实测数据，20 小样比例抽检后若过Q再校 gpt2×west 专属句
        CHUNK = 10
        rows = []
        with open(TABLE, newline="", encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                r["no"] = int(r["no"])
                r["corr"] = int(r["corr"])
                r["heads"] = float(r["heads"])
                hmap = {n: p for n, p in HEADS}
                r["heads_phrase"] = hmap[r["heads"]]
                r["class_desc"] = CLASS_DESC[r["class"]]
                r["model"] = "gpt2"
                r["style"] = "west"
                r["filename"] = f"demo-character-concept_portrait_b{r['no']:03d}_{r['class']}-{r['faction']}{r['corr']}_gpt2-west.png"
                r["mini"] = mini_prompt(r)
                rows.append(r)
        gs = []
        for i in range(0, len(rows), CHUNK):
            gs.append({"model": "gpt2", "style": "west", "rows": rows[i:i + CHUNK]})
        with open(GROUPS, "w", encoding="utf-8") as f:
            json.dump(gs, f, ensure_ascii=False, indent=2)
        for i, g in enumerate(gs):
            save_state(i, {"thread_id": None, "done": 0})
        print(f"westbatch 已重建：{len(gs)} 组 × ~{CHUNK} 张，全部 gpt2×west，状态已重置")
    elif cmd == "summary":
        total = sum(len(g["rows"]) for g in groups)
        done = sum(load_state(i).get("done", 0) for i in range(len(groups)))
        print(f"总进度: {done}/{total}")
        for i, g in enumerate(groups):
            st = load_state(i)
            print(f"  [{i}] {g['model']}-{g['style']}: {st.get('done', 0)}/{len(g['rows'])}")
    else:
        print("未知命令:", cmd)


if __name__ == "__main__":
    main()
