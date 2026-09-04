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
    clientInfo = @{ name = 'dsh-rank2'; version = '1' }
  }
} | ConvertTo-Json -Compress -Depth 8
$r = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($init)) -TimeoutSec 30 -UseBasicParsing
$headers['mcp-session-id'] = [string]$r.Headers['mcp-session-id']
try {
  Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes('{"jsonrpc":"2.0","method":"notifications/initialized"}')) -TimeoutSec 10 -UseBasicParsing | Out-Null
} catch {}

function Invoke-McpTool([string]$Name, $Arguments, [int]$TimeoutSec = 180) {
  $payload = @{
    jsonrpc = '2.0'
    id = Get-Random -Maximum 999999
    method = 'tools/call'
    params = @{ name = $Name; arguments = $Arguments }
  } | ConvertTo-Json -Depth 40 -Compress
  $resp = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($payload)) -TimeoutSec $TimeoutSec -UseBasicParsing
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

# 1) Restore Pause if it was renamed, remove bad 09/label
$fix = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
const out = { actions: [] };
// If 09-FriendRank exists but content is pause (has "继续游戏"), rename back
for (const c of [...page.children]) {
  if ((c.name || "") === "label-09-FriendRank") { c.remove(); out.actions.push("removed bad label"); }
}
const f09 = page.children.find(n => n.name === "09-FriendRank");
if (f09) {
  // check texts
  const texts = [];
  function walk(n,d){ if(d>5)return; if(n.type==="TEXT"&&n.characters) texts.push(n.characters); if(n.children) for(const x of n.children) walk(x,d+1); }
  walk(f09,0);
  const joined = texts.join("|");
  if (joined.indexOf("继续游戏") >= 0 || joined.indexOf("已暂停") >= 0 || joined.indexOf("主菜单") >= 0 && texts.length <= 8) {
    f09.name = "08-Pause";
    f09.x = 1590;
    f09.y = 920;
    out.actions.push("restored 08-Pause from misnamed 09");
    out.pauseTexts = texts;
  } else {
    // leftover failed rank? remove to reimport clean
    out.actions.push("found 09 with other content, will remove for reimport");
    out.otherTexts = texts.slice(0,20);
    f09.remove();
  }
}
// ensure 08 label
for (const c of [...page.children]) if ((c.name||"") === "label-08-Pause") c.remove();
const pause = page.children.find(n => n.name === "08-Pause");
if (pause) {
  let font = { family: "Inter", style: "Bold" };
  try { await pixso.loadFontAsync(font); } catch(e) { font = { family: "Roboto", style: "Bold" }; try{await pixso.loadFontAsync(font);}catch(e2){} }
  const t = pixso.createText();
  try { t.fontName = font; } catch(e) {}
  t.characters = "08 Pause";
  t.fontSize = 24;
  t.fills = [{ type: "SOLID", color: { r: 1, g: 0.82, b: 0.29 } }];
  t.name = "label-08-Pause";
  t.x = pause.x; t.y = pause.y - 40;
  page.appendChild(t);
  out.actions.push("relabeled 08");
}
out.frames = page.children.filter(n=>n.type==="FRAME").map(n=>({id:n.id,name:n.name,x:n.x,y:n.y}));
return out;
'@ }
Write-Output ('RESTORE: ' + (Get-McpText $fix))

# 2) Import with required width/height
$htmlPath = 'J:\ceshi\projects\IAA\ui-prototypes\screens\09-friend-rank.html'
$html = [IO.File]::ReadAllText($htmlPath, [Text.Encoding]::UTF8)
Write-Output ("import len=" + $html.Length)
$c2d = Invoke-McpTool -Name 'code_to_design' -Arguments @{
  htmlStr = $html
  width = 450
  height = 800
} -TimeoutSec 180
Write-Output ('C2D: ' + (Get-McpText $c2d))

# 3) Place new phone as 09
$place = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
function findPhones(node, acc) {
  if (!node) return;
  const name = (node.name || "").toLowerCase();
  if (node.type === "FRAME" && name.indexOf("phone") >= 0) acc.push(node);
  if (node.children) for (const c of node.children) findPhones(c, acc);
}
const phones = [];
for (const c of page.children) findPhones(c, phones);
const named = /^(01|02|03|04|05|06|07|08|09)-/;
let phone = null;
for (let i = phones.length - 1; i >= 0; i--) {
  if (!named.test(phones[i].name || "")) { phone = phones[i]; break; }
}
if (!phone) {
  // newest frame not in named set
  const tops = page.children.filter(n => n.type === "FRAME" && !named.test(n.name||"") && !(n.name||"").startsWith("label-"));
  phone = tops[tops.length - 1];
  // or nested under html
  if (!phone) {
    for (const c of page.children) {
      if ((c.name||"").toLowerCase() === "html" || (c.name||"").toLowerCase() === "body") {
        findPhones(c, phones);
      }
    }
    for (let i = phones.length - 1; i >= 0; i--) {
      if (!named.test(phones[i].name || "")) { phone = phones[i]; break; }
    }
  }
}
if (!phone) return { error: "no phone", tops: page.children.map(n=>({id:n.id,name:n.name,type:n.type})) };
if (phone.parent && phone.parent.id !== page.id) page.appendChild(phone);
phone.name = "09-FriendRank";
phone.x = 0;
phone.y = 1840;
try { if ("resize" in phone) phone.resize(450, 800); } catch (e) {}

// cleanup orphan wrappers
for (const c of [...page.children]) {
  if ((c.name || "").startsWith("label-")) continue;
  if (named.test(c.name || "")) continue;
  let has = false;
  function scan(n){ if(!n)return; if(named.test(n.name||"")) has=true; if(n.children) for(const x of n.children) scan(x); }
  scan(c);
  if (!has) { try { c.remove(); } catch(e) {} }
}

for (const c of [...page.children]) if ((c.name||"") === "label-09-FriendRank") c.remove();
let font = { family: "Inter", style: "Bold" };
try { await pixso.loadFontAsync(font); } catch(e) { font={family:"Roboto",style:"Bold"}; try{await pixso.loadFontAsync(font);}catch(e2){} }
const t = pixso.createText();
try { t.fontName = font; } catch(e) {}
t.characters = "09 FriendRank";
t.fontSize = 24;
t.fills = [{ type: "SOLID", color: { r: 1, g: 0.82, b: 0.29 } }];
t.name = "label-09-FriendRank";
t.x = phone.x; t.y = phone.y - 40;
page.appendChild(t);

function collectText(n, acc, depth) {
  if (depth > 6) return;
  if (n.type === "TEXT" && n.characters) acc.push(String(n.characters));
  if (n.children) for (const c of n.children.slice(0, 60)) collectText(c, acc, depth + 1);
}
const texts = [];
collectText(phone, texts, 0);
return {
  placed: { id: phone.id, name: phone.name, x: phone.x, y: phone.y, w: phone.width, h: phone.height },
  texts: texts.slice(0, 40),
  frames: page.children.filter(n => n.type === "FRAME" && named.test(n.name||"")).map(n => ({id:n.id,name:n.name,x:n.x,y:n.y}))
};
'@ }
$placeText = Get-McpText $place
Write-Output ('PLACE: ' + $placeText)
[IO.File]::WriteAllText('J:\ceshi\projects\IAA\ui-prototypes\pixso-previews\qa-09.json', $placeText, [Text.UTF8Encoding]::new($false))

$id = $null
try { $id = ($placeText | ConvertFrom-Json).placed.id } catch {}
if (-not $id) {
  $id = (Get-McpText (Invoke-McpTool -Name 'eval_script' -Arguments @{ script = 'const n=pixso.currentPage.children.find(x=>x.name==="09-FriendRank"); return n?n.id:null;' })).Trim('"')
}
Write-Output ("id=" + $id)
if ($id -and $id -ne 'null') {
  $exp = Invoke-McpTool -Name 'get_export_image' -Arguments @{
    guid = $id
    exportSettings = @{ constraint = @{ type = 2; value = 450 }; imageType = 1 }
  }
  $text = Get-McpText $exp
  $outDir = 'J:\ceshi\projects\IAA\ui-prototypes\pixso-previews'
  if ($text -match 'http://localhost:3667/export/[a-f0-9\-]+\.png') {
    Invoke-WebRequest -Uri $Matches[0] -OutFile (Join-Path $outDir '09-FriendRank.png') -TimeoutSec 30 -UseBasicParsing
    Write-Output ("png size=" + (Get-Item (Join-Path $outDir '09-FriendRank.png')).Length)
  }
  $shot = Invoke-McpTool -Name 'take_screenshot' -Arguments @{ nodeIds = @($id) }
  try {
    $so = $shot | ConvertFrom-Json
    foreach ($c in $so.result.content) {
      $b64 = $null
      if ($c.data) { $b64 = $c.data }
      elseif ($c.text) {
        $m = [regex]::Match($c.text, 'data:image/png;base64,([A-Za-z0-9+/=]+)')
        if ($m.Success) { $b64 = $m.Groups[1].Value }
      }
      if ($b64) {
        [IO.File]::WriteAllBytes((Join-Path $outDir '09-FriendRank-preview.png'), [Convert]::FromBase64String($b64))
        Write-Output 'preview saved'
      }
    }
  } catch { Write-Output $_.Exception.Message }
}
