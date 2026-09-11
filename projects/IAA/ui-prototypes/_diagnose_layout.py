# -*- coding: utf-8 -*-
import json
import random
import sys
import urllib.request
from pathlib import Path

OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")


def log(s):
    sys.stdout.buffer.write((s + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def init(uri, name):
    h = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}

    def post(p, timeout=90):
        req = urllib.request.Request(
            uri, data=json.dumps(p, ensure_ascii=False).encode("utf-8"), headers=h
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
                "clientInfo": {"name": name, "version": "1"},
            },
        }
    )
    try:
        post({"jsonrpc": "2.0", "method": "notifications/initialized"})
    except Exception:
        pass

    def call(n, a, timeout=90):
        o = post(
            {
                "jsonrpc": "2.0",
                "id": random.randint(1, 999999),
                "method": "tools/call",
                "params": {"name": n, "arguments": a},
            },
            timeout=timeout,
        )
        res = (o or {}).get("result") or {}
        sc = res.get("structuredContent")
        t = ((res.get("content") or [{}])[0]).get("text")
        if sc is not None:
            return sc
        try:
            return json.loads(t) if isinstance(t, str) else t
        except Exception:
            return t

    return call


# Godot
g = init("http://127.0.0.1:9080/mcp", "g")
code = r"""
var r = edited_scene
var paths = [
	"UI/Overlays/Menu/VBox",
	"UI/Overlays/Menu/VBox/Title",
	"UI/Overlays/Menu/VBox/Sub",
	"UI/Overlays/Menu/VBox/MenuStats",
	"UI/Overlays/Menu/VBox/StartButton",
	"UI/Overlays/LevelClear/VBox",
	"UI/Overlays/LevelClear/VBox/Title",
	"UI/Overlays/LevelClear/VBox/Stats",
	"UI/Overlays/LevelClear/VBox/DoubleButton",
	"UI/Overlays/LevelClear/VBox/NextButton",
	"UI/Overlays/GameOver/VBox",
	"UI/Overlays/GameOver/VBox/Title",
	"UI/Overlays/Pause/VBox",
	"UI/Overlays/Pause/VBox/Title",
	"UI/HUD/TopBar",
	"UI/HUD/GoalLabel",
	"UI/HUD/Hint"
]
for i in range(paths.size()):
	var p = paths[i]
	var n = r.get_node_or_null(p)
	if n == null:
		_custom_print(p + "|MISS")
		continue
	if n is Control:
		var rect = n.get_global_rect()
		var tx = ""
		if n is Label or n is Button:
			tx = n.text.replace("\n", "\\n")
		_custom_print(p + "|" + str(rect.position.x) + "|" + str(rect.position.y) + "|" + str(rect.size.x) + "|" + str(rect.size.y) + "|" + tx)
"""
sc = g("execute_editor_script", {"code": code})
log("GODOT " + json.dumps(sc, ensure_ascii=False)[:2500])

# Pixso
p = init("http://127.0.0.1:3667/mcp", "p")
script = r"""
const page = (() => {
  for (const pg of pixso.root.children) if ((pg.name || '') === 'Godot-UI-Replica') return pg;
  return pixso.currentPage;
})();
await pixso.setCurrentPageAsync(page);
function abs(n, frame) {
  let x = 0, y = 0, c = n;
  while (c && c !== frame) { x += c.x || 0; y += c.y || 0; c = c.parent; }
  return { x, y };
}
function walk(n, frame, acc) {
  if (!n) return;
  if (n.type === 'TEXT') {
    const a = abs(n, frame);
    acc.push({
      name: n.name || '',
      chars: String(n.characters || '').slice(0, 28),
      lx: n.x, ly: n.y, ax: a.x, ay: a.y,
      w: n.width, h: n.height,
      parent: (n.parent && n.parent.name) || ''
    });
  }
  if (n.children) for (const c of n.children) walk(c, frame, acc);
}
const out = {};
for (const f of page.children) {
  if (f.type !== 'FRAME') continue;
  if (!(f.name || '').startsWith('T0') && f.name !== 'G06-AssetBoard') continue;
  const acc = [];
  walk(f, f, acc);
  out[f.name] = { id: f.id, w: f.width, h: f.height, texts: acc };
}
return out;
"""
res = p("eval_script", {"script": script})
(OUT / "layout-chaos-scan.json").write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
for name in ["T01-Menu", "T02-InGame", "T03-LevelClear", "T04-GameOver", "T05-Pause", "G06-AssetBoard"]:
    fr = (res or {}).get(name) or {}
    log(f"== {name} texts={len(fr.get('texts') or [])}")
    for t in (fr.get("texts") or [])[:15]:
        log(
            f"  '{t.get('chars')}' abs=({round(t.get('ax',0),1)},{round(t.get('ay',0),1)}) "
            f"loc=({round(t.get('lx',0),1)},{round(t.get('ly',0),1)}) parent={t.get('parent')}"
        )
