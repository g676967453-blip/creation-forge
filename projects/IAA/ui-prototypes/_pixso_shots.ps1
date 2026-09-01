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
      clientInfo = @{ name = 'dsh-shots'; version = '1' }
    }
  } | ConvertTo-Json -Compress -Depth 8
  $r = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($init)) -TimeoutSec 30 -UseBasicParsing
  $headers['mcp-session-id'] = [string]$r.Headers['mcp-session-id']
  try {
    Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes('{"jsonrpc":"2.0","method":"notifications/initialized"}')) -TimeoutSec 10 -UseBasicParsing | Out-Null
  } catch {}
}

function Invoke-McpTool([string]$Name, $Arguments, [int]$TimeoutSec = 120) {
  $payload = @{
    jsonrpc = '2.0'
    id = Get-Random -Maximum 999999
    method = 'tools/call'
    params = @{ name = $Name; arguments = $Arguments }
  } | ConvertTo-Json -Depth 30 -Compress
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
        if ($c.text) { $out += $c.text }
        elseif ($c.type -eq 'image' -and $c.data) { $out += ('IMAGE_BASE64_LEN=' + $c.data.Length) }
        else { $out += ($c | ConvertTo-Json -Compress -Depth 6) }
      }
      return ($out -join "`n")
    }
    return $Raw
  } catch { return $Raw }
}

function Save-ImagesFromRaw([string]$Raw, [string]$Prefix, [string]$OutDir) {
  $obj = $Raw | ConvertFrom-Json
  $i = 0
  $saved = @()
  if ($obj.result -and $obj.result.content) {
    foreach ($c in $obj.result.content) {
      if ($c.data -and ($c.mimeType -like 'image/*' -or $c.type -eq 'image')) {
        $bytes = [Convert]::FromBase64String($c.data)
        $path = Join-Path $OutDir ("$Prefix-$i.png")
        [IO.File]::WriteAllBytes($path, $bytes)
        $saved += $path
        $i++
      } elseif ($c.text -and $c.text -match 'https?://[^\s\"]+') {
        $url = $Matches[0]
        $path = Join-Path $OutDir ("$Prefix-$i-url.txt")
        [IO.File]::WriteAllText($path, $c.text, [Text.UTF8Encoding]::new($false))
        $saved += $path
        $i++
      }
    }
  }
  # also search whole raw for data urls / localhost export urls
  $urls = [regex]::Matches($Raw, 'http://127\.0\.0\.1[^\s\"\\]+') | ForEach-Object { $_.Value }
  foreach ($u in $urls) {
    try {
      $path = Join-Path $OutDir ("$Prefix-dl-$i.png")
      Invoke-WebRequest -Uri $u -OutFile $path -TimeoutSec 30 -UseBasicParsing
      $saved += $path
      $i++
    } catch {
      $path = Join-Path $OutDir ("$Prefix-url-$i.txt")
      [IO.File]::WriteAllText($path, $u, [Text.UTF8Encoding]::new($false))
      $saved += $path
      $i++
    }
  }
  return $saved
}

Connect-Mcp
$outDir = 'J:\ceshi\projects\IAA\ui-prototypes\pixso-previews'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$nodesRaw = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
return pixso.currentPage.children.map(n => ({id:n.id, name:n.name}));
'@ }
$nodesText = Get-McpText $nodesRaw
Write-Output ('NODES: ' + $nodesText)
$nodes = $nodesText | ConvertFrom-Json

# take_screenshot in batches of 3
for ($i = 0; $i -lt $nodes.Count; $i += 3) {
  $chunk = @($nodes[$i..([Math]::Min($i + 2, $nodes.Count - 1))])
  $ids = @($chunk | ForEach-Object { $_.id })
  $names = @($chunk | ForEach-Object { $_.name }) -join ','
  Write-Output ("SHOT batch $i ids=$($ids -join '|') names=$names")
  $raw = Invoke-McpTool -Name 'take_screenshot' -Arguments @{ nodeIds = $ids } -TimeoutSec 120
  $metaPath = Join-Path $outDir ("take_screenshot_batch$i.json")
  [IO.File]::WriteAllText($metaPath, $raw, [Text.UTF8Encoding]::new($false))
  $saved = Save-ImagesFromRaw -Raw $raw -Prefix ("batch$i") -OutDir $outDir
  Write-Output ('saved: ' + ($saved -join '; '))
}

# also export each via get_export_image
foreach ($n in $nodes) {
  $safe = ($n.name -replace '[^\w\-]+', '_')
  Write-Output ("EXPORT $($n.name) $($n.id)")
  try {
    $raw = Invoke-McpTool -Name 'get_export_image' -Arguments @{
      guid = $n.id
      exportSettings = @{
        constraint = @{ type = 2; value = 450 }
        imageType = 1
      }
    } -TimeoutSec 90
    $meta = Join-Path $outDir ("export_$safe.txt")
    $text = Get-McpText $raw
    [IO.File]::WriteAllText($meta, $text, [Text.UTF8Encoding]::new($false))
    $saved = Save-ImagesFromRaw -Raw $raw -Prefix ("export_$safe") -OutDir $outDir
    # if text contains localhost url only
    if ($text -match 'http://127\.0\.0\.1[^\s\"\\]+') {
      $u = $Matches[0]
      $png = Join-Path $outDir ("$safe.png")
      try {
        Invoke-WebRequest -Uri $u -OutFile $png -TimeoutSec 30 -UseBasicParsing
        Write-Output ("downloaded $png")
      } catch {
        Write-Output ("download fail $u $($_.Exception.Message)")
      }
    }
    Write-Output ('export-saved: ' + ($saved -join '; '))
  } catch {
    Write-Output ('export-fail: ' + $_.Exception.Message)
  }
}

Get-ChildItem $outDir | Select-Object Name, Length | Format-Table -AutoSize | Out-String
