# -*- coding: utf-8 -*-
"""Fix CJK labels on Godot-UI-Replica via Pixso MCP using unicode escapes only in transport."""
from __future__ import annotations

import json
import random
import urllib.request
from pathlib import Path

URI = "http://127.0.0.1:3667/mcp"
OUT = Path(r"J:\ceshi\projects\IAA\ui-prototypes\godot-replica")


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
            "clientInfo": {"name": "cjk-fix", "version": "1"},
        },
    }
    req = urllib.request.Request(URI, data=json.dumps(init).encode("utf-8"), headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        sid = resp.headers.get("mcp-session-id")
        body = resp.read()
    headers["mcp-session-id"] = sid
    note = {"jsonrpc": "2.0", "method": "notifications/initialized"}
    try:
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
    parts = []
    for line in raw.splitlines():
        if line.startswith("data:"):
            parts.append(line[5:].strip())
    joined = "\n".join(parts)
    try:
        obj = json.loads(joined)
    except Exception:
        return joined
    if "error" in obj:
        return "ERROR: " + json.dumps(obj["error"], ensure_ascii=False)
    content = obj.get("result", {}).get("content") or []
    texts = []
    for c in content:
        if isinstance(c, dict) and "text" in c:
            texts.append(c["text"])
        else:
            texts.append(json.dumps(c, ensure_ascii=False))
    return "\n".join(texts)


def u(s: str) -> str:
    """JS string literal with only \\u escapes."""
    return '"' + "".join(f"\\u{ord(ch):04x}" for ch in s) + '"'


# Build inject script with unicode-escaped Chinese only
script = f"""
const page = (() => {{
  for (const p of pixso.root.children) {{
    if ((p.name || "") === "Godot-UI-Replica") return p;
  }}
  return pixso.currentPage;
}})();
await pixso.setCurrentPageAsync(page);
page.name = "Godot-UI-Replica";

const font = {{ family: "Microsoft YaHei", style: "Regular" }};
try {{ await pixso.loadFontAsync(font); }} catch (e) {{}}
try {{ await pixso.loadFontAsync({{ family: "Microsoft YaHei", style: "Bold" }}); }} catch (e) {{}}

function allText(node) {{
  const acc = [];
  function w(n) {{
    if (!n) return;
    if (n.type === "TEXT") acc.push(n);
    if (n.children) for (const c of n.children) w(c);
  }}
  w(node);
  return acc;
}}

function clearInjected(frame) {{
  for (const t of allText(frame)) {{
    if ((t.name || "").startsWith("cjk-")) {{
      try {{ t.remove(); }} catch (e) {{}}
    }}
  }}
}}

function addText(frame, name, characters, x, y, size, color) {{
  const t = pixso.createText();
  try {{ t.fontName = font; }} catch (e) {{}}
  t.name = name;
  t.fontSize = size;
  t.characters = characters;
  t.x = x; t.y = y;
  const col = color || {{ r: 1, g: 1, b: 1 }};
  t.fills = [{{ type: "SOLID", color: col }}];
  frame.appendChild(t);
  return t;
}}

const gold = {{ r: 1, g: 0.88, b: 0.44 }};
const subc = {{ r: 0.7, g: 0.78, b: 0.88 }};
const fail = {{ r: 1, g: 0.4, b: 0.35 }};
const hint = {{ r: 0.65, g: 0.72, b: 0.8 }};
const sec = {{ r: 1, g: 0.82, b: 0.29 }};

const map = {{}};
for (const f of page.children) {{
  if (f.type === "FRAME") map[f.name] = f;
}}

// Ensure G05 exists flag
let hasG05 = !!map["G05-Pause"];

if (map["G01-Menu"]) {{
  const f = map["G01-Menu"];
  clearInjected(f);
  addText(f, "cjk-title", {u("救火英雄")}, 15, 200, 28);
  addText(f, "cjk-sub", {u("灭火或救人 · 双通道过关")}, 15, 248, 13, subc);
  addText(f, "cjk-sub2", {u("Godot 4.7 · IAA 验证版")}, 15, 268, 13, subc);
  addText(f, "cjk-stats", {u("最高分 12840　金币 1280")}, 15, 300, 15, gold);
  addText(f, "cjk-char", {u("角色：小猫 · 敏捷（点击切换）")}, 75, 350, 13);
  addText(f, "cjk-start", {u("开始游戏")}, 95, 412, 16);
  addText(f, "cjk-n0", {u("小猫")}, 50, 528, 11);
  addText(f, "cjk-n1", {u("小狗")}, 125, 528, 11);
  addText(f, "cjk-n2", {u("熊猫")}, 200, 528, 11);
  addText(f, "cjk-n3", {u("卡皮")}, 275, 528, 11);
  addText(f, "cjk-n4", {u("狐狸")}, 350, 528, 11);
  addText(f, "cjk-test", {u("+500 金币")}, 332, 50, 12);
}}

if (map["G02-InGame"]) {{
  const f = map["G02-InGame"];
  clearInjected(f);
  addText(f, "cjk-h0", "3", 28, 14, 15);
  addText(f, "cjk-h1", "2460", 130, 14, 15);
  addText(f, "cjk-h2", "1280", 235, 14, 15);
  addText(f, "cjk-h3", "3", 360, 14, 15);
  addText(f, "cjk-goal", {u("火 5　人 3　· 双通道")}, 8, 48, 15);
  addText(f, "cjk-skill", {u("影分身")}, 320, 575, 15);
  addText(f, "cjk-hint", {u("A/D 或拖拽移动 · 空格/点击发射 · Esc 暂停")}, 25, 752, 12, hint);
}}

if (map["G03-LevelClear-Shop"]) {{
  const f = map["G03-LevelClear-Shop"];
  clearInjected(f);
  addText(f, "cjk-title", {u("扑灭成功！")}, 15, 70, 26);
  addText(f, "cjk-stats", {u("本关奖励")}, 15, 115, 15);
  addText(f, "cjk-stats2", {u("分数 +860　金币 +80")}, 15, 138, 15);
  addText(f, "cjk-double", {u("看广告 · 双倍金币")}, 95, 185, 16);
  addText(f, "cjk-shop", {u("补给队 · 过关补给")}, 35, 258, 18);
  addText(f, "cjk-bal", {u("金币 1360")}, 35, 286, 14, gold);
  addText(f, "cjk-r0", {u("熊猫 · 力量：灭火效率+1级")}, 85, 320, 12);
  addText(f, "cjk-r1", {u("长条 · 蹦床加长 8 秒")}, 85, 366, 12);
  addText(f, "cjk-r2", {u("灭火器 · 下关首次着火自灭")}, 85, 412, 12);
  addText(f, "cjk-r3", {u("1UP · 灭火等级 +1")}, 85, 458, 12);
  addText(f, "cjk-r4", {u("商品不满意？")}, 50, 504, 12);
  addText(f, "cjk-next", {u("下一关 →")}, 95, 570, 16);
}}

if (map["G04-GameOver"]) {{
  const f = map["G04-GameOver"];
  clearInjected(f);
  addText(f, "cjk-title", {u("任务失败…")}, 15, 250, 26, fail);
  addText(f, "cjk-s1", {u("本局得分 1980")}, 15, 310, 15);
  addText(f, "cjk-s2", {u("最高分 12840")}, 15, 335, 15);
  addText(f, "cjk-s3", {u("金币 1280")}, 15, 360, 15);
  addText(f, "cjk-s4", {u("到达第 3 关")}, 15, 385, 15);
  addText(f, "cjk-revive", {u("看广告 · 复活")}, 95, 440, 16);
  addText(f, "cjk-retry", {u("重新开始")}, 95, 500, 16);
  addText(f, "cjk-menu", {u("主菜单")}, 95, 560, 16);
}}

if (map["G05-Pause"]) {{
  const f = map["G05-Pause"];
  clearInjected(f);
  addText(f, "cjk-title", {u("已暂停")}, 15, 320, 26);
  addText(f, "cjk-resume", {u("继续")}, 115, 400, 16);
  addText(f, "cjk-menu", {u("主菜单")}, 115, 460, 16);
}}

if (map["G06-AssetBoard"]) {{
  const f = map["G06-AssetBoard"];
  clearInjected(f);
  addText(f, "cjk-h1", {u("Godot PNG 资产板（原尺寸）")}, 24, 24, 28);
  addText(f, "cjk-h2", {u("按板块分区 · 场景 / 角色 / 道具 · 非 450×800 强行画板")}, 24, 60, 14, subc);
  addText(f, "cjk-s1", {u("一、场景")}, 24, 94, 22, sec);
  addText(f, "cjk-s2", {u("二、角色")}, 24, 980, 22, sec);
  addText(f, "cjk-s3", {u("三、道具 / HUD 图标")}, 24, 1120, 22, sec);
}}

// labels
for (const c of [...page.children]) {{
  if ((c.name || "").startsWith("label-G")) try {{ c.remove(); }} catch (e) {{}}
}}
for (const frame of page.children) {{
  if (frame.type !== "FRAME" || !(frame.name || "").startsWith("G0")) continue;
  const t = pixso.createText();
  try {{ t.fontName = font; }} catch (e) {{}}
  t.characters = frame.name;
  t.fontSize = 22;
  t.fills = [{{ type: "SOLID", color: sec }}];
  t.name = "label-" + frame.name;
  t.x = frame.x; t.y = frame.y - 36;
  page.appendChild(t);
}}

const g01 = map["G01-Menu"];
let title = "";
if (g01) {{
  for (const t of allText(g01)) if (t.name === "cjk-title") title = String(t.characters || "");
}}
return {{
  hasG05,
  frames: page.children.filter(n => n.type === "FRAME").map(n => ({{ name: n.name, id: n.id, w: n.width, h: n.height, x: n.x, y: n.y }})),
  title,
  titleOk: title === {u("救火英雄")}
}};
"""

headers = mcp_session()
print("session ok")

# If G05 missing, import first
status = mcp_tool(
    headers,
    "eval_script",
    {
        "script": """
let page=null; for (const p of pixso.root.children) if ((p.name||"")==="Godot-UI-Replica") page=p;
await pixso.setCurrentPageAsync(page);
return page.children.filter(n=>n.type==="FRAME").map(n=>n.name);
"""
    },
)
print("frames before:", status)
names = []
try:
    names = json.loads(status)
except Exception:
    pass

if "G05-Pause" not in names:
    html = (OUT / "screens-v2" / "G05-Pause.html").read_text(encoding="utf-8")
    print("import G05...")
    print(mcp_tool(headers, "code_to_design", {"htmlStr": html, "width": 450, "height": 800}, timeout=360))
    print(
        mcp_tool(
            headers,
            "eval_script",
            {
                "script": """
const page = pixso.currentPage;
function findPhones(node, acc) {
  if (!node) return;
  const name = (node.name || '').toLowerCase();
  if (node.type === 'FRAME' && (name.indexOf('phone')>=0 || name.indexOf('board')>=0)) acc.push(node);
  if (node.children) for (const c of node.children) findPhones(c, acc);
}
const phones=[]; for (const c of page.children) findPhones(c, phones);
const named=/^G0[1-6]-/;
let phone=null;
for (let i=phones.length-1;i>=0;i--) if (!named.test(phones[i].name||'')) { phone=phones[i]; break; }
if (!phone) {
  const tops=page.children.filter(n=>n.type==='FRAME' && !named.test(n.name||''));
  phone=tops[tops.length-1];
}
if (phone.parent && phone.parent.id!==page.id) page.appendChild(phone);
phone.name='G05-Pause'; phone.x=550; phone.y=940;
try { phone.resize(450,800); } catch(e) {}
for (const c of [...page.children]) {
  if (named.test(c.name||'') || (c.name||'').startsWith('label-')) continue;
  let has=false; function scan(n){ if(!n)return; if(named.test(n.name||'')) has=true; if(n.children) for (const x of n.children) scan(x);} scan(c);
  if (!has) try{c.remove();}catch(e){}
}
return {id:phone.id,name:phone.name,w:phone.width,h:phone.height};
"""
            },
        )
    )

result = mcp_tool(headers, "eval_script", {"script": script}, timeout=120)
print("rewrite:", result)
(OUT / "cjk-fix-result.json").write_text(result, encoding="utf-8")

# export
try:
    obj = json.loads(result)
except Exception as e:
    print("parse fail", e)
    raise SystemExit(1)

prev = OUT / "previews-v2"
prev.mkdir(parents=True, exist_ok=True)
for fr in obj.get("frames", []):
    if not str(fr.get("name", "")).startswith("G0"):
        continue
    exp = mcp_tool(
        headers,
        "get_export_image",
        {
            "guid": fr["id"],
            "exportSettings": {
                "constraint": {"type": 2, "value": min(900, max(300, int(fr.get("w", 450))))},
                "imageType": 1,
            },
        },
        timeout=90,
    )
    import re

    m = re.search(r"http://localhost:3667/export/[a-f0-9\-]+\.png", exp)
    if not m:
        print("export fail", fr["name"], exp[:120])
        continue
    url = m.group(0)
    outp = prev / f"{fr['name']}.png"
    urllib.request.urlretrieve(url, outp)
    print("export", outp.name, outp.stat().st_size)

print("titleOk", obj.get("titleOk"), "title", obj.get("title"))
print("DONE")
