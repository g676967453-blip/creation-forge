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
    clientInfo = @{ name = 'godot-v2-rest'; version = '2' }
  }
} | ConvertTo-Json -Compress -Depth 6
$r = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($init)) -TimeoutSec 30 -UseBasicParsing
$headers['mcp-session-id'] = [string]$r.Headers['mcp-session-id']
try {
  Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes('{"jsonrpc":"2.0","method":"notifications/initialized"}')) -TimeoutSec 10 -UseBasicParsing | Out-Null
} catch {}

function Invoke-McpTool([string]$Name, $Arguments, [int]$TimeoutSec = 360) {
  $payload = @{
    jsonrpc = '2.0'
    id = Get-Random -Maximum 999999
    method = 'tools/call'
    params = @{ name = $Name; arguments = $Arguments }
  } | ConvertTo-Json -Depth 40 -Compress
  $tmp = [IO.Path]::GetTempFileName()
  [IO.File]::WriteAllText($tmp, $payload, [Text.UTF8Encoding]::new($false))
  $bytes = [IO.File]::ReadAllBytes($tmp)
  Remove-Item $tmp -Force
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
    if ($obj.error) { return ('ERROR: ' + ($obj.error | ConvertTo-Json -Compress -Depth 6)) }
    if ($obj.result -and $obj.result.content) {
      return (($obj.result.content | ForEach-Object { if ($_.text) { $_.text } else { $_ | ConvertTo-Json -Compress } }) -join "`n")
    }
    return $Raw
  } catch { return $Raw }
}

$sw = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
let page = null;
for (const p of pixso.root.children) {
  if ((p.name || "") === "Godot-UI-Replica") { page = p; break; }
}
if (!page) {
  for (const p of pixso.root.children) {
    if ((p.children || []).some(c => (c.name || "").startsWith("G0"))) { page = p; break; }
  }
}
await pixso.setCurrentPageAsync(page);
return { page: page.name, frames: page.children.filter(n=>n.type==="FRAME").map(n=>({name:n.name,id:n.id,x:n.x,y:n.y,w:n.width,h:n.height})) };
'@ }
Write-Output ('PAGE: ' + (Get-McpText $sw))

$meta = Get-Content "J:\ceshi\projects\IAA\ui-prototypes\godot-replica\screens-v2-meta.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$screenDir = "J:\ceshi\projects\IAA\ui-prototypes\godot-replica\screens-v2"
$need = @('G05-Pause', 'G06-AssetBoard')
$GAPX = 100; $GAPY = 140

foreach ($s in $meta.screens) {
  if ($need -notcontains $s.name) { continue }
  $exists = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = "return pixso.currentPage.children.some(n => n.name === '$($s.name)');" }
  if ((Get-McpText $exists) -eq 'true') {
    Write-Output "skip $($s.name)"
    continue
  }
  $path = Join-Path $screenDir $s.file
  $html = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  Write-Output ("--- $($s.name) ---")
  Write-Output ('C2D: ' + (Get-McpText (Invoke-McpTool -Name 'code_to_design' -Arguments @{ htmlStr = $html; width = [int]$s.w; height = [int]$s.h } -TimeoutSec 360)))
  $tx = [int]($s.col * (450 + $GAPX))
  if ($s.name -eq 'G06-AssetBoard') { $tx = 0 }
  $ty = [int]($s.row * (800 + $GAPY))
  if ([int]$s.row -ge 2) { $ty = 2 * (800 + $GAPY) }
  $nmJson = ($s.name | ConvertTo-Json -Compress)
  $w = [int]$s.w; $h = [int]$s.h
  $place = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @"
const page = pixso.currentPage;
const targetName = $nmJson;
const tx=$tx, ty=$ty, tw=$w, th=$h;
function findPhones(node, acc) {
  if (!node) return;
  const name=(node.name||'').toLowerCase();
  if (node.type==='FRAME' && (name.indexOf('phone')>=0 || name.indexOf('board')>=0)) acc.push(node);
  if (node.children) for (const c of node.children) findPhones(c, acc);
}
const phones=[]; for (const c of page.children) findPhones(c, phones);
const named=/^G0[1-6]-/;
let phone=null;
for (let i=phones.length-1;i>=0;i--) if (!named.test(phones[i].name||'')) { phone=phones[i]; break; }
if (!phone) {
  const tops=page.children.filter(n=>n.type==='FRAME' && !named.test(n.name||'') && !(n.name||'').startsWith('label-'));
  phone=tops[tops.length-1];
}
if (!phone) return {error:'no phone'};
if (phone.parent && phone.parent.id!==page.id) page.appendChild(phone);
phone.name=targetName; phone.x=tx; phone.y=ty;
try { if ('resize' in phone) phone.resize(tw, th); } catch(e) {}
for (const c of [...page.children]) {
  if ((c.name||'').startsWith('label-')) continue;
  if (named.test(c.name||'')) continue;
  let has=false; function scan(n){ if(!n)return; if(named.test(n.name||'')) has=true; if(n.children) for(const x of n.children) scan(x);} scan(c);
  if (!has) try{c.remove()}catch(e){}
}
return {placed:{id:phone.id,name:phone.name,x:phone.x,y:phone.y,w:phone.width,h:phone.height}};
"@ }
  Write-Output ('PLACE: ' + (Get-McpText $place))
  Start-Sleep -Seconds 1
}

$fix = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
page.name = "Godot-UI-Replica";
const fontCandidates = [
  { family: "Microsoft YaHei", style: "Regular" },
  { family: "Microsoft YaHei", style: "Bold" },
  { family: "Noto Sans SC", style: "Regular" },
  { family: "Inter", style: "Regular" }
];
let font = null;
for (const f of fontCandidates) {
  try { await pixso.loadFontAsync(f); font = f; break; } catch (e) {}
}
let fixed = 0, texts = 0;
function walk(n) {
  if (!n) return;
  if (n.type === "TEXT") {
    texts++;
    if (font) { try { n.fontName = font; fixed++; } catch (e) {} }
  }
  if (n.children) for (const c of n.children) walk(c);
}
for (const c of page.children) walk(c);
for (const c of [...page.children]) if ((c.name || "").startsWith("label-G")) c.remove();
if (font) {
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
  }
}
function sample(frame) {
  const acc = [];
  function w(n,d){ if(d>5)return; if(n.type==="TEXT"&&n.characters) acc.push(String(n.characters).slice(0,40)); if(n.children) for(const c of n.children.slice(0,50)) w(c,d+1); }
  w(frame,0); return acc.slice(0,12);
}
return {
  font, fixed, texts,
  frames: page.children.filter(n => n.type==="FRAME" && (n.name||"").startsWith("G0")).map(n => ({
    id:n.id, name:n.name, x:n.x, y:n.y, w:n.width, h:n.height, sample: sample(n)
  }))
};
'@ }
$final = Get-McpText $fix
Write-Output ('FINAL: ' + $final)
$outDir = 'J:\ceshi\projects\IAA\ui-prototypes\godot-replica'
[IO.File]::WriteAllText((Join-Path $outDir 'import-result-v2.json'), $final, [Text.UTF8Encoding]::new($false))

$prev = Join-Path $outDir 'previews-v2'
New-Item -ItemType Directory -Force -Path $prev | Out-Null
$obj = $final | ConvertFrom-Json
foreach ($f in @($obj.frames)) {
  try {
    $exp = Invoke-McpTool -Name 'get_export_image' -Arguments @{
      guid = $f.id
      exportSettings = @{
        constraint = @{ type = 2; value = [Math]::Min(900, [Math]::Max(200, [int]$f.w)) }
        imageType = 1
      }
    } -TimeoutSec 120
    $et = Get-McpText $exp
    if ($et -match 'http://localhost:3667/export/[a-f0-9\-]+\.png') {
      $png = Join-Path $prev ("$($f.name).png")
      Invoke-WebRequest -Uri $Matches[0] -OutFile $png -TimeoutSec 40 -UseBasicParsing
      Write-Output "export $($f.name) $((Get-Item $png).Length)"
    }
  } catch {
    Write-Output ("export fail $($f.name) $($_.Exception.Message)")
  }
}
Write-Output 'REST DONE'
