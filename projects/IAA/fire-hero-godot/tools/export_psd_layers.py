# -*- coding: utf-8 -*-
"""从 PSD 背景工程导出每个可见叶子图层为透明 PNG，并记录画布坐标/名称/层级。

产出:
  <out_dir>/layers/<z>_<sanitized>.png        每层透明 PNG（图层自身尺寸）
  <out_dir>/layers/composite_reference.png   全画布合成参考图（450x800）
  <out_dir>/layers.json                      层元数据（utf-8）

用法: python export_psd_layers.py <psd_path> <out_dir>
"""
import json
import os
import re
import sys

from psd_tools import PSDImage
from PIL import Image

CANVAS_W, CANVAS_H = 450, 800


def sanitize(name: str) -> str:
    name = re.sub(r"[^0-9A-Za-z\u4e00-\u9fff\-_]", "_", name)
    name = re.sub(r"_+", "_", name).strip("_")
    return name or "layer"


def collect_layers(psd, parent_path="", out=None):
    """遍历到叶子像素/形状层，返回记录列表（保持绘制顺序）。"""
    if out is None:
        out = []
    for l in psd:
        if l.is_group():
            collect_layers(l, parent_path + "/" + str(getattr(l, "name", "group")), out)
            continue
        # 仅处理可见且能渲染的层
        if not getattr(l, "visible", True):
            continue
        try:
            img = l.topil()
        except Exception:
            img = None
        if img is None:
            continue
        bbox = getattr(l, "bbox", None)
        if bbox is None:
            continue
        x, y = int(bbox[0]), int(bbox[1])  # bbox=(left,top,right,bottom)
        w, h = img.size
        if w <= 0 or h <= 0:
            continue
        out.append({
            "name": str(getattr(l, "name", "layer")),
            "kind": str(getattr(l, "kind", "?")),
            "group": parent_path,
            "file": "",
            "x": x,
            "y": y,
            "w": w,
            "h": h,
            "img": img,
        })
    return out


def main():
    psd_path = sys.argv[1] if len(sys.argv) > 1 else r"C:/Users/admin/Desktop/救火英雄背景.psd"
    out_dir = sys.argv[2] if len(sys.argv) > 2 else r"J:/ceshi/projects/IAA/fire-hero-godot/assets/backgrounds"

    psd = PSDImage.open(psd_path)
    print("canvas", psd.width, "x", psd.height)

    layers = collect_layers(psd)
    print("visible leaf layers:", len(layers))

    layers_dir = os.path.join(out_dir, "layers")
    os.makedirs(layers_dir, exist_ok=True)

    # 全画布合成参考
    composite = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    records = []
    for idx, rec in enumerate(layers):
        img = rec["img"].convert("RGBA")
        fname = f"{idx:02d}_{sanitize(rec['name'])}.png"
        fpath = os.path.join(layers_dir, fname)
        img.save(fpath)
        rec["file"] = os.path.relpath(fpath, out_dir).replace("\\", "/")
        rec.pop("img", None)
        records.append(rec)
        # 合成参考
        composite.alpha_composite(img, (rec["x"], rec["y"]))

    composite.save(os.path.join(layers_dir, "composite_reference.png"))

    meta = {
        "source_psd": psd_path.replace("\\", "/"),
        "canvas": [CANVAS_W, CANVAS_H],
        "count": len(records),
        "layers": records,
    }
    meta_path = os.path.join(out_dir, "layers.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print("exported", len(records), "layers ->", layers_dir)
    print("meta ->", meta_path)


if __name__ == "__main__":
    main()
