"""生成金币雨结算用的大金币贴图（原生大尺寸，避免把 64px UI 图标放大 2 倍变马赛克）

背景：结算画面原本复用 assets/pixel/ui/ui_icon_coin.png（64×64），
显示尺寸 132px = 2.06 倍放大；项目 canvas_textures/default_texture_filter = 0（Nearest），
放大后是块状马赛克。UI 图标平时都是缩小使用所以很锐利，只有这里被放大。

做法：按显示尺寸原生绘制（1:1，永不放缩），逐像素解析式抗锯齿，
风格对齐 assets/props/items/ 下其余道具图标（渐变 + 高光，非硬边像素风）。

用法：
    python tools/make_big_coin.py            # 默认 132px 输出到 assets/props/items/coin_big.png
    python tools/make_big_coin.py --size 160
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image

# ===== 配色（金色系，与 item_bag 等道具图标的暖金一致）=====
## 描边色对齐 assets/pixel/ui/ui_icon_coin.png 的主色 RGBA(18,14,22)
## —— 那一族 UI 图标都是「深色描边 + 填充」，结算大金币必须同族，
## 否则同一个游戏里会出现两种风格的金币。
OUTLINE = (24, 19, 28)
RIM_DARK = (0x7A, 0x58, 0x0C)      # 外圈暗金
GOLD_EDGE = (0xE8, 0xA8, 0x1E)     # 盘面外缘
GOLD_MID = (0xFF, 0xC8, 0x3A)      # 盘面中部
GOLD_CORE = (0xFF, 0xEC, 0xA6)     # 盘面偏亮
HILIGHT = (0xFF, 0xFA, 0xDC)       # 左上高光
STAR = (0xC9, 0x8A, 0x14)          # 中央星徽（压暗浮雕）

# 几何比例（相对半径 R）
OUTLINE_W = 0.065     # 深色描边宽度（占 R 的比例）
RIM_INNER = 0.90      # 外圈内边界
STAR_R_OUT = 0.40     # 星徽外接圆
STAR_R_IN = 0.165     # 星徽内接圆
STAR_BLEND = 0.55     # 星徽压暗强度（太高会变成一团黑）


def _lerp(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return (
        int(round(a[0] + (b[0] - a[0]) * t)),
        int(round(a[1] + (b[1] - a[1]) * t)),
        int(round(a[2] + (b[2] - a[2]) * t)),
    )


def _star_polygon(cx: float, cy: float, r_out: float, r_in: float, points: int = 5) -> list[tuple[float, float]]:
    """标准 5 角星顶点（尖角朝上）"""
    verts: list[tuple[float, float]] = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        ang = -math.pi / 2 + i * math.pi / points
        verts.append((cx + math.cos(ang) * r, cy + math.sin(ang) * r))
    return verts


def _inside_polygon(px: float, py: float, poly: list[tuple[float, float]]) -> bool:
    """射线法点在多边形内判定"""
    inside = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if (y1 > py) != (y2 > py):
            x_cross = (x2 - x1) * (py - y1) / (y2 - y1) + x1
            if px < x_cross:
                inside = not inside
    return inside


def build_coin(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()

    c = size / 2.0
    R = size / 2.0 - 1.0          # 留 1px 余量给抗锯齿
    outline_in = R * (1.0 - OUTLINE_W)   # 描边内边界
    rim_in = outline_in * RIM_INNER      # 盘面外边界
    star = _star_polygon(c, c, rim_in * STAR_R_OUT, rim_in * STAR_R_IN)

    # 光源方向（左上 → 右下），用于盘面渐变与高光
    lx, ly = -0.55, -0.62

    for y in range(size):
        for x in range(size):
            dx = x + 0.5 - c
            dy = y + 0.5 - c
            d = math.hypot(dx, dy)

            # 外缘 1px 解析式抗锯齿
            cover = R - d
            if cover <= 0.0:
                continue
            alpha = 255 if cover >= 1.0 else int(round(255 * cover))

            if d > outline_in:
                # 深色描边：与 ui_icon_* 同族
                rgb = OUTLINE
            elif d > rim_in:
                # 外圈暗金：给盘面一个厚度感
                rgb = _lerp(GOLD_EDGE, RIM_DARK, (d - rim_in) / max(1e-6, outline_in - rim_in))
            else:
                # 盘面：外缘 → 中部 → 靠光一侧更亮
                t = d / max(1e-6, rim_in)
                if t < 0.55:
                    rgb = _lerp(GOLD_CORE, GOLD_MID, t / 0.55)
                else:
                    rgb = _lerp(GOLD_MID, GOLD_EDGE, (t - 0.55) / 0.45)
                # 朝光源方向提亮（中心亮、右下暗）
                lit = max(0.0, 1.0 - math.hypot(dx / R - lx, dy / R - ly) * 0.95)
                rgb = _lerp(rgb, HILIGHT, lit * 0.55 * (1.0 - t * 0.6))
                # 中央星徽浮雕
                if _inside_polygon(x + 0.5, y + 0.5, star):
                    rgb = _lerp(rgb, STAR, STAR_BLEND)

            px[x, y] = (rgb[0], rgb[1], rgb[2], alpha)

    return img


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", type=int, default=132, help="输出边长（应与游戏内显示尺寸一致，保证 1:1）")
    ap.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "assets" / "props" / "items" / "coin_big.png",
    )
    args = ap.parse_args()

    img = build_coin(args.size)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    img.save(args.out)
    print(f"[OK] {args.out}  {img.size[0]}x{img.size[1]}  可见区域 {img.getbbox()}")


if __name__ == "__main__":
    main()
