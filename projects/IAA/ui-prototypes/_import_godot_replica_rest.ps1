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
    clientInfo = @{ name = 'godot-replica-rest'; version = '1' }
  }
} | ConvertTo-Json -Compress -Depth 6
$r = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($init)) -TimeoutSec 30 -UseBasicParsing
$headers['mcp-session-id'] = [string]$r.Headers['mcp-session-id']
try {
  Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes('{"jsonrpc":"2.0","method":"notifications/initialized"}')) -TimeoutSec 10 -UseBasicParsing | Out-Null
} catch {}

function Invoke-McpTool([string]$Name, $Arguments, [int]$TimeoutSec = 300) {
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
    if ($obj.error) { return ('ERROR: ' + ($obj.error | ConvertTo-Json -Compress -Depth 6)) }
    if ($obj.result -and $obj.result.content) {
      return (($obj.result.content | ForEach-Object { if ($_.text) { $_.text } else { $_ | ConvertTo-Json -Compress } }) -join "`n")
    }
    return $Raw
  } catch { return $Raw }
}

# Ensure on replica page
$sw = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
let target = null;
for (const p of pixso.root.children) {
  // prefer page that already has G01-Menu
  const has = (p.children || []).some(c => (c.name || "").startsWith("G0"));
  if (has) { target = p; break; }
}
if (!target) {
  for (const p of pixso.root.children) {
    if ((p.name || "").indexOf("Godot") >= 0 || (p.name || "").indexOf("Replica") >= 0) { target = p; break; }
  }
}
if (!target) target = pixso.currentPage;
await pixso.setCurrentPageAsync(target);
target.name = "Godot-UI-Replica";
return {
  pageId: target.id,
  pageName: target.name,
  frames: target.children.filter(n => n.type === "FRAME").map(n => ({ id: n.id, name: n.name, x: n.x, y: n.y }))
};
'@ }
Write-Output ('PAGE: ' + (Get-McpText $sw))

$screenDir = 'J:\ceshi\projects\IAA\ui-prototypes\godot-replica\screens'
$screens = @(
  @{ file = 'G05-Pause.html'; name = 'G05-Pause'; col = 1; row = 1 }
  @{ file = 'G06-AssetBoard.html'; name = 'G06-AssetBoard'; col = 2; row = 1 }
)
$GAPX = 80; $GAPY = 120; $W = 450; $H = 800

foreach ($s in $screens) {
  # skip if already present
  $check = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = "return pixso.currentPage.children.some(n => n.name === '$($s.name)');" }
  if ((Get-McpText $check) -eq 'true') {
    Write-Output ("skip existing $($s.name)")
    continue
  }
  $path = Join-Path $screenDir $s.file
  $html = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  Write-Output ("--- import $($s.file) ---")
  $c2d = Invoke-McpTool -Name 'code_to_design' -Arguments @{ htmlStr = $html; width = 450; height = 800 } -TimeoutSec 300
  Write-Output ('C2D: ' + (Get-McpText $c2d))

  $tx = [int]($s.col * ($W + $GAPX))
  $ty = [int]($s.row * ($H + $GAPY))
  $nmJson = ($s.name | ConvertTo-Json)
  $placeScript = @"
const page = pixso.currentPage;
const targetName = $nmJson;
const tx = $tx; const ty = $ty;
function findPhones(node, acc) {
  if (!node) return;
  const name = (node.name || '').toLowerCase();
  if (node.type === 'FRAME' && name.indexOf('phone') >= 0) acc.push(node);
  if (node.children) for (const c of node.children) findPhones(c, acc);
}
const phones = [];
for (const c of page.children) findPhones(c, phones);
const named = /^G0[1-6]-/;
let phone = null;
for (let i = phones.length - 1; i >= 0; i--) {
  if (!named.test(phones[i].name || '')) { phone = phones[i]; break; }
}
if (!phone) {
  const tops = page.children.filter(n => n.type === 'FRAME' && !named.test(n.name || '') && !(n.name || '').startsWith('label-'));
  phone = tops[tops.length - 1];
}
if (!phone) return { error: 'no phone' };
if (phone.parent && phone.parent.id !== page.id) page.appendChild(phone);
phone.name = targetName; phone.x = tx; phone.y = ty;
try { if ('resize' in phone) phone.resize(450, 800); } catch (e) {}
for (const c of [...page.children]) {
  if ((c.name || '').startsWith('label-')) continue;
  if (named.test(c.name || '')) continue;
  let has = false;
  function scan(n){ if(!n)return; if(named.test(n.name||'')) has=true; if(n.children) for(const x of n.children) scan(x); }
  scan(c);
  if (!has) { try { c.remove(); } catch(e) {} }
}
return { placed: { id: phone.id, name: phone.name, x: phone.x, y: phone.y } };
"@
  Write-Output ('PLACE: ' + (Get-McpText (Invoke-McpTool -Name 'eval_script' -Arguments @{ script = $placeScript })))
  Start-Sleep -Seconds 1
}

$lab = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
page.name = "Godot-UI-Replica";
let font = { family: "Inter", style: "Bold" };
try { await pixso.loadFontAsync(font); } catch (e) {
  font = { family: "Roboto", style: "Bold" };
  try { await pixso.loadFontAsync(font); } catch (e2) {}
}
for (const c of [...page.children]) {
  if ((c.name || "").startsWith("label-G")) c.remove();
}
const labels = [];
for (const frame of page.children) {
  if (frame.type !== "FRAME" || !(frame.name || "").startsWith("G0")) continue;
  const t = pixso.createText();
  try { t.fontName = font; } catch (e) {}
  t.characters = frame.name;
  t.fontSize = 22;
  t.fills = [{ type: "SOLID", color: { r: 1, g: 0.82, b: 0.29 } }];
  t.name = "label-" + frame.name;
  t.x = frame.x; t.y = frame.y - 36;
  page.appendChild(t);
  labels.push(t.name);
}
return {
  page: page.name,
  frames: page.children.filter(n => n.type === "FRAME" && (n.name||"").startsWith("G0")).map(n => ({id:n.id,name:n.name,x:n.x,y:n.y,w:n.width,h:n.height})),
  labels
};
'@ }
$final = Get-McpText $lab
Write-Output ('FINAL: ' + $final)
$outDir = 'J:\ceshi\projects\IAA\ui-prototypes\godot-replica'
[IO.File]::WriteAllText((Join-Path $outDir 'import-result.json'), $final, [Text.UTF8Encoding]::new($false))

$prev = Join-Path $outDir 'previews'
New-Item -ItemType Directory -Force -Path $prev | Out-Null
try {
  $obj = $final | ConvertFrom-Json
  foreach ($f in @($obj.frames)) {
    $exp = Invoke-McpTool -Name 'get_export_image' -Arguments @{
      guid = $f.id
      exportSettings = @{ constraint = @{ type = 2; value = 450 }; imageType = 1 }
    } -TimeoutSec 90
    $et = Get-McpText $exp
    if ($et -match 'http://localhost:3667/export/[a-f0-9\-]+\.png') {
      $png = Join-Path $prev ("$($f.name).png")
      Invoke-WebRequest -Uri $Matches[0] -OutFile $png -TimeoutSec 30 -UseBasicParsing
      Write-Output "export $($f.name) size=$((Get-Item $png).Length)"
    } else {
      Write-Output ("export fail $($f.name): " + $et.Substring(0, [Math]::Min(120, $et.Length)))
    }
  }
} catch {
  Write-Output $_.Exception.Message
}
