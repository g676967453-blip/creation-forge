# -*- coding: utf-8 -*-
"""仅用「纯背景」组图层合成一张干净的关卡背景（不含烘焙的可交互窗）。

产出:
  assets/backgrounds/bg_level_default.png   (450x800, 纯背景组合成)
  assets/backgrounds/bg_level_default_900x1600.png   (@2x)

用法: python make_bg_composite.py <layers.json> <out_dir>
"""
import json
import os
import sys

from PIL import Image

json_path = sys.argv[1] if len(sys.argv) > 1 else r"J:/ceshi/projects/IAA/fire-hero-godot/assets/backgrounds/layers.json"
out_dir = sys.argv[2] if len(sys.argv) > 2 else r"J:/ceshi/projects/IAA/fire-hero-godot/assets/backgrounds"

with open(json_path, encoding="utf-8") as f:
    meta = json.load(f)

base_dir = os.path.dirname(json_path)
canvas_w, canvas_h = meta["canvas"]
canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))

imported = 0
for rec in meta["layers"]:
    if "纯背景" not in (rec.get("group", "") or ""):
        continue
    fpath = os.path.join(base_dir, rec["file"].replace("/", os.sep))
    if not os.path.exists(fpath):
        continue
    img = Image.open(fpath).convert("RGBA")
    canvas.alpha_composite(img, (rec["x"], rec["y"]))
    imported += 1

print("composited pure-background layers:", imported)
if imported == 0:
    print("no pure-background layers matched")
    sys.exit(1)

out1 = os.path.join(out_dir, "bg_level_default.png")
canvas.convert("RGB").save(out1)
print("saved", out1)

# @2x
canvas2x = canvas.resize((canvas_w * 2, canvas_h * 2), Image.NEAREST)
out2 = os.path.join(out_dir, "bg_level_default_900x1600.png")
canvas2x.convert("RGB").save(out2)
print("saved", out2)
