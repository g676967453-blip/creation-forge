# -*- coding: utf-8 -*-
"""导出球.psd 里的多个角色层（透明 PNG + 裁剪）到 assets/props/ball/，
并生成组合参考图。用于判断弹射物用哪几个角色/如何排布。

用法: python export_ball_chars.py <psd> <out_dir>
"""
import os
import re
import sys

from psd_tools import PSDImage
from PIL import Image


def sanitize(n):
    n = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff\-_]", "_", n)
    n = re.sub(r"_+", "_", n).strip("_")
    return n or "layer"


def crop_alpha(img):
    b = img.getbbox()
    return img.crop(b) if b else img


def main():
    psd_path = sys.argv[1] if len(sys.argv) > 1 else r"C:/Users/admin/Desktop/球.psd"
    out_dir = sys.argv[2] if len(sys.argv) > 2 else r"J:/ceshi/projects/IAA/fire-hero-godot/assets/props/ball"
    psd = PSDImage.open(psd_path)
    print("canvas", psd.width, "x", psd.height)
    os.makedirs(out_dir, exist_ok=True)

    canvas = Image.new("RGBA", (psd.width, psd.height), (0, 0, 0, 0))
    idx = 0

    def collect(node):
        nonlocal idx
        for l in node:
            if l.is_group():
                collect(l)
                continue
            if not getattr(l, "visible", True):
                continue
            img = l.topil().convert("RGBA") if l.topil() is not None else None
            if img is None:
                continue
            x, y = int(l.bbox[0]), int(l.bbox[1])
            c = crop_alpha(img)
            fname = f"{idx:02d}_{sanitize(str(l.name))}.png"
            c.save(os.path.join(out_dir, fname))
            print(f"  {fname}  bbox=({x},{y})  size={img.size}  cropped={c.size}")
            canvas.alpha_composite(img, (x, y))
            idx += 1

    collect(psd)
    canvas.save(os.path.join(out_dir, "composite.png"))
    print("composite ->", os.path.join(out_dir, "composite.png"))
    print("total layers:", idx)


if __name__ == "__main__":
    main()
