# -*- coding: utf-8 -*-
"""Flatten Pixso frames and rebuild UI chrome from Godot truth rects."""
from __future__ import annotations

import json
import random
import re
import sys
import urllib.request
from pathlib import Path

PIXSO = "http://127.0.0.1:3667/mcp"
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")
TRUTH = json.loads((OUT / "godot-ui-truth.json").read_text(encoding="utf-8"))
PREV = OUT / "previews-truth"
PREV.mkdir(parents=True, exist_ok=True)


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def js_str(s: str) -> str:
    return '"' + "".join(f"\\u{ord(c):04x}" for c in s) + '"'


def N(path: str) -> dict:
    return TRUTH.get(path) or {"missing": True}


def pack_label(path: str, text=None):
    n = dict(N(path))
    if n.get("missing") or "x" not in n:
        return None
    if text is not None:
        n["text"] = text
    return {
        "x": round(float(n["x"]), 1),
        "y": round(float(n["y"]), 1),
        "w": round(float(n["w"]), 1),
        "h": round(float(n["h"]), 1),
        "text": n.get("text") or "",
        "fs": int(n.get("font_size") or 15),
        "fc": n.get("font_color") or [1, 1, 1, 1],
        "center": int(n.get("halign") or 1) == 1,
    }


def pack_btn(path=None, manual=None, bg=None, fg=None):
    n = manual if manual else dict(N(path))
    if not n or n.get("missing") or "x" not in n:
        return None
    bg = bg or [1, 0.69, 0.125, 1]
    if fg is None:
        # dark bg => white text; light bg => dark text; translucent white => white text
        if (bg[0] + bg[1] + bg[2]) / 3 < 0.5 or (len(bg) > 3 and bg[3] is not None and bg[3] < 0.35):
            fg = [1, 1, 1, 1]
        else:
            fg = [0.1, 0.07, 0.03, 1]
    return {
        "x": round(float(n["x"]), 1),
        "y": round(float(n["y"]), 1),
        "w": round(float(n["w"]), 1),
        "h": round(float(n["h"]), 1),
        "text": n.get("text") or "",
        "bg": bg,
        "fg": fg,
    }


def pack_ov(path, fallback):
    n = dict(N(path))
    return {"color": n.get("color") or fallback}


def hud_boxes():
    lb = N("UI/HUD/TopBar/LevelBox")
    # editor collapsed boxes -> synthesize readable HUD
    if lb.get("missing") or float(lb.get("w") or 0) < 40:
        gap, left, y, h = 8, 8, 8, 28
        bw = (450 - 16 - gap * 3) / 4
        vals = ["3", "2460", "1280", "3"]
        return [
            {
                "x": round(left + i * (bw + gap), 1),
                "y": y,
                "w": round(bw, 1),
                "h": h,
                "text": vals[i],
            }
            for i in range(4)
        ]
    out = []
    for path, lp, default in [
        ("UI/HUD/TopBar/LevelBox", "UI/HUD/TopBar/LevelBox/LevelLabel", "3"),
        ("UI/HUD/TopBar/ScoreBox", "UI/HUD/TopBar/ScoreBox/ScoreLabel", "2460"),
        ("UI/HUD/TopBar/CoinsBox", "UI/HUD/TopBar/CoinsBox/CoinsLabel", "1280"),
        ("UI/HUD/TopBar/LivesBox", "UI/HUD/TopBar/LivesBox/LivesLabel", "3"),
    ]:
        b, lab = dict(N(path)), dict(N(lp))
        if b.get("missing"):
            continue
        txt = lab.get("text")
        if txt in (None, "", "0", "1"):
            txt = default
        out.append(
            {
                "x": round(float(b["x"]), 1),
                "y": round(float(b["y"]), 1),
                "w": round(float(b["w"]), 1),
                "h": round(float(b["h"]), 1),
                "text": str(txt),
            }
        )
    return out


start = N("UI/Overlays/Menu/VBox/StartButton")
char = {
    "x": start.get("x", 75),
    "y": float(start.get("y", 378)) - float(start.get("h", 36)) - 14,
    "w": start.get("w", 300),
    "h": start.get("h", 36),
    "text": "角色：小猫 · 敏捷（点击切换）",
}

SPECS = {
    "T01-Menu": {
        "overlay": pack_ov("UI/Overlays/Menu", [0.05, 0.07, 0.1, 0.92]),
        "labels": [
            pack_label("UI/Overlays/Menu/VBox/Title"),
            pack_label("UI/Overlays/Menu/VBox/Sub"),
            pack_label("UI/Overlays/Menu/VBox/MenuStats"),
        ],
        "buttons": [
            pack_btn(manual=char, bg=[0.35, 0.24, 0.1, 1]),
            pack_btn("UI/Overlays/Menu/VBox/StartButton", bg=[1, 0.69, 0.125, 1]),
        ],
    },
    "T02-InGame": {
        "overlay": None,
        "labels": [],
        "buttons": [],
        "hudBoxes": hud_boxes(),
        "goal": pack_label("UI/HUD/GoalLabel", text="火 5   人 3"),
        "hint": pack_label("UI/HUD/Hint"),
        "pads": True,
        "skill": {
            "x": 280,
            "y": 560,
            "w": 130,
            "h": 52,
            "text": "影分身",
            "bg": [0.7, 0.25, 0.12, 1],
        },
    },
    "T03-LevelClear": {
        "overlay": pack_ov("UI/Overlays/LevelClear", [0.05, 0.1, 0.08, 0.9]),
        "labels": [
            pack_label("UI/Overlays/LevelClear/VBox/Title"),
            pack_label(
                "UI/Overlays/LevelClear/VBox/Stats",
                text="本关奖励\n分数 +860　金币 +80",
            ),
        ],
        "buttons": [
            pack_btn("UI/Overlays/LevelClear/VBox/DoubleButton", bg=[0.2, 0.36, 0.58, 1]),
            pack_btn("UI/Overlays/LevelClear/VBox/NextButton", bg=[1, 0.69, 0.125, 1]),
        ],
        "shop": True,
    },
    "T04-GameOver": {
        "overlay": pack_ov("UI/Overlays/GameOver", [0.12, 0.05, 0.05, 0.92]),
        "labels": [
            pack_label("UI/Overlays/GameOver/VBox/Title"),
            pack_label(
                "UI/Overlays/GameOver/VBox/Stats",
                text="本局得分 1980\n最高分 12840\n金币 1280\n到达第 3 关",
            ),
        ],
        "buttons": [
            pack_btn("UI/Overlays/GameOver/VBox/ReviveButton", bg=[0.2, 0.36, 0.58, 1]),
            pack_btn("UI/Overlays/GameOver/VBox/RetryButton", bg=[1, 0.69, 0.125, 1]),
            pack_btn("UI/Overlays/GameOver/VBox/MenuButton", bg=[1, 1, 1, 0.12], fg=[1, 1, 1, 1]),
        ],
    },
    "T05-Pause": {
        "overlay": pack_ov("UI/Overlays/Pause", [0.05, 0.06, 0.1, 0.85]),
        "labels": [pack_label("UI/Overlays/Pause/VBox/Title")],
        "buttons": [
            pack_btn("UI/Overlays/Pause/VBox/ResumeButton", bg=[1, 0.69, 0.125, 1]),
            pack_btn("UI/Overlays/Pause/VBox/MenuButton", bg=[1, 1, 1, 0.12], fg=[1, 1, 1, 1]),
        ],
    },
}

for sp in SPECS.values():
    sp["labels"] = [x for x in (sp.get("labels") or []) if x]
    sp["buttons"] = [x for x in (sp.get("buttons") or []) if x]

SPECS_JSON = json.dumps(SPECS, ensure_ascii=False)

SCRIPT = """
const SPECS = __SPECS__;
const page = (() => {
  for (const p of pixso.root.children) if ((p.name || '') === 'Godot-UI-Replica') return p;
  return pixso.currentPage;
})();
await pixso.setCurrentPageAsync(page);
page.name = 'Godot-UI-Replica';

const font = { family: 'Microsoft YaHei', style: 'Regular' };
try { await pixso.loadFontAsync(font); } catch (e) {}

function isImage(n) {
  return (n.fills || []).some(f => f && f.type === 'IMAGE');
}
function absIn(n, frame) {
  let x = 0, y = 0, c = n;
  while (c && c !== frame) { x += c.x || 0; y += c.y || 0; c = c.parent; }
  return { x, y };
}
function collect(n, acc) {
  if (!n) return;
  acc.push(n);
  if (n.children) for (const c of n.children) collect(c, acc);
}
function addRect(frame, x, y, w, h, color, name) {
  const r = pixso.createRectangle();
  r.name = name || 'rect';
  r.x = x; r.y = y;
  try { r.resize(Math.max(1, w), Math.max(1, h)); } catch (e) {}
  const opacity = (color[3] == null) ? 1 : color[3];
  r.fills = [{ type: 'SOLID', color: { r: color[0], g: color[1], b: color[2] }, opacity: opacity }];
  try { r.cornerRadius = 10; } catch (e) {}
  frame.appendChild(r);
  return r;
}
function addText(frame, x, y, w, h, text, fs, fc, name, center) {
  const t = pixso.createText();
  try { t.fontName = font; } catch (e) {}
  t.name = name || 'txt';
  t.fontSize = fs || 16;
  t.characters = String(text || '');
  const opacity = (fc[3] == null) ? 1 : fc[3];
  t.fills = [{ type: 'SOLID', color: { r: fc[0], g: fc[1], b: fc[2] }, opacity: opacity }];
  frame.appendChild(t);
  const tw = t.width || 0;
  const th = t.height || fs || 16;
  if (center) {
    t.x = x + (w - tw) / 2;
    t.y = y + (h - th) / 2;
  } else {
    t.x = x;
    t.y = y + Math.max(0, (h - th) / 2);
  }
  return t;
}

const report = {};
for (const frame of [...page.children]) {
  if (frame.type !== 'FRAME') continue;
  const spec = SPECS[frame.name];
  if (!spec) continue;

  // collect image fills with absolute positions
  const nodes = [];
  collect(frame, nodes);
  const imgData = [];
  for (const n of nodes) {
    if (n === frame || !isImage(n) || n.visible === false) continue;
    const a = absIn(n, frame);
    const w = n.width || 0, h = n.height || 0;
    if (w < 4 || h < 4) continue;
    let fills = null;
    try { fills = JSON.parse(JSON.stringify(n.fills)); } catch (e) { fills = n.fills; }
    imgData.push({ a, w, h, fills });
  }

  // clear frame
  for (const c of [...frame.children]) {
    try { c.remove(); } catch (e) {}
  }

  // restore images on root
  let imgCount = 0;
  for (const im of imgData) {
    const r = pixso.createRectangle();
    r.name = 'art-' + imgCount;
    r.x = im.a.x; r.y = im.a.y;
    try { r.resize(im.w, im.h); } catch (e) {}
    try { r.fills = im.fills; } catch (e) { try { r.remove(); } catch (e2) {} continue; }
    frame.appendChild(r);
    imgCount++;
  }

  // overlay
  if (spec.overlay && spec.overlay.color) {
    addRect(frame, 0, 0, 450, 800, spec.overlay.color, 'overlay');
  }

  // labels
  for (const L of (spec.labels || [])) {
    addText(frame, L.x, L.y, L.w, L.h, L.text, L.fs, L.fc, 'ui-label', !!L.center);
  }

  // buttons
  for (const B of (spec.buttons || [])) {
    const rr = addRect(frame, B.x, B.y, B.w, B.h, B.bg, 'ui-btn');
    try { rr.cornerRadius = 10; } catch (e) {}
    addText(frame, B.x, B.y, B.w, B.h, B.text, 16, B.fg, 'ui-btn-text', true);
  }

  // hud
  if (spec.hudBoxes) {
    for (const b of spec.hudBoxes) {
      addRect(frame, b.x, b.y, b.w, b.h, [0.04, 0.055, 0.1, 0.55], 'hud-box');
      addText(frame, b.x + 22, b.y, Math.max(10, b.w - 26), b.h, String(b.text || ''), 15, [1,1,1,1], 'hud-text', false);
    }
  }
  if (spec.goal) {
    const G = spec.goal;
    addText(frame, G.x, G.y, G.w, G.h, G.text, G.fs || 15, G.fc || [1,1,1,1], 'goal', true);
  }
  if (spec.hint) {
    const G = spec.hint;
    addText(frame, G.x, G.y, G.w, G.h, G.text, G.fs || 12, G.fc || [0.65,0.72,0.8,1], 'hint', true);
  }
  if (spec.pads) {
    const mk = (x,y,w,h,txt) => {
      const r = addRect(frame, x, y, w, h, [1,1,1,0.12], 'vpad');
      try { r.cornerRadius = 999; } catch (e) {}
      addText(frame, x, y, w, h, txt, 34, [1,1,1,1], 'vpad-text', true);
    };
    mk(18, 670, 120, 110, '◀');
    mk(312, 670, 120, 110, '▶');
  }
  if (spec.skill) {
    const S = spec.skill;
    const r = addRect(frame, S.x, S.y, S.w, S.h, S.bg, 'skill');
    try { r.cornerRadius = 10; } catch (e) {}
    addText(frame, S.x, S.y, S.w, S.h, S.text, 15, [1,1,1,1], 'skill-text', true);
  }

  // shop between first two buttons
  if (spec.shop && (spec.buttons || []).length >= 2) {
    const d = spec.buttons[0], n = spec.buttons[1];
    const sx = d.x, sw = d.w;
    const sy = d.y + d.h + 10;
    const sh = Math.max(110, n.y - sy - 10);
    addRect(frame, sx, sy, sw, sh, [0,0,0,0.28], 'shop');
    addText(frame, sx, sy + 8, sw, 22, __SHOP_TITLE__, 18, [1,1,1,1], 'shop-title', true);
    addText(frame, sx, sy + 34, sw, 18, __SHOP_BAL__, 14, [1,0.88,0.44,1], 'shop-bal', true);
    const rows = [__R0__, __R1__, __R2__, __R3__];
    let ry = sy + 58;
    for (const info of rows) {
      if (ry + 34 > sy + sh - 6) break;
      addRect(frame, sx + 8, ry, sw - 16, 34, [1,1,1,0.06], 'shop-row');
      addText(frame, sx + 16, ry, sw - 120, 34, info, 12, [1,1,1,1], 'shop-row-text', false);
      const pr = addRect(frame, sx + sw - 86, ry + 5, 68, 24, [1,0.69,0.125,1], 'shop-price');
      try { pr.cornerRadius = 8; } catch (e) {}
      addText(frame, sx + sw - 86, ry + 5, 68, 24, '100', 12, [0.1,0.07,0.03,1], 'shop-price-text', true);
      ry += 38;
    }
  }

  report[frame.name] = { images: imgCount, children: frame.children.length };
}

// layout grid
const order = ['T01-Menu','T02-InGame','T03-LevelClear','T04-GameOver','T05-Pause','G06-AssetBoard'];
const map = {};
for (const c of page.children) if (c.type === 'FRAME') map[c.name] = c;
let i = 0;
for (const name of order) {
  const f = map[name]; if (!f) continue;
  if (name === 'G06-AssetBoard') { f.x = 0; f.y = 2 * (800 + 100); }
  else {
    f.x = (i % 3) * (450 + 80);
    f.y = Math.floor(i / 3) * (800 + 100);
    try { f.resize(450, 800); } catch (e) {}
    i++;
  }
}
// labels
for (const c of [...page.children]) if ((c.name || '').startsWith('label-')) try { c.remove(); } catch (e) {}
for (const name of order) {
  const f = map[name]; if (!f) continue;
  const t = pixso.createText();
  try { t.fontName = font; } catch (e) {}
  t.characters = name; t.fontSize = 20;
  t.fills = [{ type: 'SOLID', color: { r: 1, g: 0.82, b: 0.29 } }];
  t.name = 'label-' + name; t.x = f.x; t.y = f.y - 32;
  page.appendChild(t);
}

return {
  report,
  frames: order.map(name => map[name] ? {
    id: map[name].id, name, x: map[name].x, y: map[name].y, w: map[name].width, h: map[name].height,
    childCount: map[name].children.length
  } : { missing: name })
};
"""

SCRIPT = (
    SCRIPT.replace("__SPECS__", SPECS_JSON)
    .replace("__SHOP_TITLE__", js_str("补给队 · 过关补给"))
    .replace("__SHOP_BAL__", js_str("金币 1360"))
    .replace("__R0__", js_str("熊猫 · 力量 +1 级灭火"))
    .replace("__R1__", js_str("长条 · 蹦床加长 8 秒"))
    .replace("__R2__", js_str("灭火器 · 首次着火自灭"))
    .replace("__R3__", js_str("1UP · 灭火等级 +1"))
)


def main():
    h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}

    def post(p, timeout=240):
        return mcp(h, p, timeout)

    def mcp(headers, payload, timeout=240):
        req = urllib.request.Request(
            PIXSO, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), headers=headers
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            sid = r.headers.get("mcp-session-id")
            if sid:
                headers["mcp-session-id"] = sid
            raw = r.read().decode("utf-8", errors="replace")
        parts = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
        body = "\n".join(parts) if parts else raw
        return json.loads(body) if body.strip() else None

    post(
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "flatten", "version": "1"},
            },
        }
    )
    try:
        post({"jsonrpc": "2.0", "method": "notifications/initialized"})
    except Exception:
        pass

    log("fixing layout...")
    o = post(
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": "eval_script", "arguments": {"script": SCRIPT}},
        },
        timeout=300,
    )
    text = (((o or {}).get("result") or {}).get("content") or [{}])[0].get("text")
    try:
        res = json.loads(text)
    except Exception:
        res = text
    (OUT / "flatten-fix-result.json").write_text(
        json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    log(json.dumps(res, ensure_ascii=False)[:2000])

    frames = (res or {}).get("frames") or []
    for fr in frames:
        if not isinstance(fr, dict) or "id" not in fr:
            continue
        exp_o = post(
            {
                "jsonrpc": "2.0",
                "id": random.randint(1, 99999),
                "method": "tools/call",
                "params": {
                    "name": "get_export_image",
                    "arguments": {
                        "guid": fr["id"],
                        "exportSettings": {
                            "constraint": {
                                "type": 2,
                                "value": min(900, max(300, int(fr.get("w") or 450))),
                            },
                            "imageType": 1,
                        },
                    },
                },
            },
            timeout=90,
        )
        et = (((exp_o or {}).get("result") or {}).get("content") or [{}])[0].get("text")
        blob = et if isinstance(et, str) else json.dumps(exp_o, ensure_ascii=False)
        m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", blob or "")
        if not m:
            log("export fail " + str(fr.get("name")))
            continue
        outp = PREV / f"{fr['name']}.png"
        urllib.request.urlretrieve(m.group(0), outp)
        log(f"export {outp.name} {outp.stat().st_size}")
    log("DONE")


if __name__ == "__main__":
    main()
