# -*- coding: utf-8 -*-
import json
import random
import re
import sys
import urllib.request
from pathlib import Path

PIXSO = "http://127.0.0.1:3667/mcp"
SCREENS = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica\screens-truth")
PREV = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica\previews-truth")
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")
PREV.mkdir(parents=True, exist_ok=True)


def log(s):
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def mcp(headers, payload, timeout=360):
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


def call(headers, name, args, timeout=360):
    o = mcp(
        headers,
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
            "clientInfo": {"name": "rest", "version": "1"},
        },
    },
)
try:
    mcp(h, {"jsonrpc": "2.0", "method": "notifications/initialized"})
except Exception:
    pass

# switch page
call(
    h,
    "eval_script",
    {
        "script": """
let page=null;
for (const p of pixso.root.children) if ((p.name||'')==='Godot-UI-Replica') page=p;
await pixso.setCurrentPageAsync(page);
return page.children.filter(n=>n.type==='FRAME').map(n=>n.name);
"""
    },
)

names = call(
    h,
    "eval_script",
    {
        "script": """
const page=(()=>{for(const p of pixso.root.children) if((p.name||'')==='Godot-UI-Replica') return p; return pixso.currentPage})();
await pixso.setCurrentPageAsync(page);
return page.children.filter(n=>n.type==='FRAME').map(n=>n.name);
"""
    },
)
log("existing " + str(names))
if "T05-Pause" not in (names or []):
    html = (SCREENS / "T05-Pause.html").read_text(encoding="utf-8")
    log("import T05")
    log(str(call(h, "code_to_design", {"htmlStr": html, "width": 450, "height": 800}, timeout=360))[:120])
    log(
        str(
            call(
                h,
                "eval_script",
                {
                    "script": """
const page=pixso.currentPage;
function findPhones(node,acc){ if(!node)return; const name=(node.name||'').toLowerCase(); if(node.type==='FRAME'&&name.indexOf('phone')>=0) acc.push(node); if(node.children) for(const c of node.children) findPhones(c,acc); }
const phones=[]; for(const c of page.children) findPhones(c,phones);
const named=/^T0[1-5]-/;
let phone=null; for(let i=phones.length-1;i>=0;i--) if(!named.test(phones[i].name||'')){phone=phones[i];break}
if(!phone){ const tops=page.children.filter(n=>n.type==='FRAME'&&!named.test(n.name||'')); phone=tops[tops.length-1]; }
if(phone.parent&&phone.parent.id!==page.id) page.appendChild(phone);
phone.name='T05-Pause'; phone.x=80+450*2; phone.y=100+800; // will fix layout next
try{phone.resize(450,800)}catch(e){}
for(const c of [...page.children]){ if(named.test(c.name||'')||(c.name||'').startsWith('label-')) continue; let has=false; function scan(n){if(!n)return; if(named.test(n.name||'')) has=true; if(n.children) for(const x of n.children) scan(x)} scan(c); if(!has) try{c.remove()}catch(e){} }
return {id:phone.id,name:phone.name};
"""
                },
            )
        )[:200]
    )

# layout 3-col and font
frames = call(
    h,
    "eval_script",
    {
        "script": """
const page=(()=>{for(const p of pixso.root.children) if((p.name||'')==='Godot-UI-Replica') return p; return pixso.currentPage})();
await pixso.setCurrentPageAsync(page);
page.name='Godot-UI-Replica';
const order=['T01-Menu','T02-InGame','T03-LevelClear','T04-GameOver','T05-Pause'];
const gapx=80,gapy=100;
const map={};
for (const c of page.children) if (c.type==='FRAME') map[c.name]=c;
let i=0;
for (const name of order) {
  const f=map[name];
  if (!f) continue;
  f.x=(i%3)*(450+gapx);
  f.y=Math.floor(i/3)*(800+gapy);
  try{f.resize(450,800)}catch(e){}
  i++;
}
const font={family:'Microsoft YaHei',style:'Regular'};
try{await pixso.loadFontAsync(font)}catch(e){}
function walk(n){ if(!n)return; if(n.type==='TEXT'){ try{n.fontName=font}catch(e){} } if(n.children) for(const c of n.children) walk(c); }
for (const c of page.children) walk(c);
for (const c of [...page.children]) if ((c.name||'').startsWith('label-T')) try{c.remove()}catch(e){}
for (const name of order) {
  const f=map[name]; if(!f) continue;
  const t=pixso.createText(); try{t.fontName=font}catch(e){}
  t.characters=name; t.fontSize=20; t.fills=[{type:'SOLID',color:{r:1,g:0.82,b:0.29}}];
  t.name='label-'+name; t.x=f.x; t.y=f.y-32; page.appendChild(t);
}
// sample texts on T01
function texts(frame){
  const acc=[];
  function w(n){ if(!n)return; if(n.type==='TEXT') acc.push({name:n.name,chars:String(n.characters||'').slice(0,30),x:n.x,y:n.y}); if(n.children) for(const c of n.children) w(c); }
  w(frame); return acc.slice(0,20);
}
return {
  frames: order.map(name => map[name] ? {id:map[name].id,name,x:map[name].x,y:map[name].y,w:map[name].width,h:map[name].height,sample:texts(map[name])} : {missing:name})
};
"""
    },
)
(OUT / "truth-frames.json").write_text(json.dumps(frames, ensure_ascii=False, indent=2), encoding="utf-8")
log(json.dumps(frames, ensure_ascii=False)[:1500])

for fr in frames.get("frames") or frames:
    if not isinstance(fr, dict) or fr.get("missing") or "id" not in fr:
        continue
    exp = call(
        h,
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
log("REST DONE")
