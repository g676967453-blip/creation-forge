# -*- coding: utf-8 -*-
"""从 PSD 导出的窗图层，合成 48x48 的砖纹理到 assets/props/windows/。

输出:
  window_fire.png        着火窗（基础，等级用 modulate 区分）
  window_rescue.png      救援窗 = 窗框 + 兔子-待救（居中）
  window_rescue_red.png  红窗   = 红色窗框 + 兔子（跳楼提示）
  window_normal.png      普通未着火窗（蓝玻璃，备用/空地装饰）

用法: python make_window_textures.py <layers_dir> <out_dir>
"""
import os
import sys

from PIL import Image

layers_dir = sys.argv[1] if len(sys.argv) > 1 else r"J:/ceshi/projects/IAA/fire-hero-godot/assets/backgrounds/layers"
out_dir = sys.argv[2] if len(sys.argv) > 2 else r"J:/ceshi/projects/IAA/fire-hero-godot/assets/props/windows"

SIZE = 48
os.makedirs(out_dir, exist_ok=True)


def load(name):
    p = os.path.join(layers_dir, name)
    if not os.path.exists(p):
        return None
    return Image.open(p).convert("RGBA")


def fit_center(img, box=SIZE):
    """等比缩放并居中到 SIZE x SIZE 画布（保持透明底）。"""
    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    if img is None:
        return out
    # 等比放大到接近，但保留原始意图：直接缩放到合适大小再居中
    w, h = img.size
    scale = min((SIZE * 0.94) / w, (SIZE * 0.94) / h)
    nw, nh = max(2, int(w * scale)), max(2, int(h * scale))
    img2 = img.resize((nw, nh), Image.NEAREST)
    ox, oy = (SIZE - nw) // 2, (SIZE - nh) // 2
    out.alpha_composite(img2, (ox, oy))
    return out


def tint(img, color):
    """对不透明像素做色调染色（R/G/B 乘子）。"""
    if img is None:
        return img
    r, g, b, a = img.split()
    r = r.point(lambda px: int(px * color[0]))
    g = g.point(lambda px: int(px * color[1]))
    b = b.point(lambda px: int(px * color[2]))
    return Image.merge("RGBA", (r, g, b, a))


# 1) 着火窗：已是完整火窗
fire = fit_center(load("17_着火窗户.png"))
fire.save(os.path.join(out_dir, "window_fire.png"))

# 2) 救援窗：窗框打底 + 兔子居中
frame = load("07_窗框.png")
rabbit = load("06_兔子-待救.png")
rescue = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
if frame:
    frame_f = fit_center(frame)
    rescue.alpha_composite(frame_f)
if rabbit:
    # 兔子等比放到窗内偏上（模拟扒窗）
    rw, rh = rabbit.size
    rscale = (SIZE * 0.62) / rw
    r2 = rabbit.resize((max(2, int(rw * rscale)), max(2, int(rh * rscale))), Image.NEAREST)
    rox, roy = (SIZE - r2.size[0]) // 2, 4
    rescue.alpha_composite(r2, (rox, roy))
rescue.save(os.path.join(out_dir, "window_rescue.png"))

# 3) 红窗：窗框染色红 + 兔子
red = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
if frame:
    red.alpha_composite(tint(fit_center(frame), (1.0, 0.25, 0.25)))
if rabbit:
    rw, rh = rabbit.size
    rscale = (SIZE * 0.62) / rw
    r2 = rabbit.resize((max(2, int(rw * rscale)), max(2, int(rh * rscale))), Image.NEAREST)
    rox, roy = (SIZE - r2.size[0]) // 2, 4
    red.alpha_composite(r2, (rox, roy))
red.save(os.path.join(out_dir, "window_rescue_red.png"))

# 4) 普通未着火窗（蓝玻璃）
normal = fit_center(load("16_普通未着火窗户.png"))
normal.save(os.path.join(out_dir, "window_normal.png"))

print("windows textures ->", out_dir)
for f in ["window_fire.png", "window_rescue.png", "window_rescue_red.png", "window_normal.png"]:
    p = os.path.join(out_dir, f)
    print(f"  {f}  {os.path.getsize(p)} bytes  (exists {os.path.exists(p)})")
