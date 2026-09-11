# -*- coding: utf-8 -*-
import json
import random
import re
import sys
import urllib.request
from pathlib import Path

URI = "http://127.0.0.1:3667/mcp"
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica\previews-v2")


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


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
        "clientInfo": {"name": "unhide", "version": "1"},
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


def tool(name, args, timeout=120):
    payload = {
        "jsonrpc": "2.0",
        "id": random.randint(1, 999999),
        "method": "tools/call",
        "params": {"name": name, "arguments": args},
    }
    req = urllib.request.Request(
        URI, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), headers=h
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read().decode("utf-8", errors="replace")
    parts = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
    obj = json.loads("\n".join(parts))
    if "error" in obj:
        raise RuntimeError(obj)
    return "\n".join(c.get("text", "") for c in (obj.get("result") or {}).get("content") or [])


script = r"""
const page = (() => {
  for (const p of pixso.root.children) {
    if ((p.name || "") === "Godot-UI-Replica") return p;
  }
  return pixso.currentPage;
})();
await pixso.setCurrentPageAsync(page);
const g03 = page.children.find(n => n.name === "G03-LevelClear-Shop");
const fixed = [];
function walk(n) {
  if (!n) return;
  const name = n.name || "";
  if (/shop/i.test(name) && n.visible === false) {
    n.visible = true;
    fixed.push(name);
  }
  // unhide image children always under g03 if hidden and has image fill
  const fills = n.fills || [];
  const hasImg = fills.some(f => f && f.type === "IMAGE");
  if (hasImg && n.visible === false) {
    n.visible = true;
    fixed.push("img:" + name);
  }
  if (n.children) for (const c of n.children) walk(c);
}
if (g03) walk(g03);
return { fixed, id: g03 ? g03.id : null };
"""

res = tool("eval_script", {"script": script})
log(res)
obj = json.loads(res)
if obj.get("id"):
    exp = tool(
        "get_export_image",
        {
            "guid": obj["id"],
            "exportSettings": {
                "constraint": {"type": 2, "value": 450},
                "imageType": 1,
            },
        },
    )
    m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", exp)
    if m:
        OUT.mkdir(parents=True, exist_ok=True)
        out = OUT / "G03-LevelClear-Shop.png"
        urllib.request.urlretrieve(m.group(0), out)
        log(f"export {out.stat().st_size}")
log("OK")
