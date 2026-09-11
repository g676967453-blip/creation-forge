# -*- coding: utf-8 -*-
import json
import random
import sys
import urllib.request
from pathlib import Path

PIXSO = "http://127.0.0.1:3667/mcp"
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")
TRUTH = json.loads((OUT / "godot-ui-truth.json").read_text(encoding="utf-8"))
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
            "clientInfo": {"name": "verify", "version": "1"},
        },
    }
)
try:
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})
except Exception:
    pass

script = r"""
const page = (() => {
  for (const p of pixso.root.children) if ((p.name || '') === 'Godot-UI-Replica') return p;
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
      chars: String(n.characters || '').slice(0, 40),
      ax: Math.round(a.x * 10) / 10,
      ay: Math.round(a.y * 10) / 10,
      parent: (n.parent && n.parent.name) || '',
      parentType: (n.parent && n.parent.type) || ''
    });
  }
  if (n.children) for (const c of n.children) walk(c, frame, acc);
}
const out = {};
for (const f of page.children) {
  if (f.type !== 'FRAME') continue;
  if (!(f.name || '').startsWith('T0') && f.name !== 'G06-AssetBoard') continue;
  const texts = [];
  walk(f, f, texts);
  out[f.name] = {
    id: f.id,
    w: f.width,
    h: f.height,
    directChildren: f.children.length,
    nested: f.children.some(c => c.type === 'FRAME' || c.type === 'GROUP'),
    texts: texts
  };
}
return out;
"""
res = call("eval_script", {"script": script})
(OUT / "layout-verify-after-fix.json").write_text(
    json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8"
)

# Compare key texts with Godot truth
checks = [
    ("T01-Menu", "救火英雄", "UI/Overlays/Menu/VBox/Title"),
    ("T01-Menu", "开始游戏", "UI/Overlays/Menu/VBox/StartButton"),
    ("T01-Menu", "最高分", "UI/Overlays/Menu/VBox/MenuStats"),
    ("T03-LevelClear", "扑灭成功", "UI/Overlays/LevelClear/VBox/Title"),
    ("T03-LevelClear", "下一关", "UI/Overlays/LevelClear/VBox/NextButton"),
    ("T04-GameOver", "任务失败", "UI/Overlays/GameOver/VBox/Title"),
    ("T05-Pause", "已暂停", "UI/Overlays/Pause/VBox/Title"),
]

for frame, needle, path in checks:
    fr = (res or {}).get(frame) or {}
    texts = fr.get("texts") or []
    hit = next((t for t in texts if needle in str(t.get("chars") or "")), None)
    truth = TRUTH.get(path) or {}
    if not hit:
        log(f"MISS {frame} '{needle}'")
        continue
    tx, ty = float(truth.get("x") or 0), float(truth.get("y") or 0)
    tw, th = float(truth.get("w") or 0), float(truth.get("h") or 0)
    # text is centered in box, so abs should be near box center-ish; check y within box
    ay = float(hit.get("ay") or 0)
    ax = float(hit.get("ax") or 0)
    in_box = (ty - 8) <= ay <= (ty + th + 8) and (tx - 20) <= ax <= (tx + tw + 20)
    parent_ok = hit.get("parent") == frame or hit.get("parentType") != "FRAME" and hit.get("parent") in (
        "ui-btn",
        "ui-label",
        frame,
    )
    # parent should be the frame itself after flatten
    parent_is_frame = hit.get("parent") == frame
    log(
        f"{'OK' if in_box and parent_is_frame else 'WARN'} {frame} '{hit.get('chars')}' "
        f"abs=({ax},{ay}) truth_box=({tx},{ty},{tw},{th}) parent={hit.get('parent')} nested={fr.get('nested')}"
    )

log("G06 labels=" + str(len(((res or {}).get("G06-AssetBoard") or {}).get("texts") or [])))
for name, fr in (res or {}).items():
    if name.startswith("T0"):
        log(f"{name}: nested={fr.get('nested')} texts={len(fr.get('texts') or [])} children={fr.get('directChildren')}")
