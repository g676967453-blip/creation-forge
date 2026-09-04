# -*- coding: utf-8 -*-
"""导出蹦床 PSD 里两个消防员的 2 帧(左消防员1/1-2, 右消防员2/2-2)，
按底边对齐合成到统一尺寸，供 AnimatedSprite2D 动画。

输出 assets/props/trampoline/frames/:
  fireman_left_00/01.png   左消防员帧(底边对齐)
  fireman_right_00/01.png  右消防员帧(底边对齐)
  strip_left.png / strip_right.png  核对参考

用法: python export_tramp_frames.py <psd> <out_dir>
"""
import os
import re
import sys

from psd_tools import PSDImage
from PIL import Image


def sanitize(n):
    n = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff\-_]", "_", n)
    n = re.sub(r"_+", "_", n).strip("_")
    return n or "frame"


def crop_alpha(img):
    b = img.getbbox()
    return img.crop(b) if b else img


def align_bottom(img, W, H):
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x = (W - img.width) // 2
    y = H - img.height
    canvas.alpha_composite(img, (x, y))
    return canvas


def main():
    psd_path = sys.argv[1] if len(sys.argv) > 1 else r"C:/Users/admin/Desktop/蹦床.psd"
    out_dir = sys.argv[2] if len(sys.argv) > 2 else r"J:/ceshi/projects/IAA/fire-hero-godot/assets/props/trampoline/frames"
    os.makedirs(out_dir, exist_ok=True)
    psd = PSDImage.open(psd_path)

    # 按名字分组收集帧
    left, right = [], []
    for l in psd:
        nm = str(l.name)
        if "消防员1" in nm:
            left.append(l)
        elif "消防员2" in nm:
            right.append(l)

    def export(group, prefix):
        imgs = []
        for l in group:
            img = crop_alpha(l.topil().convert("RGBA"))
            imgs.append(img)
        if not imgs:
            return
        W = max(i.width for i in imgs)
        H = max(i.height for i in imgs)
        frames = [align_bottom(i, W, H) for i in imgs]
        for k, f in enumerate(frames):
            f.save(os.path.join(out_dir, f"{prefix}_{k:02d}.png"))
        # 横条参考
        strip = Image.new("RGBA", (W * len(frames), H), (0, 0, 0, 0))
        x = 0
        for f in frames:
            strip.alpha_composite(f, (x, 0))
            x += W
        strip.save(os.path.join(out_dir, f"strip_{prefix}.png"))
        print(f"{prefix}: {len(frames)} frames, canvas {W}x{H}")

    export(left, "fireman_left")
    export(right, "fireman_right")
    print("exported ->", out_dir)


if __name__ == "__main__":
    main()
