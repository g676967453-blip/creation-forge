#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图标归一化 — 道具图标工作流的收尾步骤

解决两个实际问题：
  1. AI 出图尺寸不一定是 1024（GPT Image 2 实测吐过 1254×1254），
     不能被 4 整除时直接切片会行列错位 → 切片前先 --square 规范化
  2. slice_grid.py --trim 后每张尺寸各不相同，不利于 UI 布局
     → 切片后用 --pad 统一到 256×256 居中

用法：
  # 切片前：把网格图规范化到 1024×1024
  python3 normalize_icons.py --square 1024 \
      --input grid_raw.png --output grid_1024.png

  # 切片后：把 trim 过的图标统一到 256×256 居中
  python3 normalize_icons.py --pad 256 --margin 16 \
      --input-dir sliced/ --output-dir sliced-256/
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("需要 Pillow：pip install Pillow", file=sys.stderr)
    sys.exit(1)


def square(input_file: Path, output_file: Path, size: int) -> None:
    """把网格图缩放到 size×size，保证能被 4 整除。"""
    img = Image.open(input_file)
    if img.size == (size, size):
        print(f"[square] 已是 {size}×{size}，直接复制")
    else:
        print(f"[square] {img.size[0]}×{img.size[1]} -> {size}×{size}")
        if img.size[0] % 4 or img.size[1] % 4:
            print(f"[square] 原尺寸不能被 4 整除，切片会错位 — 规范化是必需的")
    img.resize((size, size), Image.LANCZOS).save(output_file)
    print(f"[square] 已保存: {output_file}")


def pad(input_dir: Path, output_dir: Path, size: int, margin: int) -> None:
    """把目录下所有 PNG 等比缩放并居中贴到 size×size 透明画布。"""
    output_dir.mkdir(parents=True, exist_ok=True)
    files = sorted(input_dir.glob("*.png"))
    if not files:
        print(f"[pad] {input_dir} 下没有 PNG", file=sys.stderr)
        sys.exit(1)

    inner = size - margin * 2
    for f in files:
        img = Image.open(f).convert("RGBA")
        w, h = img.size
        scale = inner / max(w, h)
        nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
        img = img.resize((nw, nh), Image.LANCZOS)

        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        canvas.paste(img, ((size - nw) // 2, (size - nh) // 2), img)
        canvas.save(output_dir / f.name)
        print(f"[pad] {f.name}: {w}×{h} -> {size}×{size} (内容 {nw}×{nh})")

    print(f"\n[pad] 完成: {len(files)} 张 -> {output_dir}")


def main() -> None:
    p = argparse.ArgumentParser(description="道具图标归一化")
    p.add_argument("--square", type=int, metavar="N",
                   help="模式一：把单张网格图规范化到 N×N（配合 --input/--output）")
    p.add_argument("--pad", type=int, metavar="N",
                   help="模式二：把目录内图标统一到 N×N 居中（配合 --input-dir/--output-dir）")
    p.add_argument("--margin", type=int, default=16,
                   help="--pad 模式的四周安全边距，默认 16px")
    p.add_argument("--input", type=Path)
    p.add_argument("--output", type=Path)
    p.add_argument("--input-dir", type=Path)
    p.add_argument("--output-dir", type=Path)
    args = p.parse_args()

    if args.square:
        if not args.input or not args.output:
            p.error("--square 需要 --input 和 --output")
        square(args.input, args.output, args.square)
    elif args.pad:
        if not args.input_dir or not args.output_dir:
            p.error("--pad 需要 --input-dir 和 --output-dir")
        pad(args.input_dir, args.output_dir, args.pad, args.margin)
    else:
        p.error("必须指定 --square 或 --pad")


if __name__ == "__main__":
    main()
