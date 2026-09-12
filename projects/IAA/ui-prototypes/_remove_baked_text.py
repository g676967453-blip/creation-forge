# -*- coding: utf-8 -*-
"""Hide/remove code_to_design baked text layers; keep only cjk-* TEXT + art images."""
from __future__ import annotations

import json
import random
import re
import sys
import urllib.request
from pathlib import Path

URI = "http://127.0.0.1:3667/mcp"
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")


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
            "clientInfo": {"name": "rm-baked", "version": "1"},
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


# Strategy:
# Under each G0* frame, keep:
# - TEXT named cjk-*
# - IMAGE / RECTANGLE that are clearly game art (bg, windows sized 48, paddle, ball, icons)
# Hide or remove nodes that look like HTML text wrappers from code_to_design:
#   names containing title/sub/stats/btn/hint/goal/shop/char-name etc.
#   OR small frames that only contain TEXT (already removed) leftover groups
#   OR nodes whose only purpose was text background near overlay center

SCRIPT = r"""
const page = (() => {
  for (const p of pixso.root.children) {
    if ((p.name || "") === "Godot-UI-Replica") return p;
  }
  return pixso.currentPage;
})();
await pixso.setCurrentPageAsync(page);

const KEEP_NAME = /^(cjk-|bg|win|paddle|ball|hud|mat|fm|char-thumb|item|skill|vpad|grid|phone|board|ov$)/i;
const KILL_NAME = /(title|sub|stats|btn|hint|goal-text|shop|char-name|test-coin|menu-stats|double|next|resume|retry|revive|label|div\.title|div\.sub|div\.stats|div\.btn|div\.hint|div\.goal|div\.shop|div\.char|text)/i;

function isArtImage(n) {
  if (n.type !== "RECTANGLE" && n.type !== "FRAME" && n.type !== "GROUP" && n.type !== "COMPONENT" && n.type !== "INSTANCE") {
    // BOOLEAN_OPERATION etc
  }
  // filled with image?
  const fills = n.fills || [];
  for (const f of fills) {
    if (f && f.type === "IMAGE") return true;
  }
  return false;
}

function sizeLooksLikeSprite(n) {
  const w = n.width || 0, h = n.height || 0;
  if (w === 450 && h === 800) return true; // bg
  if (w === 48 && h === 48) return true; // window
  if (w <= 80 && h <= 80) return true; // icons/items/chars thumbs
  if (w <= 120 && h <= 40) return true; // mat etc
  return false;
}

const report = [];

function processFrame(frame) {
  const removed = [];
  const hidden = [];
  const kept = [];

  function consider(n, depth) {
    if (!n || n === frame) return;
    const name = n.name || "";
    if (n.type === "TEXT") {
      if (name.startsWith("cjk-")) { kept.push(name); return; }
      try { n.remove(); removed.push("TEXT:" + name); } catch (e) { try { n.visible = false; hidden.push(name); } catch (e2) {} }
      return;
    }

    // Do not descend into removed nodes
    const killByName = KILL_NAME.test(name) && !KEEP_NAME.test(name);
    const art = isArtImage(n);

    if (killByName) {
      // If it has image children that are sprites, only remove pure text-ish groups
      // Prefer hide if has many children
      const childCount = (n.children && n.children.length) || 0;
      if (!art && childCount === 0) {
        try { n.remove(); removed.push(name || n.type); return; } catch (e) {}
      }
      if (!art) {
        // hide entire HTML text/button chrome leftover
        try { n.visible = false; hidden.push(name || n.type); return; } catch (e) {
          try { n.remove(); removed.push(name || n.type); return; } catch (e2) {}
        }
      }
    }

    // Hide empty-looking button chrome: rounded rects without image, mid-size
    if (!art && (n.type === "RECTANGLE" || n.type === "FRAME")) {
      const w = n.width || 0, h = n.height || 0;
      // typical buttons 220-300 x 40-50
      if (w >= 180 && w <= 320 && h >= 36 && h <= 60) {
        // keep if it might be intentional empty btn under cjk text? User wants single text;
        // button backgrounds can stay; only kill if name suggests btn text container
        if (/btn|button|start|double|next|menu|retry|revive|resume|char/i.test(name)) {
          // keep the chrome (visual button) - don't remove
        }
      }
      // leftover text-sized rects without image
      if (w >= 100 && w <= 430 && h >= 12 && h <= 34 && !art && /div\.|text|title|sub|stats|hint|goal|label/i.test(name)) {
        try { n.visible = false; hidden.push(name); return; } catch (e) {}
      }
    }

    if (n.children) {
      for (const c of [...n.children]) consider(c, depth + 1);
    }
  }

  for (const c of [...frame.children]) consider(c, 0);
  report.push({ frame: frame.name, removed: removed.length, hidden: hidden.length, removedSample: removed.slice(0, 25), hiddenSample: hidden.slice(0, 25) });
}

for (const f of page.children) {
  if (f.type === "FRAME" && (f.name || "").startsWith("G0")) processFrame(f);
}

// Also hide page-level label-G* if user doesn't want them (optional keep above frames)
// Keep labels outside screens as navigation only - move further up if overlapping
for (const n of page.children) {
  if (n.type === "TEXT" && (n.name || "").startsWith("label-G")) {
    // ensure above frame, not overlapping content: already y = frame.y - 36
  }
}

// Recount TEXT
function allText(n, acc) {
  if (!n) return;
  if (n.type === "TEXT" && n.visible !== false) acc.push({ name: n.name || "", chars: String(n.characters || "").slice(0, 30), x: n.x, y: n.y });
  if (n.children) for (const c of n.children) allText(c, acc);
}
const final = [];
for (const f of page.children) {
  if (f.type !== "FRAME" || !(f.name || "").startsWith("G0")) continue;
  const acc = [];
  allText(f, acc);
  final.push({ name: f.name, id: f.id, w: f.width, texts: acc });
}
return { report, final };
"""

headers = session()
log("session ok")
res = tool(headers, "eval_script", {"script": SCRIPT}, timeout=180)
(OUT / "remove-baked-result.json").write_text(res, encoding="utf-8")
obj = json.loads(res)
for r in obj.get("report") or []:
    log(
        f"{r.get('frame')}: removed={r.get('removed')} hidden={r.get('hidden')} sample_rm={r.get('removedSample')} sample_hi={r.get('hiddenSample')}"
    )
for f in obj.get("final") or []:
    log(f"final {f.get('name')} texts={len(f.get('texts') or [])}")
    for t in f.get("texts") or []:
        log(f"  {t.get('name')} ({t.get('x')},{t.get('y')}) {t.get('chars')}")

# export
prev = OUT / "previews-v2"
prev.mkdir(parents=True, exist_ok=True)
for fr in obj.get("final") or []:
    exp = tool(
        headers,
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
    m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", exp)
    if not m:
        log("export fail " + str(fr.get("name")))
        continue
    outp = prev / f"{fr['name']}.png"
    urllib.request.urlretrieve(m.group(0), outp)
    log(f"export {outp.name} {outp.stat().st_size}")

log("DONE")
