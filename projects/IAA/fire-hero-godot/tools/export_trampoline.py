# -*- coding: utf-8 -*-
"""导出蹦床 PSD 的三个元素（消防员1 / 蹦床 / 消防员2）到 assets/props/trampoline/，
并生成一张组合参考图验证位置。

输出:
  assets/props/trampoline/{z}_{name}.png   各元素透明 PNG（按 alpha 裁剪）
  assets/props/trampoline/composite.png    140x71 组合示意

用法: python export_trampoline.py <psd> <out_dir>
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
    bbox = img.getbbox()
    if bbox:
        return img.crop(bbox)
    return img


def main():
    psd_path = sys.argv[1] if len(sys.argv) > 1 else r"C:/Users/admin/Desktop/蹦床.psd"
    out_dir = sys.argv[2] if len(sys.argv) > 2 else r"J:/ceshi/projects/IAA/fire-hero-godot/assets/props/trampoline"
    psd = PSDImage.open(psd_path)
    print("canvas", psd.width, "x", psd.height)
    os.makedirs(out_dir, exist_ok=True)

    canvas = Image.new("RGBA", (psd.width, psd.height), (0, 0, 0, 0))
    idx = 0
    for l in psd:
        img = l.topil().convert("RGBA") if l.topil() is not None else None
        if img is None:
            continue
        x, y = int(l.bbox[0]), int(l.bbox[1])
        cropped = crop_alpha(img)
        fname = f"{idx:02d}_{sanitize(str(l.name))}.png"
        fpath = os.path.join(out_dir, fname)
        cropped.save(fpath)
        w, h = cropped.size
        print(f"  {fname}  bbox_in_psd=({x},{y})  size={img.size}  cropped={w}x{h}")
        canvas.alpha_composite(img, (x, y))
        idx += 1

    canvas.save(os.path.join(out_dir, "composite.png"))
    print("composite ->", os.path.join(out_dir, "composite.png"))
    print("total elements:", idx)


if __name__ == "__main__":
    main()
