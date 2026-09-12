# -*- coding: utf-8 -*-
import json
import random
import sys
import urllib.request

PIXSO = "http://127.0.0.1:3667/mcp"
h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}


def log(s):
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def post(p, timeout=90):
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


def call(name, args, timeout=90):
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
            "clientInfo": {"name": "scan", "version": "1"},
        },
    }
)
try:
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})
except Exception:
    pass

script = r"""
const pages = pixso.root.children.map(p => ({
  id: p.id,
  name: p.name,
  frames: (p.children || []).filter(c => c.type === 'FRAME').map(c => c.name)
}));
let page = null;
for (const p of pixso.root.children) {
  if ((p.name || '') === 'Godot-UI-Replica') page = p;
}
if (!page) page = pixso.currentPage;
await pixso.setCurrentPageAsync(page);

function walk(n, acc, d) {
  if (!n || d > 8) return;
  const fills = n.fills || [];
  let hasImg = false;
  for (const f of fills) {
    if (f && f.type === 'IMAGE') hasImg = true;
  }
  acc.push({
    name: n.name || '',
    type: n.type,
    w: n.width || 0,
    h: n.height || 0,
    hasImg: hasImg,
    visible: n.visible !== false,
    children: (n.children && n.children.length) || 0
  });
  if (n.children) {
    for (const c of n.children) walk(c, acc, d + 1);
  }
}

const frames = [];
for (const f of page.children) {
  if (f.type !== 'FRAME') continue;
  const acc = [];
  walk(f, acc, 0);
  const imgs = acc.filter(x => x.hasImg);
  frames.push({
    name: f.name,
    id: f.id,
    w: f.width,
    h: f.height,
    totalNodes: acc.length,
    imageNodes: imgs.length,
    imgSample: imgs.slice(0, 12).map(x => x.name + ':' + x.w + 'x' + x.h)
  });
}
return { page: page.name, pages, frames };
"""

res = call("eval_script", {"script": script})
path = r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica\pixso-asset-scan.json"
open(path, "w", encoding="utf-8").write(json.dumps(res, ensure_ascii=False, indent=2))
log(json.dumps(res, ensure_ascii=False, indent=2))
