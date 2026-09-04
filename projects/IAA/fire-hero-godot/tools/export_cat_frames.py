# -*- coding: utf-8 -*-
"""导出 球.psd 里「猫-1」「猫-2」两帧到 assets/props/ball/frames/，
供小球做 2 帧序列动画。

用法: python export_cat_frames.py <psd> <out_dir>
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


def main():
    psd_path = sys.argv[1] if len(sys.argv) > 1 else r"C:/Users/admin/Desktop/球.psd"
    out_dir = sys.argv[2] if len(sys.argv) > 2 else r"J:/ceshi/projects/IAA/fire-hero-godot/assets/props/ball/frames"
    psd = PSDImage.open(psd_path)
    os.makedirs(out_dir, exist_ok=True)

    idx = 0
    out = []

    def collect(node):
        nonlocal idx
        for l in node:
            if l.is_group():
                collect(l)
                continue
            if not getattr(l, "visible", True):
                continue
            nm = str(l.name)
            if "猫" not in nm:
                continue
            img = l.topil().convert("RGBA") if l.topil() is not None else None
            if img is None:
                continue
            c = crop_alpha(img)
            fname = f"cat_{idx:02d}.png"
            c.save(os.path.join(out_dir, fname))
            print(f"  {fname}  name={nm!r}  size={img.size}  cropped={c.size}")
            out.append(fname)
            idx += 1

    collect(psd)
    print("cat frames:", out)
    if out:
        # 组合一张横向参考
        imgs = [Image.open(os.path.join(out_dir, f)).convert("RGBA") for f in out]
        w = sum(i.width for i in imgs)
        h = max(i.height for i in imgs)
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        x = 0
        for i in imgs:
            canvas.alpha_composite(i, (x, 0))
            x += i.width
        canvas.save(os.path.join(out_dir, "frames_strip.png"))
        print("strip ->", os.path.join(out_dir, "frames_strip.png"))


if __name__ == "__main__":
    main()
