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
    clientInfo = @{ name = 'dsh-labels'; version = '1' }
  }
} | ConvertTo-Json -Compress -Depth 8
$r = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($init)) -TimeoutSec 30 -UseBasicParsing
$headers['mcp-session-id'] = [string]$r.Headers['mcp-session-id']
try {
  Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes('{"jsonrpc":"2.0","method":"notifications/initialized"}')) -TimeoutSec 10 -UseBasicParsing | Out-Null
} catch {}

$script = @'
const page = pixso.currentPage;
const labels = {
  "01-MainMenu": "01 MainMenu",
  "02-InGameHUD": "02 InGameHUD",
  "03-CharacterSelect": "03 CharacterSelect",
  "04-LevelClear": "04 LevelClear",
  "05-Shop": "05 Shop",
  "06-GameOver": "06 GameOver",
  "07-AdReward": "07 AdReward",
  "08-Pause": "08 Pause"
};
for (const c of [...page.children]) {
  if ((c.name || "").startsWith("label-")) c.remove();
}
let font = { family: "Inter", style: "Bold" };
try {
  await pixso.loadFontAsync(font);
} catch (e) {
  font = { family: "Roboto", style: "Bold" };
  try { await pixso.loadFontAsync(font); } catch (e2) {}
}
const created = [];
const frames = page.children.filter(n => n.type === "FRAME" && labels[n.name]);
for (const frame of frames) {
  const t = pixso.createText();
  try { t.fontName = font; } catch (e) {}
  t.characters = labels[frame.name];
  t.fontSize = 24;
  t.fills = [{ type: "SOLID", color: { r: 1, g: 0.82, b: 0.29 } }];
  t.name = "label-" + frame.name;
  t.x = frame.x;
  t.y = frame.y - 40;
  page.appendChild(t);
  created.push({ id: t.id, name: t.name, x: t.x, y: t.y });
}
function collectText(n, acc, depth) {
  if (depth > 6) return;
  if (n.type === "TEXT" && n.characters) acc.push(String(n.characters));
  if (n.children) for (const c of n.children.slice(0, 40)) collectText(c, acc, depth + 1);
}
const qa = {};
for (const frame of frames) {
  const acc = [];
  collectText(frame, acc, 0);
  qa[frame.name] = acc.slice(0, 25);
}
return {
  frameCount: frames.length,
  frames: frames.map(n => ({ id: n.id, name: n.name, x: n.x, y: n.y, w: n.width, h: n.height })),
  labels: created,
  qa
};
'@

$payload = @{
  jsonrpc = '2.0'
  id = 2
  method = 'tools/call'
  params = @{
    name = 'eval_script'
    arguments = @{ script = $script }
  }
} | ConvertTo-Json -Depth 20 -Compress

$resp = Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($payload)) -TimeoutSec 90 -UseBasicParsing
$data = ($resp.Content -split "`n" | Where-Object { $_.StartsWith('data:') } | ForEach-Object { $_.Substring(5).Trim() }) -join "`n"
$outPath = 'J:\ceshi\projects\IAA\ui-prototypes\pixso-previews\qa-structure.json'
try {
  $obj = $data | ConvertFrom-Json
  if ($obj.result.content) {
    $text = ($obj.result.content | ForEach-Object { $_.text }) -join "`n"
    [IO.File]::WriteAllText($outPath, $text, [Text.UTF8Encoding]::new($false))
    Write-Output $text
  } else {
    [IO.File]::WriteAllText($outPath, $data, [Text.UTF8Encoding]::new($false))
    Write-Output $data
  }
} catch {
  [IO.File]::WriteAllText($outPath, $data, [Text.UTF8Encoding]::new($false))
  Write-Output $data
}
