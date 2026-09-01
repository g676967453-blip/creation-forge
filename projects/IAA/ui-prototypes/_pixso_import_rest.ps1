$ErrorActionPreference = 'Stop'
$uri = 'http://127.0.0.1:3667/mcp'
$headers = @{
  'Content-Type' = 'application/json'
  'Accept' = 'application/json, text/event-stream'
}

function Connect-Mcp {
  $init = @{
    jsonrpc = '2.0'; id = 1; method = 'initialize'
    params = @{
      protocolVersion = '2024-11-05'
      capabilities = @{}
      clientInfo = @{ name = 'dsh-import-rest'; version = '1' }
    }
  } | ConvertTo-Json -Compress -Depth 8
  $r = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($init)) -TimeoutSec 30 -UseBasicParsing
  $sid = [string]$r.Headers['mcp-session-id']
  $headers['mcp-session-id'] = $sid
  try {
    Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes('{"jsonrpc":"2.0","method":"notifications/initialized"}')) -TimeoutSec 10 -UseBasicParsing | Out-Null
  } catch {}
  Write-Output "session=$sid"
}

function Invoke-McpTool([string]$Name, $Arguments, [int]$TimeoutSec = 180) {
  $payload = @{
    jsonrpc = '2.0'
    id = Get-Random -Maximum 999999
    method = 'tools/call'
    params = @{ name = $Name; arguments = $Arguments }
  } | ConvertTo-Json -Depth 50 -Compress
  $r = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($payload)) -TimeoutSec $TimeoutSec -UseBasicParsing
  $parts = @()
  foreach ($line in ($r.Content -split "`n")) {
    if ($line.StartsWith('data:')) { $parts += $line.Substring(5).Trim() }
  }
  return ($parts -join "`n")
}

function Get-McpText([string]$Raw) {
  try {
    $obj = $Raw | ConvertFrom-Json
    if ($obj.error) { return ('ERROR: ' + ($obj.error | ConvertTo-Json -Compress -Depth 8)) }
    if ($obj.result -and $obj.result.content) {
      $out = @()
      foreach ($c in $obj.result.content) {
        if ($c.text) { $out += $c.text } else { $out += ($c | ConvertTo-Json -Compress -Depth 8) }
      }
      return ($out -join "`n")
    }
    return $Raw
  } catch { return $Raw }
}

Connect-Mcp

$status = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
return {
  page: page.name,
  count: page.children.length,
  children: page.children.map(n => ({id:n.id,name:n.name,x:n.x,y:n.y,w:n.width,h:n.height}))
};
'@ }
Write-Output ('BEFORE: ' + (Get-McpText $status))

$screens = @(
  @{ file = '05-shop.html'; name = '05-Shop'; col = 0; row = 1 }
  @{ file = '06-game-over.html'; name = '06-GameOver'; col = 1; row = 1 }
  @{ file = '07-ad-reward.html'; name = '07-AdReward'; col = 2; row = 1 }
  @{ file = '08-pause.html'; name = '08-Pause'; col = 3; row = 1 }
)

$dir = 'J:\ceshi\projects\IAA\ui-prototypes\screens'
$GAPX = 80
$GAPY = 120
$W = 450
$H = 800

foreach ($s in $screens) {
  $path = Join-Path $dir $s.file
  $html = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  Write-Output ("--- import $($s.file) ---")
  try {
    $raw = Invoke-McpTool -Name 'code_to_design' -Arguments @{ htmlStr = $html } -TimeoutSec 180
    Write-Output ('C2D: ' + (Get-McpText $raw))
  } catch {
    Write-Output ('C2D FAIL: ' + $_.Exception.Message)
    Start-Sleep -Seconds 2
    continue
  }

  $tx = [int]($s.col * ($W + $GAPX))
  $ty = [int]($s.row * ($H + $GAPY))
  $nmJson = ($s.name | ConvertTo-Json)
  $script = @"
const page = pixso.currentPage;
const targetName = $nmJson;
const tx = $tx;
const ty = $ty;
function findPhones(node, acc) {
  if (!node) return;
  const name = (node.name || '').toLowerCase();
  if (node.type === 'FRAME' && name.indexOf('phone') >= 0) acc.push(node);
  if (node.children) for (const c of node.children) findPhones(c, acc);
}
const phones = [];
for (const c of page.children) findPhones(c, phones);
const screenPrefix = /^(01|02|03|04|05|06|07|08)-/;
let phone = null;
for (let i = phones.length - 1; i >= 0; i--) {
  if (!screenPrefix.test(phones[i].name || '')) { phone = phones[i]; break; }
}
if (!phone && phones.length) phone = phones[phones.length - 1];
if (!phone) {
  if (!page.children.length) return { error: 'no nodes' };
  phone = page.children[page.children.length - 1];
}
if (phone.parent && phone.parent.id !== page.id) page.appendChild(phone);
phone.name = targetName;
phone.x = tx;
phone.y = ty;
try { if ('resize' in phone) phone.resize(450, 800); } catch (e) {}
const keep = new Set();
for (const c of page.children) if (screenPrefix.test(c.name || '')) keep.add(c.id);
const removeIds = [];
for (const c of [...page.children]) {
  if (keep.has(c.id)) continue;
  let hasScreen = false;
  function scan(n) {
    if (!n) return;
    if (screenPrefix.test(n.name || '')) hasScreen = true;
    if (n.children) for (const x of n.children) scan(x);
  }
  scan(c);
  if (!hasScreen) {
    removeIds.push(c.id);
    try { c.remove(); } catch (e) {}
  }
}
return {
  placed: { id: phone.id, name: phone.name, x: phone.x, y: phone.y, w: phone.width, h: phone.height },
  phonesFound: phones.length,
  removed: removeIds,
  top: page.children.map(n => ({ id: n.id, name: n.name, x: n.x, y: n.y, w: n.width, h: n.height }))
};
"@
  $fix = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = $script } -TimeoutSec 60
  Write-Output ('PLACE: ' + (Get-McpText $fix))
  Start-Sleep -Seconds 1
}

$final = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
return {
  page: page.name,
  count: page.children.length,
  children: page.children.map(n => ({id:n.id,name:n.name,x:n.x,y:n.y,w:n.width,h:n.height,type:n.type}))
};
'@ }
Write-Output ('FINAL: ' + (Get-McpText $final))
