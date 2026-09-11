# -*- coding: utf-8 -*-
"""Fine-fix G03 shop text coords and G06 section header Y from real node bounds."""
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
            "clientInfo": {"name": "fix-g03-g06", "version": "1"},
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
  return (n.fills || []).some(f => f && f.type === "IMAGE");
}
function findText(frame, name) {
  const acc = []; collect(frame, acc);
  return acc.find(n => n.type === "TEXT" && n.name === name) || null;
}
function centerText(t, cx, y, size) {
  if (!t) return null;
  try { t.fontName = font; if (size) t.fontSize = size; } catch (e) {}
  t.x = cx - (t.width || 0) / 2;
  t.y = y;
  return { name: t.name, x: t.x, y: t.y, w: t.width };
}
function placeInBox(t, ax, ay, bw, bh, size) {
  if (!t) return null;
  try { t.fontName = font; if (size) t.fontSize = size; } catch (e) {}
  t.x = ax + (bw - (t.width || 0)) / 2;
  t.y = ay + (bh - (t.height || size || 16)) / 2;
  return { name: t.name, x: t.x, y: t.y };
}

const out = {};

// ---- G03 ----
{
  const f = page.children.find(n => n.name === "G03-LevelClear-Shop");
  if (f) {
    const acc = []; collect(f, acc);
    // find shop box: largest non-image frame/rect with width~380 or name shop
    let shop = null;
    for (const n of acc) {
      if (n === f || n.visible === false) continue;
      if (n.type === "TEXT") continue;
      const a = absInFrame(n, f);
      const w = n.width || 0, h = n.height || 0;
      if (/shop/i.test(n.name || "") && w >= 280) {
        shop = { n, a, w, h, name: n.name };
        break;
      }
    }
    if (!shop) {
      // heuristic: mid panel ~380x250+
      for (const n of acc) {
        if (n === f || n.visible === false || n.type === "TEXT" || isImage(n)) continue;
        const a = absInFrame(n, f);
        const w = n.width || 0, h = n.height || 0;
        if (w >= 340 && w <= 420 && h >= 180 && h <= 360 && a.y >= 180 && a.y <= 400) {
          shop = { n, a, w, h, name: n.name || "panel" };
          break;
        }
      }
    }
    // buttons
    const btns = [];
    for (const n of acc) {
      if (n === f || n.visible === false || n.type === "TEXT" || isImage(n)) continue;
      const a = absInFrame(n, f);
      const w = n.width || 0, h = n.height || 0;
      if (w >= 180 && w <= 320 && h >= 36 && h <= 60) btns.push({ a, w, h, name: n.name || "" });
    }
    btns.sort((p, q) => p.a.y - q.a.y);

    // Title block above shop
    const topY = shop ? Math.max(40, shop.a.y - 170) : 70;
    centerText(findText(f, "cjk-title"), 225, topY, 26);
    centerText(findText(f, "cjk-stats"), 225, topY + 45, 15);
    centerText(findText(f, "cjk-stats2"), 225, topY + 68, 15);

    // double ad button: prefer button above shop
    let ad = btns.find(b => b.a.y < (shop ? shop.a.y - 10 : 250));
    if (!ad && btns.length) ad = btns[0];
    if (ad) placeInBox(findText(f, "cjk-double"), ad.a.x, ad.a.y, ad.w, ad.h, 16);
    else centerText(findText(f, "cjk-double"), 225, topY + 100, 16);

    // next button: lowest button
    let next = btns.length ? btns[btns.length - 1] : null;
    if (next && ad && next.a.y === ad.a.y && next.a.x === ad.a.x && btns.length > 1) {
      next = btns[btns.length - 1];
    }
    if (next) placeInBox(findText(f, "cjk-next"), next.a.x, next.a.y, next.w, next.h, 16);
    else centerText(findText(f, "cjk-next"), 225, 570, 16);

    if (shop) {
      const sx = shop.a.x, sy = shop.a.y, sw = shop.w;
      centerText(findText(f, "cjk-shop"), sx + sw / 2, sy + 12, 18);
      centerText(findText(f, "cjk-bal"), sx + sw / 2, sy + 42, 14);
      // row texts: look for row-like rects inside shop, else fixed stride
      const rows = [];
      for (const n of acc) {
        if (n === f || n === shop.n || n.visible === false || n.type === "TEXT") continue;
        const a = absInFrame(n, f);
        const w = n.width || 0, h = n.height || 0;
        if (a.y > sy + 50 && a.y < sy + shop.h - 10 && w >= 300 && w <= sw && h >= 28 && h <= 50) {
          rows.push({ a, w, h });
        }
      }
      rows.sort((p, q) => p.a.y - q.a.y);
      const names = ["cjk-r0","cjk-r1","cjk-r2","cjk-r3","cjk-r4"];
      for (let i = 0; i < names.length; i++) {
        const t = findText(f, names[i]);
        if (!t) continue;
        try { t.fontName = font; t.fontSize = 12; } catch (e) {}
        if (rows[i]) {
          t.x = rows[i].a.x + 44;
          t.y = rows[i].a.y + (rows[i].h - (t.height || 14)) / 2;
        } else {
          t.x = sx + 44;
          t.y = sy + 72 + i * 46;
        }
      }
    }
    out.G03 = {
      shop: shop ? { name: shop.name, x: shop.a.x, y: shop.a.y, w: shop.w, h: shop.h } : null,
      btns,
      texts: ["cjk-title","cjk-stats","cjk-stats2","cjk-double","cjk-shop","cjk-bal","cjk-r0","cjk-r1","cjk-r2","cjk-r3","cjk-r4","cjk-next"]
        .map(nm => { const t = findText(f, nm); return t ? { name: nm, x: t.x, y: t.y, chars: String(t.characters||"").slice(0,20) } : null; })
        .filter(Boolean)
    };
  }
}

// ---- G06 section headers from asset-label clusters ----
{
  const f = page.children.find(n => n.name === "G06-AssetBoard");
  if (f) {
    const acc = []; collect(f, acc);
    const labels = acc.filter(n => n.type === "TEXT" && (n.name || "").startsWith("asset-label-"));
    const imgs = [];
    for (const n of acc) {
      if (!isImage(n) || n.visible === false) continue;
      const a = absInFrame(n, f);
      imgs.push({ a, w: n.width || 0, h: n.height || 0 });
    }
    // clusters by y
    const bg = imgs.find(i => i.w >= 400 && i.h >= 700);
    const roleImgs = imgs.filter(i => i.w >= 30 && i.w <= 55 && i.h >= 40 && i.h <= 70).sort((p,q)=>p.a.y-q.a.y);
    // prop icons: not bg, not role-like, typically square
    const propImgs = imgs.filter(i => {
      if (bg && Math.abs(i.a.x - bg.a.x) < 5 && Math.abs(i.a.y - bg.a.y) < 5) return false;
      if (i.w >= 30 && i.w <= 55 && i.h >= 40 && i.h <= 70) return false;
      if (i.w >= 400) return false;
      return i.w >= 20 && i.h >= 8 && i.w <= 80;
    }).sort((p,q)=>p.a.y-q.a.y);

    const s1 = findText(f, "cjk-s1");
    const s2 = findText(f, "cjk-s2");
    const s3 = findText(f, "cjk-s3");
    const h1 = findText(f, "cjk-h1");
    const h2 = findText(f, "cjk-h2");
    if (h1) { try { h1.fontName = font; h1.fontSize = 28; } catch(e){} h1.x = 24; h1.y = 24; }
    if (h2) { try { h2.fontName = font; h2.fontSize = 14; } catch(e){} h2.x = 24; h2.y = 60; }
    if (s1) {
      try { s1.fontName = font; s1.fontSize = 22; } catch(e){}
      s1.x = 24;
      s1.y = bg ? Math.max(90, bg.a.y - 36) : 94;
    }
    if (s2) {
      try { s2.fontName = font; s2.fontSize = 22; } catch(e){}
      s2.x = 24;
      // roles are to the right of bg usually; take min y of role cluster
      const ry = roleImgs.length ? roleImgs[0].a.y : (bg ? bg.a.y + bg.h + 40 : 980);
      s2.y = Math.max((s1 ? s1.y + 40 : 200), ry - 36);
    }
    if (s3) {
      try { s3.fontName = font; s3.fontSize = 22; } catch(e){}
      s3.x = 24;
      // after roles: max role y + h, or prop min y
      let y = 300;
      if (roleImgs.length) {
        const maxR = Math.max(...roleImgs.map(i => i.a.y + i.h));
        y = maxR + 40;
      }
      if (propImgs.length) y = Math.min(y, propImgs[0].a.y - 36);
      // ensure below s2
      if (s2) y = Math.max(y, s2.y + 40);
      s3.y = y;
    }

    // Re-center each asset-label under nearest image of similar band
    for (const t of labels) {
      // find image whose bottom is just above this label or closest
      let best = null, bestD = 1e9;
      for (const img of imgs) {
        const cx = img.a.x + img.w / 2;
        const lx = (t.x || 0) + (t.width || 0) / 2;
        const dy = Math.abs((img.a.y + img.h + 4) - (t.y || 0));
        const dx = Math.abs(cx - lx);
        const d = dy * 3 + dx;
        if (d < bestD) { bestD = d; best = img; }
      }
      if (best && bestD < 120) {
        try { t.fontName = font; t.fontSize = 12; } catch (e) {}
        t.x = best.a.x + (best.w - (t.width || 0)) / 2;
        t.y = best.a.y + best.h + 4;
      }
    }

    out.G06 = {
      s1: s1 ? s1.y : null,
      s2: s2 ? s2.y : null,
      s3: s3 ? s3.y : null,
      labels: labels.length,
      roleImgs: roleImgs.length,
      propImgs: propImgs.length
    };
  }
}

// G01 start/char: if still not on buttons, force vertical stack centered
{
  const f = page.children.find(n => n.name === "G01-Menu");
  if (f) {
    const btns = [];
    const acc = []; collect(f, acc);
    for (const n of acc) {
      if (n === f || n.visible === false || n.type === "TEXT" || isImage(n)) continue;
      const a = absInFrame(n, f);
      const w = n.width || 0, h = n.height || 0;
      if (w >= 200 && w <= 340 && h >= 36 && h <= 70 && a.y >= 300) btns.push({ a, w, h, name: n.name||"" });
    }
    btns.sort((p,q)=>p.a.y-q.a.y);
    const charT = findText(f, "cjk-char");
    const startT = findText(f, "cjk-start");
    if (btns.length >= 2) {
      placeInBox(charT, btns[0].a.x, btns[0].a.y, btns[0].w, btns[0].h, 13);
      placeInBox(startT, btns[1].a.x, btns[1].a.y, btns[1].w, btns[1].h, 16);
    } else if (btns.length === 1) {
      placeInBox(startT, btns[0].a.x, btns[0].a.y, btns[0].w, btns[0].h, 16);
      if (charT) centerText(charT, 225, btns[0].a.y - 56, 13);
    }
    out.G01btns = btns;
  }
}

function snapTexts(name) {
  const f = page.children.find(n => n.name === name);
  if (!f) return [];
  const acc = []; collect(f, acc);
  return acc.filter(n => n.type === "TEXT" && (n.name||"").startsWith("cjk-")).map(n => ({
    name: n.name, x: Math.round(n.x*10)/10, y: Math.round(n.y*10)/10, chars: String(n.characters||"").slice(0,24)
  }));
}

return {
  out,
  G01: snapTexts("G01-Menu"),
  G03: snapTexts("G03-LevelClear-Shop"),
  G06headers: ["cjk-h1","cjk-h2","cjk-s1","cjk-s2","cjk-s3"].map(nm => {
    const f = page.children.find(n => n.name === "G06-AssetBoard");
    const t = f && findText(f, nm);
    return t ? { name: nm, x: t.x, y: t.y, chars: String(t.characters||"").slice(0,30) } : null;
  }).filter(Boolean),
  ids: page.children.filter(n => n.type==="FRAME" && (n.name||"").startsWith("G0")).map(n => ({ id: n.id, name: n.name, w: n.width }))
};
"""


def main():
    headers = session()
    log("session ok")
    res = tool(headers, "eval_script", {"script": SCRIPT}, timeout=180)
    (OUT / "g03-g06-fix.json").write_text(res, encoding="utf-8")
    obj = json.loads(res)
    log("G03 out=" + json.dumps(obj.get("out", {}).get("G03"), ensure_ascii=False))
    log("G06 out=" + json.dumps(obj.get("out", {}).get("G06"), ensure_ascii=False))
    for t in obj.get("G03") or []:
        log(f"G03 {t['name']} ({t['x']},{t['y']}) {t['chars']}")
    for t in obj.get("G06headers") or []:
        log(f"G06 {t['name']} ({t['x']},{t['y']}) {t['chars']}")

    prev = OUT / "previews-v2"
    prev.mkdir(parents=True, exist_ok=True)
    for fr in obj.get("ids") or []:
        if fr["name"] not in ("G01-Menu", "G03-LevelClear-Shop", "G06-AssetBoard", "G02-InGame", "G04-GameOver", "G05-Pause"):
            continue
        exp = tool(
            headers,
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
        m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", exp)
        if not m:
            log("export fail " + fr["name"])
            continue
        outp = prev / f"{fr['name']}.png"
        urllib.request.urlretrieve(m.group(0), outp)
        log(f"export {outp.name} {outp.stat().st_size}")
    log("DONE")


if __name__ == "__main__":
    main()
