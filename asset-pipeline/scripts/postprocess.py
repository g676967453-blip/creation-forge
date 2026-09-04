"""
美术资产后处理脚本
用途：色键抠图（品红/明绿）+ NEAREST 缩放 → 透明 PNG

用法：
  # 品红抠除 + 缩放
  python postprocess.py --input in.png --output out.png --width 512 --height 720 --chroma-key magenta

  # 明绿抠除 + 缩放
  python postprocess.py --input in.png --output out.png --width 256 --height 256 --chroma-key green

  # 仅缩放（不去背）
  python postprocess.py --input in.png --output out.png --width 256 --height 256 --chroma-key none

依赖：Pillow (pip install Pillow)
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow required. Run: pip install Pillow")
    sys.exit(1)


# 色键颜色定义
CHROMA_COLORS = {
    "magenta": {"name": "magenta", "r_min": 235, "r_max": 255, "g_min": 0, "g_max": 20, "b_min": 235, "b_max": 255},
    "green":   {"name": "green",   "r_min": 0,   "r_max": 20,  "g_min": 235, "g_max": 255, "b_min": 0,   "b_max": 20},
}


def chroma_key_remove(img: Image.Image, key: str) -> tuple[Image.Image, int]:
    """
    色键抠除：将指定颜色范围的像素设为透明。
    返回 (处理后的图片, 抠除像素数)
    """
    if key not in CHROMA_COLORS:
        raise ValueError(f"Unknown chroma key: {key}. Available: {list(CHROMA_COLORS.keys())}")

    cfg = CHROMA_COLORS[key]
    pixels = img.load()
    width, height = img.size

    # 采样检测
    sample_points = [
        (0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1),
        (width // 2, 0), (0, height // 2), (width // 2, height // 2)
    ]
    found = 0
    for x, y in sample_points:
        if 0 <= x < width and 0 <= y < height:
            r, g, b, a = pixels[x, y]
            if cfg["r_min"] <= r <= cfg["r_max"] and cfg["g_min"] <= g <= cfg["g_max"] and cfg["b_min"] <= b <= cfg["b_max"]:
                found += 1

    if found == 0:
        print(f"[chroma] No {cfg['name']} background detected, skipping")
        return img, 0

    print(f"[chroma] {cfg['name']} background detected ({found}/{len(sample_points)} samples), removing...")
    removed = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if cfg["r_min"] <= r <= cfg["r_max"] and cfg["g_min"] <= g <= cfg["g_max"] and cfg["b_min"] <= b <= cfg["b_max"]:
                pixels[x, y] = (0, 0, 0, 0)
                removed += 1

    print(f"[chroma] Removed {removed} pixels ({removed / (width * height) * 100:.1f}% of image)")
    return img, removed


def despill_green(img: Image.Image) -> Image.Image:
    """
    绿色溢色抑制：对非透明像素，抑制绿色通道的溢出。
    用于色键抠图后边缘残留的绿色光晕。
    """
    pixels = img.load()
    width, height = img.size
    fixed = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            # 绿色通道显著高于红蓝 → 溢色
            if g > r + 20 and g > b + 20:
                target = max(r, b)
                new_g = int(g * 0.3 + target * 0.7)  # 向 target 靠拢
                pixels[x, y] = (r, min(255, new_g), b, a)
                fixed += 1
    pct = fixed / (width * height) * 100
    print(f"[despill] Corrected {fixed} green spill pixels ({pct:.1f}%)")
    return img


def nearest_resize(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """NEAREST 缩放 — 保持像素艺术锐利边缘"""
    original_size = img.size
    resized = img.resize((target_w, target_h), Image.NEAREST)
    print(f"[resize] NEAREST: {original_size[0]}x{original_size[1]} -> {target_w}x{target_h}")
    return resized


def process(
    input_path: str,
    output_path: str,
    target_w: int,
    target_h: int,
    chroma_key: str = "none",
    despill: bool = True,
) -> Path:
    """
    后处理主流程：
    1. 打开图片 → RGBA
    2. 色键抠图（可选）
    3. NEAREST 缩放至目标尺寸
    4. 保存 PNG
    """
    input_file = Path(input_path)
    output_file = Path(output_path)

    if not input_file.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    print(f"[process] Input: {input_file} ({input_file.stat().st_size:,} bytes)")

    img = Image.open(input_file).convert("RGBA")

    # 色键抠图
    if chroma_key in CHROMA_COLORS:
        img, removed = chroma_key_remove(img, chroma_key)
        # 抠图后自动做溢色抑制
        img = despill_green(img)
    elif chroma_key == "none":
        print("[process] Skipping chroma key")
    else:
        raise ValueError(f"Unknown chroma key: {chroma_key}")

    # NEAREST 缩放
    img = nearest_resize(img, target_w, target_h)

    # 保存
    output_file.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_file, "PNG")
    output_size = output_file.stat().st_size

    # 检查透明像素占比
    pixels = img.load()
    transparent = sum(1 for y in range(img.height) for x in range(img.width) if pixels[x, y][3] == 0)
    print(f"[process] Done: {output_file} ({target_w}x{target_h}, {output_size:,} bytes, {transparent / (img.width * img.height) * 100:.1f}% transparent)")

    return output_file


def main():
    parser = argparse.ArgumentParser(
        description="Post-process: chroma key removal + NEAREST resize"
    )
    parser.add_argument("--input", "-i", required=True, help="Input file path")
    parser.add_argument("--output", "-o", required=True, help="Output file path")
    parser.add_argument("--width", "-W", type=int, required=True, help="Target width (px)")
    parser.add_argument("--height", "-H", type=int, required=True, help="Target height (px)")
    parser.add_argument("--chroma-key", "-k", default="none",
                        choices=["magenta", "green", "none"],
                        help="Chroma key color to remove (default: none)")
    parser.add_argument("--no-despill", action="store_true",
                        help="Skip green spill suppression after chroma key")

    # Backward compat
    parser.add_argument("--no-magenta", action="store_true", help=argparse.SUPPRESS)

    args = parser.parse_args()

    # Backward compat: --no-magenta
    chroma = args.chroma_key
    if args.no_magenta and chroma == "magenta":
        chroma = "none"

    try:
        result = process(
            input_path=args.input,
            output_path=args.output,
            target_w=args.width,
            target_h=args.height,
            chroma_key=chroma,
            despill=not args.no_despill,
        )
        print(f"\nOK: {result}")
    except Exception as e:
        print(f"\nERROR: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
