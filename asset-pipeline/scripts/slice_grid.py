"""
4×4 网格切片脚本
用途：将 Lovart 生成的 1024×1024 4×4 网格图切割为 16 个独立 256×256 PNG

用法：
  python slice_grid.py --input grid.png --output-dir ./icons --prefix naruto_item

输出：
  naruto_item_r0_c0.png, naruto_item_r0_c1.png, ..., naruto_item_r3_c3.png
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("错误：需要安装 Pillow。运行: pip install Pillow")
    sys.exit(1)


def slice_4x4(
    input_path: str,
    output_dir: str,
    prefix: str = "item",
    auto_trim: bool = False,
    trim_padding: int = 0,
) -> list[Path]:
    """
    将 1024×1024 图片等分为 16 个 256×256 切片。

    参数:
        input_path: 输入图片路径
        output_dir: 输出目录
        prefix: 输出文件名前缀
        auto_trim: 是否自动裁剪每个切片中的纯色边缘
        trim_padding: trim 后补多少像素透明边距

    返回:
        输出文件路径列表
    """
    input_file = Path(input_path)
    if not input_file.exists():
        raise FileNotFoundError(f"输入文件不存在: {input_path}")

    img = Image.open(input_file).convert("RGBA")
    width, height = img.size

    if width != 1024 or height != 1024:
        print(f"[slice] WARNING: input {width}x{height}, not standard 1024x1024, dividing by actual size")
        cell_w = width // 4
        cell_h = height // 4
    else:
        cell_w, cell_h = 256, 256

    print(f"[slice] Input: {input_file} ({width}x{height})")
    print(f"[slice] Grid: 4x4, cell size {cell_w}x{cell_h}")

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    output_files = []

    for row in range(4):
        for col in range(4):
            left = col * cell_w
            upper = row * cell_h
            right = left + cell_w
            lower = upper + cell_h

            cell = img.crop((left, upper, right, lower))

            if auto_trim:
                # 自动裁剪纯色/透明边缘
                bbox = cell.getbbox()
                if bbox:
                    cell = cell.crop(bbox)
                    # 补回透明边距
                    if trim_padding > 0:
                        new_w = cell.width + trim_padding * 2
                        new_h = cell.height + trim_padding * 2
                        padded = Image.new("RGBA", (new_w, new_h), (0, 0, 0, 0))
                        padded.paste(cell, (trim_padding, trim_padding))
                        cell = padded
                else:
                    print(f"[slice] WARNING r{row}_c{col}: fully transparent, skip trim")

            filename = f"{prefix}_r{row}_c{col}.png"
            out_path = out_dir / filename
            cell.save(out_path, "PNG")
            output_files.append(out_path)

            print(f"[slice] r{row}_c{col}: {left},{upper} -> {cell.width}x{cell.height} -> {filename}")

    print(f"\n[slice] Done: {len(output_files)} files -> {out_dir}")
    return output_files


def main():
    parser = argparse.ArgumentParser(
        description="4×4 网格切片：1024×1024 → 16×256×256"
    )
    parser.add_argument("--input", "-i", required=True, help="输入图片路径（1024×1024 网格图）")
    parser.add_argument("--output-dir", "-o", required=True, help="输出目录")
    parser.add_argument("--prefix", "-p", default="item", help="输出文件名前缀")
    parser.add_argument("--trim", action="store_true", help="自动裁剪每个切片的纯色/透明边缘")
    parser.add_argument("--trim-padding", type=int, default=8, help="trim 后补的透明边距 (px)")

    args = parser.parse_args()

    try:
        files = slice_4x4(
            input_path=args.input,
            output_dir=args.output_dir,
            prefix=args.prefix,
            auto_trim=args.trim,
            trim_padding=args.trim_padding,
        )
        print(f"\n生成文件列表:")
        for f in files:
            size_kb = f.stat().st_size / 1024
            print(f"  {f.name} ({size_kb:.1f} KB)")
    except Exception as e:
        print(f"\n[slice] ERROR: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
