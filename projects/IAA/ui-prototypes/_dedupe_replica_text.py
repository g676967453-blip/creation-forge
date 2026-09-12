# -*- coding: utf-8 -*-
"""Keep only cjk-* text under G0* frames; delete code_to_design duplicate text."""
from __future__ import annotations

import json
import random
import re
import sys
import urllib.request
from pathlib import Path

URI = "http://127.0.0.1:3667/mcp"
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")
OUT.mkdir(parents=True, exist_ok=True)


def log(msg: str) -> None:
    sys.stdout.buffer.write((msg + "\n").encode("utf-8", errors="replace"))
    sys.stdout.buffer.flush()


def mcp_session():
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
            "clientInfo": {"name": "dedupe-text", "version": "2"},
        },
    }
    req = urllib.request.Request(URI, data=json.dumps(init).encode("utf-8"), headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        sid = resp.headers.get("mcp-session-id")
        resp.read()
    headers["mcp-session-id"] = sid
    try:
        note = {"jsonrpc": "2.0", "method": "notifications/initialized"}
        req2 = urllib.request.Request(URI, data=json.dumps(note).encode("utf-8"), headers=headers)
        urllib.request.urlopen(req2, timeout=10).read()
    except Exception:
        pass
    return headers


def mcp_tool(headers, name, arguments, timeout=180):
    payload = {
        "jsonrpc": "2.0",
        "id": random.randint(1, 999999),
        "method": "tools/call",
        "params": {"name": name, "arguments": arguments},
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(URI, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    parts = [ln[5:].strip() for ln in raw.splitlines() if ln.startswith("data:")]
    joined = "\n".join(parts)
    obj = json.loads(joined)
    if "error" in obj:
        raise RuntimeError(json.dumps(obj["error"], ensure_ascii=False))
    content = obj.get("result", {}).get("content") or []
    return "\n".join(
        c.get("text", "") if isinstance(c, dict) else json.dumps(c, ensure_ascii=False)
        for c in content
    )


SCRIPT = r"""
const page = (() => {
  for (const p of pixso.root.children) {
    if ((p.name || "") === "Godot-UI-Replica") return p;
  }
  return pixso.currentPage;
})();
await pixso.setCurrentPageAsync(page);

function collectText(node, acc) {
  if (!node) return;
  if (node.type === "TEXT") acc.push(node);
  if (node.children) for (const c of node.children) collectText(c, acc);
}

const report = [];
for (const frame of [...page.children]) {
  if (frame.type !== "FRAME") continue;
  const name = frame.name || "";
  if (!name.startsWith("G0")) continue;

  const texts = [];
  collectText(frame, texts);
  const before = texts.length;
  const removed = [];
  const kept = [];
  const seenCjk = new Set();

  for (const t of texts) {
    const tn = t.name || "";
    if (tn.startsWith("cjk-")) {
      if (seenCjk.has(tn)) {
        try { t.remove(); removed.push(tn + "#dup"); } catch (e) {}
        continue;
      }
      seenCjk.add(tn);
      kept.push(tn);
      continue;
    }
    // delete code_to_design leftovers and any non-cjk text inside screens
    try {
      removed.push(tn || "anon");
      t.remove();
    } catch (e) {
      removed.push("fail:" + tn);
    }
  }
  report.push({
    frame: name,
    before,
    kept: kept.length,
    removed: removed.length,
    keptNames: kept,
    removedSample: removed.slice(0, 20)
  });
}

// rebuild cjk if a frame has zero cjk after cleanup
const font = { family: "Microsoft YaHei", style: "Regular" };
try { await pixso.loadFontAsync(font); } catch (e) {}

function allText(node) {
  const acc = [];
  collectText(node, acc);
  return acc;
}
function addText(frame, name, characters, x, y, size, color) {
  const t = pixso.createText();
  try { t.fontName = font; } catch (e) {}
  t.name = name;
  t.fontSize = size;
  t.characters = characters;
  t.x = x; t.y = y;
  t.fills = [{ type: "SOLID", color: color || { r: 1, g: 1, b: 1 } }];
  frame.appendChild(t);
}
function cp(...arr) { return String.fromCodePoint(...arr); }

const map = {};
for (const f of page.children) if (f.type === "FRAME") map[f.name] = f;

const gold = { r: 1, g: 0.88, b: 0.44 };
const subc = { r: 0.7, g: 0.78, b: 0.88 };
const fail = { r: 1, g: 0.4, b: 0.35 };
const hint = { r: 0.65, g: 0.72, b: 0.8 };
const sec = { r: 1, g: 0.82, b: 0.29 };

function needRebuild(frameName, minCount) {
  const f = map[frameName];
  if (!f) return false;
  const n = allText(f).filter(t => (t.name || "").startsWith("cjk-")).length;
  return n < minCount;
}

const rebuilt = [];
if (needRebuild("G01-Menu", 8)) {
  const f = map["G01-Menu"];
  for (const t of allText(f).filter(t => (t.name||"").startsWith("cjk-"))) try { t.remove(); } catch (e) {}
  addText(f, "cjk-title", cp(0x6551,0x706b,0x82f1,0x96c4), 15, 200, 28);
  addText(f, "cjk-sub", cp(0x706d,0x706b,0x6216,0x6551,0x4eba) + " · " + cp(0x53cc,0x901a,0x9053,0x8fc7,0x5173), 15, 248, 13, subc);
  addText(f, "cjk-sub2", "Godot 4.7 · IAA", 15, 268, 13, subc);
  addText(f, "cjk-stats", cp(0x6700,0x9ad8,0x5206) + " 12840  " + cp(0x91d1,0x5e01) + " 1280", 15, 300, 15, gold);
  addText(f, "cjk-char", cp(0x89d2,0x8272) + "：" + cp(0x5c0f,0x732b) + " · " + cp(0x654f,0x6377), 75, 350, 13);
  addText(f, "cjk-start", cp(0x5f00,0x59cb,0x6e38,0x620f), 95, 412, 16);
  addText(f, "cjk-n0", cp(0x5c0f,0x732b), 50, 528, 11);
  addText(f, "cjk-n1", cp(0x5c0f,0x72d7), 125, 528, 11);
  addText(f, "cjk-n2", cp(0x718a,0x732b), 200, 528, 11);
  addText(f, "cjk-n3", cp(0x5361,0x76ae), 275, 528, 11);
  addText(f, "cjk-n4", cp(0x72d0,0x72f8), 350, 528, 11);
  addText(f, "cjk-test", "+500 " + cp(0x91d1,0x5e01), 332, 50, 12);
  rebuilt.push("G01-Menu");
}
if (needRebuild("G02-InGame", 5)) {
  const f = map["G02-InGame"];
  for (const t of allText(f).filter(t => (t.name||"").startsWith("cjk-"))) try { t.remove(); } catch (e) {}
  addText(f, "cjk-h0", "3", 28, 14, 15);
  addText(f, "cjk-h1", "2460", 130, 14, 15);
  addText(f, "cjk-h2", "1280", 235, 14, 15);
  addText(f, "cjk-h3", "3", 360, 14, 15);
  addText(f, "cjk-goal", cp(0x706b) + " 5  " + cp(0x4eba) + " 3  · " + cp(0x53cc,0x901a,0x9053), 8, 48, 15);
  addText(f, "cjk-skill", cp(0x5f71,0x5206,0x8eab), 320, 575, 15);
  addText(f, "cjk-hint", "A/D · Space/Click · Esc", 25, 752, 12, hint);
  rebuilt.push("G02-InGame");
}
if (needRebuild("G03-LevelClear-Shop", 5)) {
  const f = map["G03-LevelClear-Shop"];
  for (const t of allText(f).filter(t => (t.name||"").startsWith("cjk-"))) try { t.remove(); } catch (e) {}
  addText(f, "cjk-title", cp(0x6253,0x706d,0x6210,0x529f) + "!", 15, 70, 26);
  addText(f, "cjk-stats", cp(0x672c,0x5173,0x5956,0x52b1), 15, 115, 15);
  addText(f, "cjk-stats2", cp(0x5206,0x6570) + " +860  " + cp(0x91d1,0x5e01) + " +80", 15, 138, 15);
  addText(f, "cjk-double", cp(0x770b,0x5e7f,0x544a) + " · " + cp(0x53cc,0x500d,0x91d1,0x5e01), 95, 185, 16);
  addText(f, "cjk-shop", cp(0x8865,0x7ed9,0x961f) + " · " + cp(0x8fc7,0x5173,0x8865,0x7ed9), 35, 258, 18);
  addText(f, "cjk-bal", cp(0x91d1,0x5e01) + " 1360", 35, 286, 14, gold);
  addText(f, "cjk-next", cp(0x4e0b,0x4e00,0x5173) + " →", 95, 570, 16);
  rebuilt.push("G03-LevelClear-Shop");
}
if (needRebuild("G04-GameOver", 5)) {
  const f = map["G04-GameOver"];
  for (const t of allText(f).filter(t => (t.name||"").startsWith("cjk-"))) try { t.remove(); } catch (e) {}
  addText(f, "cjk-title", cp(0x4efb,0x52a1,0x5931,0x8d25) + "...", 15, 250, 26, fail);
  addText(f, "cjk-s1", cp(0x672c,0x5c40,0x5f97,0x5206) + " 1980", 15, 310, 15);
  addText(f, "cjk-s2", cp(0x6700,0x9ad8,0x5206) + " 12840", 15, 335, 15);
  addText(f, "cjk-s3", cp(0x91d1,0x5e01) + " 1280", 15, 360, 15);
  addText(f, "cjk-s4", cp(0x5230,0x8fbe,0x7b2c) + " 3 " + cp(0x5173), 15, 385, 15);
  addText(f, "cjk-revive", cp(0x770b,0x5e7f,0x544a) + " · " + cp(0x590d,0x6d3b), 95, 440, 16);
  addText(f, "cjk-retry", cp(0x91cd,0x65b0,0x5f00,0x59cb), 95, 500, 16);
  addText(f, "cjk-menu", cp(0x4e3b,0x83dc,0x5355), 95, 560, 16);
  rebuilt.push("G04-GameOver");
}
if (needRebuild("G05-Pause", 3)) {
  const f = map["G05-Pause"];
  for (const t of allText(f).filter(t => (t.name||"").startsWith("cjk-"))) try { t.remove(); } catch (e) {}
  addText(f, "cjk-title", cp(0x5df2,0x6682,0x505c), 15, 320, 26);
  addText(f, "cjk-resume", cp(0x7ee7,0x7eed), 115, 400, 16);
  addText(f, "cjk-menu", cp(0x4e3b,0x83dc,0x5355), 115, 460, 16);
  rebuilt.push("G05-Pause");
}
if (needRebuild("G06-AssetBoard", 4)) {
  const f = map["G06-AssetBoard"];
  for (const t of allText(f).filter(t => (t.name||"").startsWith("cjk-"))) try { t.remove(); } catch (e) {}
  addText(f, "cjk-h1", "Godot PNG " + cp(0x8d44,0x4ea7,0x677f) + cp(0xff08,0x539f,0x5c3a,0x5bf8,0xff09), 24, 24, 28);
  addText(f, "cjk-h2", cp(0x573a,0x666f) + " / " + cp(0x89d2,0x8272) + " / " + cp(0x9053,0x5177), 24, 60, 14, subc);
  addText(f, "cjk-s1", cp(0x4e00,0x3001,0x573a,0x666f), 24, 94, 22, sec);
  addText(f, "cjk-s2", cp(0x4e8c,0x3001,0x89d2,0x8272), 24, 980, 22, sec);
  addText(f, "cjk-s3", cp(0x4e09,0x3001,0x9053,0x5177) + " / HUD", 24, 1120, 22, sec);
  rebuilt.push("G06-AssetBoard");
}

const final = [];
for (const f of page.children) {
  if (f.type !== "FRAME" || !(f.name || "").startsWith("G0")) continue;
  const ts = allText(f);
  final.push({
    name: f.name,
    id: f.id,
    w: f.width,
    textTotal: ts.length,
    cjk: ts.filter(t => (t.name || "").startsWith("cjk-")).length,
    otherNames: ts.filter(t => !(t.name || "").startsWith("cjk-")).map(t => t.name || "anon")
  });
}
return { report, rebuilt, final };
"""


def main():
    headers = mcp_session()
    log("session ok")
    result = mcp_tool(headers, "eval_script", {"script": SCRIPT}, timeout=180)
    (OUT / "dedupe-result.json").write_text(result, encoding="utf-8")
    obj = json.loads(result)
    log("rebuilt=" + ",".join(obj.get("rebuilt") or []))
    for row in obj.get("report") or []:
        log(
            f"{row.get('frame')}: before={row.get('before')} kept={row.get('kept')} removed={row.get('removed')}"
        )
    for row in obj.get("final") or []:
        log(
            f"final {row.get('name')}: total={row.get('textTotal')} cjk={row.get('cjk')} other={row.get('otherNames')}"
        )

    # export
    prev = OUT / "previews-v2"
    prev.mkdir(parents=True, exist_ok=True)
    for fr in obj.get("final") or []:
        exp = mcp_tool(
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
            log("export fail " + str(fr.get("name")))
            continue
        outp = prev / f"{fr['name']}.png"
        urllib.request.urlretrieve(m.group(0), outp)
        log(f"export {outp.name} {outp.stat().st_size}")
    log("DEDUPE DONE")


if __name__ == "__main__":
    main()
