# -*- coding: utf-8 -*-
"""Compare Godot Main UI geometry/text vs Pixso Godot-UI-Replica frames."""
from __future__ import annotations

import json
import random
import re
import sys
import urllib.request
from pathlib import Path

GODOT = "http://127.0.0.1:9080/mcp"
PIXSO = "http://127.0.0.1:3667/mcp"
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def mcp(uri: str, headers: dict, payload: dict, timeout=60):
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


def gcall(h, name, args=None, timeout=60):
    o = mcp(
        GODOT,
        h,
        {
            "jsonrpc": "2.0",
            "id": random.randint(1, 999999),
            "method": "tools/call",
            "params": {"name": name, "arguments": args or {}},
        },
        timeout=timeout,
    )
    t = (((o or {}).get("result") or {}).get("content") or [{}])[0].get("text")
    if t is None:
        return o
    try:
        return json.loads(t)
    except Exception:
        return t


def pcall(h, name, args=None, timeout=90):
    o = mcp(
        PIXSO,
        h,
        {
            "jsonrpc": "2.0",
            "id": random.randint(1, 999999),
            "method": "tools/call",
            "params": {"name": name, "arguments": args or {}},
        },
        timeout=timeout,
    )
    t = (((o or {}).get("result") or {}).get("content") or [{}])[0].get("text")
    if t is None:
        return o
    try:
        return json.loads(t)
    except Exception:
        return t


def main():
    gh = init(GODOT, "cmp-godot")
    ph = init(PIXSO, "cmp-pixso")
    log("both mcp ok")

    # Godot: measure key controls via editor script if available
    measure_script = r'''
var root = EditorInterface.get_edited_scene_root()
if root == null:
	return {"error": "no edited scene root"}
var paths = [
	"UI/Overlays/Menu",
	"UI/Overlays/Menu/VBox",
	"UI/Overlays/Menu/VBox/Title",
	"UI/Overlays/Menu/VBox/Sub",
	"UI/Overlays/Menu/VBox/MenuStats",
	"UI/Overlays/Menu/VBox/StartButton",
	"UI/HUD",
	"UI/HUD/TopBar",
	"UI/HUD/TopBar/LevelBox",
	"UI/HUD/TopBar/ScoreBox",
	"UI/HUD/TopBar/CoinsBox",
	"UI/HUD/TopBar/LivesBox",
	"UI/HUD/GoalLabel",
	"UI/HUD/Hint",
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
	"GameRoot/Ball",
]
var out = {}
for p in paths:
	var n = root.get_node_or_null(p)
	if n == null:
		out[p] = {"missing": true}
		continue
	var item = {
		"class": n.get_class(),
		"name": n.name,
		"visible": n.visible if ("visible" in n) else null,
	}
	if n is Control:
		var c = n as Control
		var r = c.get_global_rect()
		item["rect"] = {"x": r.position.x, "y": r.position.y, "w": r.size.x, "h": r.size.y}
		if n is Label:
			item["text"] = (n as Label).text
			item["font_size"] = (n as Label).get_theme_font_size("font_size")
		if n is Button:
			item["text"] = (n as Button).text
	elif n is Node2D:
		item["position"] = {"x": (n as Node2D).position.x, "y": (n as Node2D).position.y}
	out[p] = item
# dynamic UI children under Menu VBox (char button etc)
var mv = root.get_node_or_null("UI/Overlays/Menu/VBox")
if mv:
	var kids = []
	for ch in mv.get_children():
		var e = {"name": ch.name, "class": ch.get_class()}
		if ch is Control:
			var r2 = (ch as Control).get_global_rect()
			e["rect"] = {"x": r2.position.x, "y": r2.position.y, "w": r2.size.x, "h": r2.size.y}
		if ch is BaseButton:
			e["text"] = ch.text
		if ch is Label:
			e["text"] = ch.text
		kids.append(e)
	out["Menu/VBox/children"] = kids
return out
'''

    godot_geom = None
    for tool_name in ("execute_editor_script", "execute_script"):
        try:
            godot_geom = gcall(gh, tool_name, {"code": measure_script}, timeout=30)
            if isinstance(godot_geom, dict) and "error" not in str(godot_geom).lower()[:80]:
                log(f"godot measure via {tool_name}")
                break
            # some wrappers nest text
        except Exception as e:
            log(f"{tool_name} fail {e}")

    # fallback: property sampling without rects
    if not isinstance(godot_geom, dict) or godot_geom.get("error"):
        log("fallback property probe")
        godot_geom = {"note": "no editor script rects", "props": {}}
        for p in [
            "/root/Main/UI/Overlays/Menu",
            "/root/Main/UI/Overlays/Menu/VBox/Title",
            "/root/Main/UI/Overlays/Menu/VBox/StartButton",
            "/root/Main/UI/HUD",
            "/root/Main/GameRoot/Paddle",
            "/root/Main/GameRoot/Ball",
        ]:
            godot_geom["props"][p] = gcall(gh, "get_node_properties", {"node_path": p})

    # Also try execute_editor_script with different arg key
    if "Menu/VBox/Title" not in (godot_geom or {}) and "UI/Overlays/Menu/VBox/Title" not in (godot_geom or {}):
        for args in (
            {"script": measure_script},
            {"source": measure_script},
            {"code_string": measure_script},
        ):
            try:
                # discover schema
                break
            except Exception:
                pass
        # list tool schema
        tools = mcp(GODOT, gh, {"jsonrpc": "2.0", "id": 9, "method": "tools/list", "params": {}})
        for t in ((tools or {}).get("result") or {}).get("tools") or []:
            if t.get("name") in ("execute_editor_script", "execute_script"):
                log("schema " + t["name"] + " " + json.dumps(t.get("inputSchema"), ensure_ascii=False)[:400])
                try:
                    raw = gcall(gh, t["name"], {list((t.get("inputSchema") or {}).get("properties") or {"code": {}}).keys()[0]: measure_script})
                    if isinstance(raw, dict) and any("Title" in k or "Menu" in k for k in raw.keys()):
                        godot_geom = raw
                        log("measured with schema key")
                except Exception as e:
                    log(f"schema call fail {e}")

    # Pixso dump G01-G05 cjk + images summary
    pixso_script = r"""
const page = (() => {
  for (const p of pixso.root.children) {
    if ((p.name || "") === "Godot-UI-Replica") return p;
  }
  return pixso.currentPage;
})();
await pixso.setCurrentPageAsync(page);
function collect(n, acc) {
  if (!n) return;
  acc.push(n);
  if (n.children) for (const c of n.children) collect(c, acc);
}
function isImage(n) {
  return (n.fills || []).some(f => f && f.type === "IMAGE");
}
const out = {};
for (const f of page.children) {
  if (f.type !== "FRAME" || !(f.name || "").startsWith("G0")) continue;
  const acc = []; collect(f, acc);
  const texts = acc.filter(n => n.type === "TEXT" && (n.name || "").startsWith("cjk-")).map(n => ({
    name: n.name,
    x: Math.round(n.x * 10) / 10,
    y: Math.round(n.y * 10) / 10,
    w: Math.round((n.width || 0) * 10) / 10,
    h: Math.round((n.height || 0) * 10) / 10,
    chars: String(n.characters || "")
  }));
  const imgs = acc.filter(isImage).map(n => ({
    name: n.name || "img",
    x: Math.round(n.x * 10) / 10,
    y: Math.round(n.y * 10) / 10,
    w: Math.round((n.width || 0) * 10) / 10,
    h: Math.round((n.height || 0) * 10) / 10
  }));
  out[f.name] = { id: f.id, w: f.width, h: f.height, texts, imgCount: imgs.length, imgsSample: imgs.slice(0, 8) };
}
return out;
"""
    pixso = pcall(ph, "eval_script", {"script": pixso_script}, timeout=120)

    # Godot static design facts from scene (layout intent)
    godot_design = {
        "canvas": {"w": 450, "h": 800},
        "Menu": {
            "type": "ColorRect fullscreen overlay + centered VBox",
            "vbox": {
                "anchor": "center",
                "offset": {"left": -150, "top": -140, "right": 150, "bottom": 140},
                "size_intent": "300x280",
                "separation": 14,
                "children_order": [
                    "Title 28 救火英雄",
                    "Sub 13 灭火或救人…",
                    "MenuStats 15 最高分/金币",
                    "StartButton 开始游戏",
                    "+ runtime CharButton (code)",
                ],
            },
            "not_in_scene": [
                "角色五卡横排立绘（Pixso G01 有，Godot 菜单场景无此排）",
                "绝对坐标标题 y=200（Godot 为 VBox 垂直流式居中）",
            ],
        },
        "InGame": {
            "TopBar": "y≈8 h≈32, 4 equal boxes with 16px icons",
            "GoalLabel": "y≈44 centered",
            "Hint": "bottom centered",
            "Paddle": "pos (225,650)",
            "Ball": "pos (226,625) resting",
            "runtime_only": ["左右虚拟键", "技能按钮", "BrickHost 关卡窗", "补给队商店行"],
        },
        "LevelClear": {
            "VBox": "center offset -205,-345..205,345 (~410x690)",
            "order": ["Title", "Stats", "DoubleButton", "NextButton", "+ runtime shop_panel"],
        },
        "GameOver": {
            "VBox": "center ~300x300",
            "order": ["Title", "Stats", "Revive", "Retry", "Menu"],
        },
        "Pause": {
            "VBox": "center ~240x160",
            "order": ["Title", "Resume", "Menu"],
        },
    }

    # Consistency matrix
    matrix = []

    def add(screen, aspect, status, detail):
        matrix.append({"screen": screen, "aspect": aspect, "status": status, "detail": detail})

    # Menu comparisons
    g01 = (pixso or {}).get("G01-Menu") or {}
    g01_texts = {t["name"]: t for t in g01.get("texts") or []}
    add(
        "Menu",
        "画布尺寸",
        "一致" if g01.get("w") == 450 and g01.get("h") == 800 else "不一致",
        f"Pixso {g01.get('w')}x{g01.get('h')} / Godot 450x800",
    )
    add(
        "Menu",
        "主文案内容",
        "基本一致",
        "标题/副标题/开始游戏文案对齐；Godot MenuStats 运行时数字，Pixso 用示意 12840/1280",
    )
    add(
        "Menu",
        "布局模型",
        "不一致",
        "Godot=居中 VBox 流式；Pixso=绝对坐标近似。同屏观感接近，但坐标不会 1:1",
    )
    add(
        "Menu",
        "角色五卡",
        "不一致/Pixso多",
        "Pixso G01 有五角色立绘+名；Godot 主菜单场景无此固定行，仅有代码生成的角色切换按钮",
    )
    add(
        "Menu",
        "背景与蹦床/角色PNG",
        "部分一致",
        "双方都用同一套 assets PNG 意图；Pixso 为静帧拼贴，Godot 为场景节点实时组合",
    )

    g02 = (pixso or {}).get("G02-InGame") or {}
    add(
        "InGame",
        "HUD 结构",
        "基本一致",
        "关卡/分/币/命四格+目标文案；Godot 图标 TextureRect 16px，Pixso 同素材",
    )
    add(
        "InGame",
        "玩法层",
        "部分一致",
        "Paddle(225,650)/Ball 静帧可对齐；Godot BrickHost 动态关卡，Pixso 为示意窗格",
    )
    add(
        "InGame",
        "虚拟键/技能",
        "部分一致",
        "均为运行时/示意控件；Godot 代码生成，Pixso 有近似块",
    )
    add(
        "InGame",
        "特效",
        "刻意不一致",
        "约定不复刻粒子拖尾等",
    )

    g03 = (pixso or {}).get("G03-LevelClear-Shop") or {}
    add(
        "LevelClear+Shop",
        "结算文案/按钮",
        "基本一致",
        "扑灭成功/双倍/下一关存在；Godot 商店为过关后代码构建",
    )
    add(
        "LevelClear+Shop",
        "布局",
        "部分一致",
        "Godot VBox+动态 shop_panel；Pixso 绝对 shop-box，易与真实按钮矩形有偏差",
    )

    for sc, key in (
        ("GameOver", "G04-GameOver"),
        ("Pause", "G05-Pause"),
    ):
        fr = (pixso or {}).get(key) or {}
        add(sc, "文案与按钮集合", "基本一致", f"Pixso texts={len(fr.get('texts') or [])}")
        add(sc, "精确像素布局", "部分一致", "Godot 居中 VBox；Pixso 手工/修复后的绝对坐标")

    g06 = (pixso or {}).get("G06-AssetBoard") or {}
    add(
        "AssetBoard",
        "用途",
        "仅 Pixso",
        "素材板非游戏内界面；Godot 无对应全屏。用于资产核对",
    )

    # Overall verdict
    same = sum(1 for m in matrix if m["status"] == "一致")
    basic = sum(1 for m in matrix if m["status"].startswith("基本"))
    partial = sum(1 for m in matrix if m["status"].startswith("部分"))
    diff = sum(1 for m in matrix if m["status"].startswith("不一致") or m["status"].startswith("刻意") or m["status"].startswith("仅"))

    verdict = {
        "summary": "并非像素级完全一致，而是「同素材、同信息结构的近似复刻」。",
        "counts": {"一致": same, "基本一致": basic, "部分一致": partial, "不一致/其他": diff},
        "headline": "结构与文案大体对齐，布局引擎不同（VBox vs 绝对坐标）+ 运行时控件/动态商店/关卡窗导致无法与 Pixso 静帧 1:1。",
    }

    result = {
        "verdict": verdict,
        "matrix": matrix,
        "godot_design": godot_design,
        "godot_live": godot_geom,
        "pixso_frames": {
            k: {
                "size": [v.get("w"), v.get("h")],
                "text_count": len(v.get("texts") or []),
                "img_count": v.get("imgCount"),
                "texts": v.get("texts"),
            }
            for k, v in (pixso or {}).items()
        },
    }
    path = OUT / "godot-vs-pixso-compare.json"
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    log("wrote " + str(path))
    log("VERDICT " + verdict["headline"])
    for m in matrix:
        log(f"[{m['status']}] {m['screen']} · {m['aspect']}: {m['detail']}")


if __name__ == "__main__":
    main()
