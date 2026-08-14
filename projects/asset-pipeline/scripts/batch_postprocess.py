"""
batch_postprocess.py — 批量绿幕抠图（自适应绿幕 + despill）

背景：GPT Image 2 实际输出的绿底不是纯 #00FF00，而是 r/b 残留 15-40、
g 236-245 的近似绿（实测 110 张），postprocess.py 的严格色键（r<20,g>235,b<20）
会漏抠大片背景。本脚本用「四角采样估计背景绿 + 颜色距离阈值」自适应抠图，
再复用 postprocess.despill_green 清理边缘绿边。

用法：
  python batch_postprocess.py --drafts <绿底原图目录> --out <输出目录>
      [--threshold 60] [--no-despill-skins skin1,skin2] [--force]

依赖：numpy + Pillow + 同目录 postprocess.py（只复用 despill_green）
"""

import argparse
import statistics
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import postprocess  # noqa: E402
from PIL import Image  # noqa: E402


def adaptive_green_remove(img: Image.Image, threshold: int):
    """自适应绿幕抠除：四角采样估计背景绿，移除颜色距离 < threshold 的像素。

    返回 (处理后的图片, 移除像素数)。若四角不像绿幕则跳过返回原图。
    """
    arr = np.array(img)  # h,w,4
    h, w = arr.shape[:2]
    # 注意：必须转 int，uint8 加法会溢出（如 241+244 → 112）
    corners = [(int(arr[0, 0, 0]), int(arr[0, 0, 1]), int(arr[0, 0, 2])),
               (int(arr[0, w - 1, 0]), int(arr[0, w - 1, 1]), int(arr[0, w - 1, 2])),
               (int(arr[h - 1, 0, 0]), int(arr[h - 1, 0, 1]), int(arr[h - 1, 0, 2])),
               (int(arr[h - 1, w - 1, 0]), int(arr[h - 1, w - 1, 1]), int(arr[h - 1, w - 1, 2]))]
    bg_r = statistics.median(p[0] for p in corners)
    bg_g = statistics.median(p[1] for p in corners)
    bg_b = statistics.median(p[2] for p in corners)
    # 必须显著是绿色背景才继续（g 明显高于 r/b 且足够亮）
    if bg_g < 180 or bg_g < bg_r + 80 or bg_g < bg_b + 80:
        print(f"[chroma] 四角不像绿幕（{bg_r},{bg_g},{bg_b}），跳过抠图")
        return img, 0
    dist = np.sqrt(
        (arr[:, :, 0].astype(int) - bg_r) ** 2
        + (arr[:, :, 1].astype(int) - bg_g) ** 2
        + (arr[:, :, 2].astype(int) - bg_b) ** 2
    )
    mask = dist < threshold
    removed = int(mask.sum())
    arr[mask] = (0, 0, 0, 0)
    pct = removed / (h * w) * 100
    print(f"[chroma] 背景绿({bg_r},{bg_g},{bg_b}) 阈值{threshold}：移除 {removed} 像素（{pct:.1f}%）")
    # fromarray 返回只读图像，copy() 使其可写（后续 despill 需要写像素）
    return Image.fromarray(arr, "RGBA").copy(), removed


def main():
    parser = argparse.ArgumentParser(description="批量自适应绿幕抠图")
    parser.add_argument("--drafts", required=True, help="绿底原图目录")
    parser.add_argument("--out", required=True, help="透明 PNG 输出目录")
    parser.add_argument("--pattern", default="*_v1_*.png", help="文件名匹配模式")
    parser.add_argument("--threshold", type=int, default=60, help="颜色距离阈值")
    parser.add_argument("--no-despill-skins", default="",
                        help="逗号分隔的 skin id：这些皮肤跳过 despill（绿色系主体防误伤）")
    parser.add_argument("--force", action="store_true", help="覆盖已存在的输出")
    args = parser.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    drafts = Path(args.drafts)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    no_despill = {s.strip() for s in args.no_despill_skins.split(",") if s.strip()}

    files = sorted(drafts.glob(args.pattern))
    if not files:
        print(f"没有匹配 {args.pattern} 的文件：{drafts}")
        sys.exit(1)
    print(f"待处理 {len(files)} 张：{drafts} -> {out_dir}")

    ok, skipped = 0, 0
    summary = []
    for p in files:
        skin_id = p.name.split("_v1_")[0]
        out_file = out_dir / p.name
        if out_file.exists() and not args.force:
            print(f"SKIP（已存在，--force 可覆盖）: {p.name}")
            skipped += 1
            continue
        img = Image.open(p).convert("RGBA")
        img, removed = adaptive_green_remove(img, args.threshold)
        if removed > 0 and skin_id not in no_despill:
            img = postprocess.despill_green(img)
        img.save(out_file, "PNG")
        # 透明占比（步长 4 采样）
        a = np.array(img)[:, :, 3]
        h, w = a.shape
        ratio = (a[::4, ::4] == 0).mean() * 100
        summary.append((p.name, w, h, round(ratio, 1), skin_id not in no_despill))
        if ratio < 25 or ratio > 82:
            print(f"WARN: {p.name} 透明占比 {ratio:.1f}%（期望 25-82%）")
        ok += 1

    print(f"\n完成：{ok}/{len(files)} 张（跳过 {skipped} 张已存在）。透明占比摘要：")
    print(f"{'文件':<30} {'尺寸':<14} {'透明占比':<8} {'despill'}")
    for name, w, h, ratio, despill in summary:
        print(f"{name:<30} {w}x{h:<9} {ratio}%{'':<4} {'on' if despill else 'OFF'}")

    with open(out_dir / "_postprocess_summary.txt", "w", encoding="utf-8") as f:
        for name, w, h, ratio, despill in summary:
            f.write(f"{name}\t{w}x{h}\t{ratio}%\tdespill={'on' if despill else 'off'}\n")
    print(f"摘要已写入 {out_dir / '_postprocess_summary.txt'}")


if __name__ == "__main__":
    main()
