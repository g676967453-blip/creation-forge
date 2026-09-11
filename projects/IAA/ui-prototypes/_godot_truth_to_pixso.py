# -*- coding: utf-8 -*-
"""Godot UI truth -> rebuild Pixso Godot-UI-Replica (T01-T05)."""
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
SCREENS = OUT / "screens-truth"
PREV = OUT / "previews-truth"
SCREENS.mkdir(parents=True, exist_ok=True)
PREV.mkdir(parents=True, exist_ok=True)

PATHS = [
    "UI/Overlays/Menu",
    "UI/Overlays/Menu/VBox",
    "UI/Overlays/Menu/VBox/Title",
    "UI/Overlays/Menu/VBox/Sub",
    "UI/Overlays/Menu/VBox/MenuStats",
    "UI/Overlays/Menu/VBox/StartButton",
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
    "UI/Overlays/LevelClear",
    "UI/Overlays/LevelClear/VBox/Title",
    "UI/Overlays/LevelClear/VBox/Stats",
    "UI/Overlays/LevelClear/VBox/DoubleButton",
    "UI/Overlays/LevelClear/VBox/NextButton",
    "UI/Overlays/GameOver",
    "UI/Overlays/GameOver/VBox/Title",
    "UI/Overlays/GameOver/VBox/Stats",
    "UI/Overlays/GameOver/VBox/ReviveButton",
    "UI/Overlays/GameOver/VBox/RetryButton",
    "UI/Overlays/GameOver/VBox/MenuButton",
    "UI/Overlays/Pause",
    "UI/Overlays/Pause/VBox/Title",
    "UI/Overlays/Pause/VBox/ResumeButton",
    "UI/Overlays/Pause/VBox/MenuButton",
    "GameRoot/Paddle",
    "GameRoot/Ball",
]


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def mcp(uri, headers, payload, timeout=180):
    req = urllib.request.Request(
        uri, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), headers=headers
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        sid = r.headers.get("mcp-session-id")
        if sid:
            headers["mcp-session-id"] = sid
        raw = r.read().decode("utf-8", errors="replace")
    parts = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
    body = "\n".join(parts) if parts else raw
    return json.loads(body) if body.strip() else None


def init(uri, name):
    h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
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


def call(uri, h, name, args=None, timeout=180):
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
    res = (o or {}).get("result") or {}
    sc = res.get("structuredContent")
    text = ((res.get("content") or [{}])[0]).get("text")
    if sc is not None:
        return sc
    try:
        return json.loads(text) if isinstance(text, str) else text
    except Exception:
        return text


def data_uri(rel: str) -> str:
    return "data:image/png;base64," + base64.b64encode((ASSETS / rel).read_bytes()).decode("ascii")


def png_wh(rel: str):
    b = (ASSETS / rel).read_bytes()
    return int.from_bytes(b[16:20], "big"), int.from_bytes(b[20:24], "big")


def measure_code() -> str:
    lines = ["var r = edited_scene", "var n", "var rect", "var c"]
    for p in PATHS:
        lines += [
            f'n = r.get_node_or_null("{p}")',
            "if n == null:",
            f'\t_custom_print("P|{p}|MISSING")',
            "else:",
            f'\t_custom_print("P|{p}|" + n.get_class())',
            "\tif n is Control:",
            "\t\trect = n.get_global_rect()",
            '\t\t_custom_print("R|" + str(rect.position.x) + "|" + str(rect.position.y) + "|" + str(rect.size.x) + "|" + str(rect.size.y) + "|" + str(n.visible))',
            "\t\tif n is Label:",
            '\t\t\t_custom_print("T|" + n.text.replace("\\n", "\\\\n"))',
            '\t\t\t_custom_print("FS|" + str(n.get_theme_font_size("font_size")))',
            '\t\t\tc = n.get_theme_color("font_color")',
            '\t\t\t_custom_print("FC|" + str(c.r) + "|" + str(c.g) + "|" + str(c.b) + "|" + str(c.a))',
            '\t\t\t_custom_print("HA|" + str(n.horizontal_alignment))',
            "\t\tif n is Button:",
            '\t\t\t_custom_print("B|" + n.text)',
            "\t\tif n is ColorRect:",
            "\t\t\tc = n.color",
            '\t\t\t_custom_print("CR|" + str(c.r) + "|" + str(c.g) + "|" + str(c.b) + "|" + str(c.a))',
            "\telif n is Node2D:",
            '\t\t_custom_print("N2|" + str(n.global_position.x) + "|" + str(n.global_position.y))',
        ]
    lines += [
        'var mv = r.get_node_or_null("UI/Overlays/Menu/VBox")',
        "if mv != null:",
        "\tfor ch in mv.get_children():",
        '\t\t_custom_print("K|" + str(ch.name) + "|" + ch.get_class())',
        "\t\tif ch is Control:",
        "\t\t\trect = ch.get_global_rect()",
        '\t\t\t_custom_print("KR|" + str(rect.position.x) + "|" + str(rect.position.y) + "|" + str(rect.size.x) + "|" + str(rect.size.y))',
        "\t\tif ch is Label or ch is Button:",
        '\t\t\t_custom_print("KT|" + ch.text.replace("\\n", "\\\\n"))',
    ]
    return "\n".join(lines)


def parse_measure(lines) -> dict:
    truth = {}
    cur = None
    kids = []
    kid = None
    for line in lines:
        s = str(line)
        if s.startswith("P|"):
            _, path, cls = s.split("|", 2)
            if cls == "MISSING":
                truth[path] = {"missing": True}
                cur = None
            else:
                cur = {"class": cls}
                truth[path] = cur
        elif s.startswith("R|") and cur is not None:
            _, x, y, w, h, vis = s.split("|")
            cur.update({"x": float(x), "y": float(y), "w": float(w), "h": float(h), "visible": vis.lower() == "true"})
        elif s.startswith("T|") and cur is not None:
            cur["text"] = s[2:].replace("\\n", "\n")
        elif s.startswith("B|") and cur is not None:
            cur["text"] = s[2:]
        elif s.startswith("FS|") and cur is not None:
            cur["font_size"] = int(float(s[3:]))
        elif s.startswith("FC|") and cur is not None:
            _, r, g, b, a = s.split("|")
            cur["font_color"] = [float(r), float(g), float(b), float(a)]
        elif s.startswith("HA|") and cur is not None:
            cur["halign"] = int(float(s[3:]))
        elif s.startswith("CR|") and cur is not None:
            _, r, g, b, a = s.split("|")
            cur["color"] = [float(r), float(g), float(b), float(a)]
        elif s.startswith("N2|") and cur is not None:
            _, x, y = s.split("|")
            cur.update({"x": float(x), "y": float(y)})
        elif s.startswith("K|"):
            _, name, cls = s.split("|", 2)
            kid = {"name": name, "class": cls}
            kids.append(kid)
        elif s.startswith("KR|") and kid is not None:
            _, x, y, w, h = s.split("|")
            kid.update({"x": float(x), "y": float(y), "w": float(w), "h": float(h)})
        elif s.startswith("KT|") and kid is not None:
            kid["text"] = s[3:].replace("\\n", "\n")
    truth["menu_kids"] = kids
    return truth


def r1(v):
    return round(float(v), 1)


def build_screens(truth: dict):
    U = {
        k: data_uri(v)
        for k, v in {
            "bg": "backgrounds/bg_level_default.png",
            "mat": "props/trampoline/mat.png",
            "fmL": "props/trampoline/fireman_left.png",
            "fmR": "props/trampoline/fireman_right.png",
            "cat": "props/ball/char_cat.png",
            "icLv": "pixel/ui/ui_icon_level.png",
            "icSc": "pixel/ui/ui_icon_score.png",
            "icCn": "pixel/ui/ui_icon_coin.png",
            "icLife": "pixel/ui/ui_icon_life.png",
            "winN": "props/windows/window_normal.png",
            "winF1": "props/windows/window_fire_lv1.png",
            "winF2": "props/windows/window_fire_lv2.png",
            "winF3": "props/windows/window_fire_lv3.png",
            "winR": "props/windows/window_rescue.png",
            "winRR": "props/windows/window_rescue_red.png",
            "itemWide": "props/items/item_wide.png",
            "itemExt": "props/items/item_extinguish.png",
            "itemUp": "props/items/item_up.png",
            "panda": "props/ball/char_panda.png",
        }.items()
    }
    mw, mh = png_wh("props/trampoline/mat.png")
    flw, flh = png_wh("props/trampoline/fireman_left.png")
    frw, frh = png_wh("props/trampoline/fireman_right.png")
    cw, ch = png_wh("props/ball/char_cat.png")

    def N(p):
        return truth.get(p) or {"missing": True}

    def rect(n):
        return f"left:{r1(n['x'])}px;top:{r1(n['y'])}px;width:{r1(n['w'])}px;height:{r1(n['h'])}px;"

    def lbl(n):
        if not n or n.get("missing") or "x" not in n:
            return ""
        fc = n.get("font_color") or [1, 1, 1, 1]
        color = f"rgba({int(fc[0]*255)},{int(fc[1]*255)},{int(fc[2]*255)},{fc[3]})"
        fs = int(n.get("font_size") or 15)
        text = (n.get("text") or "").replace("&", "&amp;").replace("<", "&lt;").replace("\n", "<br/>")
        ha = "center" if int(n.get("halign") or 1) == 1 else "left"
        jc = "center" if ha == "center" else "flex-start"
        return (
            f'<div style="position:absolute;{rect(n)}color:{color};font-size:{fs}px;font-weight:700;'
            f'text-align:{ha};display:flex;align-items:center;justify-content:{jc};line-height:1.25;white-space:pre-wrap">{text}</div>'
        )

    def btn(n, bg="#ffb020", fg="#1a1208"):
        if not n or n.get("missing") or "x" not in n:
            return ""
        text = (n.get("text") or "").replace("<", "&lt;")
        return (
            f'<div style="position:absolute;{rect(n)}background:{bg};color:{fg};border-radius:10px;font-size:16px;font-weight:800;'
            f'display:flex;align-items:center;justify-content:center;box-shadow:0 4px 0 rgba(0,0,0,.22)">{text}</div>'
        )

    def ov(n):
        c = (n or {}).get("color") or [0.05, 0.07, 0.1, 0.92]
        return f'<div style="position:absolute;left:0;top:0;width:450px;height:800px;background:rgba({int(c[0]*255)},{int(c[1]*255)},{int(c[2]*255)},{c[3]})"></div>'

    paddle, ball = N("GameRoot/Paddle"), N("GameRoot/Ball")
    px, py = float(paddle.get("x", 225)), float(paddle.get("y", 650))
    bx, by = float(ball.get("x", 226)), float(ball.get("y", 625))
    facade_x0 = (450 - (7 * 48 + 6 * 4)) / 2
    keys = {"N": U["winN"], "F1": U["winF1"], "F2": U["winF2"], "F3": U["winF3"], "R": U["winR"], "RR": U["winRR"]}
    pattern = [
        "F2 N F1 R N F3 N",
        "N F2 N N F1 N F2",
        "F1 N RR N F2 N N",
        "N F3 N F1 N R N",
        "F2 N N N F1 N F2",
        "N F1 N F2 N N F3",
        "F1 N R N F2 N N",
        "N F2 N F1 N N F1",
    ]
    wins = []
    for ri, row in enumerate(pattern):
        for ci, k in enumerate(row.split()):
            x = facade_x0 + ci * 52
            y = 80 + ri * 52
            wins.append(
                f'<img src="{keys[k]}" style="position:absolute;left:{x}px;top:{y}px;width:48px;height:48px;image-rendering:pixelated"/>'
            )
    field = f'''
<img src="{U["bg"]}" style="position:absolute;left:0;top:0;width:450px;height:800px"/>
{"".join(wins)}
<img src="{U["fmL"]}" style="position:absolute;left:{px-40-flw/2}px;top:{py-10-flh/2}px;width:{flw}px;height:{flh}px;image-rendering:pixelated"/>
<img src="{U["mat"]}" style="position:absolute;left:{px-mw/2}px;top:{py+8-mh/2}px;width:{mw}px;height:{mh}px;image-rendering:pixelated"/>
<img src="{U["fmR"]}" style="position:absolute;left:{px+40-frw/2}px;top:{py-10-frh/2}px;width:{frw}px;height:{frh}px;image-rendering:pixelated"/>
<img src="{U["cat"]}" style="position:absolute;left:{bx-cw/2}px;top:{by-ch/2}px;width:{cw}px;height:{ch}px;image-rendering:pixelated"/>
'''
    css = (
        '*{box-sizing:border-box;margin:0;padding:0}'
        "html,body{width:450px;height:800px;overflow:hidden;background:#000}"
        '.phone{position:relative;width:450px;height:800px;overflow:hidden;'
        'font-family:"Microsoft YaHei","Noto Sans SC",sans-serif;color:#fff}'
    )

    def write(name, body):
        html = (
            f'<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"/><title>{name}</title>'
            f"<style>{css}</style></head><body>"
            f'<div class="phone" data-name="{name}">{body}</div></body></html>'
        )
        p = SCREENS / f"{name}.html"
        p.write_text(html, encoding="utf-8")
        log(f"html {name} {p.stat().st_size}")
        return {"file": p.name, "name": name, "w": 450, "h": 800}

    def Npath(p):
        return N(p)

    start = N("UI/Overlays/Menu/VBox/StartButton")
    char = None
    for k in truth.get("menu_kids") or []:
        if k.get("class") == "Button" and k.get("name") != "StartButton" and "x" in k:
            char = k
            break
    if char is None and not start.get("missing"):
        char = {
            "x": start["x"],
            "y": start["y"] - start["h"] - 14,
            "w": start["w"],
            "h": start["h"],
            "text": "角色：小猫 · 敏捷（点击切换）",
        }

    def hud():
        parts = []
        rows = [
            ("UI/HUD/TopBar/LevelBox", "UI/HUD/TopBar/LevelBox/Icon", "UI/HUD/TopBar/LevelBox/LevelLabel", U["icLv"], "3"),
            ("UI/HUD/TopBar/ScoreBox", "UI/HUD/TopBar/ScoreBox/Icon", "UI/HUD/TopBar/ScoreBox/ScoreLabel", U["icSc"], "2460"),
            ("UI/HUD/TopBar/CoinsBox", "UI/HUD/TopBar/CoinsBox/Icon", "UI/HUD/TopBar/CoinsBox/CoinsLabel", U["icCn"], "1280"),
            ("UI/HUD/TopBar/LivesBox", "UI/HUD/TopBar/LivesBox/Icon", "UI/HUD/TopBar/LivesBox/LivesLabel", U["icLife"], "3"),
        ]
        for bp, ip, lp, ico, dtxt in rows:
            b, ic, lab = N(bp), N(ip), dict(N(lp))
            if b.get("missing") or "x" not in b:
                continue
            parts.append(
                f'<div style="position:absolute;{rect(b)}background:rgba(10,14,26,.45);border:1px solid rgba(255,255,255,.12);border-radius:8px"></div>'
            )
            if not ic.get("missing") and "x" in ic:
                parts.append(
                    f'<img src="{ico}" style="position:absolute;left:{r1(ic["x"])}px;top:{r1(ic["y"])}px;width:{r1(ic.get("w",16))}px;height:{r1(ic.get("h",16))}px;image-rendering:pixelated"/>'
                )
            else:
                parts.append(
                    f'<img src="{ico}" style="position:absolute;left:{r1(b["x"]+4)}px;top:{r1(b["y"]+(b["h"]-16)/2)}px;width:16px;height:16px;image-rendering:pixelated"/>'
                )
            if not lab.get("missing"):
                if lab.get("text") in (None, "", "0", "1"):
                    lab["text"] = dtxt
                parts.append(lbl(lab))
        goal = dict(N("UI/HUD/GoalLabel"))
        if not goal.get("missing"):
            t = str(goal.get("text") or "")
            if not t.strip() or re.search(r"\b0\b", t):
                goal["text"] = "火 5   人 3"
            parts.append(lbl(goal))
        hint = N("UI/HUD/Hint")
        if not hint.get("missing"):
            parts.append(lbl(hint))
        parts.append(
            '<div style="position:absolute;left:18px;top:670px;width:120px;height:110px;border-radius:999px;background:rgba(255,255,255,.10);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800">◀</div>'
        )
        parts.append(
            '<div style="position:absolute;left:312px;top:670px;width:120px;height:110px;border-radius:999px;background:rgba(255,255,255,.10);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800">▶</div>'
        )
        parts.append(
            '<div style="position:absolute;left:280px;top:560px;width:130px;height:52px;border-radius:10px;background:#b3401f;color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center">影分身</div>'
        )
        return "".join(parts)

    def rect(n):
        return f"left:{r1(n['x'])}px;top:{r1(n['y'])}px;width:{r1(n['w'])}px;height:{r1(n['h'])}px;"

    screens = []
    screens.append(
        write(
            "T01-Menu",
            field
            + ov(N("UI/Overlays/Menu"))
            + lbl(N("UI/Overlays/Menu/VBox/Title"))
            + lbl(N("UI/Overlays/Menu/VBox/Sub"))
            + lbl(N("UI/Overlays/Menu/VBox/MenuStats"))
            + (btn(char, bg="#593d1a", fg="#ffe9c9") if char else "")
            + btn(start),
        )
        if False
        else None
    )
    # clean
    def write(name, body):
        html = (
            f'<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"/><title>{name}</title>'
            f"<style>*{{box-sizing:border-box;margin:0;padding:0}}html,body{{width:450px;height:800px;overflow:hidden;background:#000}}"
            f'.phone{{position:relative;width:450px;height:800px;overflow:hidden;font-family:"Microsoft YaHei","Noto Sans SC",sans-serif;color:#fff}}</style>'
            f'</head><body><div class="phone" data-name="{name}">{body}</div></body></html>'
        )
        p = SCREENS / f"{name}.html"
        p.write_text(html, encoding="utf-8")
        log(f"html {name} {p.stat().st_size}")
        return {"file": p.name, "name": name, "w": 450, "h": 800}

    out = []
    out.append(
        write(
            "T01-Menu",
            field
            + ov(N("UI/Overlays/Menu"))
            + lbl(N("UI/Overlays/Menu/VBox/Title"))
            + lbl(N("UI/Overlays/Menu/VBox/Sub"))
            + lbl(N("UI/Overlays/Menu/VBox/MenuStats"))
            + (btn(char, bg="#593d1a", fg="#ffe9c9") if char else "")
            + btn(start),
        )
    )
    out.append(write("T02-InGame", field + hud()))

    lc_stats = dict(N("UI/Overlays/LevelClear/VBox/Stats"))
    if not lc_stats.get("missing"):
        lc_stats["text"] = "本关奖励\n分数 +860　金币 +80"
    dbtn = N("UI/Overlays/LevelClear/VBox/DoubleButton")
    nbtn = N("UI/Overlays/LevelClear/VBox/NextButton")
    shop = ""
    if not dbtn.get("missing") and not nbtn.get("missing"):
        sx, sw = dbtn["x"], dbtn["w"]
        sy = dbtn["y"] + dbtn["h"] + 10
        sh = max(100.0, nbtn["y"] - sy - 10)
        shop = f'<div style="position:absolute;left:{r1(sx)}px;top:{r1(sy)}px;width:{r1(sw)}px;height:{r1(sh)}px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.12);border-radius:12px"></div>'
        shop += f'<div style="position:absolute;left:{r1(sx)}px;top:{r1(sy+8)}px;width:{r1(sw)}px;height:22px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800">补给队 · 过关补给</div>'
        shop += f'<div style="position:absolute;left:{r1(sx)}px;top:{r1(sy+34)}px;width:{r1(sw)}px;height:18px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#ffe070">金币 1360</div>'
        ry = sy + 58
        for ico, info, price in [
            (U["panda"], "熊猫 · 力量 +1 级灭火", "2000"),
            (U["itemWide"], "长条 · 蹦床加长 8 秒", "100"),
            (U["itemExt"], "灭火器 · 首次着火自灭", "120"),
            (U["itemUp"], "1UP · 灭火等级 +1", "200"),
        ]:
            if ry + 36 > sy + sh - 6:
                break
            shop += f'<div style="position:absolute;left:{r1(sx+8)}px;top:{r1(ry)}px;width:{r1(sw-16)}px;height:34px;background:rgba(255,255,255,.06);border-radius:8px"></div>'
            shop += f'<img src="{ico}" style="position:absolute;left:{r1(sx+14)}px;top:{r1(ry+3)}px;width:28px;height:28px;image-rendering:pixelated"/>'
            shop += f'<div style="position:absolute;left:{r1(sx+48)}px;top:{r1(ry)}px;width:{r1(sw-140)}px;height:34px;display:flex;align-items:center;font-size:12px;font-weight:700">{info}</div>'
            shop += f'<div style="position:absolute;left:{r1(sx+sw-86)}px;top:{r1(ry+5)}px;width:68px;height:24px;background:#ffb020;color:#1a1208;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">{price}</div>'
            ry += 38
    out.append(
        write(
            "T03-LevelClear",
            field
            + ov(N("UI/Overlays/LevelClear"))
            + lbl(N("UI/Overlays/LevelClear/VBox/Title"))
            + lbl(lc_stats)
            + btn(dbtn, bg="#345c94", fg="#fff")
            + shop
            + btn(nbtn),
        )
    )
    go_stats = dict(N("UI/Overlays/GameOver/VBox/Stats"))
    if not go_stats.get("missing"):
        go_stats["text"] = "本局得分 1980\n最高分 12840\n金币 1280\n到达第 3 关"
    out.append(
        write(
            "T04-GameOver",
            field
            + ov(N("UI/Overlays/GameOver"))
            + lbl(N("UI/Overlays/GameOver/VBox/Title"))
            + lbl(go_stats)
            + btn(N("UI/Overlays/GameOver/VBox/ReviveButton"), bg="#345c94", fg="#fff")
            + btn(N("UI/Overlays/GameOver/VBox/RetryButton"))
            + btn(N("UI/Overlays/GameOver/VBox/MenuButton"), bg="rgba(255,255,255,.12)", fg="#fff"),
        )
    )
    out.append(
        write(
            "T05-Pause",
            field
            + ov(N("UI/Overlays/Pause"))
            + lbl(N("UI/Overlays/Pause/VBox/Title"))
            + btn(N("UI/Overlays/Pause/VBox/ResumeButton"))
            + btn(N("UI/Overlays/Pause/VBox/MenuButton"), bg="rgba(255,255,255,.12)", fg="#fff"),
        )
    )
    return out


def import_pixso(ph, screens):
    call(
        PIXSO,
        ph,
        "eval_script",
        {
            "script": """
let page=null;
for (const p of pixso.root.children) if ((p.name||'')==='Godot-UI-Replica') page=p;
if (!page) page=pixso.createPage('Godot-UI-Replica');
await pixso.setCurrentPageAsync(page);
page.name='Godot-UI-Replica';
for (const c of [...page.children]) try{c.remove()}catch(e){}
return {ok:true};
"""
        },
    )
    gapx, gapy = 80, 100
    for i, s in enumerate(screens):
        html = (SCREENS / s["file"]).read_text(encoding="utf-8")
        log(f"import {s['name']} len={len(html)}")
        c2d = call(PIXSO, ph, "code_to_design", {"htmlStr": html, "width": 450, "height": 800}, timeout=360)
        log("c2d " + str(c2d)[:100])
        tx = (i % 3) * (450 + gapx)
        ty = (i // 3) * (800 + gapy)
        nm = json.dumps(s["name"])
        place = call(
            PIXSO,
            ph,
            "eval_script",
            {
                "script": f"""
const page=pixso.currentPage; const targetName={nm}; const tx={tx}, ty={ty};
function findPhones(node,acc){{ if(!node)return; const name=(node.name||'').toLowerCase(); if(node.type==='FRAME'&&name.indexOf('phone')>=0) acc.push(node); if(node.children) for(const c of node.children) findPhones(c,acc); }}
const phones=[]; for(const c of page.children) findPhones(c,phones);
const named=/^T0[1-5]-/;
let phone=null; for(let i=phones.length-1;i>=0;i--) if(!named.test(phones[i].name||'')){{phone=phones[i];break}}
if(!phone){{ const tops=page.children.filter(n=>n.type==='FRAME'&&!named.test(n.name||'')); phone=tops[tops.length-1]; }}
if(!phone) return {{error:'no phone'}};
if(phone.parent&&phone.parent.id!==page.id) page.appendChild(phone);
phone.name=targetName; phone.x=tx; phone.y=ty; try{{phone.resize(450,800)}}catch(e){{}}
for(const c of [...page.children]){{ if(named.test(c.name||'')||(c.name||'').startsWith('label-')) continue; let has=false; function scan(n){{if(!n)return; if(named.test(n.name||'')) has=true; if(n.children) for(const x of n.children) scan(x)}} scan(c); if(!has) try{{c.remove()}}catch(e){{}} }}
return {{id:phone.id,name:phone.name}};
"""
            },
        )
        log("place " + str(place)[:160])

    frames = call(
        PIXSO,
        ph,
        "eval_script",
        {
            "script": """
const page=pixso.currentPage; page.name='Godot-UI-Replica';
const font={family:'Microsoft YaHei',style:'Regular'}; try{await pixso.loadFontAsync(font)}catch(e){}
function walk(n){ if(!n)return; if(n.type==='TEXT'){ try{n.fontName=font}catch(e){} } if(n.children) for(const c of n.children) walk(c); }
for(const c of page.children) walk(c);
for(const c of [...page.children]) if((c.name||'').startsWith('label-T')) try{c.remove()}catch(e){}
for(const f of page.children){ if(f.type!=='FRAME'||!(f.name||'').startsWith('T0')) continue; const t=pixso.createText(); try{t.fontName=font}catch(e){} t.characters=f.name; t.fontSize=20; t.fills=[{type:'SOLID',color:{r:1,g:0.82,b:0.29}}]; t.name='label-'+f.name; t.x=f.x; t.y=f.y-32; page.appendChild(t); }
return page.children.filter(n=>n.type==='FRAME'&&(n.name||'').startsWith('T0')).map(n=>({id:n.id,name:n.name,x:n.x,y:n.y,w:n.width,h:n.height}));
"""
        },
    )
    if isinstance(frames, str):
        frames = json.loads(frames)
    (OUT / "truth-frames.json").write_text(json.dumps(frames, ensure_ascii=False, indent=2), encoding="utf-8")
    for fr in frames:
        exp = call(
            PIXSO,
            ph,
            "get_export_image",
            {"guid": fr["id"], "exportSettings": {"constraint": {"type": 2, "value": 450}, "imageType": 1}},
            timeout=90,
        )
        blob = exp if isinstance(exp, str) else json.dumps(exp, ensure_ascii=False)
        m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", blob)
        if m:
            outp = PREV / f"{fr['name']}.png"
            urllib.request.urlretrieve(m.group(0), outp)
            log(f"export {outp.name} {outp.stat().st_size}")
    return frames


def main():
    gh = init(GODOT, "gt")
    log("godot ok")
    sc = call(GODOT, gh, "execute_editor_script", {"code": measure_code()}, timeout=60)
    if not isinstance(sc, dict) or not sc.get("success"):
        raise RuntimeError(str(sc)[:500])
    truth = parse_measure(sc.get("output") or [])
    (OUT / "godot-ui-truth.json").write_text(json.dumps(truth, ensure_ascii=False, indent=2), encoding="utf-8")
    log("Title=" + str(truth.get("UI/Overlays/Menu/VBox/Title")))
    log("Start=" + str(truth.get("UI/Overlays/Menu/VBox/StartButton")))
    screens = build_screens(truth)
    (OUT / "screens-truth-meta.json").write_text(json.dumps(screens, ensure_ascii=False, indent=2), encoding="utf-8")
    ph = init(PIXSO, "pt")
    log("pixso ok")
    frames = import_pixso(ph, screens)
    log(f"done {len(frames)} frames")


if __name__ == "__main__":
    main()
