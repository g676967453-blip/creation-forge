# -*- coding: utf-8 -*-
"""
Hidden Godot overlays collapse child rects in the editor.
Rebuild T03/T04/T05 (and refine T02 HUD) from scene anchor math + sensible VBox flow.
Keep existing art images flattened on root.
"""
from __future__ import annotations

import json
import random
import re
import sys
import urllib.request
from pathlib import Path

PIXSO = "http://127.0.0.1:3667/mcp"
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")
PREV = OUT / "previews-truth"
PREV.mkdir(parents=True, exist_ok=True)


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def js_str(s: str) -> str:
    return '"' + "".join(f"\\u{ord(c):04x}" for c in s) + '"'


def flow_vbox(x, y, w, items, sep=12):
    """items: list of dicts with keys kind,text,h, optional bg/fs/fc"""
    out_labels, out_btns = [], []
    cy = y
    for it in items:
        h = it["h"]
        if it["kind"] == "label":
            out_labels.append(
                {
                    "x": x,
                    "y": cy,
                    "w": w,
                    "h": h,
                    "text": it["text"],
                    "fs": it.get("fs", 15),
                    "fc": it.get("fc", [1, 1, 1, 1]),
                    "center": True,
                }
            )
        else:
            out_btns.append(
                {
                    "x": x,
                    "y": cy,
                    "w": w,
                    "h": h,
                    "text": it["text"],
                    "bg": it.get("bg", [1, 0.69, 0.125, 1]),
                    "fg": it.get("fg", [0.1, 0.07, 0.03, 1]),
                }
            )
        cy += h + sep
    return out_labels, out_btns, cy


# Scene-derived VBox frames (center anchors on 450x800)
# LevelClear: offset L/T/R/B = -205,-345,205,345
LC = {"x": 20.0, "y": 55.0, "w": 410.0, "h": 690.0}
# GameOver: -150,-150,150,150
GO = {"x": 75.0, "y": 250.0, "w": 300.0, "h": 300.0}
# Pause: -120,-80,120,80
PA = {"x": 105.0, "y": 320.0, "w": 240.0, "h": 160.0}
# Menu (already good from live measure)
ME = {"x": 75.0, "y": 260.0, "w": 300.0, "h": 280.0}

# Level clear content: title/stats/double near top; shop middle; next lower
lc_labels = [
    {
        "x": LC["x"],
        "y": 70,
        "w": LC["w"],
        "h": 32,
        "text": "扑灭成功！",
        "fs": 26,
        "fc": [1, 1, 1, 1],
        "center": True,
    },
    {
        "x": LC["x"],
        "y": 112,
        "w": LC["w"],
        "h": 48,
        "text": "本关奖励\n分数 +860　金币 +80",
        "fs": 15,
        "fc": [1, 1, 1, 1],
        "center": True,
    },
]
lc_btns = [
    {
        "x": LC["x"] + 20,
        "y": 175,
        "w": LC["w"] - 40,
        "h": 40,
        "text": "看广告 · 双倍金币",
        "bg": [0.2, 0.36, 0.58, 1],
        "fg": [1, 1, 1, 1],
    },
    {
        "x": LC["x"] + 20,
        "y": 620,
        "w": LC["w"] - 40,
        "h": 44,
        "text": "下一关 →",
        "bg": [1, 0.69, 0.125, 1],
        "fg": [0.1, 0.07, 0.03, 1],
    },
]
# shop between double and next
shop = {
    "x": LC["x"] + 20,
    "y": 230,
    "w": LC["w"] - 40,
    "h": 370,
}

go_labels, go_btns, _ = flow_vbox(
    GO["x"],
    GO["y"],
    GO["w"],
    [
        {"kind": "label", "text": "任务失败…", "h": 32, "fs": 26, "fc": [1, 0.4, 0.35, 1]},
        {
            "kind": "label",
            "text": "本局得分 1980\n最高分 12840\n金币 1280\n到达第 3 关",
            "h": 84,
            "fs": 15,
            "fc": [1, 1, 1, 1],
        },
        {"kind": "btn", "text": "看广告 · 复活", "h": 40, "bg": [0.2, 0.36, 0.58, 1], "fg": [1, 1, 1, 1]},
        {"kind": "btn", "text": "重新开始", "h": 40, "bg": [1, 0.69, 0.125, 1]},
        {"kind": "btn", "text": "主菜单", "h": 36, "bg": [1, 1, 1, 0.12], "fg": [1, 1, 1, 1]},
    ],
    sep=12,
)

pa_labels, pa_btns, _ = flow_vbox(
    PA["x"],
    PA["y"],
    PA["w"],
    [
        {"kind": "label", "text": "已暂停", "h": 32, "fs": 26, "fc": [1, 1, 1, 1]},
        {"kind": "btn", "text": "继续", "h": 40, "bg": [1, 0.69, 0.125, 1]},
        {"kind": "btn", "text": "主菜单", "h": 36, "bg": [1, 1, 1, 0.12], "fg": [1, 1, 1, 1]},
    ],
    sep=12,
)

# Menu from measured truth
menu_labels = [
    {
        "x": 75,
        "y": 260,
        "w": 300,
        "h": 29,
        "text": "救火英雄",
        "fs": 28,
        "fc": [1, 1, 1, 1],
        "center": True,
    },
    {
        "x": 75,
        "y": 303,
        "w": 300,
        "h": 31,
        "text": "灭火或救人 · 双通道过关\nGodot 4.7 · IAA 验证版",
        "fs": 13,
        "fc": [0.7, 0.78, 0.88, 1],
        "center": True,
    },
    {
        "x": 75,
        "y": 348,
        "w": 300,
        "h": 16,
        "text": "最高分 0　金币 0",
        "fs": 15,
        "fc": [1, 0.88, 0.45, 1],
        "center": True,
    },
]
menu_btns = [
    {
        "x": 75,
        "y": 378 - 36 - 14,
        "w": 300,
        "h": 36,
        "text": "角色：小猫 · 敏捷（点击切换）",
        "bg": [0.35, 0.24, 0.1, 1],
        "fg": [1, 1, 1, 1],
    },
    {
        "x": 75,
        "y": 378,
        "w": 300,
        "h": 36,
        "text": "开始游戏",
        "bg": [1, 0.69, 0.125, 1],
        "fg": [0.1, 0.07, 0.03, 1],
    },
]

# HUD
gap, left, y, hh = 8, 8, 8, 28
bw = (450 - 16 - gap * 3) / 4
hud_boxes = [
    {"x": round(left + i * (bw + gap), 1), "y": y, "w": round(bw, 1), "h": hh, "text": t}
    for i, t in enumerate(["3", "2460", "1280", "3"])
]
goal = {
    "x": 8,
    "y": 44,
    "w": 434,
    "h": 28,
    "text": "火 5   人 3",
    "fs": 15,
    "fc": [1, 1, 1, 1],
    "center": True,
}
hint = {
    "x": 25,
    "y": 752,
    "w": 400,
    "h": 36,
    "text": "A/D 或拖拽移动 · 空格/点击发射 · Esc 暂停",
    "fs": 12,
    "fc": [0.65, 0.72, 0.8, 1],
    "center": True,
}

SPECS = {
    "T01-Menu": {
        "overlay": [0.05, 0.07, 0.1, 0.92],
        "labels": menu_labels,
        "buttons": menu_btns,
        "shop": None,
        "hud": None,
        "pads": False,
        "skill": None,
    },
    "T02-InGame": {
        "overlay": None,
        "labels": [goal, hint],
        "buttons": [],
        "shop": None,
        "hud": hud_boxes,
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
        "overlay": [0.05, 0.1, 0.08, 0.9],
        "labels": lc_labels,
        "buttons": lc_btns,
        "shop": shop,
        "hud": None,
        "pads": False,
        "skill": None,
    },
    "T04-GameOver": {
        "overlay": [0.12, 0.05, 0.05, 0.92],
        "labels": go_labels,
        "buttons": go_btns,
        "shop": None,
        "hud": None,
        "pads": False,
        "skill": None,
    },
    "T05-Pause": {
        "overlay": [0.05, 0.06, 0.1, 0.85],
        "labels": pa_labels,
        "buttons": pa_btns,
        "shop": None,
        "hud": None,
        "pads": False,
        "skill": None,
    },
}

# persist corrected truth for future
corrected = {
    "note": "Hidden overlay children synthesized from main.tscn center anchors + VBox flow",
    "LevelClear_VBox": LC,
    "GameOver_VBox": GO,
    "Pause_VBox": PA,
    "screens": SPECS,
}
(OUT / "godot-layout-synthesized.json").write_text(
    json.dumps(corrected, ensure_ascii=False, indent=2), encoding="utf-8"
)

SPECS_JSON = json.dumps(SPECS, ensure_ascii=False)

SCRIPT = f"""
const SPECS = {SPECS_JSON};
const page = (() => {{
  for (const p of pixso.root.children) if ((p.name || '') === 'Godot-UI-Replica') return p;
  return pixso.currentPage;
}})();
await pixso.setCurrentPageAsync(page);
page.name = 'Godot-UI-Replica';
const font = {{ family: 'Microsoft YaHei', style: 'Regular' }};
try {{ await pixso.loadFontAsync(font); }} catch (e) {{}}

function isImage(n) {{ return (n.fills || []).some(f => f && f.type === 'IMAGE'); }}
function absIn(n, frame) {{
  let x = 0, y = 0, c = n;
  while (c && c !== frame) {{ x += c.x || 0; y += c.y || 0; c = c.parent; }}
  return {{ x, y }};
}}
function collect(n, acc) {{ if (!n) return; acc.push(n); if (n.children) for (const c of n.children) collect(c, acc); }}
function addRect(frame, x, y, w, h, color, name, radius) {{
  const r = pixso.createRectangle();
  r.name = name || 'rect';
  r.x = x; r.y = y;
  try {{ r.resize(Math.max(1,w), Math.max(1,h)); }} catch (e) {{}}
  const opacity = (color[3] == null) ? 1 : color[3];
  r.fills = [{{ type: 'SOLID', color: {{ r: color[0], g: color[1], b: color[2] }}, opacity: opacity }}];
  try {{ r.cornerRadius = (radius == null ? 10 : radius); }} catch (e) {{}}
  frame.appendChild(r);
  return r;
}}
function addText(frame, x, y, w, h, text, fs, fc, name, center) {{
  const t = pixso.createText();
  try {{ t.fontName = font; }} catch (e) {{}}
  t.name = name || 'txt';
  t.fontSize = fs || 16;
  t.characters = String(text || '');
  const opacity = (fc[3] == null) ? 1 : fc[3];
  t.fills = [{{ type: 'SOLID', color: {{ r: fc[0], g: fc[1], b: fc[2] }}, opacity: opacity }}];
  frame.appendChild(t);
  const tw = t.width || 0, th = t.height || fs || 16;
  if (center) {{ t.x = x + (w - tw) / 2; t.y = y + (h - th) / 2; }}
  else {{ t.x = x; t.y = y + Math.max(0, (h - th) / 2); }}
  return t;
}}

const report = {{}};
for (const frame of [...page.children]) {{
  if (frame.type !== 'FRAME') continue;
  const spec = SPECS[frame.name];
  if (!spec) continue;

  // keep art images only
  const nodes = []; collect(frame, nodes);
  const imgData = [];
  for (const n of nodes) {{
    if (n === frame || !isImage(n) || n.visible === false) continue;
    const a = absIn(n, frame);
    const w = n.width || 0, h = n.height || 0;
    if (w < 4 || h < 4) continue;
    let fills = null;
    try {{ fills = JSON.parse(JSON.stringify(n.fills)); }} catch (e) {{ fills = n.fills; }}
    // Prefer gameplay art: skip pure solid if any - all image fills ok
    imgData.push({{ a, w, h, fills }});
  }}

  for (const c of [...frame.children]) try {{ c.remove(); }} catch (e) {{}}

  let imgCount = 0;
  for (const im of imgData) {{
    const r = pixso.createRectangle();
    r.name = 'art-' + imgCount;
    r.x = im.a.x; r.y = im.a.y;
    try {{ r.resize(im.w, im.h); }} catch (e) {{}}
    try {{ r.fills = im.fills; }} catch (e) {{ try {{ r.remove(); }} catch (e2) {{}} continue; }}
    frame.appendChild(r);
    imgCount++;
  }}

  if (spec.overlay) addRect(frame, 0, 0, 450, 800, spec.overlay, 'overlay', 0);

  if (spec.hud) {{
    for (const b of spec.hud) {{
      addRect(frame, b.x, b.y, b.w, b.h, [0.04, 0.055, 0.1, 0.55], 'hud-box', 8);
      addText(frame, b.x + 22, b.y, Math.max(10, b.w - 26), b.h, String(b.text || ''), 15, [1,1,1,1], 'hud-text', false);
    }}
  }}

  for (const L of (spec.labels || [])) {{
    addText(frame, L.x, L.y, L.w, L.h, L.text, L.fs, L.fc || [1,1,1,1], 'ui-label', !!L.center);
  }}
  for (const B of (spec.buttons || [])) {{
    addRect(frame, B.x, B.y, B.w, B.h, B.bg, 'ui-btn', 10);
    addText(frame, B.x, B.y, B.w, B.h, B.text, 16, B.fg || [0.1,0.07,0.03,1], 'ui-btn-text', true);
  }}

  if (spec.shop) {{
    const s = spec.shop;
    addRect(frame, s.x, s.y, s.w, s.h, [0,0,0,0.28], 'shop', 12);
    addText(frame, s.x, s.y + 10, s.w, 24, {js_str("补给队 · 过关补给")}, 18, [1,1,1,1], 'shop-title', true);
    addText(frame, s.x, s.y + 38, s.w, 20, {js_str("金币 1360")}, 14, [1,0.88,0.44,1], 'shop-bal', true);
    const rows = [{js_str("熊猫 · 力量 +1 级灭火")},{js_str("长条 · 蹦床加长 8 秒")},{js_str("灭火器 · 首次着火自灭")},{js_str("1UP · 灭火等级 +1")},{js_str("锤子 · 砸碎一排窗")},{js_str("钱袋 · 金币 +50")}];
    let ry = s.y + 70;
    for (const info of rows) {{
      if (ry + 36 > s.y + s.h - 10) break;
      addRect(frame, s.x + 10, ry, s.w - 20, 34, [1,1,1,0.06], 'shop-row', 8);
      addText(frame, s.x + 18, ry, s.w - 120, 34, info, 12, [1,1,1,1], 'shop-row-text', false);
      addRect(frame, s.x + s.w - 90, ry + 5, 70, 24, [1,0.69,0.125,1], 'shop-price', 8);
      addText(frame, s.x + s.w - 90, ry + 5, 70, 24, '100', 12, [0.1,0.07,0.03,1], 'shop-price-text', true);
      ry += 40;
    }}
  }}

  if (spec.pads) {{
    const mk = (x,y,w,h,txt) => {{
      addRect(frame, x, y, w, h, [1,1,1,0.12], 'vpad', 999);
      addText(frame, x, y, w, h, txt, 34, [1,1,1,1], 'vpad-text', true);
    }};
    mk(18, 670, 120, 110, '◀');
    mk(312, 670, 120, 110, '▶');
  }}
  if (spec.skill) {{
    const S = spec.skill;
    addRect(frame, S.x, S.y, S.w, S.h, S.bg, 'skill', 10);
    addText(frame, S.x, S.y, S.w, S.h, S.text, 15, [1,1,1,1], 'skill-text', true);
  }}

  report[frame.name] = {{ images: imgCount, children: frame.children.length }};
}}

// grid
const order = ['T01-Menu','T02-InGame','T03-LevelClear','T04-GameOver','T05-Pause','G06-AssetBoard'];
const map = {{}};
for (const c of page.children) if (c.type === 'FRAME') map[c.name] = c;
let i = 0;
for (const name of order) {{
  const f = map[name]; if (!f) continue;
  if (name === 'G06-AssetBoard') {{ f.x = 0; f.y = 2*(800+100); }}
  else {{
    f.x = (i%3)*(450+80);
    f.y = Math.floor(i/3)*(800+100);
    try {{ f.resize(450,800); }} catch (e) {{}}
    i++;
  }}
}}
for (const c of [...page.children]) if ((c.name||'').startsWith('label-')) try {{ c.remove(); }} catch(e) {{}}
for (const name of order) {{
  const f = map[name]; if (!f) continue;
  const t = pixso.createText();
  try {{ t.fontName = font; }} catch(e) {{}}
  t.characters = name; t.fontSize = 20;
  t.fills = [{{ type:'SOLID', color:{{ r:1,g:0.82,b:0.29 }} }}];
  t.name = 'label-' + name; t.x = f.x; t.y = f.y - 32;
  page.appendChild(t);
}}

return {{
  report,
  frames: order.map(name => map[name] ? {{
    id: map[name].id, name, x: map[name].x, y: map[name].y, w: map[name].width, h: map[name].height,
    childCount: map[name].children.length
  }} : {{ missing: name }})
}};
"""


def main():
    h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}

    def post(p, timeout=300):
        req = urllib.request.Request(
            PIXSO, data=json.dumps(p, ensure_ascii=False).encode("utf-8"), headers=h
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            sid = r.headers.get("mcp-session-id")
            if sid:
                h["mcp-session-id"] = sid
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
                "clientInfo": {"name": "fix-overlays", "version": "1"},
            },
        }
    )
    try:
        post({"jsonrpc": "2.0", "method": "notifications/initialized"})
    except Exception:
        pass

    log("rebuilding overlay layouts...")
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
    (OUT / "overlay-layout-fix.json").write_text(
        json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    log(json.dumps(res, ensure_ascii=False)[:1600])

    # verify key positions
    verify = r"""
const page = (() => { for (const p of pixso.root.children) if ((p.name||'')==='Godot-UI-Replica') return p; return pixso.currentPage; })();
await pixso.setCurrentPageAsync(page);
function abs(n,f){let x=0,y=0,c=n;while(c&&c!==f){x+=c.x||0;y+=c.y||0;c=c.parent;}return{x,y};}
const out={};
for (const f of page.children) {
  if (f.type!=='FRAME' || !(f.name||'').startsWith('T0')) continue;
  const texts=[];
  for (const c of f.children) {
    if (c.type==='TEXT') {
      const a=abs(c,f);
      texts.push({chars:String(c.characters||'').slice(0,24), x:Math.round(a.x), y:Math.round(a.y)});
    }
  }
  out[f.name]=texts;
}
return out;
"""
    vo = post(
        {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {"name": "eval_script", "arguments": {"script": verify}},
        }
    )
    vt = (((vo or {}).get("result") or {}).get("content") or [{}])[0].get("text")
    try:
        vres = json.loads(vt)
    except Exception:
        vres = vt
    (OUT / "overlay-layout-verify.json").write_text(
        json.dumps(vres, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    for name, texts in (vres or {}).items():
        log("== " + name)
        for t in texts[:10]:
            log(f"  {t.get('chars')} @ ({t.get('x')},{t.get('y')})")

    frames = (res or {}).get("frames") or []
    for fr in frames:
        if not isinstance(fr, dict) or "id" not in fr:
            continue
        exp = post(
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
        et = (((exp or {}).get("result") or {}).get("content") or [{}])[0].get("text")
        blob = et if isinstance(et, str) else json.dumps(exp, ensure_ascii=False)
        m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", blob or "")
        if not m:
            log("export fail " + str(fr.get("name")))
            continue
        outp = PREV / f"{fr['name']}.png"
        urllib.request.urlretrieve(m.group(0), outp)
        log(f"export {outp.name} {outp.stat().st_size}")
    log("OVERLAY LAYOUT FIXED")


if __name__ == "__main__":
    main()
