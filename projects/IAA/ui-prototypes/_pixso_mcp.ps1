param(
  [ValidateSet('status','import-rest','layout','screenshot','import-one')]
  [string]$Action = 'status',
  [string]$File = ''
)

$ErrorActionPreference = 'Stop'
$uri = 'http://127.0.0.1:3667/mcp'
$script:headers = @{
  'Content-Type' = 'application/json'
  'Accept' = 'application/json, text/event-stream'
}

function Connect-Mcp {
  $initObj = @{
    jsonrpc = '2.0'
    id = 1
    method = 'initialize'
    params = @{
      protocolVersion = '2024-11-05'
      capabilities = @{}
      clientInfo = @{ name = 'dsh-c2d'; version = '1' }
    }
  }
  $init = $initObj | ConvertTo-Json -Compress -Depth 8
  $r = Invoke-WebRequest -Uri $uri -Method POST -Headers $script:headers -Body ([Text.Encoding]::UTF8.GetBytes($init)) -TimeoutSec 30 -UseBasicParsing
  $sid = [string]$r.Headers['mcp-session-id']
  $script:headers['mcp-session-id'] = $sid
  $nb = '{"jsonrpc":"2.0","method":"notifications/initialized"}'
  try {
    Invoke-WebRequest -Uri $uri -Method POST -Headers $script:headers -Body ([Text.Encoding]::UTF8.GetBytes($nb)) -TimeoutSec 10 -UseBasicParsing | Out-Null
  } catch {}
  Write-Output "session=$sid"
}

function Invoke-McpTool {
  param([string]$Name, $Arguments, [int]$TimeoutSec = 120)
  $payload = @{
    jsonrpc = '2.0'
    id = Get-Random -Maximum 999999
    method = 'tools/call'
    params = @{
      name = $Name
      arguments = $Arguments
    }
  }
  $json = $payload | ConvertTo-Json -Depth 40 -Compress
  $r = Invoke-WebRequest -Uri $uri -Method POST -Headers $script:headers -Body ([Text.Encoding]::UTF8.GetBytes($json)) -TimeoutSec $TimeoutSec -UseBasicParsing
  $data = @()
  foreach ($line in ($r.Content -split "`n")) {
    if ($line.StartsWith('data:')) { $data += $line.Substring(5).Trim() }
  }
  return ($data -join "`n")
}

function Get-McpText {
  param([string]$Raw)
  try {
    $obj = $Raw | ConvertFrom-Json
    if ($obj.error) {
      return ('ERROR: ' + ($obj.error | ConvertTo-Json -Compress -Depth 8))
    }
    if ($obj.result -and $obj.result.content) {
      $parts = @()
      foreach ($c in $obj.result.content) {
        if ($c.text) { $parts += $c.text }
        else { $parts += ($c | ConvertTo-Json -Compress -Depth 8) }
      }
      return ($parts -join "`n")
    }
    return $Raw
  } catch {
    return $Raw
  }
}

Connect-Mcp

switch ($Action) {
  'status' {
    $frames = Invoke-McpTool -Name 'get_top_level_frames' -Arguments @{ type = 'frame' }
    Write-Output ('FRAMES: ' + (Get-McpText $frames))
    $nodes = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
const kids = page.children.map((n,i)=>({i, id:n.id, name:n.name, type:n.type, w:n.width||null, h:n.height||null, x:n.x, y:n.y}));
return { page: page.name, pageId: page.id, count: kids.length, kids };
'@ }
    Write-Output ('NODES: ' + (Get-McpText $nodes))
  }
  'import-one' {
    if (-not $File) { throw 'File required' }
    $html = [IO.File]::ReadAllText($File, [Text.Encoding]::UTF8)
    Write-Output ("importing $File len=$($html.Length)")
    $raw = Invoke-McpTool -Name 'code_to_design' -Arguments @{ htmlStr = $html } -TimeoutSec 150
    Write-Output (Get-McpText $raw)
  }
  'import-rest' {
    $dir = 'J:\ceshi\projects\IAA\ui-prototypes\screens'
    $rest = @(
      '06-失败复活.html',
      '07-激励视频.html',
      '08-暂停.html'
    )
    foreach ($name in $rest) {
      $path = Join-Path $dir $name
      $html = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
      Write-Output ("--- $name len=$($html.Length) ---")
      try {
        $raw = Invoke-McpTool -Name 'code_to_design' -Arguments @{ htmlStr = $html } -TimeoutSec 150
        Write-Output (Get-McpText $raw)
      } catch {
        Write-Output ("FAIL: " + $_.Exception.Message)
      }
      Start-Sleep -Seconds 1
    }
    $nodes = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
return page.children.map((n,i)=>({i,id:n.id,name:n.name,w:n.width,h:n.height,x:n.x,y:n.y}));
'@ }
    Write-Output ('AFTER: ' + (Get-McpText $nodes))
  }
  'layout' {
    $raw = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
const kids = [...page.children];
// Sort by creation order already; layout in 4 columns of 450x800 with gaps
const COLS = 4;
const GAP = 80;
const W = 450;
const H = 800;
const names = [
  '01-主菜单 MainMenu',
  '02-局内HUD InGame',
  '03-角色选择 CharacterSelect',
  '04-通关结算 LevelClear',
  '05-补给队 Shop',
  '06-失败复活 GameOver',
  '07-激励视频 AdReward',
  '08-暂停 Pause'
];
const result = [];
for (let i = 0; i < kids.length; i++) {
  const n = kids[i];
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  n.x = col * (W + GAP);
  n.y = row * (H + GAP + 40);
  if (names[i]) n.name = names[i];
  // If root is not exactly phone size, try resize top frame-like nodes
  try {
    if ('resize' in n && n.width && n.height) {
      // keep as-is if already near phone
    }
  } catch (e) {}
  result.push({ id: n.id, name: n.name, x: n.x, y: n.y, w: n.width, h: n.height });
}
page.name = '救火英雄-UI原型';
return { count: result.length, result };
'@ }
    Write-Output (Get-McpText $raw)
  }
  'screenshot' {
    $nodes = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
return pixso.currentPage.children.map(n => n.id);
'@ }
    $text = Get-McpText $nodes
    Write-Output ("ids raw: $text")
    $ids = @()
    try {
      $arr = $text | ConvertFrom-Json
      $ids = @($arr)
    } catch {
      # try extract quoted ids
      $ids = [regex]::Matches($text, '"(\d+:\d+)"') | ForEach-Object { $_.Groups[1].Value }
    }
    Write-Output ("id count=$($ids.Count)")
    $outDir = 'J:\ceshi\projects\IAA\ui-prototypes\pixso-previews'
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
    $batch = @()
    for ($i = 0; $i -lt $ids.Count; $i += 3) {
      $chunk = @($ids[$i..([Math]::Min($i+2, $ids.Count-1))])
      $raw = Invoke-McpTool -Name 'take_screenshot' -Arguments @{ nodeIds = $chunk } -TimeoutSec 120
      $t = Get-McpText $raw
      $path = Join-Path $outDir ("batch-$i.json")
      [IO.File]::WriteAllText($path, $t, [Text.UTF8Encoding]::new($false))
      Write-Output ("saved $path len=$($t.Length)")
      # also try get_export_image per node
      foreach ($id in $chunk) {
        try {
          $exp = Invoke-McpTool -Name 'get_export_image' -Arguments @{
            guid = $id
            exportSettings = @{
              constraint = @{ type = 2; value = 450 }
              imageType = 1
            }
          } -TimeoutSec 60
          $et = Get-McpText $exp
          $ep = Join-Path $outDir ("export-$($id -replace ':','-').txt")
          [IO.File]::WriteAllText($ep, $et, [Text.UTF8Encoding]::new($false))
          Write-Output ("export $id => $($et.Substring(0,[Math]::Min(200,$et.Length)))")
        } catch {
          Write-Output ("export fail $id $($_.Exception.Message)")
        }
      }
    }
  }
}
