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
    clientInfo = @{ name = 'dsh-fix-rank'; version = '2' }
  }
} | ConvertTo-Json -Compress -Depth 8
$r = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($init)) -TimeoutSec 30 -UseBasicParsing
$headers['mcp-session-id'] = [string]$r.Headers['mcp-session-id']
try {
  Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes('{"jsonrpc":"2.0","method":"notifications/initialized"}')) -TimeoutSec 10 -UseBasicParsing | Out-Null
} catch {}

function Invoke-McpTool([string]$Name, $Arguments, [int]$TimeoutSec = 90) {
  $payload = @{
    jsonrpc = '2.0'
    id = Get-Random -Maximum 999999
    method = 'tools/call'
    params = @{ name = $Name; arguments = $Arguments }
  } | ConvertTo-Json -Depth 30 -Compress
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
      return (($obj.result.content | ForEach-Object { $_.text }) -join "`n")
    }
    return $Raw
  } catch { return $Raw }
}

# Use only ASCII in script body to avoid encoding breakage
$script = @'
const page = pixso.currentPage;
const actions = [];
function collectText(n, acc, depth) {
  if (depth > 5) return;
  if (n.type === "TEXT" && n.characters) acc.push(String(n.characters));
  if (n.children) for (const c of n.children.slice(0, 50)) collectText(c, acc, depth + 1);
}
const nines = page.children.filter(n => n.name === "09-FriendRank");
for (const f of nines) {
  const texts = [];
  collectText(f, texts, 0);
  const joined = texts.join(" ");
  const isPause = texts.some(t => t.indexOf("Pause") >= 0) === false && (
    // old pause frame id was 2:946; rank is 8:4-ish. Detect by known pause strings via code points
    texts.length <= 8 ||
    joined.indexOf("\u7ee7\u7eed\u6e38\u620f") >= 0 || // continue game
    joined.indexOf("\u5df2\u6682\u505c") >= 0 ||       // paused
    f.id === "2:946"
  );
  const isRank = joined.indexOf("\u597d\u53cb\u6392\u884c\u699c") >= 0 || // friend rank title
                 joined.indexOf("\u9080\u8bf7\u597d\u53cb") >= 0 ||       // invite friends
                 f.id.indexOf("8:") === 0;
  if (isPause && !isRank) {
    f.name = "08-Pause";
    f.x = 1590;
    f.y = 920;
    actions.push({ action: "restore-pause", id: f.id, n: texts.length });
  } else if (isRank) {
    f.name = "09-FriendRank";
    f.x = 0;
    f.y = 1840;
    try { if ("resize" in f) f.resize(450, 800); } catch (e) {}
    actions.push({ action: "keep-rank", id: f.id, n: texts.length, sample: texts.slice(0, 8) });
  } else {
    actions.push({ action: "unknown", id: f.id, sample: texts.slice(0, 10) });
  }
}

for (const c of [...page.children]) {
  const nm = c.name || "";
  if (nm === "label-08-Pause" || nm === "label-09-FriendRank") c.remove();
}
let font = { family: "Inter", style: "Bold" };
try { await pixso.loadFontAsync(font); } catch (e) {
  font = { family: "Roboto", style: "Bold" };
  try { await pixso.loadFontAsync(font); } catch (e2) {}
}
function addLabel(frameName, labelText) {
  const frame = page.children.find(n => n.name === frameName);
  if (!frame) return null;
  const t = pixso.createText();
  try { t.fontName = font; } catch (e) {}
  t.characters = labelText;
  t.fontSize = 24;
  t.fills = [{ type: "SOLID", color: { r: 1, g: 0.82, b: 0.29 } }];
  t.name = "label-" + frameName;
  t.x = frame.x;
  t.y = frame.y - 40;
  page.appendChild(t);
  return { id: t.id, frame: frameName, x: t.x, y: t.y };
}
const labels = [
  addLabel("08-Pause", "08 Pause"),
  addLabel("09-FriendRank", "09 FriendRank")
];
const frames = page.children
  .filter(n => n.type === "FRAME" && /^(0[1-9])-/.test(n.name || ""))
  .map(n => ({ id: n.id, name: n.name, x: n.x, y: n.y, w: n.width, h: n.height }));
return { actions, labels, frames };
'@

$raw = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = $script }
$text = Get-McpText $raw
Write-Output $text
[IO.File]::WriteAllText('J:\ceshi\projects\IAA\ui-prototypes\pixso-previews\qa-09-fix.json', $text, [Text.UTF8Encoding]::new($false))

try {
  $obj = $text | ConvertFrom-Json
  $rank = @($obj.frames | Where-Object { $_.name -eq '09-FriendRank' })[0]
  $pause = @($obj.frames | Where-Object { $_.name -eq '08-Pause' })[0]
  Write-Output ("rank=" + ($rank | ConvertTo-Json -Compress))
  Write-Output ("pause=" + ($pause | ConvertTo-Json -Compress))
  if ($rank) {
    $exp = Invoke-McpTool -Name 'get_export_image' -Arguments @{
      guid = $rank.id
      exportSettings = @{ constraint = @{ type = 2; value = 450 }; imageType = 1 }
    }
    $et = Get-McpText $exp
    if ($et -match 'http://localhost:3667/export/[a-f0-9\-]+\.png') {
      $png = 'J:\ceshi\projects\IAA\ui-prototypes\pixso-previews\09-FriendRank.png'
      Invoke-WebRequest -Uri $Matches[0] -OutFile $png -TimeoutSec 30 -UseBasicParsing
      Write-Output ("export ok size=" + (Get-Item $png).Length)
    }
  }
} catch {
  Write-Output ('post: ' + $_.Exception.Message)
}
