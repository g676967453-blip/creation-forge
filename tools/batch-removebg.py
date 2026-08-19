"""
批量 AI 抠图工具（rembg）
用途：把文件夹里的图片批量去背景 → 透明 PNG

用法：
  python batch-removebg.py <输入文件夹> [输出文件夹] [--model isnet-general-use]

  默认输出到 <输入文件夹>/抠图结果/
  可选模型：u2net（快）、isnet-general-use（质量更好，默认）、u2net_human_seg（人物专用）

依赖：pip install rembg（首次运行会自动下载模型，需能访问 GitHub）
"""

import argparse
import sys
from pathlib import Path

try:
    from rembg import remove, new_session
    from PIL import Image
except ImportError:
    print("Error: 需要 rembg 和 Pillow。安装：pip install rembg")
    sys.exit(1)

SUPPORTED_EXT = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def main() -> None:
    parser = argparse.ArgumentParser(description="批量 AI 抠图")
    parser.add_argument("input_dir", type=Path, help="输入文件夹")
    parser.add_argument("output_dir", type=Path, nargs="?", default=None, help="输出文件夹（默认 输入文件夹/抠图结果）")
    parser.add_argument("--model", default="isnet-general-use", help="rembg 模型名")
    parser.add_argument("--alpha-matting", action="store_true", help="启用 alpha matting 优化边缘（更慢）")
    args = parser.parse_args()

    input_dir: Path = args.input_dir
    if not input_dir.is_dir():
        print(f"Error: 文件夹不存在: {input_dir}")
        sys.exit(1)

    output_dir: Path = args.output_dir or (input_dir / "抠图结果")
    output_dir.mkdir(exist_ok=True)

    files = sorted(
        p for p in input_dir.iterdir()
        if p.is_file() and p.suffix.lower() in SUPPORTED_EXT
    )
    if not files:
        print("没有找到可处理的图片")
        sys.exit(1)

    print(f"模型: {args.model} | 待处理 {len(files)} 张 | 输出到 {output_dir}")
    session = new_session(args.model)

    ok, fail = 0, 0
    for p in files:
        out = output_dir / f"{p.stem}.png"
        try:
            img = Image.open(p).convert("RGBA")
            result = remove(
                img,
                session=session,
                alpha_matting=args.alpha_matting,
                post_process_mask=True,
            )
            result.save(out, "PNG")
            print(f"  ✅ {p.name} → {out.name}")
            ok += 1
        except Exception as e:
            print(f"  ❌ {p.name}: {e}")
            fail += 1

    print(f"\n完成：成功 {ok} / 失败 {fail}")


if __name__ == "__main__":
    main()
