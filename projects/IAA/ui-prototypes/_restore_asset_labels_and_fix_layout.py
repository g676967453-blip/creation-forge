# -*- coding: utf-8 -*-
"""
1) Fix cjk text positions on UI screens (center on real buttons/chrome).
2) Restore per-asset labels on G06-AssetBoard (native-size board).
"""
from __future__ import annotations

import json
import random
import re
import sys
import urllib.request
from pathlib import Path

URI = "http://127.0.0.1:3667/mcp"
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")
ASSETS = Path(r"J:\ceshi\projects\IAA\fire-hero-godot\assets")


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def session():
    h = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    init = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "restore-labels", "version": "1"},
        },
    }
    req = urllib.request.Request(URI, data=json.dumps(init).encode(), headers=h)
    with urllib.request.urlopen(req, timeout=30) as r:
        h["mcp-session-id"] = r.headers.get("mcp-session-id")
        r.read()
    try:
        urllib.request.urlopen(
            urllib.request.Request(
                URI,
                data=b'{"jsonrpc":"2.0","method":"notifications/initialized"}',
                headers=h,
            ),
            timeout=10,
        ).read()
    except Exception:
        pass
    return h


def tool(headers, name, args, timeout=180):
    payload = {
        "jsonrpc": "2.0",
        "id": random.randint(1, 999999),
        "method": "tools/call",
        "params": {"name": name, "arguments": args},
    }
    req = urllib.request.Request(
        URI, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), headers=headers
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read().decode("utf-8", errors="replace")
    parts = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
    obj = json.loads("\n".join(parts))
    if "error" in obj:
        raise RuntimeError(json.dumps(obj["error"], ensure_ascii=False))
    return "\n".join(
        c.get("text", "") for c in (obj.get("result") or {}).get("content") or []
    )


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    w = int.from_bytes(data[16:20], "big")
    h = int.from_bytes(data[20:24], "big")
    return w, h


# Known asset sizes for matching images on board
ASSET_LABELS = []


def add_label(rel: str, label: str, section: str):
    p = ASSETS / rel
    if p.exists():
        w, h = png_size(p)
        ASSET_LABELS.append({"rel": rel, "label": label, "section": section, "w": w, "h": h})


# 场景
add_label("backgrounds/bg_level_default.png", "背景 450×800", "scene")
add_label("props/windows/window_normal.png", "普通窗", "scene")
add_label("props/windows/window_fire_lv1.png", "火1", "scene")
add_label("props/windows/window_fire_lv2.png", "火2", "scene")
add_label("props/windows/window_fire_lv3.png", "火3", "scene")
add_label("props/windows/window_rescue.png", "救援窗", "scene")
add_label("props/windows/window_rescue_red.png", "红窗", "scene")
add_label("props/trampoline/mat.png", "蹦床垫", "scene")
add_label("props/trampoline/fireman_left.png", "消防员左", "scene")
add_label("props/trampoline/fireman_right.png", "消防员右", "scene")
add_label("pixel/villagers/vil_rabbit_front_call.png", "村民呼救", "scene")
add_label("pixel/villagers/vil_rabbit_front.png", "村民", "scene")
add_label("pixel/villagers/vil_fox_front_call.png", "狐狸村民", "scene")
add_label("pixel/villagers/vil_pig_front_call.png", "猪村民", "scene")
# 角色
add_label("props/ball/char_cat.png", "小猫 cat", "role")
add_label("props/ball/char_dog.png", "小狗 dog", "role")
add_label("props/ball/char_panda.png", "熊猫 panda", "role")
add_label("props/ball/char_capybara.png", "卡皮巴拉", "role")
add_label("props/ball/char_naruto.png", "狐狸 fox", "role")
# 道具/HUD
add_label("props/items/item_bag.png", "钱袋", "prop")
add_label("props/items/item_wide.png", "长条", "prop")
add_label("props/items/item_hammer.png", "锤子", "prop")
add_label("props/items/item_extinguish.png", "灭火器", "prop")
add_label("props/items/item_up.png", "1UP", "prop")
add_label("props/items/item_fireball.png", "火球", "prop")
add_label("pixel/ui/ui_icon_level.png", "关卡", "prop")
add_label("pixel/ui/ui_icon_score.png", "分数", "prop")
add_label("pixel/ui/ui_icon_coin.png", "金币", "prop")
add_label("pixel/ui/ui_icon_life.png", "生命", "prop")
add_label("pixel/ui/ui_icon_pause.png", "暂停", "prop")
add_label("pixel/ui/ui_icon_skill.png", "技能", "prop")
add_label("pixel/ui/ui_icon_fire.png", "火", "prop")
add_label("pixel/ui/ui_icon_rescue.png", "救援", "prop")

# Build JS array of {w,h,label} with unicode escapes for labels
def js_str(s: str) -> str:
    return '"' + "".join(f"\\u{ord(c):04x}" for c in s) + '"'


labels_js_items = []
for a in ASSET_LABELS:
    labels_js_items.append(
        f"{{w:{a['w']},h:{a['h']},section:{js_str(a['section'])},label:{js_str(a['label'])}}}"
    )
labels_js = "[" + ",".join(labels_js_items) + "]"

SCRIPT = f"""
const page = (() => {{
  for (const p of pixso.root.children) {{
    if ((p.name || "") === "Godot-UI-Replica") return p;
  }}
  return pixso.currentPage;
}})();
await pixso.setCurrentPageAsync(page);

const font = {{ family: "Microsoft YaHei", style: "Regular" }};
try {{ await pixso.loadFontAsync(font); }} catch (e) {{}}
try {{ await pixso.loadFontAsync({{ family: "Microsoft YaHei", style: "Bold" }}); }} catch (e) {{}}

const ASSET_LABELS = {labels_js};

function collect(n, acc) {{
  if (!n) return;
  acc.push(n);
  if (n.children) for (const c of n.children) collect(c, acc);
}}
function absInFrame(n, frame) {{
  let x = 0, y = 0, cur = n;
  while (cur && cur !== frame) {{
    x += cur.x || 0;
    y += cur.y || 0;
    cur = cur.parent;
  }}
  return {{ x, y }};
}}
function isImage(n) {{
  const fills = n.fills || [];
  return fills.some(f => f && f.type === "IMAGE");
}}
function findText(frame, name) {{
  const acc = []; collect(frame, acc);
  return acc.find(n => n.type === "TEXT" && n.name === name) || null;
}}
function centerX(frame, t, y, size) {{
  if (!t) return null;
  try {{ t.fontName = font; }} catch (e) {{}}
  if (size) try {{ t.fontSize = size; }} catch (e) {{}}
  const tw = t.width || 0;
  t.x = ((frame.width || 450) - tw) / 2;
  t.y = y;
  return {{ name: t.name, x: t.x, y: t.y }};
}}
function setCentered(t, ax, ay, boxW, boxH, size) {{
  if (!t) return null;
  try {{ t.fontName = font; }} catch (e) {{}}
  if (size) try {{ t.fontSize = size; }} catch (e) {{}}
  const tw = t.width || 0;
  const th = t.height || (size ? size * 1.2 : 16);
  t.x = ax + (boxW - tw) / 2;
  t.y = ay + (boxH - th) / 2;
  return {{ name: t.name, x: t.x, y: t.y }};
}}
function btnCandidates(frame) {{
  const acc = []; collect(frame, acc);
  const out = [];
  for (const n of acc) {{
    if (n === frame || n.visible === false || n.type === "TEXT" || isImage(n)) continue;
    const w = n.width || 0, h = n.height || 0;
    if (w >= 160 && w <= 360 && h >= 34 && h <= 72) {{
      const a = absInFrame(n, frame);
      out.push({{ n, name: n.name || n.type, w, h, ax: a.x, ay: a.y }});
    }}
  }}
  out.sort((a, b) => a.ay - b.ay || a.ax - b.ax);
  return out;
}}

const report = {{}};

// ===== G01 =====
{{
  const f = page.children.find(n => n.name === "G01-Menu");
  if (f) {{
    const m = [];
    m.push(centerX(f, findText(f, "cjk-title"), 200, 28));
    m.push(centerX(f, findText(f, "cjk-sub"), 248, 13));
    m.push(centerX(f, findText(f, "cjk-sub2"), 270, 13));
    m.push(centerX(f, findText(f, "cjk-stats"), 304, 15));
    const btns = btnCandidates(f).filter(b => b.ay >= 300 && b.ay <= 520);
    let charBtn = btns.find(b => /char/i.test(b.name)) || (btns.length >= 2 ? btns[0] : null);
    let startBtn = btns.find(b => /main|start/i.test(b.name)) || (btns.length ? btns[btns.length - 1] : null);
    if (charBtn && startBtn && charBtn.ay > startBtn.ay) {{ const t = charBtn; charBtn = startBtn; startBtn = t; }}
    if (charBtn) m.push(setCentered(findText(f, "cjk-char"), charBtn.ax, charBtn.ay, charBtn.w, charBtn.h, 13));
    else m.push(centerX(f, findText(f, "cjk-char"), 350, 13));
    if (startBtn) m.push(setCentered(findText(f, "cjk-start"), startBtn.ax, startBtn.ay, startBtn.w, startBtn.h, 16));
    else m.push(centerX(f, findText(f, "cjk-start"), 412, 16));
    // thumbs
    const acc = []; collect(f, acc);
    const thumbs = [];
    for (const n of acc) {{
      if (!isImage(n)) continue;
      const a = absInFrame(n, f);
      const w = n.width || 0, h = n.height || 0;
      if (w >= 30 && w <= 55 && h >= 40 && h <= 65 && a.y >= 430 && a.y <= 580) thumbs.push({{ a, w, h }});
    }}
    thumbs.sort((p, q) => p.a.x - q.a.x);
    const ns = ["cjk-n0","cjk-n1","cjk-n2","cjk-n3","cjk-n4"];
    for (let i = 0; i < ns.length; i++) {{
      const t = findText(f, ns[i]);
      if (!t) continue;
      try {{ t.fontName = font; t.fontSize = 11; }} catch (e) {{}}
      if (thumbs[i]) {{
        t.x = thumbs[i].a.x + (thumbs[i].w - (t.width || 40)) / 2;
        t.y = thumbs[i].a.y + thumbs[i].h + 4;
      }}
      m.push({{ name: ns[i], x: t.x, y: t.y }});
    }}
    const test = findText(f, "cjk-test");
    if (test) {{
      try {{ test.fontName = font; test.fontSize = 12; }} catch (e) {{}}
      test.x = 450 - (test.width || 90) - 12;
      test.y = 48;
      m.push({{ name: "cjk-test", x: test.x, y: test.y }});
    }}
    report["G01"] = {{ btns: btns.map(b => ({{ name: b.name, ax: b.ax, ay: b.ay, w: b.w, h: b.h }})), thumbs: thumbs.length, m }};
  }}
}}

// ===== G02 =====
{{
  const f = page.children.find(n => n.name === "G02-InGame");
  if (f) {{
    const m = [];
    const acc = []; collect(f, acc);
    const boxes = [];
    for (const n of acc) {{
      if (n === f || n.visible === false || isImage(n) || n.type === "TEXT") continue;
      const a = absInFrame(n, f);
      const w = n.width || 0, h = n.height || 0;
      if (a.y <= 24 && h >= 20 && h <= 42 && w >= 70 && w <= 140) boxes.push({{ a, w, h, name: n.name }});
    }}
    boxes.sort((p, q) => p.a.x - q.a.x);
    const hs = ["cjk-h0","cjk-h1","cjk-h2","cjk-h3"];
    for (let i = 0; i < 4; i++) {{
      const t = findText(f, hs[i]);
      if (!t) continue;
      try {{ t.fontName = font; t.fontSize = 15; }} catch (e) {{}}
      if (boxes[i]) {{
        t.x = boxes[i].a.x + 22;
        t.y = boxes[i].a.y + (boxes[i].h - (t.height || 16)) / 2;
      }}
      m.push({{ name: hs[i], x: t.x, y: t.y }});
    }}
    m.push(centerX(f, findText(f, "cjk-goal"), 48, 15));
    const skillBtns = btnCandidates(f).filter(b => b.ay >= 500 && b.ax >= 200);
    const skillBtn = skillBtns.find(b => /skill/i.test(b.name)) || skillBtns[0];
    if (skillBtn) m.push(setCentered(findText(f, "cjk-skill"), skillBtn.ax, skillBtn.ay, skillBtn.w, skillBtn.h, 15));
    m.push(centerX(f, findText(f, "cjk-hint"), 752, 12));
    report["G02"] = {{ boxes: boxes.length, skill: skillBtn ? {{ ax: skillBtn.ax, ay: skillBtn.ay, w: skillBtn.w, h: skillBtn.h }} : null, m }};
  }}
}}

// ===== G03 =====
{{
  const f = page.children.find(n => n.name === "G03-LevelClear-Shop");
  if (f) {{
    const m = [];
    m.push(centerX(f, findText(f, "cjk-title"), 70, 26));
    m.push(centerX(f, findText(f, "cjk-stats"), 115, 15));
    m.push(centerX(f, findText(f, "cjk-stats2"), 138, 15));
    const btns = btnCandidates(f);
    const ad = btns.find(b => /ad|double/i.test(b.name)) || btns.find(b => b.ay < 240) || btns[0];
    const next = [...btns].reverse().find(b => /main|next/i.test(b.name)) || btns[btns.length - 1];
    if (ad) m.push(setCentered(findText(f, "cjk-double"), ad.ax, ad.ay, ad.w, ad.h, 16));
    if (next) m.push(setCentered(findText(f, "cjk-next"), next.ax, next.ay, next.w, next.h, 16));
    const acc = []; collect(f, acc);
    let shop = null;
    for (const n of acc) {{
      if (/shop/i.test(n.name || "") && (n.width || 0) >= 300) {{
        const a = absInFrame(n, f);
        shop = {{ a, w: n.width, h: n.height, name: n.name }};
        break;
      }}
    }}
    if (shop) {{
      const st = findText(f, "cjk-shop");
      if (st) {{
        try {{ st.fontName = font; st.fontSize = 18; }} catch (e) {{}}
        st.x = shop.a.x + (shop.w - (st.width || 0)) / 2;
        st.y = shop.a.y + 10;
        m.push({{ name: "cjk-shop", x: st.x, y: st.y }});
      }}
      const bal = findText(f, "cjk-bal");
      if (bal) {{
        try {{ bal.fontName = font; bal.fontSize = 14; }} catch (e) {{}}
        bal.x = shop.a.x + (shop.w - (bal.width || 0)) / 2;
        bal.y = shop.a.y + 40;
        m.push({{ name: "cjk-bal", x: bal.x, y: bal.y }});
      }}
      const rows = ["cjk-r0","cjk-r1","cjk-r2","cjk-r3","cjk-r4"];
      for (let i = 0; i < rows.length; i++) {{
        const rt = findText(f, rows[i]);
        if (!rt) continue;
        try {{ rt.fontName = font; rt.fontSize = 12; }} catch (e) {{}}
        rt.x = shop.a.x + 48;
        rt.y = shop.a.y + 72 + i * 46;
        m.push({{ name: rows[i], x: rt.x, y: rt.y }});
      }}
    }}
    report["G03"] = {{ btns: btns.map(b => ({{ name: b.name, ax: b.ax, ay: b.ay, w: b.w, h: b.h }})), shop, m }};
  }}
}}

// ===== G04 =====
{{
  const f = page.children.find(n => n.name === "G04-GameOver");
  if (f) {{
    const m = [];
    m.push(centerX(f, findText(f, "cjk-title"), 250, 26));
    m.push(centerX(f, findText(f, "cjk-s1"), 310, 15));
    m.push(centerX(f, findText(f, "cjk-s2"), 335, 15));
    m.push(centerX(f, findText(f, "cjk-s3"), 360, 15));
    m.push(centerX(f, findText(f, "cjk-s4"), 385, 15));
    const btns = btnCandidates(f).filter(b => b.ay >= 400);
    const labels = ["cjk-revive","cjk-retry","cjk-menu"];
    for (let i = 0; i < labels.length; i++) {{
      const t = findText(f, labels[i]);
      if (!t) continue;
      if (btns[i]) m.push(setCentered(t, btns[i].ax, btns[i].ay, btns[i].w, btns[i].h, 16));
      else m.push(centerX(f, t, 440 + i * 60, 16));
    }}
    report["G04"] = {{ btns: btns.map(b => ({{ name: b.name, ax: b.ax, ay: b.ay, w: b.w, h: b.h }})), m }};
  }}
}}

// ===== G05 =====
{{
  const f = page.children.find(n => n.name === "G05-Pause");
  if (f) {{
    const m = [];
    m.push(centerX(f, findText(f, "cjk-title"), 320, 26));
    const btns = btnCandidates(f).filter(b => b.ay >= 350);
    const labels = ["cjk-resume","cjk-menu"];
    for (let i = 0; i < labels.length; i++) {{
      const t = findText(f, labels[i]);
      if (!t) continue;
      if (btns[i]) m.push(setCentered(t, btns[i].ax, btns[i].ay, btns[i].w, btns[i].h, 16));
      else m.push(centerX(f, t, 400 + i * 60, 16));
    }}
    report["G05"] = {{ btns: btns.map(b => ({{ name: b.name, ax: b.ax, ay: b.ay, w: b.w, h: b.h }})), m }};
  }}
}}

// ===== G06 restore asset labels =====
{{
  const f = page.children.find(n => n.name === "G06-AssetBoard");
  if (f) {{
    // remove old asset labels only
    const acc = []; collect(f, acc);
    for (const n of acc) {{
      if (n.type === "TEXT" && (n.name || "").startsWith("asset-label-")) {{
        try {{ n.remove(); }} catch (e) {{}}
      }}
    }}
    // keep section headers; reposition them
    const imgs = [];
    for (const n of acc) {{
      if (!isImage(n) || n.visible === false) continue;
      const a = absInFrame(n, f);
      imgs.push({{ n, a, w: n.width || 0, h: n.height || 0 }});
    }}
    // match each image to a label by size (unique consumption)
    const used = new Set();
    const placed = [];
    function matchLabel(img) {{
      let best = -1, bestScore = 1e9;
      for (let i = 0; i < ASSET_LABELS.length; i++) {{
        if (used.has(i)) continue;
        const L = ASSET_LABELS[i];
        const dw = Math.abs(L.w - img.w);
        const dh = Math.abs(L.h - img.h);
        // allow small scale drift from import
        const score = dw + dh;
        if (dw <= 3 && dh <= 3 && score < bestScore) {{
          bestScore = score;
          best = i;
        }}
      }}
      // looser match for scaled imports (up to 20%)
      if (best < 0) {{
        for (let i = 0; i < ASSET_LABELS.length; i++) {{
          if (used.has(i)) continue;
          const L = ASSET_LABELS[i];
          const rw = L.w ? img.w / L.w : 99;
          const rh = L.h ? img.h / L.h : 99;
          if (Math.abs(rw - rh) > 0.15) continue;
          if (rw < 0.5 || rw > 2.2) continue;
          const score = Math.abs(rw - 1) + Math.abs(rh - 1);
          if (score < bestScore) {{ bestScore = score; best = i; }}
        }}
      }}
      if (best >= 0) {{ used.add(best); return ASSET_LABELS[best]; }}
      return null;
    }}
    let labelCount = 0;
    for (const img of imgs) {{
      // skip full-frame phone chrome if any
      if (img.w >= 1400) continue;
      const L = matchLabel(img);
      if (!L) continue;
      const t = pixso.createText();
      try {{ t.fontName = font; }} catch (e) {{}}
      t.name = "asset-label-" + labelCount;
      t.fontSize = 12;
      t.characters = L.label;
      t.fills = [{{ type: "SOLID", color: {{ r: 1, g: 1, b: 1 }} }}];
      // center under image
      const tw = t.width || 48;
      t.x = img.a.x + (img.w - tw) / 2;
      t.y = img.a.y + img.h + 4;
      f.appendChild(t);
      // re-center after append (width may update)
      try {{
        const tw2 = t.width || tw;
        t.x = img.a.x + (img.w - tw2) / 2;
      }} catch (e) {{}}
      labelCount++;
      placed.push({{ label: L.label, x: t.x, y: t.y, iw: img.w, ih: img.h, ix: img.a.x, iy: img.a.y }});
    }}
    // section headers
    const bg = imgs.find(i => i.w >= 400 && i.h >= 700);
    const s1 = findText(f, "cjk-s1");
    if (s1) {{ try {{ s1.fontName = font; s1.fontSize = 22; }} catch(e) {{}} s1.x = 24; s1.y = bg ? Math.max(90, bg.a.y - 34) : 94; }}
    const roles = imgs.filter(i => i.w >= 30 && i.w <= 55 && i.h >= 40 && i.h <= 70).sort((p,q)=>p.a.y-q.a.y);
    const s2 = findText(f, "cjk-s2");
    if (s2) {{ try {{ s2.fontName = font; s2.fontSize = 22; }} catch(e) {{}} s2.x = 24; s2.y = roles.length ? Math.max(200, roles[0].a.y - 34) : 980; }}
    const props = imgs.filter(i => i.w >= 24 && i.w <= 70 && i.h >= 24 && i.h <= 70 && i.a.y > (roles[0] ? roles[0].a.y + 60 : 500)).sort((p,q)=>p.a.y-q.a.y);
    const s3 = findText(f, "cjk-s3");
    if (s3) {{ try {{ s3.fontName = font; s3.fontSize = 22; }} catch(e) {{}} s3.x = 24; s3.y = props.length ? Math.max(300, props[0].a.y - 34) : 1120; }}
    const h1 = findText(f, "cjk-h1"); if (h1) {{ try {{ h1.fontName = font; h1.fontSize = 28; }} catch(e) {{}} h1.x = 24; h1.y = 24; }}
    const h2 = findText(f, "cjk-h2"); if (h2) {{ try {{ h2.fontName = font; h2.fontSize = 14; }} catch(e) {{}} h2.x = 24; h2.y = 60; }}
    report["G06"] = {{ images: imgs.length, labelsPlaced: labelCount, placedSample: placed.slice(0, 12) }};
  }}
}}

const final = {{}};
for (const f of page.children) {{
  if (f.type !== "FRAME" || !(f.name || "").startsWith("G0")) continue;
  const acc = []; collect(f, acc);
  final[f.name] = {{
    id: f.id,
    w: f.width,
    texts: acc.filter(n => n.type === "TEXT" && n.visible !== false).map(n => ({{
      name: n.name || "",
      x: Math.round((n.x || 0) * 10) / 10,
      y: Math.round((n.y || 0) * 10) / 10,
      chars: String(n.characters || "").slice(0, 28)
    }}))
  }};
}}
return {{ report, final }};
"""


def main():
    headers = session()
    log("session ok")
    log(f"asset label defs={len(ASSET_LABELS)}")
    res = tool(headers, "eval_script", {"script": SCRIPT}, timeout=240)
    (OUT / "layout-and-labels-result.json").write_text(res, encoding="utf-8")
    obj = json.loads(res)
    g06 = (obj.get("report") or {}).get("G06") or {}
    log(f"G06 labelsPlaced={g06.get('labelsPlaced')} images={g06.get('images')}")
    for name, info in (obj.get("final") or {}).items():
        texts = info.get("texts") or []
        log(f"{name}: texts={len(texts)}")
        for t in texts[:8]:
            log(f"  {t.get('name')} ({t.get('x')},{t.get('y')}) {t.get('chars')}")
        if len(texts) > 8:
            log(f"  ... +{len(texts)-8} more")

    prev = OUT / "previews-v2"
    prev.mkdir(parents=True, exist_ok=True)
    for name, info in (obj.get("final") or {}).items():
        exp = tool(
            headers,
            "get_export_image",
            {
                "guid": info["id"],
                "exportSettings": {
                    "constraint": {
                        "type": 2,
                        "value": min(900, max(300, int(info.get("w") or 450))),
                    },
                    "imageType": 1,
                },
            },
            timeout=90,
        )
        m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", exp)
        if not m:
            log("export fail " + name)
            continue
        outp = prev / f"{name}.png"
        urllib.request.urlretrieve(m.group(0), outp)
        log(f"export {outp.name} {outp.stat().st_size}")
    log("DONE")


if __name__ == "__main__":
    main()
