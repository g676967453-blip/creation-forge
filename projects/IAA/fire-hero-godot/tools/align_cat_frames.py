# -*- coding: utf-8 -*-
"""把猫的两帧按底边对齐合成到同一尺寸画布（都从底部放，脚底对齐）。
输出 assets/props/ball/frames/cat_anim_00.png / cat_anim_01.png（同为最大帧尺寸）。

用法: python align_cat_frames.py <frames_dir>
"""
import os
import sys

from PIL import Image

frames_dir = sys.argv[1] if len(sys.argv) > 1 else r"J:/ceshi/projects/IAA/fire-hero-godot/assets/props/ball/frames"

f0 = os.path.join(frames_dir, "cat_00.png")
f1 = os.path.join(frames_dir, "cat_01.png")

if not (os.path.exists(f0) and os.path.exists(f1)):
    print("missing cat frames, exit")
    sys.exit(1)

img0 = Image.open(f0).convert("RGBA")
img1 = Image.open(f1).convert("RGBA")

# 目标画布：取最大宽高
W = max(img0.width, img1.width)
H = max(img0.height, img1.height)

def align_bottom(img):
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x = (W - img.width) // 2
    y = H - img.height   # 底边对齐：y = H - 高
    canvas.alpha_composite(img, (x, y))
    return canvas

a0 = align_bottom(img0)
a1 = align_bottom(img1)

a0.save(os.path.join(frames_dir, "cat_anim_00.png"))
a1.save(os.path.join(frames_dir, "cat_anim_01.png"))

# 生成一条底边对齐的横条参考
strip = Image.new("RGBA", (W * 2, H), (0, 0, 0, 0))
strip.alpha_composite(a0, (0, 0))
strip.alpha_composite(a1, (W, 0))
strip.save(os.path.join(frames_dir, "frames_strip_aligned.png"))

print("aligned frames ->", frames_dir)
print("size", W, "x", H)
print("cat_anim_00.png", os.path.getsize(os.path.join(frames_dir, "cat_anim_00.png")))
print("cat_anim_01.png", os.path.getsize(os.path.join(frames_dir, "cat_anim_01.png")))
