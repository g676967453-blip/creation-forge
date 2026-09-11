# -*- coding: utf-8 -*-
"""Restore G06 asset board (native-size art sheets + labels) onto Godot-UI-Replica."""
from __future__ import annotations

import json
import random
import re
import sys
import urllib.request
from pathlib import Path

PIXSO = "http://127.0.0.1:3667/mcp"
ROOT = Path(r"J:\ceshi\projects\IAA")
HTML = ROOT / "ui-prototypes" / "godot-replica" / "screens-v2" / "G06-AssetBoard.html"
OUT = ROOT / "ui-prototypes" / "godot-replica"
PREV = OUT / "previews-truth"
PREV.mkdir(parents=True, exist_ok=True)
ASSETS = ROOT / "fire-hero-godot" / "assets"


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def mcp(h, payload, timeout=360):
    req = urllib.request.Request(
        PIXSO, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), headers=h
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        sid = r.headers.get("mcp-session-id")
        if sid:
            h["mcp-session-id"] = sid
        raw = r.read().decode("utf-8", errors="replace")
    parts = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
    body = "\n".join(parts) if parts else raw
    return json.loads(body) if body.strip() else None


def call(h, name, args, timeout=360):
    o = mcp(
        h,
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


def png_wh(rel: str):
    b = (ASSETS / rel).read_bytes()
    return int.from_bytes(b[16:20], "big"), int.from_bytes(b[20:24], "big")


def js_str(s: str) -> str:
    return '"' + "".join(f"\\u{ord(c):04x}" for c in s) + '"'


# label defs for restore
LABELS = []


def add(rel, label, section):
    p = ASSETS / rel
    if p.exists():
        w, h = png_wh(rel)
        LABELS.append({"w": w, "h": h, "label": label, "section": section})


add("backgrounds/bg_level_default.png", "背景 450x800", "scene")
add("props/windows/window_normal.png", "普通窗", "scene")
add("props/windows/window_fire_lv1.png", "火1", "scene")
add("props/windows/window_fire_lv2.png", "火2", "scene")
add("props/windows/window_fire_lv3.png", "火3", "scene")
add("props/windows/window_rescue.png", "救援窗", "scene")
add("props/windows/window_rescue_red.png", "红窗", "scene")
add("props/trampoline/mat.png", "蹦床垫", "scene")
add("props/trampoline/fireman_left.png", "消防员左", "scene")
add("props/trampoline/fireman_right.png", "消防员右", "scene")
add("pixel/villagers/vil_rabbit_front_call.png", "村民呼救", "scene")
add("pixel/villagers/vil_rabbit_front.png", "村民", "scene")
add("pixel/villagers/vil_fox_front_call.png", "狐狸村民", "scene")
add("pixel/villagers/vil_pig_front_call.png", "猪村民", "scene")
add("props/ball/char_cat.png", "小猫 cat", "role")
add("props/ball/char_dog.png", "小狗 dog", "role")
add("props/ball/char_panda.png", "熊猫 panda", "role")
add("props/ball/char_capybara.png", "卡皮巴拉", "role")
add("props/ball/char_naruto.png", "狐狸 fox", "role")
add("props/items/item_bag.png", "钱袋", "prop")
add("props/items/item_wide.png", "长条", "prop")
add("props/items/item_hammer.png", "锤子", "prop")
add("props/items/item_extinguish.png", "灭火器", "prop")
add("props/items/item_up.png", "1UP", "prop")
add("props/items/item_fireball.png", "火球", "prop")
add("pixel/ui/ui_icon_level.png", "关卡", "prop")
add("pixel/ui/ui_icon_score.png", "分数", "prop")
add("pixel/ui/ui_icon_coin.png", "金币", "prop")
add("pixel/ui/ui_icon_life.png", "生命", "prop")
add("pixel/ui/ui_icon_pause.png", "暂停", "prop")
add("pixel/ui/ui_icon_skill.png", "技能", "prop")
add("pixel/ui/ui_icon_fire.png", "火", "prop")
add("pixel/ui/ui_icon_rescue.png", "救援", "prop")

labels_js = (
    "["
    + ",".join(
        f"{{w:{a['w']},h:{a['h']},section:{js_str(a['section'])},label:{js_str(a['label'])}}}"
        for a in LABELS
    )
    + "]"
)


def main():
    if not HTML.exists():
        raise SystemExit(f"missing {HTML}")
    html = HTML.read_text(encoding="utf-8")
    # parse size from meta or html
    meta = OUT / "screens-v2-meta.json"
    w, h = 1400, 1267
    if meta.exists():
        for s in json.loads(meta.read_text(encoding="utf-8")).get("screens", []):
            if s.get("name") == "G06-AssetBoard":
                w, h = int(s["w"]), int(s["h"])
    log(f"html bytes={len(html)} board={w}x{h} labels={len(LABELS)}")

    h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
    mcp(
        h,
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "restore-assets", "version": "1"},
            },
        },
    )
    try:
        mcp(h, {"jsonrpc": "2.0", "method": "notifications/initialized"})
    except Exception:
        pass

    # ensure page + remove old G06 only
    prep = call(
        h,
        "eval_script",
        {
            "script": """
let page=null;
for (const p of pixso.root.children) if ((p.name||'')==='Godot-UI-Replica') page=p;
if (!page) page=pixso.createPage('Godot-UI-Replica');
await pixso.setCurrentPageAsync(page);
page.name='Godot-UI-Replica';
for (const c of [...page.children]) {
  const n=c.name||'';
  if (n==='G06-AssetBoard' || n==='T06-AssetBoard' || n.startsWith('label-G06') || n.startsWith('label-T06')) {
    try { c.remove(); } catch (e) {}
  }
}
// layout existing T frames 3-col
const order=['T01-Menu','T02-InGame','T03-LevelClear','T04-GameOver','T05-Pause'];
const map={}; for (const c of page.children) if (c.type==='FRAME') map[c.name]=c;
let i=0;
for (const name of order) {
  const f=map[name]; if(!f) continue;
  f.x=(i%3)*(450+80); f.y=Math.floor(i/3)*(800+100);
  try{f.resize(450,800)}catch(e){}
  i++;
}
return {frames: page.children.filter(c=>c.type==='FRAME').map(c=>c.name)};
"""
        },
    )
    log("prep " + str(prep)[:300])

    log("code_to_design G06...")
    c2d = call(h, "code_to_design", {"htmlStr": html, "width": w, "height": h}, timeout=420)
    log("c2d " + str(c2d)[:200])

    place = call(
        h,
        "eval_script",
        {
            "script": f"""
const page=pixso.currentPage;
function findBoards(node, acc) {{
  if (!node) return;
  const name=(node.name||'').toLowerCase();
  if (node.type==='FRAME' && (name.indexOf('board')>=0 || name.indexOf('phone')>=0 || name==='html' || name==='body')) acc.push(node);
  if (node.children) for (const c of node.children) findBoards(c, acc);
}}
const boards=[]; for (const c of page.children) findBoards(c, boards);
const named=/^(T0[1-5]-|G06-)/;
let board=null;
for (let i=boards.length-1;i>=0;i--) {{
  if (!named.test(boards[i].name||'')) {{ board=boards[i]; break; }}
}}
if (!board) {{
  const tops=page.children.filter(n=>n.type==='FRAME' && !named.test(n.name||'') && !(n.name||'').startsWith('label-'));
  board=tops[tops.length-1];
}}
if (!board) return {{error:'no board', tops: page.children.map(n=>n.name)}};
if (board.parent && board.parent.id!==page.id) page.appendChild(board);
board.name='G06-AssetBoard';
board.x=0;
board.y=2*(800+100);
try {{ board.resize({w}, {h}); }} catch (e) {{}}
// cleanup wrappers without T/G frames
for (const c of [...page.children]) {{
  if ((c.name||'').startsWith('label-')) continue;
  if (/^(T0[1-5]-|G06-)/.test(c.name||'')) continue;
  let has=false;
  function scan(n){{ if(!n)return; if(/^(T0[1-5]-|G06-)/.test(n.name||'')) has=true; if(n.children) for(const x of n.children) scan(x); }}
  scan(c);
  if (!has) try{{c.remove()}}catch(e){{}}
}}
return {{id: board.id, name: board.name, x: board.x, y: board.y, w: board.width, h: board.height, images: (function(){{
  let n=0; function w(node){{ if(!node)return; const fills=node.fills||[]; for(const f of fills) if(f&&f.type==='IMAGE') n++; if(node.children) for(const c of node.children) w(c); }}
  w(board); return n;
}})()}};
"""
        },
    )
    log("place " + str(place)[:400])
    if not isinstance(place, dict) or "id" not in place:
        raise SystemExit("place failed: " + str(place))

    # restore labels + section headers
    fix_script = f"""
const page=pixso.currentPage;
const font={{family:'Microsoft YaHei',style:'Regular'}};
try{{await pixso.loadFontAsync(font)}}catch(e){{}}
const ASSET_LABELS={labels_js};
const board=page.children.find(n=>n.name==='G06-AssetBoard');
if(!board) return {{error:'no board'}};

function collect(n,acc){{ if(!n)return; acc.push(n); if(n.children) for(const c of n.children) collect(c,acc); }}
function absInFrame(n,frame){{ let x=0,y=0,cur=n; while(cur&&cur!==frame){{ x+=cur.x||0; y+=cur.y||0; cur=cur.parent; }} return {{x,y}}; }}
function isImage(n){{ return (n.fills||[]).some(f=>f&&f.type==='IMAGE'); }}

// remove old labels/headers we manage
const all=[]; collect(board, all);
for (const n of all) {{
  const nm=n.name||'';
  if (n.type==='TEXT' && (nm.startsWith('asset-label-') || nm.startsWith('cjk-'))) {{
    try{{n.remove()}}catch(e){{}}
  }}
}}

// images
const imgs=[];
for (const n of all) {{
  if (!isImage(n) || n.visible===false) continue;
  const a=absInFrame(n, board);
  imgs.push({{n,a,w:n.width||0,h:n.height||0}});
}}

// section headers
function addText(name, characters, x, y, size, color) {{
  const t=pixso.createText();
  try{{t.fontName=font}}catch(e){{}}
  t.name=name; t.fontSize=size; t.characters=characters; t.x=x; t.y=y;
  t.fills=[{{type:'SOLID', color: color||{{r:1,g:1,b:1}}}}];
  board.appendChild(t);
  return t;
}}
const gold={{r:1,g:0.82,b:0.29}};
const sub={{r:0.7,g:0.78,b:0.88}};
addText('cjk-h1', {js_str("Godot PNG 资产板（原尺寸）")}, 24, 24, 28);
addText('cjk-h2', {js_str("按板块分区 · 场景 / 角色 / 道具 · 素材标注保留")}, 24, 60, 14, sub);

const bg=imgs.find(i=>i.w>=400 && i.h>=700);
const wins=imgs.filter(i=>Math.abs(i.w-48)<=4 && Math.abs(i.h-48)<=4);
const chars=imgs.filter(i=>i.w>=28&&i.w<=55&&i.h>=40&&i.h<=70&&i.h>=i.w*1.05);
const icons=imgs.filter(i=>{{
  if (Math.abs(i.w-48)<=4 && Math.abs(i.h-48)<=4) return false;
  if (i.w>=28&&i.w<=55&&i.h>=40&&i.h<=70&&i.h>=i.w*1.05) return false;
  if (i.w>=400) return false;
  return i.w>=20&&i.h>=20&&i.w<=80&&i.h<=80;
}});
let rolePool=chars.slice();
if (bg) {{
  const below=chars.filter(i=>i.a.y>=bg.a.y+bg.h-30);
  if (below.length) rolePool=below;
}}
const roleTop=rolePool.length?Math.min(...rolePool.map(i=>i.a.y)):(bg?bg.a.y+bg.h+40:900);
const propPool=icons.filter(i=>i.a.y>=roleTop-20);
const propTop=(propPool.length?Math.min(...propPool.map(i=>i.a.y)):roleTop+120);

const y1=Math.max(90, (bg?bg.a.y:130)-36);
let y2=Math.max(y1+48, roleTop-36);
if (bg && y2<bg.a.y+100) y2=bg.a.y+bg.h+24;
let y3=Math.max(y2+48, propTop-36);

addText('cjk-s1', {js_str("一、场景")}, 24, y1, 22, gold);
addText('cjk-s2', {js_str("二、角色")}, 24, y2, 22, gold);
addText('cjk-s3', {js_str("三、道具 / HUD 图标")}, 24, y3, 22, gold);

// match labels
const used=new Set();
function matchLabel(img) {{
  let best=-1, bestScore=1e9;
  for (let i=0;i<ASSET_LABELS.length;i++) {{
    if (used.has(i)) continue;
    const L=ASSET_LABELS[i];
    const dw=Math.abs(L.w-img.w), dh=Math.abs(L.h-img.h);
    if (dw<=3 && dh<=3 && dw+dh<bestScore) {{ bestScore=dw+dh; best=i; }}
  }}
  if (best<0) {{
    for (let i=0;i<ASSET_LABELS.length;i++) {{
      if (used.has(i)) continue;
      const L=ASSET_LABELS[i];
      const rw=L.w?img.w/L.w:99, rh=L.h?img.h/L.h:99;
      if (Math.abs(rw-rh)>0.15) continue;
      if (rw<0.5||rw>2.2) continue;
      const score=Math.abs(rw-1)+Math.abs(rh-1);
      if (score<bestScore) {{bestScore=score; best=i;}}
    }}
  }}
  if (best>=0) {{ used.add(best); return ASSET_LABELS[best]; }}
  return null;
}}

let labelCount=0;
const placed=[];
for (const img of imgs) {{
  if (img.w>=1400) continue;
  const L=matchLabel(img);
  if (!L) continue;
  const t=pixso.createText();
  try{{t.fontName=font}}catch(e){{}}
  t.name='asset-label-'+labelCount;
  t.fontSize=12;
  t.characters=L.label;
  t.fills=[{{type:'SOLID',color:{{r:1,g:1,b:1}}}}];
  board.appendChild(t);
  const tw=t.width||48;
  t.x=img.a.x+(img.w-tw)/2;
  t.y=img.a.y+img.h+4;
  labelCount++;
  placed.push({{label:L.label, x:t.x, y:t.y, w:img.w, h:img.h}});
}}

// page label
for (const c of [...page.children]) if ((c.name||'')==='label-G06-AssetBoard') try{{c.remove()}}catch(e){{}}
const lt=pixso.createText();
try{{lt.fontName=font}}catch(e){{}}
lt.characters='G06-AssetBoard';
lt.fontSize=20;
lt.fills=[{{type:'SOLID',color:gold}}];
lt.name='label-G06-AssetBoard';
lt.x=board.x; lt.y=board.y-32;
page.appendChild(lt);

return {{
  boardId: board.id,
  images: imgs.length,
  labels: labelCount,
  y1,y2,y3,
  placedSample: placed.slice(0,10),
  frames: page.children.filter(n=>n.type==='FRAME').map(n=>({{name:n.name,id:n.id,w:n.width,h:n.height,x:n.x,y:n.y}}))
}};
"""
    fix = call(h, "eval_script", {"script": fix_script}, timeout=180)
    (OUT / "restore-asset-board.json").write_text(
        json.dumps(fix, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    log("fix " + json.dumps(fix, ensure_ascii=False)[:800])

    # export all frames including G06
    frames = fix.get("frames") if isinstance(fix, dict) else []
    for fr in frames:
        exp = call(
            h,
            "get_export_image",
            {
                "guid": fr["id"],
                "exportSettings": {
                    "constraint": {
                        "type": 2,
                        "value": min(900, max(300, int(fr.get("w") or 450))),
                    },
                    "imageType": 1,
                },
            },
            timeout=90,
        )
        blob = exp if isinstance(exp, str) else json.dumps(exp, ensure_ascii=False)
        m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", blob)
        if not m:
            log("export fail " + fr.get("name", "?"))
            continue
        outp = PREV / f"{fr['name']}.png"
        urllib.request.urlretrieve(m.group(0), outp)
        log(f"export {outp.name} {outp.stat().st_size}")
    log("ASSET BOARD RESTORED")


if __name__ == "__main__":
    main()
