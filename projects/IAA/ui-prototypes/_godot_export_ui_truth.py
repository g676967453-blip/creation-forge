# -*- coding: utf-8 -*-
"""Export Godot UI truth (rects/text) then rebuild Pixso frames from that truth."""
from __future__ import annotations

import base64
import json
import random
import re
import sys
import urllib.request
from pathlib import Path

GODOT = "http://127.0.0.1:9080/mcp"
PIXSO = "http://127.0.0.1:3667/mcp"
ROOT = Path(r"J:\ceshi\projects\IAA")
ASSETS = ROOT / "fire-hero-godot" / "assets"
OUT = ROOT / "ui-prototypes" / "godot-replica"
OUT.mkdir(parents=True, exist_ok=True)
SCREENS = OUT / "screens-godot-truth"
SCREENS.mkdir(parents=True, exist_ok=True)


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def mcp(uri: str, headers: dict, payload: dict, timeout=120):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(uri, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        sid = r.headers.get("mcp-session-id")
        if sid:
            headers["mcp-session-id"] = sid
        raw = r.read().decode("utf-8", errors="replace")
    parts = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
    body = "\n".join(parts) if parts else raw
    if not body.strip():
        return None
    return json.loads(body)


def init(uri: str, name: str) -> dict:
    h = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    mcp(
        uri,
        h,
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": name, "version": "1"},
            },
        },
    )
    try:
        mcp(uri, h, {"jsonrpc": "2.0", "method": "notifications/initialized"})
    except Exception:
        pass
    return h


def call(uri, h, name, args=None, timeout=120):
    o = mcp(
        uri,
        h,
        {
            "jsonrpc": "2.0",
            "id": random.randint(1, 999999),
            "method": "tools/call",
            "params": {"name": name, "arguments": args or {}},
        },
        timeout=timeout,
    )
    content = ((o or {}).get("result") or {}).get("content") or []
    # concatenate text parts
    texts = []
    for c in content:
        if isinstance(c, dict) and "text" in c:
            texts.append(c["text"])
    text = "\n".join(texts)
    # structuredContent preferred
    sc = ((o or {}).get("result") or {}).get("structuredContent")
    if sc is not None:
        return sc, text, o
    try:
        return json.loads(text), text, o
    except Exception:
        return text, text, o


def data_uri(rel: str) -> str:
    b = (ASSETS / rel).read_bytes()
    return "data:image/png;base64," + base64.b64encode(b).decode("ascii")


def png_wh(rel: str) -> tuple[int, int]:
    b = (ASSETS / rel).read_bytes()
    return int.from_bytes(b[16:20], "big"), int.from_bytes(b[20:24], "big")


MEASURE_GD = r"""
var root = edited_scene
if root == null:
	_custom_print("ERROR_NO_ROOT")
	return
var out = {}
out["root"] = str(root.name)
var paths = [
	"UI",
	"UI/HUD",
	"UI/HUD/TopBar",
	"UI/HUD/TopBar/LevelBox",
	"UI/HUD/TopBar/LevelBox/Icon",
	"UI/HUD/TopBar/LevelBox/LevelLabel",
	"UI/HUD/TopBar/ScoreBox",
	"UI/HUD/TopBar/ScoreBox/Icon",
	"UI/HUD/TopBar/ScoreBox/ScoreLabel",
	"UI/HUD/TopBar/CoinsBox",
	"UI/HUD/TopBar/CoinsBox/Icon",
	"UI/HUD/TopBar/CoinsBox/CoinsLabel",
	"UI/HUD/TopBar/LivesBox",
	"UI/HUD/TopBar/LivesBox/Icon",
	"UI/HUD/TopBar/LivesBox/LivesLabel",
	"UI/HUD/GoalLabel",
	"UI/HUD/Hint",
	"UI/Toast",
	"UI/Overlays",
	"UI/Overlays/Menu",
	"UI/Overlays/Menu/VBox",
	"UI/Overlays/Menu/VBox/Title",
	"UI/Overlays/Menu/VBox/Sub",
	"UI/Overlays/Menu/VBox/MenuStats",
	"UI/Overlays/Menu/VBox/StartButton",
	"UI/Overlays/LevelClear",
	"UI/Overlays/LevelClear/VBox",
	"UI/Overlays/LevelClear/VBox/Title",
	"UI/Overlays/LevelClear/VBox/Stats",
	"UI/Overlays/LevelClear/VBox/DoubleButton",
	"UI/Overlays/LevelClear/VBox/NextButton",
	"UI/Overlays/GameOver",
	"UI/Overlays/GameOver/VBox",
	"UI/Overlays/GameOver/VBox/Title",
	"UI/Overlays/GameOver/VBox/Stats",
	"UI/Overlays/GameOver/VBox/ReviveButton",
	"UI/Overlays/GameOver/VBox/RetryButton",
	"UI/Overlays/GameOver/VBox/MenuButton",
	"UI/Overlays/Pause",
	"UI/Overlays/Pause/VBox",
	"UI/Overlays/Pause/VBox/Title",
	"UI/Overlays/Pause/VBox/ResumeButton",
	"UI/Overlays/Pause/VBox/MenuButton",
	"GameRoot/Background",
	"GameRoot/Paddle",
	"GameRoot/Paddle/Visual/Mat",
	"GameRoot/Paddle/Visual/FiremanLeft",
	"GameRoot/Paddle/Visual/FiremanRight",
	"GameRoot/Ball",
	"GameRoot/Ball/Visual"
]
for p in paths:
	var n = root.get_node_or_null(p)
	if n == null:
		out[p] = {"missing": true}
		continue
	var item = {"class": n.get_class(), "name": str(n.name)}
	if n is CanvasItem:
		item["visible"] = n.visible
	if n is Control:
		var r = n.get_global_rect()
		item["x"] = r.position.x
		item["y"] = r.position.y
		item["w"] = r.size.x
		item["h"] = r.size.y
		if n is Label:
			item["text"] = n.text
			item["font_size"] = n.get_theme_font_size("font_size")
			var fc = n.get_theme_color("font_color")
			item["font_color"] = [fc.r, fc.g, fc.b, fc.a]
			item["halign"] = n.horizontal_alignment
		if n is Button:
			item["text"] = n.text
		if n is ColorRect:
			var col = n.color
			item["color"] = [col.r, col.g, col.b, col.a]
		if n is TextureRect and n.texture != null:
			item["tex"] = str(n.texture.resource_path)
	elif n is Node2D:
		item["x"] = n.global_position.x
		item["y"] = n.global_position.y
		if n is Sprite2D or n is AnimatedSprite2D:
			if n is Sprite2D and n.texture != null:
				item["tex"] = str(n.texture.resource_path)
				item["tw"] = n.texture.get_width()
				item["th"] = n.texture.get_height()
			item["sx"] = n.scale.x
			item["sy"] = n.scale.y
	out[p] = item

# Menu VBox full children (includes runtime char btn if present after play; editor may not have it)
var mv = root.get_node_or_null("UI/Overlays/Menu/VBox")
if mv != null:
	var kids = []
	for ch in mv.get_children():
		var e = {"name": str(ch.name), "class": ch.get_class()}
		if ch is Control:
			var rr = ch.get_global_rect()
			e["x"] = rr.position.x
			e["y"] = rr.position.y
			e["w"] = rr.size.x
			e["h"] = rr.size.y
		if ch is Label or ch is Button:
			e["text"] = ch.text
		kids.append(e)
	out["menu_kids"] = kids

# Style button color from scene constant-ish
out["btn_style"] = {"bg": [1.0, 0.69, 0.125, 1.0], "radius": 10}

_custom_print(JSON.stringify(out))
"""


def export_godot_truth(gh: dict) -> dict:
    sc, text, raw = call(GODOT, gh, "execute_editor_script", {"code": MEASURE_GD}, timeout=60)
    # Prefer output array
    out_arr = None
    if isinstance(sc, dict) and "output" in sc:
        out_arr = sc["output"]
    elif isinstance(raw, dict):
        # dig
        res = raw.get("result") or {}
        sc2 = res.get("structuredContent")
        if isinstance(sc2, dict) and "output" in sc2:
            out_arr = sc2["output"]
        else:
            # text may be whole result
            try:
                parsed = json.loads(text)
                if isinstance(parsed, dict) and "output" in parsed:
                    out_arr = parsed["output"]
            except Exception:
                pass
    truth = None
    if isinstance(out_arr, list) and out_arr:
        # first printable json line
        for item in out_arr:
            s = str(item)
            if s.startswith("{"):
                truth = json.loads(s)
                break
    if truth is None and isinstance(text, str) and text.strip().startswith("{"):
        # maybe direct
        try:
            truth = json.loads(text)
        except Exception:
            pass
    if truth is None:
        # dump for debug
        (OUT / "godot-measure-raw.json").write_text(
            json.dumps({"sc": sc, "text": text}, ensure_ascii=False, indent=2)[:20000],
            encoding="utf-8",
        )
        raise RuntimeError("failed to parse godot truth; see godot-measure-raw.json")
    (OUT / "godot-ui-truth.json").write_text(json.dumps(truth, ensure_ascii=False, indent=2), encoding="utf-8")
    return truth


def r4(v):
    return round(float(v) + 1e-9, 1)


def build_html_from_truth(truth: dict) -> list[dict]:
    """Build absolute screens matching Godot control rects. No extra five-card row."""
    U = {
        "bg": data_uri("backgrounds/bg_level_default.png"),
        "mat": data_uri("props/trampoline/mat.png"),
        "fmL": data_uri("props/trampoline/fireman_left.png"),
        "fmR": data_uri("props/trampoline/fireman_right.png"),
        "cat": data_uri("props/ball/char_cat.png"),
        "icLv": data_uri("pixel/ui/ui_icon_level.png"),
        "icSc": data_uri("pixel/ui/ui_icon_score.png"),
        "icCn": data_uri("pixel/ui/ui_icon_coin.png"),
        "icLife": data_uri("pixel/ui/ui_icon_life.png"),
        "winN": data_uri("props/windows/window_normal.png"),
        "winF1": data_uri("props/windows/window_fire_lv1.png"),
        "winF2": data_uri("props/windows/window_fire_lv2.png"),
        "winF3": data_uri("props/windows/window_fire_lv3.png"),
        "winR": data_uri("props/windows/window_rescue.png"),
        "winRR": data_uri("props/windows/window_rescue_red.png"),
        "itemWide": data_uri("props/items/item_wide.png"),
        "itemExt": data_uri("props/items/item_extinguish.png"),
        "itemUp": data_uri("props/items/item_up.png"),
        "panda": data_uri("props/ball/char_panda.png"),
    }

    def node(path, default=None):
        return truth.get(path) or default or {}

    def box(n, **extra):
        if not n or n.get("missing"):
            return ""
        style = (
            f"left:{r4(n['x'])}px;top:{r4(n['y'])}px;width:{r4(n['w'])}px;height:{r4(n['h'])}px;"
        )
        for k, v in extra.items():
            style += f"{k}:{v};"
        return style

    def label_html(n, cls="lbl"):
        if not n or n.get("missing"):
            return ""
        color = n.get("font_color") or [1, 1, 1, 1]
        rgba = f"rgba({int(color[0]*255)},{int(color[1]*255)},{int(color[2]*255)},{color[3]})"
        fs = int(n.get("font_size") or 15)
        text = (n.get("text") or "").replace("\n", "<br/>")
        ha = "center" if int(n.get("halign") or 1) == 1 else "left"
        return (
            f'<div class="{cls}" style="{box(n)}color:{rgba};font-size:{fs}px;'
            f'text-align:{ha};line-height:1.25;display:flex;align-items:center;'
            f'justify-content:{"center" if ha=="center" else "flex-start"};">{text}</div>'
        )

    def btn_html(n, bg="#ffb020", fg="#1a1208", cls="btn"):
        if not n or n.get("missing"):
            return ""
        text = n.get("text") or ""
        return (
            f'<div class="{cls}" style="{box(n)}background:{bg};color:{fg};border-radius:10px;'
            f'font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center;'
            f'box-shadow:0 4px 0 rgba(0,0,0,.22);">{text}</div>'
        )

    def color_rect(n):
        if not n or n.get("missing"):
            return ""
        c = n.get("color") or [0.05, 0.07, 0.1, 0.92]
        rgba = f"rgba({int(c[0]*255)},{int(c[1]*255)},{int(c[2]*255)},{c[3]})"
        return f'<div style="{box(n)}background:{rgba};"></div>'

    # game field under overlays (editor static)
    paddle = node("GameRoot/Paddle")
    ball = node("GameRoot/Ball")
    mat = node("GameRoot/Paddle/Visual/Mat")
    fmL = node("GameRoot/Paddle/Visual/FiremanLeft")
    fmR = node("GameRoot/Paddle/Visual/FiremanRight")
    # if mat/firemen lack size, use texture sizes centered on paddle
    mw, mh = png_wh("props/trampoline/mat.png")
    flw, flh = png_wh("props/trampoline/fireman_left.png")
    frw, frh = png_wh("props/trampoline/fireman_right.png")
    cw, ch = png_wh("props/ball/char_cat.png")
    px, py = float(paddle.get("x", 225)), float(paddle.get("y", 650))
    # Node2D positions are origin; sprites drawn around them - approximate like scene
    mat_x = px - mw / 2
    mat_y = py + 8 - mh / 2
    fmL_x = px - 40 - flw / 2
    fmR_x = px + 40 - frw / 2
    fm_y = py - 10 - flh / 2
    bx, by = float(ball.get("x", 226)), float(ball.get("y", 625))
    ball_x, ball_y = bx - cw / 2, by - ch / 2

    # decorative windows grid (not exact level; visual underlay only for non-menu? include always under)
    # facade constants
    BRICK_W, BRICK_H, GAP, COLS = 48, 48, 4, 7
    GRID_TOP = 80
    facade_x0 = (450 - (COLS * BRICK_W + (COLS - 1) * GAP)) / 2
    pattern = [
        ["F2", "N", "F1", "R", "N", "F3", "N"],
        ["N", "F2", "N", "N", "F1", "N", "F2"],
        ["F1", "N", "RR", "N", "F2", "N", "N"],
        ["N", "F3", "N", "F1", "N", "R", "N"],
        ["F2", "N", "N", "N", "F1", "N", "F2"],
        ["N", "F1", "N", "F2", "N", "N", "F3"],
        ["F1", "N", "R", "N", "F2", "N", "N"],
        ["N", "F2", "N", "F1", "N", "N", "F1"],
    ]
    keyu = {
        "N": U["winN"],
        "F1": U["winF1"],
        "F2": U["winF2"],
        "F3": U["winF3"],
        "R": U["winR"],
        "RR": U["winRR"],
    }
    wins = []
    for r, row in enumerate(pattern):
        for c, k in enumerate(row):
            x = facade_x0 + c * (BRICK_W + GAP)
            y = GRID_TOP + r * (BRICK_H + GAP)
            wins.append(
                f'<img src="{keyu[k]}" style="position:absolute;left:{x}px;top:{y}px;width:48px;height:48px;image-rendering:pixelated"/>'
            )

    field = f"""
<img src="{U['bg']}" style="position:absolute;left:0;top:0;width:450px;height:800px"/>
{''.join(wins)}
<img src="{U['fmL']}" style="position:absolute;left:{mat_x-30}px;top:{fm_y}px;width:{flw}px;height:{flh}px;image-rendering:pixelated"/>
<img src="{U['mat']}" style="position:absolute;left:{mat_x}px;top:{mat_y}px;width:{mw}px;height:{mh}px;image-rendering:pixelated"/>
<img src="{U['fmR']}" style="position:absolute;left:{mat_x+mw-10}px;top:{fm_y}px;width:{frw}px;height:{frh}px;image-rendering:pixelated"/>
<img src="{U['cat']}" style="position:absolute;left:{ball_x}px;top:{ball_y}px;width:{cw}px;height:{ch}px;image-rendering:pixelated"/>
"""
    # better fireman positions from truth if present
    if fmL and not fmL.get("missing") and "x" in fmL:
        field = f"""
<img src="{U['bg']}" style="position:absolute;left:0;top:0;width:450px;height:800px"/>
{''.join(wins)}
<img src="{U['fmL']}" style="position:absolute;left:{r4(fmL['x']-flw/2)}px;top:{r4(fmL['y']-flh/2)}px;width:{flw}px;height:{flh}px;image-rendering:pixelated"/>
<img src="{U['mat']}" style="position:absolute;left:{r4((mat.get('x',px)-mw/2) if mat else mat_x)}px;top:{r4((mat.get('y',py)-mh/2) if mat else mat_y)}px;width:{mw}px;height:{mh}px;image-rendering:pixelated"/>
<img src="{U['fmR']}" style="position:absolute;left:{r4(fmR['x']-frw/2) if fmR and 'x' in fmR else mat_x+mw-10}px;top:{r4(fmR['y']-frh/2) if fmR and 'y' in fmR else fm_y}px;width:{frw}px;height:{frh}px;image-rendering:pixelated"/>
<img src="{U['cat']}" style="position:absolute;left:{ball_x}px;top:{ball_y}px;width:{cw}px;height:{ch}px;image-rendering:pixelated"/>
"""

    css = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:450px;height:800px;overflow:hidden;background:#000}
.phone{position:relative;width:450px;height:800px;overflow:hidden;
  font-family:"Microsoft YaHei","Noto Sans SC",sans-serif;color:#fff}
.lbl,.btn{position:absolute;white-space:pre-wrap}
"""

    def wrap(name, body):
        html = f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"/><title>{name}</title>
<style>{css}</style></head><body>
<div class="phone" data-name="{name}">{body}</div>
</body></html>"""
        path = SCREENS / f"{name}.html"
        path.write_text(html, encoding="utf-8")
        log(f"wrote {path.name} {path.stat().st_size}")
        return {"file": path.name, "name": name, "w": 450, "h": 800}

    screens = []

    # G01 Menu = field + menu overlay exact
    menu = node("UI/Overlays/Menu")
    title = node("UI/Overlays/Menu/VBox/Title")
    sub = node("UI/Overlays/Menu/VBox/Sub")
    stats = node("UI/Overlays/Menu/VBox/MenuStats")
    start = node("UI/Overlays/Menu/VBox/StartButton")
    # char button may be runtime-only; synthesize above Start if missing using same width
    char_btn = None
    for ch in truth.get("menu_kids") or []:
        if ch.get("class") == "Button" and ch.get("name") not in ("StartButton",):
            if "角色" in str(ch.get("text") or "") or ch.get("name") not in (
                "Title",
                "Sub",
                "MenuStats",
            ):
                if ch.get("name") != "StartButton" and "text" in ch and ch.get("w"):
                    char_btn = ch
    # If no runtime char btn, place one just above start with same w, h~44
    if not char_btn and start and not start.get("missing"):
        char_btn = {
            "x": start["x"],
            "y": start["y"] - 58,
            "w": start["w"],
            "h": 44,
            "text": "角色：小猫 · 敏捷（点击切换）",
        }
    screens.append(
        wrap(
            "T01-Menu",
            field
            + color_rect(menu)
            + label_html(title)
            + label_html(sub)
            + label_html(stats)
            + (
                btn_html(char_btn, bg="#593d1a", fg="#ffe9c9")
                if char_btn
                else ""
            )
            + btn_html(start),
        )
    )

    # G02 InGame HUD visible + field, overlays hidden
    # force show HUD pieces even if currently invisible in editor
    def force_visible_copy(n):
        if not n or n.get("missing"):
            return n
        d = dict(n)
        d["visible"] = True
        return d

    top = force_visible_copy(node("UI/HUD/TopBar"))
    # individual boxes
    boxes = []
    for key, ico, path_box, path_lab in [
        ("lv", U["icLv"], "UI/HUD/TopBar/LevelBox", "UI/HUD/TopBar/LevelBox/LevelLabel"),
        ("sc", U["icSc"], "UI/HUD/TopBar/ScoreBox", "UI/HUD/TopBar/ScoreBox/ScoreLabel"),
        ("cn", U["icCn"], "UI/HUD/TopBar/CoinsBox", "UI/HUD/TopBar/CoinsBox/CoinsLabel"),
        ("li", U["icLife"], "UI/HUD/TopBar/LivesBox", "UI/HUD/TopBar/LivesBox/LivesLabel"),
    ]:
        b = force_visible_copy(node(path_box))
        lab = force_visible_copy(node(path_lab))
        ic = force_visible_copy(node(path_box + "/Icon"))
        if b and not b.get("missing"):
            boxes.append(
                f'<div style="{box(b)}background:rgba(10,14,26,.45);border:1px solid rgba(255,255,255,.1);border-radius:8px"></div>'
            )
        if ic and not ic.get("missing") and "x" in ic:
            boxes.append(
                f'<img src="{ico}" style="position:absolute;left:{r4(ic["x"])}px;top:{r4(ic["y"])}px;width:{r4(ic.get("w",16))}px;height:{r4(ic.get("h",16))}px;image-rendering:pixelated"/>'
            )
        elif b and not b.get("missing"):
            boxes.append(
                f'<img src="{ico}" style="position:absolute;left:{r4(b["x"]+4)}px;top:{r4(b["y"]+(b["h"]-16)/2)}px;width:16px;height:16px;image-rendering:pixelated"/>'
            )
        if lab and not lab.get("missing"):
            boxes.append(label_html(lab))

    goal = force_visible_copy(node("UI/HUD/GoalLabel"))
    if goal and (not goal.get("text") or goal.get("text") == "火 0   人 0"):
        goal = dict(goal)
        goal["text"] = "火 5   人 3"
    hint = force_visible_copy(node("UI/HUD/Hint"))
    # virtual pads from code defaults
    vpad_l = {"x": 18, "y": 800 - 110 - 20, "w": 120, "h": 110, "text": "◀"}
    vpad_r = {"x": 450 - 120 - 18, "y": 800 - 110 - 20, "w": 120, "h": 110, "text": "▶"}
    skill = {
        "x": 450 - 150 - 20,
        "y": 800 - 240,
        "w": 130,
        "h": 52,
        "text": "影分身",
    }
    screens.append(
        wrap(
            "T02-InGame",
            field
            + "".join(boxes)
            + label_html(goal)
            + label_html(hint)
            + f'<div style="{box(vpad_l)}border-radius:999px;background:rgba(255,255,255,.10);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800">◀</div>'
            + f'<div style="{box(vpad_r)}border-radius:999px;background:rgba(255,255,255,.10);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800">▶</div>'
            + btn_html(skill, bg="#b3401f", fg="#fff"),
        )
    )

    # Level clear - show overlay with sample stats + synthetic shop matching code layout under VBox
    lc = node("UI/Overlays/LevelClear")
    lc_title = node("UI/Overlays/LevelClear/VBox/Title")
    lc_stats = node("UI/Overlays/LevelClear/VBox/Stats")
    if lc_stats and not lc_stats.get("missing"):
        lc_stats = dict(lc_stats)
        lc_stats["text"] = "本关奖励\n分数 +860　金币 +80"
    lc_double = node("UI/Overlays/LevelClear/VBox/DoubleButton")
    lc_next = node("UI/Overlays/LevelClear/VBox/NextButton")
    # shop panel sits in VBox above next button - approximate between double and next
    shop_html = ""
    if lc_double and lc_next and not lc_double.get("missing") and not lc_next.get("missing"):
        sx = float(lc_double["x"])
        sw = float(lc_double["w"])
        sy = float(lc_double["y"] + lc_double["h"] + 10)
        sh = max(120.0, float(lc_next["y"]) - sy - 10)
        shop_html = f'''
<div style="position:absolute;left:{sx}px;top:{sy}px;width:{sw}px;height:{sh}px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.12);border-radius:12px"></div>
<div class="lbl" style="left:{sx}px;top:{sy+8}px;width:{sw}px;height:24px;text-align:center;font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center">补给队 · 过关补给</div>
<div class="lbl" style="left:{sx}px;top:{sy+34}px;width:{sw}px;height:20px;text-align:center;font-size:14px;color:#ffe070;display:flex;align-items:center;justify-content:center">金币 1360</div>
'''
        rows = [
            (U["panda"], "熊猫 · 力量：灭火效率+1级", "2000"),
            (U["itemWide"], "长条 · 蹦床加长 8 秒", "100"),
            (U["itemExt"], "灭火器 · 首次着火自灭", "120"),
            (U["itemUp"], "1UP · 灭火等级 +1", "200"),
        ]
        ry = sy + 60
        for ico, info, price in rows:
            if ry + 40 > sy + sh - 8:
                break
            shop_html += f'''
<div style="position:absolute;left:{sx+10}px;top:{ry}px;width:{sw-20}px;height:36px;background:rgba(255,255,255,.06);border-radius:8px"></div>
<img src="{ico}" style="position:absolute;left:{sx+16}px;top:{ry+4}px;width:28px;height:28px;image-rendering:pixelated"/>
<div class="lbl" style="left:{sx+50}px;top:{ry}px;width:{sw-140}px;height:36px;font-size:12px;font-weight:700;display:flex;align-items:center">{info}</div>
<div class="lbl" style="left:{sx+sw-90}px;top:{ry+6}px;width:70px;height:24px;background:#ffb020;color:#1a1208;border-radius:8px;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center">{price}</div>
'''
            ry += 42

    screens.append(
        wrap(
            "T03-LevelClear",
            field
            + color_rect({**lc, "visible": True} if lc else {"x": 0, "y": 0, "w": 450, "h": 800, "color": [0.05, 0.1, 0.08, 0.9]})
            + label_html(lc_title)
            + label_html(lc_stats)
            + btn_html(lc_double, bg="#345c94", fg="#fff")
            + shop_html
            + btn_html(lc_next),
        )
    )

    go = node("UI/Overlays/GameOver")
    screens.append(
        wrap(
            "T04-GameOver",
            field
            + color_rect({**go, "visible": True} if go else {"x": 0, "y": 0, "w": 450, "h": 800, "color": [0.12, 0.05, 0.05, 0.92]})
            + label_html(node("UI/Overlays/GameOver/VBox/Title"))
            + label_html(
                {
                    **(node("UI/Overlays/GameOver/VBox/Stats") or {}),
                    "text": "本局得分 1980\n最高分 12840\n金币 1280\n到达第 3 关",
                }
            )
            + btn_html(node("UI/Overlays/GameOver/VBox/ReviveButton"), bg="#345c94", fg="#fff")
            + btn_html(node("UI/Overlays/GameOver/VBox/RetryButton"))
            + btn_html(
                node("UI/Overlays/GameOver/VBox/MenuButton"),
                bg="rgba(255,255,255,.12)",
                fg="#fff",
            ),
        )
    )

    pa = node("UI/Overlays/Pause")
    screens.append(
        wrap(
            "T05-Pause",
            field
            + color_rect({**pa, "visible": True} if pa else {"x": 0, "y": 0, "w": 450, "h": 800, "color": [0.05, 0.06, 0.1, 0.85]})
            + label_html(node("UI/Overlays/Pause/VBox/Title"))
            + btn_html(node("UI/Overlays/Pause/VBox/ResumeButton"))
            + btn_html(
                node("UI/Overlays/Pause/VBox/MenuButton"),
                bg="rgba(255,255,255,.12)",
                fg="#fff",
            ),
        )
    )

    # Asset board remains separate - native sizes by category (truth from files)
    # keep previous G06 approach but as T06
    return screens, truth


def import_to_pixso(ph: dict, screens: list[dict]):
    # clear page
    prep = call(
        PIXSO,
        ph,
        "eval_script",
        {
            "script": """
let page = null;
for (const p of pixso.root.children) {
  if ((p.name || '') === 'Godot-UI-Replica') { page = p; break; }
}
if (!page) page = pixso.createPage('Godot-UI-Replica');
await pixso.setCurrentPageAsync(page);
page.name = 'Godot-UI-Replica';
for (const c of [...page.children]) { try { c.remove(); } catch (e) {} }
return { pageId: page.id };
"""
        },
    )
    log("prep " + str(prep[0])[:200])

    gapx, gapy = 80, 100
    placed = []
    for i, s in enumerate(screens):
        html = (SCREENS / s["file"]).read_text(encoding="utf-8")
        # ensure chinese
        assert "救火英雄" in html or s["name"] != "T01-Menu"
        log(f"import {s['name']} ...")
        c2d = call(
            PIXSO,
            ph,
            "code_to_design",
            {"htmlStr": html, "width": 450, "height": 800},
            timeout=360,
        )
        log("c2d " + str(c2d[0])[:120])
        col = i % 3
        row = i // 3
        tx = col * (450 + gapx)
        ty = row * (800 + gapy)
        nm = json.dumps(s["name"])
        place = call(
            PIXSO,
            ph,
            "eval_script",
            {
                "script": f"""
const page = pixso.currentPage;
const targetName = {nm};
const tx={tx}, ty={ty};
function findPhones(node, acc) {{
  if (!node) return;
  const name=(node.name||'').toLowerCase();
  if (node.type==='FRAME' && name.indexOf('phone')>=0) acc.push(node);
  if (node.children) for (const c of node.children) findPhones(c, acc);
}}
const phones=[]; for (const c of page.children) findPhones(c, phones);
const named=/^T0[1-5]-/;
let phone=null;
for (let i=phones.length-1;i>=0;i--) if (!named.test(phones[i].name||'')) {{ phone=phones[i]; break; }}
if (!phone) {{
  const tops=page.children.filter(n=>n.type==='FRAME' && !named.test(n.name||''));
  phone=tops[tops.length-1];
}}
if (!phone) return {{error:'no phone'}};
if (phone.parent && phone.parent.id!==page.id) page.appendChild(phone);
phone.name=targetName; phone.x=tx; phone.y=ty;
try {{ phone.resize(450,800); }} catch(e) {{}}
for (const c of [...page.children]) {{
  if (named.test(c.name||'') || (c.name||'').startsWith('label-')) continue;
  let has=false; function scan(n){{ if(!n)return; if(named.test(n.name||'')) has=true; if(n.children) for(const x of n.children) scan(x); }} scan(c);
  if (!has) try{{ c.remove(); }}catch(e){{}}
}}
return {{id:phone.id,name:phone.name,x:phone.x,y:phone.y}};
"""
            },
        )
        log("place " + str(place[0])[:200])
        placed.append(place[0])

    # inject YaHei on all text + delete non-cjk-looking garbled? keep as is if coords from godot
    fix = call(
        PIXSO,
        ph,
        "eval_script",
        {
            "script": """
const page = pixso.currentPage;
page.name = 'Godot-UI-Replica';
const font = { family: 'Microsoft YaHei', style: 'Regular' };
try { await pixso.loadFontAsync(font); } catch (e) {}
function walk(n) {
  if (!n) return;
  if (n.type === 'TEXT') {
    try { n.fontName = font; } catch (e) {}
  }
  if (n.children) for (const c of n.children) walk(c);
}
for (const c of page.children) walk(c);
// labels
for (const c of [...page.children]) if ((c.name||'').startsWith('label-T')) try{c.remove()}catch(e){}
for (const f of page.children) {
  if (f.type!=='FRAME' || !(f.name||'').startsWith('T0')) continue;
  const t = pixso.createText();
  try { t.fontName = font; } catch(e) {}
  t.characters = f.name;
  t.fontSize = 20;
  t.fills = [{type:'SOLID', color:{r:1,g:0.82,b:0.29}}];
  t.name = 'label-' + f.name;
  t.x = f.x; t.y = f.y - 32;
  page.appendChild(t);
}
return page.children.filter(n=>n.type==='FRAME').map(n=>({id:n.id,name:n.name,x:n.x,y:n.y,w:n.width,h:n.height}));
"""
        },
    )
    frames = fix[0]
    if isinstance(frames, str):
        frames = json.loads(frames)
    (OUT / "truth-import-frames.json").write_text(
        json.dumps(frames, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # export
    prev = OUT / "previews-truth"
    prev.mkdir(parents=True, exist_ok=True)
    for fr in frames:
        if not str(fr.get("name", "")).startswith("T0"):
            continue
        exp_sc, exp_text, _ = call(
            PIXSO,
            ph,
            "get_export_image",
            {
                "guid": fr["id"],
                "exportSettings": {
                    "constraint": {"type": 2, "value": 450},
                    "imageType": 1,
                },
            },
            timeout=90,
        )
        blob = exp_text if isinstance(exp_text, str) else json.dumps(exp_sc)
        m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", blob)
        if not m and isinstance(exp_sc, dict):
            blob = json.dumps(exp_sc, ensure_ascii=False)
            m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", blob)
        if m:
            outp = prev / f"{fr['name']}.png"
            urllib.request.urlretrieve(m.group(0), outp)
            log(f"export {outp.name} {outp.stat().st_size}")
    return frames


def main():
    gh = init(GODOT, "truth-g")
    log("godot mcp ok")
    truth = export_godot_truth(gh)
    log("truth keys=" + str(list(truth.keys())[:12]))
    # sanity
    title = truth.get("UI/Overlays/Menu/VBox/Title") or {}
    log(f"Menu Title rect=({title.get('x')},{title.get('y')},{title.get('w')},{title.get('h')}) text={title.get('text')}")
    start = truth.get("UI/Overlays/Menu/VBox/StartButton") or {}
    log(f"StartButton rect=({start.get('x')},{start.get('y')},{start.get('w')},{start.get('h')}) text={start.get('text')}")

    screens, _ = build_html_from_truth(truth)
    meta = {"screens": screens}
    (OUT / "screens-godot-truth-meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    ph = init(PIXSO, "truth-p")
    log("pixso mcp ok")
    frames = import_to_pixso(ph, screens)
    log("frames=" + json.dumps(frames, ensure_ascii=False)[:500])
    log("ALL DONE")


if __name__ == "__main__":
    main()
