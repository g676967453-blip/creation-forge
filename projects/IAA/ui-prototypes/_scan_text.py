# -*- coding: utf-8 -*-
import json
import random
import sys
import urllib.request
from pathlib import Path

URI = "http://127.0.0.1:3667/mcp"
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")


def log(s: str) -> None:
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


headers = {
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
        "clientInfo": {"name": "scan", "version": "1"},
    },
}
req = urllib.request.Request(URI, data=json.dumps(init).encode(), headers=headers)
with urllib.request.urlopen(req, timeout=30) as r:
    headers["mcp-session-id"] = r.headers.get("mcp-session-id")
    r.read()
try:
    urllib.request.urlopen(
        urllib.request.Request(
            URI,
            data=b'{"jsonrpc":"2.0","method":"notifications/initialized"}',
            headers=headers,
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
        URI, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"), headers=headers
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
function walk(n, acc, path, d) {
  if (!n || d > 12) return;
  const p = path + "/" + (n.name || n.type || "?");
  if (n.type === "TEXT") {
    acc.push({
      path: p,
      name: n.name || "",
      chars: String(n.characters || "").slice(0, 40),
      x: n.x,
      y: n.y,
      w: n.width,
      h: n.height,
      visible: n.visible !== false,
    });
  }
  // also note nodes that look like text containers with characters-like?
  if (n.children) for (const c of n.children) walk(c, acc, p, d + 1);
}
const all = [];
for (const c of page.children) walk(c, all, "page", 0);
const byFrame = {};
for (const t of all) {
  const m = t.path.match(/G0[1-6]-[A-Za-z0-9\-]+/);
  const k = m ? m[0] : "page-or-other";
  (byFrame[k] = byFrame[k] || []).push(t);
}
return { total: all.length, pageChildren: page.children.map(n => ({name:n.name,type:n.type})), byFrame };
"""

res = tool("eval_script", {"script": script})
(OUT / "text-scan.json").write_text(res, encoding="utf-8")
obj = json.loads(res)
log("total=" + str(obj["total"]))
log("pageChildren=" + json.dumps(obj.get("pageChildren"), ensure_ascii=False))
for k, v in (obj.get("byFrame") or {}).items():
    log(f"{k} count={len(v)}")
    for t in v:
        log(
            f"  name={t.get('name')} xy=({t.get('x')},{t.get('y')}) chars={t.get('chars')}"
        )
