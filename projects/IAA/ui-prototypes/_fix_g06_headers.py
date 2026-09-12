# -*- coding: utf-8 -*-
"""Fix G06 section headers using precise image size classes."""
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
            "clientInfo": {"name": "g06-headers", "version": "1"},
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


def tool(headers, name, args, timeout=120):
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
    return "\n".join(
        c.get("text", "") for c in (obj.get("result") or {}).get("content") or []
    )


SCRIPT = r"""
const page = (() => {
  for (const p of pixso.root.children) {
    if ((p.name || "") === "Godot-UI-Replica") return p;
  }
  return pixso.currentPage;
})();
await pixso.setCurrentPageAsync(page);
const font = { family: "Microsoft YaHei", style: "Regular" };
try { await pixso.loadFontAsync(font); } catch (e) {}

const f = page.children.find(n => n.name === "G06-AssetBoard");
if (!f) return { error: "no G06" };

function collect(n, acc) {
  if (!n) return;
  acc.push(n);
  if (n.children) for (const c of n.children) collect(c, acc);
}
function absInFrame(n, frame) {
  let x = 0, y = 0, cur = n;
  while (cur && cur !== frame) {
    x += cur.x || 0;
    y += cur.y || 0;
    cur = cur.parent;
  }
  return { x, y };
}
function isImage(n) {
  return (n.fills || []).some(ff => ff && ff.type === "IMAGE");
}
function findText(name) {
  const acc = []; collect(f, acc);
  return acc.find(n => n.type === "TEXT" && n.name === name) || null;
}

const acc = []; collect(f, acc);
const imgs = [];
for (const n of acc) {
  if (!isImage(n) || n.visible === false) continue;
  const a = absInFrame(n, f);
  imgs.push({ a, w: n.width || 0, h: n.height || 0 });
}

// classes
const bg = imgs.find(i => i.w >= 400 && i.h >= 700) || null;
// windows exactly ~48 square
const wins = imgs.filter(i => Math.abs(i.w - 48) <= 4 && Math.abs(i.h - 48) <= 4);
// trampoline mat wide short
const mats = imgs.filter(i => i.w >= 50 && i.w <= 100 && i.h >= 4 && i.h <= 20);
// firemen / chars taller than wide ~39x51
const chars = imgs.filter(i => i.w >= 28 && i.w <= 55 && i.h >= 40 && i.h <= 70 && i.h >= i.w * 1.05);
// items/icons mostly square 24-70, not windows
const icons = imgs.filter(i => {
  if (Math.abs(i.w - 48) <= 4 && Math.abs(i.h - 48) <= 4) return false;
  if (i.w >= 28 && i.w <= 55 && i.h >= 40 && i.h <= 70 && i.h >= i.w * 1.05) return false;
  if (i.w >= 400) return false;
  return i.w >= 20 && i.h >= 20 && i.w <= 80 && i.h <= 80;
});

function minY(arr) {
  if (!arr.length) return null;
  return Math.min(...arr.map(i => i.a.y));
}
function maxBottom(arr) {
  if (!arr.length) return null;
  return Math.max(...arr.map(i => i.a.y + i.h));
}

const sceneTop = bg ? bg.a.y : (wins.length ? minY(wins) : 130);
// roles: prefer chars whose y is below bg bottom - 20 OR to the right of bg with y near mid
let rolePool = chars.slice();
if (bg) {
  const below = chars.filter(i => i.a.y >= bg.a.y + bg.h - 30);
  const right = chars.filter(i => i.a.x >= bg.a.x + bg.w - 20);
  if (below.length) rolePool = below;
  else if (right.length >= 3) rolePool = right;
}
const roleTop = minY(rolePool) ?? (bg ? bg.a.y + bg.h + 48 : 900);
// props: icons below roles
let propPool = icons.filter(i => i.a.y >= roleTop - 10);
if (!propPool.length) propPool = icons;
const propTop = minY(propPool) ?? (roleTop + 120);

const h1 = findText("cjk-h1");
const h2 = findText("cjk-h2");
const s1 = findText("cjk-s1");
const s2 = findText("cjk-s2");
const s3 = findText("cjk-s3");

if (h1) { try { h1.fontName = font; h1.fontSize = 28; } catch(e){} h1.x = 24; h1.y = 24; }
if (h2) { try { h2.fontName = font; h2.fontSize = 14; } catch(e){} h2.x = 24; h2.y = 60; }

let y1 = Math.max(90, sceneTop - 36);
let y2 = Math.max(y1 + 48, roleTop - 36);
let y3 = Math.max(y2 + 48, propTop - 36);
// if roleTop is still inside bg area (misdetect), push below bg
if (bg && y2 < bg.a.y + 100) {
  y2 = bg.a.y + bg.h + 24;
  y3 = Math.max(y2 + 48, propTop - 36);
  if (y3 < y2 + 48) y3 = y2 + 120;
}

if (s1) { try { s1.fontName = font; s1.fontSize = 22; } catch(e){} s1.x = 24; s1.y = y1; s1.fills = [{ type: "SOLID", color: { r:1,g:0.82,b:0.29 } }]; }
if (s2) { try { s2.fontName = font; s2.fontSize = 22; } catch(e){} s2.x = 24; s2.y = y2; s2.fills = [{ type: "SOLID", color: { r:1,g:0.82,b:0.29 } }]; }
if (s3) { try { s3.fontName = font; s3.fontSize = 22; } catch(e){} s3.x = 24; s3.y = y3; s3.fills = [{ type: "SOLID", color: { r:1,g:0.82,b:0.29 } }]; }

// re-snap asset labels under images again
const labels = acc.filter(n => n.type === "TEXT" && (n.name || "").startsWith("asset-label-"));
for (const t of labels) {
  let best = null, bestD = 1e9;
  for (const img of imgs) {
    const cx = img.a.x + img.w / 2;
    const lx = (t.x || 0) + (t.width || 0) / 2;
    const dy = Math.abs((img.a.y + img.h + 4) - (t.y || 0));
    const dx = Math.abs(cx - lx);
    const d = dy * 2 + dx;
    if (d < bestD) { bestD = d; best = img; }
  }
  if (best && bestD < 160) {
    try { t.fontName = font; t.fontSize = 12; } catch (e) {}
    t.x = best.a.x + (best.w - (t.width || 0)) / 2;
    t.y = best.a.y + best.h + 4;
  }
}

return {
  y1, y2, y3,
  counts: { imgs: imgs.length, wins: wins.length, chars: chars.length, rolePool: rolePool.length, icons: icons.length, propPool: propPool.length, labels: labels.length },
  bg: bg ? { x: bg.a.x, y: bg.a.y, w: bg.w, h: bg.h } : null,
  roleTop, propTop,
  id: f.id,
  w: f.width
};
"""

headers = session()
log("session ok")
res = tool(headers, "eval_script", {"script": SCRIPT})
(OUT / "g06-headers-fix.json").write_text(res, encoding="utf-8")
log(res)
obj = json.loads(res)
exp = tool(
    headers,
    "get_export_image",
    {
        "guid": obj["id"],
        "exportSettings": {
            "constraint": {"type": 2, "value": min(900, int(obj.get("w") or 900))},
            "imageType": 1,
        },
    },
)
m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", exp)
if m:
    outp = OUT / "previews-v2" / "G06-AssetBoard.png"
    urllib.request.urlretrieve(m.group(0), outp)
    log(f"export {outp.stat().st_size}")
log("DONE")
