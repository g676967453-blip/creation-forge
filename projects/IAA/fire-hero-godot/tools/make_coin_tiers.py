"""按档位生成金币贴图：从金色底图做色相偏移，得到蓝 / 紫 / 红币

为什么不在运行时用 modulate 上色：
modulate 是**乘法**。金色约 (255,200,60) 乘上蓝色 (0.4,0.6,1.0) 得到 (102,120,60)
—— 是橄榄绿，不是蓝。想得到真正的蓝币必须在贴图层做色相偏移，而不是在渲染层染色。

做法：读 assets/pixel/ui/ui_icon_coin.png（64×64，深色描边 + 金色body），
转到 HSV，只旋转色相；深色描边饱和度低，旋转后仍是深色描边，风格保持一致。

用法：
    python tools/make_coin_tiers.py
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

# 目标色相（度）与饱和度增益
TIERS: dict[str, tuple[float, float]] = {
    "blue": (212.0, 1.15),    # 蓝色特效金币
    "purple": (278.0, 1.15),  # 紫色特效金币
    "red": (356.0, 1.20),     # 红色特效金币
}


def _hue_shift(src: Image.Image, target_hue_deg: float, sat_gain: float) -> Image.Image:
    """旋转色相到目标值，并轻微提升饱和度"""
    rgba = src.convert("RGBA")
    alpha = rgba.getchannel("A")
    hsv = rgba.convert("RGB").convert("HSV")
    h, s, v = hsv.split()

    # 以金色主色的色调为基准做相对偏移（而不是绝对覆盖），保留原图内部明暗层次
    base_hue = _dominant_hue(hsv, s)
    shift = (target_hue_deg - base_hue) / 360.0 * 255.0

    h = h.point(lambda p: int(round(p + shift)) % 256)
    if sat_gain != 1.0:
        s = s.point(lambda p: min(255, int(round(p * sat_gain))))

    out = Image.merge("HSV", (h, s, v)).convert("RGB").convert("RGBA")
    out.putalpha(alpha)
    return out


def _dominant_hue(hsv: Image.Image, s: Image.Image) -> float:
    """取饱和度 > 60 的像素的色相中位数，作为「主色相」"""
    hx = hsv.getchannel("H").getdata()
    sx = s.getdata()
    hues = sorted(h for h, sat in zip(hx, sx) if sat > 60)
    if not hues:
        return 0.0
    return hues[len(hues) // 2] / 255.0 * 360.0


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    src_path = root / "assets" / "pixel" / "ui" / "ui_icon_coin.png"
    src = Image.open(src_path)

    for name, (hue, sat) in TIERS.items():
        out = _hue_shift(src, hue, sat)
        dst = root / "assets" / "pixel" / "ui" / f"ui_icon_coin_{name}.png"
        out.save(dst)
        print(f"[OK] {dst.name}  目标色相 {hue}°  可见区域 {out.getbbox()}")


if __name__ == "__main__":
    main()
