$ErrorActionPreference = 'Stop'
$uri = 'http://127.0.0.1:3667/mcp'
$headers = @{
  'Content-Type' = 'application/json'
  'Accept' = 'application/json, text/event-stream'
}
$init = @{
  jsonrpc = '2.0'; id = 1; method = 'initialize'
  params = @{
    protocolVersion = '2024-11-05'
    capabilities = @{}
    clientInfo = @{ name = 'fix-text'; version = '1' }
  }
} | ConvertTo-Json -Compress -Depth 6
$r = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($init)) -TimeoutSec 30 -UseBasicParsing
$headers['mcp-session-id'] = [string]$r.Headers['mcp-session-id']
try {
  Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes('{"jsonrpc":"2.0","method":"notifications/initialized"}')) -TimeoutSec 10 -UseBasicParsing | Out-Null
} catch {}

function Invoke-McpTool([string]$Name, $Arguments, [int]$TimeoutSec = 120) {
  $payload = @{
    jsonrpc = '2.0'
    id = Get-Random -Maximum 999999
    method = 'tools/call'
    params = @{ name = $Name; arguments = $Arguments }
  } | ConvertTo-Json -Depth 30 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
  $resp = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $bytes -TimeoutSec $TimeoutSec -UseBasicParsing
  $parts = @()
  foreach ($line in ($resp.Content -split "`n")) {
    if ($line.StartsWith('data:')) { $parts += $line.Substring(5).Trim() }
  }
  return ($parts -join "`n")
}
function Get-McpText([string]$Raw) {
  try {
    $obj = $Raw | ConvertFrom-Json
    if ($obj.error) { return ('ERROR: ' + ($obj.error | ConvertTo-Json -Compress -Depth 8)) }
    if ($obj.result -and $obj.result.content) {
      return (($obj.result.content | ForEach-Object { if ($_.text) { $_.text } else { $_ | ConvertTo-Json -Compress } }) -join "`n")
    }
    return $Raw
  } catch { return $Raw }
}

$raw = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
let page = null;
for (const p of pixso.root.children) {
  if ((p.name || "") === "Godot-UI-Replica") { page = p; break; }
}
await pixso.setCurrentPageAsync(page);
function analyze(frame) {
  const counts = {};
  const texts = [];
  function walk(n, d) {
    const t = n.type || "?";
    counts[t] = (counts[t] || 0) + 1;
    if (n.type === "TEXT") {
      const ch = String(n.characters || "");
      texts.push({
        name: n.name || "",
        len: ch.length,
        // codepoints to avoid transport mojibake ambiguity
        cps: Array.from(ch).slice(0, 12).map(c => c.codePointAt(0)),
        font: n.fontName || null,
        x: n.x, y: n.y, w: n.width, h: n.height
      });
    }
    if (n.children && d < 8) for (const c of n.children) walk(c, d + 1);
  }
  walk(frame, 0);
  return { name: frame.name, id: frame.id, w: frame.width, h: frame.height, x: frame.x, y: frame.y, counts, texts: texts.slice(0, 20), textCount: texts.length };
}
const frames = page.children.filter(n => n.type === "FRAME").map(analyze);
return { page: page.name, frames };
'@ }

$out = 'J:\ceshi\projects\IAA\ui-prototypes\godot-replica\text-analysis.json'
$text = Get-McpText $raw
[IO.File]::WriteAllText($out, $text, [Text.UTF8Encoding]::new($false))
Write-Output $text

# If G05 missing, reimport only it
$obj = $text | ConvertFrom-Json
$names = @($obj.frames | ForEach-Object { $_.name })
Write-Output ("names=" + ($names -join ','))
if ($names -notcontains 'G05-Pause') {
  Write-Output 'REIMPORT G05'
  $html = [IO.File]::ReadAllText('J:\ceshi\projects\IAA\ui-prototypes\godot-replica\screens-v2\G05-Pause.html', [Text.Encoding]::UTF8)
  Write-Output (Get-McpText (Invoke-McpTool -Name 'code_to_design' -Arguments @{ htmlStr = $html; width = 450; height = 800 } -TimeoutSec 360))
  Write-Output (Get-McpText (Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
function findPhones(node, acc) {
  if (!node) return;
  const name = (node.name || "").toLowerCase();
  if (node.type === "FRAME" && name.indexOf("phone") >= 0) acc.push(node);
  if (node.children) for (const c of node.children) findPhones(c, acc);
}
const phones = [];
for (const c of page.children) findPhones(c, phones);
const named = /^G0[1-6]-/;
let phone = null;
for (let i = phones.length - 1; i >= 0; i--) {
  if (!named.test(phones[i].name || "")) { phone = phones[i]; break; }
}
if (!phone) {
  const tops = page.children.filter(n => n.type === "FRAME" && !named.test(n.name || ""));
  phone = tops[tops.length - 1];
}
if (phone.parent && phone.parent.id !== page.id) page.appendChild(phone);
phone.name = "G05-Pause";
phone.x = 550; phone.y = 940;
try { phone.resize(450, 800); } catch (e) {}
for (const c of [...page.children]) {
  if (named.test(c.name || "") || (c.name || "").startsWith("label-")) continue;
  let has = false;
  function scan(n){ if(!n)return; if(named.test(n.name||"")) has=true; if(n.children) for(const x of n.children) scan(x);} scan(c);
  if (!has) try { c.remove(); } catch(e) {}
}
return { id: phone.id, name: phone.name };
'@ }))
}

# Rewrite critical Chinese texts if codepoints wrong / missing, using set characters with YaHei
$rewrite = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
const font = { family: "Microsoft YaHei", style: "Regular" };
try { await pixso.loadFontAsync(font); } catch (e) {}
try { await pixso.loadFontAsync({ family: "Microsoft YaHei", style: "Bold" }); } catch (e) {}

function allText(frame) {
  const acc = [];
  function w(n) {
    if (n.type === "TEXT") acc.push(n);
    if (n.children) for (const c of n.children) w(c);
  }
  w(frame);
  return acc;
}

function setText(node, str, size) {
  try { node.fontName = font; } catch (e) {}
  if (size) try { node.fontSize = size; } catch (e) {}
  node.characters = str;
}

const specs = {
  "G01-Menu": [
    { match: /Godot|IAA|Menu|Start|title/i, preferY: [180, 230], text: "救火英雄", size: 28 },
  ],
};

// More robust: for each frame, if no CJK text, inject overlay titles via createText
function hasCJK(frame) {
  for (const t of allText(frame)) {
    if (/[\u4e00-\u9fff]/.test(t.characters || "")) return true;
  }
  return false;
}

function clearInjected(frame) {
  for (const t of allText(frame)) {
    if ((t.name || "").startsWith("cjk-")) t.remove();
  }
}

const injected = [];
for (const frame of page.children) {
  if (frame.type !== "FRAME" || !(frame.name || "").startsWith("G0")) continue;
  const cjk = hasCJK(frame);
  const texts = allText(frame).map(t => t.characters);
  if (frame.name === "G01-Menu") {
    clearInjected(frame);
    // Always force key labels as named text nodes for correctness
    const items = [
      { name: "cjk-title", text: "救火英雄", x: 15, y: 200, size: 28, w: 420 },
      { name: "cjk-sub", text: "灭火或救人 · 双通道过关\nGodot 4.7 · IAA 验证版", x: 15, y: 248, size: 13, w: 420 },
      { name: "cjk-stats", text: "最高分 12840　金币 1280", x: 15, y: 300, size: 15, w: 420 },
      { name: "cjk-char", text: "角色：小猫 · 敏捷（点击切换）", x: 75, y: 350, size: 13, w: 300 },
      { name: "cjk-start", text: "开始游戏", x: 95, y: 410, size: 16, w: 260 },
      { name: "cjk-n0", text: "小猫", x: 50, y: 528, size: 11, w: 64 },
      { name: "cjk-n1", text: "小狗", x: 125, y: 528, size: 11, w: 64 },
      { name: "cjk-n2", text: "熊猫", x: 200, y: 528, size: 11, w: 64 },
      { name: "cjk-n3", text: "卡皮", x: 275, y: 528, size: 11, w: 64 },
      { name: "cjk-n4", text: "狐狸", x: 350, y: 528, size: 11, w: 64 },
      { name: "cjk-test", text: "+500 金币", x: 332, y: 50, size: 12, w: 110 },
    ];
    for (const it of items) {
      const t = pixso.createText();
      try { t.fontName = font; } catch (e) {}
      t.fontSize = it.size;
      t.characters = it.text;
      t.name = it.name;
      t.x = it.x; t.y = it.y;
      try { t.resize(it.w, it.size * (it.text.includes("\n") ? 2.4 : 1.4)); } catch (e) {}
      t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      if (it.name === "cjk-stats") t.fills = [{ type: "SOLID", color: { r: 1, g: 0.88, b: 0.44 } }];
      if (it.name === "cjk-sub") t.fills = [{ type: "SOLID", color: { r: 0.7, g: 0.78, b: 0.88 } }];
      frame.appendChild(t);
      injected.push(it.name);
    }
  }
  if (frame.name === "G02-InGame") {
    clearInjected(frame);
    const items = [
      { name: "cjk-goal", text: "火 5　人 3　· 双通道", x: 8, y: 44, size: 15, w: 434 },
      { name: "cjk-skill", text: "影分身", x: 300, y: 575, size: 15, w: 130 },
      { name: "cjk-hint", text: "A/D 或拖拽移动 · 空格/点击发射 · Esc 暂停", x: 25, y: 752, size: 12, w: 400 },
      { name: "cjk-h0", text: "3", x: 28, y: 14, size: 15, w: 40 },
      { name: "cjk-h1", text: "2460", x: 130, y: 14, size: 15, w: 60 },
      { name: "cjk-h2", text: "1280", x: 235, y: 14, size: 15, w: 60 },
      { name: "cjk-h3", text: "3", x: 360, y: 14, size: 15, w: 40 },
    ];
    for (const it of items) {
      const t = pixso.createText();
      try { t.fontName = font; } catch (e) {}
      t.fontSize = it.size; t.characters = it.text; t.name = it.name;
      t.x = it.x; t.y = it.y;
      t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      if (it.name === "cjk-hint") t.fills = [{ type: "SOLID", color: { r: 0.65, g: 0.72, b: 0.8 } }];
      frame.appendChild(t);
      injected.push(it.name);
    }
  }
  if (frame.name === "G03-LevelClear-Shop") {
    clearInjected(frame);
    const items = [
      { name: "cjk-title", text: "扑灭成功！", x: 15, y: 70, size: 26, w: 420 },
      { name: "cjk-stats", text: "本关奖励\n分数 +860　金币 +80", x: 15, y: 115, size: 15, w: 420 },
      { name: "cjk-double", text: "看广告 · 双倍金币", x: 95, y: 185, size: 16, w: 260 },
      { name: "cjk-shop", text: "补给队 · 过关补给", x: 35, y: 258, size: 18, w: 380 },
      { name: "cjk-bal", text: "金币 1360", x: 35, y: 286, size: 14, w: 380 },
      { name: "cjk-next", text: "下一关 →", x: 95, y: 570, size: 16, w: 260 },
    ];
    for (const it of items) {
      const t = pixso.createText();
      try { t.fontName = font; } catch (e) {}
      t.fontSize = it.size; t.characters = it.text; t.name = it.name;
      t.x = it.x; t.y = it.y;
      t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      if (it.name === "cjk-bal") t.fills = [{ type: "SOLID", color: { r: 1, g: 0.88, b: 0.44 } }];
      frame.appendChild(t);
      injected.push(it.name);
    }
  }
  if (frame.name === "G04-GameOver") {
    clearInjected(frame);
    const items = [
      { name: "cjk-title", text: "任务失败…", x: 15, y: 250, size: 26, w: 420 },
      { name: "cjk-stats", text: "本局得分 1980\n最高分 12840\n金币 1280\n到达第 3 关", x: 15, y: 310, size: 15, w: 420 },
      { name: "cjk-revive", text: "看广告 · 复活", x: 95, y: 440, size: 16, w: 260 },
      { name: "cjk-retry", text: "重新开始", x: 95, y: 500, size: 16, w: 260 },
      { name: "cjk-menu", text: "主菜单", x: 95, y: 560, size: 16, w: 260 },
    ];
    for (const it of items) {
      const t = pixso.createText();
      try { t.fontName = font; } catch (e) {}
      t.fontSize = it.size; t.characters = it.text; t.name = it.name;
      t.x = it.x; t.y = it.y;
      t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      if (it.name === "cjk-title") t.fills = [{ type: "SOLID", color: { r: 1, g: 0.4, b: 0.35 } }];
      frame.appendChild(t);
      injected.push(it.name);
    }
  }
  if (frame.name === "G05-Pause") {
    clearInjected(frame);
    const items = [
      { name: "cjk-title", text: "已暂停", x: 15, y: 320, size: 26, w: 420 },
      { name: "cjk-resume", text: "继续", x: 115, y: 400, size: 16, w: 220 },
      { name: "cjk-menu", text: "主菜单", x: 115, y: 460, size: 16, w: 220 },
    ];
    for (const it of items) {
      const t = pixso.createText();
      try { t.fontName = font; } catch (e) {}
      t.fontSize = it.size; t.characters = it.text; t.name = it.name;
      t.x = it.x; t.y = it.y;
      t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      frame.appendChild(t);
      injected.push(it.name);
    }
  }
  if (frame.name === "G06-AssetBoard") {
    clearInjected(frame);
    const items = [
      { name: "cjk-h1", text: "Godot PNG 资产板（原尺寸）", x: 24, y: 24, size: 28, w: 800 },
      { name: "cjk-h2", text: "按板块分区 · 场景 / 角色 / 道具 · 非 450×800 强行画板", x: 24, y: 60, size: 14, w: 900 },
      { name: "cjk-s1", text: "一、场景", x: 24, y: 94, size: 22, w: 400 },
      { name: "cjk-s2", text: "二、角色", x: 24, y: 980, size: 22, w: 400 },
      { name: "cjk-s3", text: "三、道具 / HUD 图标", x: 24, y: 1120, size: 22, w: 500 },
    ];
    for (const it of items) {
      const t = pixso.createText();
      try { t.fontName = font; } catch (e) {}
      t.fontSize = it.size; t.characters = it.text; t.name = it.name;
      t.x = it.x; t.y = it.y;
      t.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      if (it.name.startsWith("cjk-s")) t.fills = [{ type: "SOLID", color: { r: 1, g: 0.82, b: 0.29 } }];
      frame.appendChild(t);
      injected.push(it.name);
    }
  }
}

// verify CJK codepoints on G01
const g01 = page.children.find(n => n.name === "G01-Menu");
let titleCps = [];
if (g01) {
  for (const t of allText(g01)) {
    if (t.name === "cjk-title") titleCps = Array.from(String(t.characters)).map(c => c.codePointAt(0));
  }
}
return {
  injectedCount: injected.length,
  frames: page.children.filter(n => n.type === "FRAME").map(n => n.name),
  titleCps,
  titleOk: titleCps.join(",") === "25945,28779,33521,38596"
};
'@ }

$rw = Get-McpText $rewrite
Write-Output ('REWRITE: ' + $rw)
[IO.File]::WriteAllText('J:\ceshi\projects\IAA\ui-prototypes\godot-replica\text-rewrite.json', $rw, [Text.UTF8Encoding]::new($false))

# re-export previews
$prev = 'J:\ceshi\projects\IAA\ui-prototypes\godot-replica\previews-v2'
New-Item -ItemType Directory -Force -Path $prev | Out-Null
$list = Get-McpText (Invoke-McpTool -Name 'eval_script' -Arguments @{ script = 'return pixso.currentPage.children.filter(n=>n.type==="FRAME"&&(n.name||"").startsWith("G0")).map(n=>({id:n.id,name:n.name,w:n.width}));' })
$frames = $list | ConvertFrom-Json
foreach ($f in @($frames)) {
  $exp = Invoke-McpTool -Name 'get_export_image' -Arguments @{
    guid = $f.id
    exportSettings = @{ constraint = @{ type = 2; value = [Math]::Min(900, [Math]::Max(300, [int]$f.w)) }; imageType = 1 }
  } -TimeoutSec 90
  $et = Get-McpText $exp
  if ($et -match 'http://localhost:3667/export/[a-f0-9\-]+\.png') {
    $png = Join-Path $prev ("$($f.name).png")
    Invoke-WebRequest -Uri $Matches[0] -OutFile $png -TimeoutSec 40 -UseBasicParsing
    Write-Output "export $($f.name) $((Get-Item $png).Length)"
  }
}
Write-Output 'FIX DONE'
