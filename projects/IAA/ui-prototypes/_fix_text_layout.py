# -*- coding: utf-8 -*-
"""Reposition cjk-* labels to match actual chrome (buttons/overlays) in Pixso frames."""
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
            "clientInfo": {"name": "fix-layout", "version": "1"},
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


# 1) Dump geometry of likely chrome nodes (absolute coords within frame)
DUMP = r"""
const page = (() => {
  for (const p of pixso.root.children) {
    if ((p.name || "") === "Godot-UI-Replica") return p;
  }
  return pixso.currentPage;
})();
await pixso.setCurrentPageAsync(page);

function absXY(n) {
  let x = 0, y = 0, cur = n;
  const frame = (() => {
    let p = n;
    while (p && p.parent) {
      if ((p.name || "").startsWith("G0") && p.type === "FRAME") return p;
      p = p.parent;
    }
    return null;
  })();
  cur = n;
  while (cur && cur !== frame) {
    x += cur.x || 0;
    y += cur.y || 0;
    cur = cur.parent;
  }
  return { x, y, frameName: frame ? frame.name : null };
}

function walk(n, acc, frame) {
  if (!n) return;
  const name = n.name || "";
  const type = n.type || "";
  if (n !== frame) {
    const fills = n.fills || [];
    const hasImg = fills.some(f => f && f.type === "IMAGE");
    const interesting =
      /btn|button|ov|overlay|menu|title|sub|stats|shop|hud|vpad|skill|char|test|goal|hint|phone|board/i.test(name) ||
      (type === "RECTANGLE" && !hasImg && (n.width || 0) >= 100 && (n.height || 0) >= 28 && (n.height || 0) <= 70) ||
      (type === "FRAME" && (n.width || 0) >= 200 && (n.width || 0) <= 400 && (n.height || 0) >= 36 && (n.height || 0) <= 80);
    if (interesting || (type === "TEXT" && (name.startsWith("cjk-") || name.startsWith("label-")))) {
      const a = absXY(n);
      acc.push({
        name,
        type,
        w: n.width,
        h: n.height,
        lx: n.x,
        ly: n.y,
        ax: a.x,
        ay: a.y,
        visible: n.visible !== false,
        hasImg,
        chars: type === "TEXT" ? String(n.characters || "").slice(0, 24) : ""
      });
    }
  }
  if (n.children) for (const c of n.children) walk(c, acc, frame);
}

const out = {};
for (const f of page.children) {
  if (f.type !== "FRAME" || !(f.name || "").startsWith("G0")) continue;
  const acc = [];
  walk(f, acc, f);
  // also full-size overlay rects
  out[f.name] = {
    id: f.id,
    w: f.width,
    h: f.height,
    nodes: acc.sort((a, b) => a.ay - b.ay || a.ax - b.ax)
  };
}
return out;
"""

# 2) Reposition cjk texts centered on chrome where possible
FIX = r"""
const page = (() => {
  for (const p of pixso.root.children) {
    if ((p.name || "") === "Godot-UI-Replica") return p;
  }
  return pixso.currentPage;
})();
await pixso.setCurrentPageAsync(page);

const font = { family: "Microsoft YaHei", style: "Regular" };
try { await pixso.loadFontAsync(font); } catch (e) {}
try { await pixso.loadFontAsync({ family: "Microsoft YaHei", style: "Bold" }); } catch (e) {}

function absInFrame(n, frame) {
  let x = 0, y = 0, cur = n;
  while (cur && cur !== frame) {
    x += cur.x || 0;
    y += cur.y || 0;
    cur = cur.parent;
  }
  return { x, y };
}

function collect(n, acc) {
  if (!n) return;
  acc.push(n);
  if (n.children) for (const c of n.children) collect(c, acc);
}

function findText(frame, name) {
  const acc = [];
  collect(frame, acc);
  return acc.find(n => n.type === "TEXT" && n.name === name) || null;
}

function setCentered(t, frame, ax, ay, boxW, boxH, fontSize) {
  if (!t) return null;
  try { t.fontName = font; } catch (e) {}
  if (fontSize) try { t.fontSize = fontSize; } catch (e) {}
  // measure after font set
  const tw = t.width || 0;
  const th = t.height || (fontSize ? fontSize * 1.2 : 16);
  // place relative to frame (cjk nodes are direct children of frame)
  t.x = ax + (boxW - tw) / 2;
  t.y = ay + (boxH - th) / 2;
  return { name: t.name, x: t.x, y: t.y, tw, th, ax, ay, boxW, boxH };
}

function setAt(t, x, y, fontSize) {
  if (!t) return null;
  try { t.fontName = font; } catch (e) {}
  if (fontSize) try { t.fontSize = fontSize; } catch (e) {}
  t.x = x; t.y = y;
  return { name: t.name, x: t.x, y: t.y };
}

function isImage(n) {
  const fills = n.fills || [];
  return fills.some(f => f && f.type === "IMAGE");
}

function btnCandidates(frame) {
  const acc = [];
  collect(frame, acc);
  const out = [];
  for (const n of acc) {
    if (n === frame) continue;
    if (n.visible === false) continue;
    if (n.type === "TEXT") continue;
    if (isImage(n)) continue;
    const w = n.width || 0, h = n.height || 0;
    // button-like
    if (w >= 160 && w <= 340 && h >= 34 && h <= 70) {
      const a = absInFrame(n, frame);
      out.push({ n, name: n.name || n.type, w, h, ax: a.x, ay: a.y });
    }
  }
  out.sort((a, b) => a.ay - b.ay || a.ax - b.ax);
  return out;
}

function centerX(frame, textNode, y, fontSize) {
  if (!textNode) return null;
  try { textNode.fontName = font; } catch (e) {}
  if (fontSize) try { textNode.fontSize = fontSize; } catch (e) {}
  const tw = textNode.width || 0;
  textNode.x = ((frame.width || 450) - tw) / 2;
  textNode.y = y;
  return { name: textNode.name, x: textNode.x, y: textNode.y, tw };
}

const moves = {};

// ---- G01 Menu ----
{
  const f = page.children.find(n => n.name === "G01-Menu");
  if (f) {
    const m = [];
    const btns = btnCandidates(f);
    // typical menu: char btn then start btn near lower-middle
    // Title block centered upper-middle
    m.push(centerX(f, findText(f, "cjk-title"), 210, 28));
    m.push(centerX(f, findText(f, "cjk-sub"), 258, 13));
    m.push(centerX(f, findText(f, "cjk-sub2"), 280, 13));
    m.push(centerX(f, findText(f, "cjk-stats"), 310, 15));

    // pick two lowest large buttons as char + start (or only start)
    const lower = btns.filter(b => b.ay >= 300 && b.ay <= 520);
    let charBtn = lower.find(b => /char/i.test(b.name)) || (lower.length >= 2 ? lower[0] : null);
    let startBtn = lower.find(b => /main|start/i.test(b.name)) || lower[lower.length - 1] || null;
    if (charBtn && startBtn && charBtn.ay > startBtn.ay) {
      const tmp = charBtn; charBtn = startBtn; startBtn = tmp;
    }
    // if only one, treat as start
    if (!startBtn && lower.length) startBtn = lower[0];
    if (charBtn) m.push(setCentered(findText(f, "cjk-char"), f, charBtn.ax, charBtn.ay, charBtn.w, charBtn.h, 13));
    else m.push(centerX(f, findText(f, "cjk-char"), 360, 13));
    if (startBtn) m.push(setCentered(findText(f, "cjk-start"), f, startBtn.ax, startBtn.ay, startBtn.w, startBtn.h, 16));
    else m.push(centerX(f, findText(f, "cjk-start"), 420, 16));

    // role names under thumbs: find small images near bottom
    const acc = []; collect(f, acc);
    const thumbs = [];
    for (const n of acc) {
      if (!isImage(n)) continue;
      const a = absInFrame(n, f);
      const w = n.width || 0, h = n.height || 0;
      if (w >= 30 && w <= 50 && h >= 40 && h <= 60 && a.y >= 450 && a.y <= 560) {
        thumbs.push({ a, w, h });
      }
    }
    thumbs.sort((p, q) => p.a.x - q.a.x);
    const names = ["cjk-n0", "cjk-n1", "cjk-n2", "cjk-n3", "cjk-n4"];
    for (let i = 0; i < names.length; i++) {
      const t = findText(f, names[i]);
      if (!t) continue;
      if (thumbs[i]) {
        try { t.fontName = font; t.fontSize = 11; } catch (e) {}
        const tw = t.width || 40;
        t.x = thumbs[i].a.x + (thumbs[i].w - tw) / 2;
        t.y = thumbs[i].a.y + thumbs[i].h + 4;
        m.push({ name: names[i], x: t.x, y: t.y });
      } else {
        m.push(setAt(t, 50 + i * 75, 528, 11));
      }
    }
    // test coin top-right
    const test = findText(f, "cjk-test");
    if (test) {
      try { test.fontName = font; test.fontSize = 12; } catch (e) {}
      const tw = test.width || 80;
      test.x = 450 - tw - 12;
      test.y = 50;
      m.push({ name: "cjk-test", x: test.x, y: test.y });
    }
    moves["G01-Menu"] = { btns: btns.map(b => ({ name: b.name, ax: b.ax, ay: b.ay, w: b.w, h: b.h })), thumbs: thumbs.length, m };
  }
}

// ---- G02 InGame ----
{
  const f = page.children.find(n => n.name === "G02-InGame");
  if (f) {
    const m = [];
    // HUD numbers in top bar boxes - find 4 non-image small frames/rects near top
    const acc = []; collect(f, acc);
    const boxes = [];
    for (const n of acc) {
      if (n === f || n.visible === false) continue;
      if (isImage(n) || n.type === "TEXT") continue;
      const a = absInFrame(n, f);
      const w = n.width || 0, h = n.height || 0;
      if (a.y <= 20 && h >= 20 && h <= 40 && w >= 70 && w <= 130) boxes.push({ a, w, h, name: n.name });
    }
    boxes.sort((p, q) => p.a.x - q.a.x);
    const hs = ["cjk-h0", "cjk-h1", "cjk-h2", "cjk-h3"];
    for (let i = 0; i < 4; i++) {
      const t = findText(f, hs[i]);
      if (!t) continue;
      if (boxes[i]) {
        // number after 16px icon
        try { t.fontName = font; t.fontSize = 15; } catch (e) {}
        t.x = boxes[i].a.x + 22;
        t.y = boxes[i].a.y + (boxes[i].h - (t.height || 15)) / 2;
        m.push({ name: hs[i], x: t.x, y: t.y, box: boxes[i] });
      } else m.push(setAt(t, 28 + i * 105, 14, 15));
    }
    m.push(centerX(f, findText(f, "cjk-goal"), 48, 15));

    // skill button candidate bottom-right
    const btns = btnCandidates(f).filter(b => b.ay >= 500 && b.ax >= 200);
    const skillBtn = btns.find(b => /skill/i.test(b.name)) || btns[0];
    if (skillBtn) m.push(setCentered(findText(f, "cjk-skill"), f, skillBtn.ax, skillBtn.ay, skillBtn.w, skillBtn.h, 15));
    else m.push(setAt(findText(f, "cjk-skill"), 320, 575, 15));

    m.push(centerX(f, findText(f, "cjk-hint"), 752, 12));
    // vpad labels not present as cjk; skip
    moves["G02-InGame"] = { boxes, skillBtn: skillBtn ? { ax: skillBtn.ax, ay: skillBtn.ay, w: skillBtn.w, h: skillBtn.h, name: skillBtn.name } : null, m };
  }
}

// ---- G03 LevelClear ----
{
  const f = page.children.find(n => n.name === "G03-LevelClear-Shop");
  if (f) {
    const m = [];
    m.push(centerX(f, findText(f, "cjk-title"), 70, 26));
    m.push(centerX(f, findText(f, "cjk-stats"), 115, 15));
    m.push(centerX(f, findText(f, "cjk-stats2"), 138, 15));
    const btns = btnCandidates(f);
    // ad then next often
    const ad = btns.find(b => /ad|double/i.test(b.name)) || btns[0];
    const next = btns.find(b => /main|next/i.test(b.name)) || btns[btns.length - 1];
    if (ad) m.push(setCentered(findText(f, "cjk-double"), f, ad.ax, ad.ay, ad.w, ad.h, 16));
    else m.push(centerX(f, findText(f, "cjk-double"), 185, 16));
    if (next && (!ad || next.n !== ad.n)) m.push(setCentered(findText(f, "cjk-next"), f, next.ax, next.ay, next.w, next.h, 16));
    else m.push(centerX(f, findText(f, "cjk-next"), 570, 16));

    // shop header inside shop box
    const acc = []; collect(f, acc);
    let shop = null;
    for (const n of acc) {
      if (/shop-box|shop/i.test(n.name || "") && (n.width || 0) >= 300) {
        const a = absInFrame(n, f);
        shop = { a, w: n.width, h: n.height, name: n.name };
        break;
      }
    }
    if (shop) {
      m.push(centerX(f, findText(f, "cjk-shop"), shop.a.y + 12, 18));
      // force x center relative to shop
      const t = findText(f, "cjk-shop");
      if (t) {
        try { t.fontName = font; t.fontSize = 18; } catch (e) {}
        t.x = shop.a.x + (shop.w - (t.width || 0)) / 2;
        t.y = shop.a.y + 10;
      }
      const bal = findText(f, "cjk-bal");
      if (bal) {
        try { bal.fontName = font; bal.fontSize = 14; } catch (e) {}
        bal.x = shop.a.x + (shop.w - (bal.width || 0)) / 2;
        bal.y = shop.a.y + 40;
        m.push({ name: "cjk-bal", x: bal.x, y: bal.y });
      }
      // rows
      const rows = ["cjk-r0", "cjk-r1", "cjk-r2", "cjk-r3", "cjk-r4"];
      for (let i = 0; i < rows.length; i++) {
        const rt = findText(f, rows[i]);
        if (!rt) continue;
        try { rt.fontName = font; rt.fontSize = 12; } catch (e) {}
        rt.x = shop.a.x + 48;
        rt.y = shop.a.y + 70 + i * 46;
        m.push({ name: rows[i], x: rt.x, y: rt.y });
      }
    } else {
      m.push(centerX(f, findText(f, "cjk-shop"), 258, 18));
      m.push(centerX(f, findText(f, "cjk-bal"), 286, 14));
    }
    moves["G03-LevelClear-Shop"] = { btns: btns.map(b => ({ name: b.name, ax: b.ax, ay: b.ay, w: b.w, h: b.h })), shop, m };
  }
}

// ---- G04 GameOver ----
{
  const f = page.children.find(n => n.name === "G04-GameOver");
  if (f) {
    const m = [];
    m.push(centerX(f, findText(f, "cjk-title"), 250, 26));
    m.push(centerX(f, findText(f, "cjk-s1"), 310, 15));
    m.push(centerX(f, findText(f, "cjk-s2"), 335, 15));
    m.push(centerX(f, findText(f, "cjk-s3"), 360, 15));
    m.push(centerX(f, findText(f, "cjk-s4"), 385, 15));
    const btns = btnCandidates(f);
    const labels = ["cjk-revive", "cjk-retry", "cjk-menu"];
    // map sorted buttons top->bottom to three actions
    const b3 = btns.filter(b => b.ay >= 400);
    for (let i = 0; i < labels.length; i++) {
      const t = findText(f, labels[i]);
      if (!t) continue;
      if (b3[i]) m.push(setCentered(t, f, b3[i].ax, b3[i].ay, b3[i].w, b3[i].h, 16));
      else m.push(centerX(f, t, 440 + i * 60, 16));
    }
    moves["G04-GameOver"] = { btns: btns.map(b => ({ name: b.name, ax: b.ax, ay: b.ay, w: b.w, h: b.h })), m };
  }
}

// ---- G05 Pause ----
{
  const f = page.children.find(n => n.name === "G05-Pause");
  if (f) {
    const m = [];
    m.push(centerX(f, findText(f, "cjk-title"), 320, 26));
    const btns = btnCandidates(f).filter(b => b.ay >= 350);
    const labels = ["cjk-resume", "cjk-menu"];
    for (let i = 0; i < labels.length; i++) {
      const t = findText(f, labels[i]);
      if (!t) continue;
      if (btns[i]) m.push(setCentered(t, f, btns[i].ax, btns[i].ay, btns[i].w, btns[i].h, 16));
      else m.push(centerX(f, t, 400 + i * 60, 16));
    }
    moves["G05-Pause"] = { btns: btns.map(b => ({ name: b.name, ax: b.ax, ay: b.ay, w: b.w, h: b.h })), m };
  }
}

// ---- G06 Asset board: section headers left-aligned with padding ----
{
  const f = page.children.find(n => n.name === "G06-AssetBoard");
  if (f) {
    const m = [];
    m.push(setAt(findText(f, "cjk-h1"), 24, 24, 28));
    m.push(setAt(findText(f, "cjk-h2"), 24, 60, 14));
    // place section titles near top of content clusters by scanning images
    const acc = []; collect(f, acc);
    const imgs = [];
    for (const n of acc) {
      if (!isImage(n)) continue;
      const a = absInFrame(n, f);
      imgs.push({ a, w: n.width || 0, h: n.height || 0 });
    }
    // s1 above first big bg (450x800)
    const bg = imgs.find(i => i.w >= 400 && i.h >= 700);
    if (bg) m.push(setAt(findText(f, "cjk-s1"), 24, Math.max(94, bg.a.y - 36), 22));
    else m.push(setAt(findText(f, "cjk-s1"), 24, 94, 22));
    // s2 above role row: images ~39x51
    const roles = imgs.filter(i => i.w >= 30 && i.w <= 55 && i.h >= 40 && i.h <= 70).sort((p, q) => p.a.y - q.a.y);
    if (roles.length) m.push(setAt(findText(f, "cjk-s2"), 24, Math.max(200, roles[0].a.y - 36), 22));
    else m.push(setAt(findText(f, "cjk-s2"), 24, 980, 22));
    // s3 above small icons 32 or 64
    const props = imgs.filter(i => i.w >= 24 && i.w <= 70 && i.h >= 24 && i.h <= 70 && i.a.y > (roles[0] ? roles[0].a.y + 80 : 500)).sort((p, q) => p.a.y - q.a.y);
    if (props.length) m.push(setAt(findText(f, "cjk-s3"), 24, Math.max(300, props[0].a.y - 36), 22));
    else m.push(setAt(findText(f, "cjk-s3"), 24, 1120, 22));
    moves["G06-AssetBoard"] = { m };
  }
}

// final text positions
const final = {};
for (const f of page.children) {
  if (f.type !== "FRAME" || !(f.name || "").startsWith("G0")) continue;
  const acc = [];
  collect(f, acc);
  final[f.name] = acc.filter(n => n.type === "TEXT" && (n.name || "").startsWith("cjk-")).map(n => ({
    name: n.name,
    x: Math.round(n.x * 10) / 10,
    y: Math.round(n.y * 10) / 10,
    w: Math.round((n.width || 0) * 10) / 10,
    h: Math.round((n.height || 0) * 10) / 10,
    chars: String(n.characters || "").slice(0, 24)
  }));
}
return { moves, final };
"""


def main():
    headers = session()
    log("session ok")
    dump = tool(headers, "eval_script", {"script": DUMP}, timeout=120)
    (OUT / "layout-dump.json").write_text(dump, encoding="utf-8")
    log("dump written")

    fix = tool(headers, "eval_script", {"script": FIX}, timeout=180)
    (OUT / "layout-fix.json").write_text(fix, encoding="utf-8")
    obj = json.loads(fix)
    for name, texts in (obj.get("final") or {}).items():
        log(f"== {name} ==")
        for t in texts:
            log(f"  {t['name']} ({t['x']},{t['y']}) {t['chars']}")

    # export all
    prev = OUT / "previews-v2"
    prev.mkdir(parents=True, exist_ok=True)
    frames = tool(
        headers,
        "eval_script",
        {
            "script": """
const page=(()=>{for(const p of pixso.root.children) if((p.name||"")==="Godot-UI-Replica") return p; return pixso.currentPage;})();
await pixso.setCurrentPageAsync(page);
return page.children.filter(n=>n.type==="FRAME"&&(n.name||"").startsWith("G0")).map(n=>({id:n.id,name:n.name,w:n.width}));
"""
        },
    )
    for fr in json.loads(frames):
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
    log("LAYOUT FIX DONE")


if __name__ == "__main__":
    main()
