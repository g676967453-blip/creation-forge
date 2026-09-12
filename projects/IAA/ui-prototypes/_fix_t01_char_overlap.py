# -*- coding: utf-8 -*-
import json
import random
import re
import sys
import urllib.request
from pathlib import Path

PIXSO = "http://127.0.0.1:3667/mcp"
PREV = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica\previews-truth")
h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}


def log(s):
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def post(p, timeout=120):
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


def call(name, args, timeout=120):
    o = post(
        {
            "jsonrpc": "2.0",
            "id": random.randint(1, 999999),
            "method": "tools/call",
            "params": {"name": name, "arguments": args},
        },
        timeout=timeout,
    )
    t = (((o or {}).get("result") or {}).get("content") or [{}])[0].get("text")
    try:
        return json.loads(t) if t else o
    except Exception:
        return t


post(
    {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "t01fix", "version": "1"},
        },
    }
)
try:
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})
except Exception:
    pass

# Runtime VBox with char btn: Stats ends ~364; char y=378 h=36; start y=428 h=36
script = r"""
const page = (() => {
  for (const p of pixso.root.children) if ((p.name || '') === 'Godot-UI-Replica') return p;
  return pixso.currentPage;
})();
await pixso.setCurrentPageAsync(page);
const font = { family: 'Microsoft YaHei', style: 'Regular' };
try { await pixso.loadFontAsync(font); } catch (e) {}
const frame = page.children.find(n => n.name === 'T01-Menu');
if (!frame) return { error: 'no T01' };

// remove old ui chrome text/buttons only (keep art-* and overlay)
for (const c of [...frame.children]) {
  const nm = c.name || '';
  if (nm.startsWith('art-') || nm === 'overlay') continue;
  try { c.remove(); } catch (e) {}
}

function addRect(x,y,w,h,color,name) {
  const r = pixso.createRectangle();
  r.name = name; r.x=x; r.y=y;
  try { r.resize(w,h); } catch(e) {}
  const op = (color[3]==null)?1:color[3];
  r.fills=[{type:'SOLID', color:{r:color[0],g:color[1],b:color[2]}, opacity:op}];
  try { r.cornerRadius = 10; } catch(e) {}
  frame.appendChild(r); return r;
}
function addText(x,y,w,h,text,fs,fc,name,center) {
  const t = pixso.createText();
  try { t.fontName = font; } catch(e) {}
  t.name=name; t.fontSize=fs; t.characters=String(text||'');
  const op=(fc[3]==null)?1:fc[3];
  t.fills=[{type:'SOLID', color:{r:fc[0],g:fc[1],b:fc[2]}, opacity:op}];
  frame.appendChild(t);
  const tw=t.width||0, th=t.height||fs;
  if (center) { t.x=x+(w-tw)/2; t.y=y+(h-th)/2; }
  else { t.x=x; t.y=y+Math.max(0,(h-th)/2); }
  return t;
}

// measured title/sub/stats + runtime char/start flow
addText(75,260,300,29, '\u6551\u706b\u82f1\u96c4', 28, [1,1,1,1], 'ui-label', true);
addText(75,303,300,31, '\u706d\u706b\u6216\u6551\u4eba \u00b7 \u53cc\u901a\u9053\u8fc7\u5173\nGodot 4.7 \u00b7 IAA \u9a8c\u8bc1\u7248', 13, [0.7,0.78,0.88,1], 'ui-label', true);
addText(75,348,300,16, '\u6700\u9ad8\u5206 0\u3000\u91d1\u5e01 0', 15, [1,0.88,0.45,1], 'ui-label', true);

// char after stats: y=348+16+14=378
addRect(75,378,300,36,[0.35,0.24,0.1,1],'ui-btn');
addText(75,378,300,36, '\u89d2\u8272\uff1a\u5c0f\u732b \u00b7 \u654f\u6377\uff08\u70b9\u51fb\u5207\u6362\uff09', 14, [1,1,1,1], 'ui-btn-text', true);
// start after char: y=378+36+14=428
addRect(75,428,300,36,[1,0.69,0.125,1],'ui-btn');
addText(75,428,300,36, '\u5f00\u59cb\u6e38\u620f', 16, [0.1,0.07,0.03,1], 'ui-btn-text', true);

const texts=[];
for (const c of frame.children) if (c.type==='TEXT') texts.push({chars:c.characters, x:c.x, y:c.y});
return { id: frame.id, texts };
"""
res = call("eval_script", {"script": script})
log(json.dumps(res, ensure_ascii=False)[:800])

if isinstance(res, dict) and res.get("id"):
    exp = call(
        "get_export_image",
        {
            "guid": res["id"],
            "exportSettings": {"constraint": {"type": 2, "value": 450}, "imageType": 1},
        },
    )
    blob = exp if isinstance(exp, str) else json.dumps(exp, ensure_ascii=False)
    m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", blob or "")
    if m:
        outp = PREV / "T01-Menu.png"
        urllib.request.urlretrieve(m.group(0), outp)
        log(f"export {outp} {outp.stat().st_size}")
log("T01 fixed")
