# -*- coding: utf-8 -*-
import json
import random
import re
import sys
import urllib.request
from pathlib import Path

PIXSO = "http://127.0.0.1:3667/mcp"
ASSETS = Path(r"J:\ceshi\projects\IAA\fire-hero-godot\assets")
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")
PREV = OUT / "previews-truth"
PREV.mkdir(parents=True, exist_ok=True)


def log(s):
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def png_wh(rel):
    b = (ASSETS / rel).read_bytes()
    return int.from_bytes(b[16:20], "big"), int.from_bytes(b[20:24], "big")


def js_str(s):
    return '"' + "".join(f"\\u{ord(c):04x}" for c in s) + '"'


LABELS = []


def add(rel, label):
    if (ASSETS / rel).exists():
        w, h = png_wh(rel)
        LABELS.append((w, h, label))


for rel, lab in [
    ("backgrounds/bg_level_default.png", "背景 450x800"),
    ("props/windows/window_normal.png", "普通窗"),
    ("props/windows/window_fire_lv1.png", "火1"),
    ("props/windows/window_fire_lv2.png", "火2"),
    ("props/windows/window_fire_lv3.png", "火3"),
    ("props/windows/window_rescue.png", "救援窗"),
    ("props/windows/window_rescue_red.png", "红窗"),
    ("props/trampoline/mat.png", "蹦床垫"),
    ("props/trampoline/fireman_left.png", "消防员左"),
    ("props/trampoline/fireman_right.png", "消防员右"),
    ("pixel/villagers/vil_rabbit_front_call.png", "村民呼救"),
    ("pixel/villagers/vil_rabbit_front.png", "村民"),
    ("pixel/villagers/vil_fox_front_call.png", "狐狸村民"),
    ("pixel/villagers/vil_pig_front_call.png", "猪村民"),
    ("props/ball/char_cat.png", "小猫 cat"),
    ("props/ball/char_dog.png", "小狗 dog"),
    ("props/ball/char_panda.png", "熊猫 panda"),
    ("props/ball/char_capybara.png", "卡皮巴拉"),
    ("props/ball/char_naruto.png", "狐狸 fox"),
    ("props/items/item_bag.png", "钱袋"),
    ("props/items/item_wide.png", "长条"),
    ("props/items/item_hammer.png", "锤子"),
    ("props/items/item_extinguish.png", "灭火器"),
    ("props/items/item_up.png", "1UP"),
    ("props/items/item_fireball.png", "火球"),
    ("pixel/ui/ui_icon_level.png", "关卡"),
    ("pixel/ui/ui_icon_score.png", "分数"),
    ("pixel/ui/ui_icon_coin.png", "金币"),
    ("pixel/ui/ui_icon_life.png", "生命"),
    ("pixel/ui/ui_icon_pause.png", "暂停"),
    ("pixel/ui/ui_icon_skill.png", "技能"),
    ("pixel/ui/ui_icon_fire.png", "火"),
    ("pixel/ui/ui_icon_rescue.png", "救援"),
]:
    add(rel, lab)

labels_js = "[" + ",".join(f"{{w:{w},h:{h},label:{js_str(lab)}}}" for w, h, lab in LABELS) + "]"

h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}


def post(p, timeout=180):
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


def call(name, args, timeout=180):
    o = post(
        {
            "jsonrpc": "2.0",
            "id": random.randint(1, 999999),
            "method": "tools/call",
            "params": {"name": name, "arguments": args},
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


post(
    {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "place-g06", "version": "1"},
        },
    }
)
try:
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})
except Exception:
    pass

script = f"""
const page = (() => {{
  for (const p of pixso.root.children) if ((p.name || '') === 'Godot-UI-Replica') return p;
  return pixso.currentPage;
}})();
await pixso.setCurrentPageAsync(page);
page.name = 'Godot-UI-Replica';

// find newest unassigned board/phone/html frame
function collectFrames(node, acc) {{
  if (!node) return;
  if (node.type === 'FRAME') acc.push(node);
  if (node.children) for (const c of node.children) collectFrames(c, acc);
}}
const all = [];
for (const c of page.children) collectFrames(c, all);
const keep = /^(T0[1-5]-|G06-AssetBoard)/;
let board = null;
// prefer top-level non-T frames created last
const tops = page.children.filter(n => n.type === 'FRAME');
for (let i = tops.length - 1; i >= 0; i--) {{
  const n = tops[i];
  if (!keep.test(n.name || '') && !(n.name || '').startsWith('label-')) {{ board = n; break; }}
}}
if (!board) {{
  // search nested
  for (let i = all.length - 1; i >= 0; i--) {{
    const n = all[i];
    if (!keep.test(n.name || '') && !(n.name || '').startsWith('label-')) {{ board = n; break; }}
  }}
}}
if (!board) return {{ error: 'no board', tops: tops.map(t => t.name) }};
if (board.parent && board.parent.id !== page.id) page.appendChild(board);
board.name = 'G06-AssetBoard';
board.x = 0;
board.y = 2 * (800 + 100);
try {{ board.resize(1400, 1267); }} catch (e) {{}}

// cleanup stray wrappers
for (const c of [...page.children]) {{
  const nm = c.name || '';
  if (nm.startsWith('label-')) continue;
  if (keep.test(nm)) continue;
  if (c.id === board.id) continue;
  let has = false;
  function scan(n) {{
    if (!n) return;
    if (keep.test(n.name || '') || n.id === board.id) has = true;
    if (n.children) for (const x of n.children) scan(x);
  }}
  scan(c);
  if (!has) try {{ c.remove(); }} catch (e) {{}}
}}

const font = {{ family: 'Microsoft YaHei', style: 'Regular' }};
try {{ await pixso.loadFontAsync(font); }} catch (e) {{}}
const ASSET_LABELS = {labels_js};
const gold = {{ r: 1, g: 0.82, b: 0.29 }};
const sub = {{ r: 0.7, g: 0.78, b: 0.88 }};

function collect(n, acc) {{ if (!n) return; acc.push(n); if (n.children) for (const c of n.children) collect(c, acc); }}
function absInFrame(n, frame) {{
  let x = 0, y = 0, cur = n;
  while (cur && cur !== frame) {{ x += cur.x || 0; y += cur.y || 0; cur = cur.parent; }}
  return {{ x, y }};
}}
function isImage(n) {{ return (n.fills || []).some(f => f && f.type === 'IMAGE'); }}

// clear old managed texts
const nodes = []; collect(board, nodes);
for (const n of nodes) {{
  const nm = n.name || '';
  if (n.type === 'TEXT' && (nm.startsWith('asset-label-') || nm.startsWith('cjk-'))) {{
    try {{ n.remove(); }} catch (e) {{}}
  }}
}}

function addText(name, characters, x, y, size, color) {{
  const t = pixso.createText();
  try {{ t.fontName = font; }} catch (e) {{}}
  t.name = name; t.fontSize = size; t.characters = characters; t.x = x; t.y = y;
  t.fills = [{{ type: 'SOLID', color: color || {{ r: 1, g: 1, b: 1 }} }}];
  board.appendChild(t);
  return t;
}}
addText('cjk-h1', {js_str("Godot PNG 资产板（原尺寸）")}, 24, 24, 28);
addText('cjk-h2', {js_str("按板块分区 · 场景 / 角色 / 道具 · 素材标注保留")}, 24, 60, 14, sub);

const imgs = [];
for (const n of nodes) {{
  if (!isImage(n) || n.visible === false) continue;
  const a = absInFrame(n, board);
  imgs.push({{ a, w: n.width || 0, h: n.height || 0 }});
}}
const bg = imgs.find(i => i.w >= 400 && i.h >= 700);
const chars = imgs.filter(i => i.w >= 28 && i.w <= 55 && i.h >= 40 && i.h <= 70 && i.h >= i.w * 1.05);
const icons = imgs.filter(i => {{
  if (Math.abs(i.w - 48) <= 4 && Math.abs(i.h - 48) <= 4) return false;
  if (i.w >= 28 && i.w <= 55 && i.h >= 40 && i.h <= 70 && i.h >= i.w * 1.05) return false;
  if (i.w >= 400) return false;
  return i.w >= 20 && i.h >= 20 && i.w <= 80 && i.h <= 80;
}});
let rolePool = chars.slice();
if (bg) {{
  const below = chars.filter(i => i.a.y >= bg.a.y + bg.h - 30);
  if (below.length) rolePool = below;
}}
const roleTop = rolePool.length ? Math.min(...rolePool.map(i => i.a.y)) : (bg ? bg.a.y + bg.h + 40 : 900);
const propPool = icons.filter(i => i.a.y >= roleTop - 20);
const propTop = propPool.length ? Math.min(...propPool.map(i => i.a.y)) : roleTop + 120;
const y1 = Math.max(90, (bg ? bg.a.y : 130) - 36);
let y2 = Math.max(y1 + 48, roleTop - 36);
if (bg && y2 < bg.a.y + 100) y2 = bg.a.y + bg.h + 24;
let y3 = Math.max(y2 + 48, propTop - 36);
addText('cjk-s1', {js_str("一、场景")}, 24, y1, 22, gold);
addText('cjk-s2', {js_str("二、角色")}, 24, y2, 22, gold);
addText('cjk-s3', {js_str("三、道具 / HUD 图标")}, 24, y3, 22, gold);

const used = new Set();
function matchLabel(img) {{
  let best = -1, bestScore = 1e9;
  for (let i = 0; i < ASSET_LABELS.length; i++) {{
    if (used.has(i)) continue;
    const L = ASSET_LABELS[i];
    const dw = Math.abs(L.w - img.w), dh = Math.abs(L.h - img.h);
    if (dw <= 3 && dh <= 3 && dw + dh < bestScore) {{ bestScore = dw + dh; best = i; }}
  }}
  if (best < 0) {{
    for (let i = 0; i < ASSET_LABELS.length; i++) {{
      if (used.has(i)) continue;
      const L = ASSET_LABELS[i];
      const rw = L.w ? img.w / L.w : 99, rh = L.h ? img.h / L.h : 99;
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
  if (img.w >= 1400) continue;
  const L = matchLabel(img);
  if (!L) continue;
  const t = pixso.createText();
  try {{ t.fontName = font; }} catch (e) {{}}
  t.name = 'asset-label-' + labelCount;
  t.fontSize = 12;
  t.characters = L.label;
  t.fills = [{{ type: 'SOLID', color: {{ r: 1, g: 1, b: 1 }} }}];
  board.appendChild(t);
  t.x = img.a.x + (img.w - (t.width || 48)) / 2;
  t.y = img.a.y + img.h + 4;
  labelCount++;
}}

for (const c of [...page.children]) if ((c.name || '') === 'label-G06-AssetBoard') try {{ c.remove(); }} catch (e) {{}}
const lt = pixso.createText();
try {{ lt.fontName = font; }} catch (e) {{}}
lt.characters = 'G06-AssetBoard';
lt.fontSize = 20;
lt.fills = [{{ type: 'SOLID', color: gold }}];
lt.name = 'label-G06-AssetBoard';
lt.x = board.x; lt.y = board.y - 32;
page.appendChild(lt);

function countImg(n) {{
  let c = 0;
  function w(x) {{
    if (!x) return;
    if ((x.fills || []).some(f => f && f.type === 'IMAGE')) c++;
    if (x.children) for (const ch of x.children) w(ch);
  }}
  w(n); return c;
}}
return {{
  id: board.id,
  name: board.name,
  x: board.x, y: board.y, w: board.width, h: board.height,
  images: countImg(board),
  labels: labelCount,
  y1, y2, y3,
  frames: page.children.filter(n => n.type === 'FRAME').map(n => ({{ id: n.id, name: n.name, x: n.x, y: n.y, w: n.width, h: n.height }}))
}};
"""

res = call("eval_script", {"script": script}, timeout=180) if False else None

# use post tool path
o = post(
    {
        "jsonrpc": "2.0",
        "id": 9,
        "method": "tools/call",
        "params": {"name": "eval_script", "arguments": {"script": script}},
    },
    timeout=180,
)
text = (((o or {}).get("result") or {}).get("content") or [{}])[0].get("text")
try:
    res = json.loads(text)
except Exception:
    res = text
(OUT / "g06-place-result.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
log(json.dumps(res, ensure_ascii=False)[:1200])

frames = res.get("frames") if isinstance(res, dict) else []
for fr in frames:
    exp = call(
        "get_export_image",
        {
            "guid": fr["id"],
            "exportSettings": {
                "constraint": {"type": 2, "value": min(900, max(300, int(fr.get("w") or 450)))},
                "imageType": 1,
            },
        },
        timeout=90,
    )
    blob = exp if isinstance(exp, str) else json.dumps(exp, ensure_ascii=False)
    m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", blob)
    if not m:
        log("export fail " + str(fr.get("name")))
        continue
    outp = PREV / f"{fr['name']}.png"
    urllib.request.urlretrieve(m.group(0), outp)
    log(f"export {outp.name} {outp.stat().st_size}")
log("DONE")
