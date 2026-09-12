# Build Godot-faithful UI HTML (PNG assets embedded, no VFX) then import to Pixso
$ErrorActionPreference = 'Stop'
$godotAssets = 'J:\ceshi\projects\IAA\fire-hero-godot\assets'
$outDir = 'J:\ceshi\projects\IAA\ui-prototypes\godot-replica'
$screenDir = Join-Path $outDir 'screens'
New-Item -ItemType Directory -Force -Path $screenDir | Out-Null

function To-DataUri([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { throw "missing $path" }
  $bytes = [IO.File]::ReadAllBytes($path)
  $b64 = [Convert]::ToBase64String($bytes)
  return "data:image/png;base64,$b64"
}

function P([string]$rel) { return (Join-Path $godotAssets $rel) }

$A = @{
  bg       = To-DataUri (P 'backgrounds/bg_level_default.png')
  winN     = To-DataUri (P 'props/windows/window_normal.png')
  winF1    = To-DataUri (P 'props/windows/window_fire_lv1.png')
  winF2    = To-DataUri (P 'props/windows/window_fire_lv2.png')
  winF3    = To-DataUri (P 'props/windows/window_fire_lv3.png')
  winR     = To-DataUri (P 'props/windows/window_rescue.png')
  winRR    = To-DataUri (P 'props/windows/window_rescue_red.png')
  mat      = To-DataUri (P 'props/trampoline/mat.png')
  fmL      = To-DataUri (P 'props/trampoline/fireman_left.png')
  fmR      = To-DataUri (P 'props/trampoline/fireman_right.png')
  cat      = To-DataUri (P 'props/ball/char_cat.png')
  dog      = To-DataUri (P 'props/ball/char_dog.png')
  panda    = To-DataUri (P 'props/ball/char_panda.png')
  capy     = To-DataUri (P 'props/ball/char_capybara.png')
  fox      = To-DataUri (P 'props/ball/char_naruto.png')
  icLv     = To-DataUri (P 'pixel/ui/ui_icon_level.png')
  icSc     = To-DataUri (P 'pixel/ui/ui_icon_score.png')
  icCn     = To-DataUri (P 'pixel/ui/ui_icon_coin.png')
  icLife   = To-DataUri (P 'pixel/ui/ui_icon_life.png')
  icPause  = To-DataUri (P 'pixel/ui/ui_icon_pause.png')
  icSkill  = To-DataUri (P 'pixel/ui/ui_icon_skill.png')
  icFire   = To-DataUri (P 'pixel/ui/ui_icon_fire.png')
  icRescue = To-DataUri (P 'pixel/ui/ui_icon_rescue.png')
  itemBag  = To-DataUri (P 'props/items/item_bag.png')
  itemWide = To-DataUri (P 'props/items/item_wide.png')
  itemHam  = To-DataUri (P 'props/items/item_hammer.png')
  itemExt  = To-DataUri (P 'props/items/item_extinguish.png')
  itemUp   = To-DataUri (P 'props/items/item_up.png')
  itemFb   = To-DataUri (P 'props/items/item_fireball.png')
  vilR     = To-DataUri (P 'pixel/villagers/vil_rabbit_front_call.png')
}

$css = @'
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:450px;height:800px;overflow:hidden;background:#0d121c;font-family:"Microsoft YaHei","PingFang SC",sans-serif;color:#fff}
.phone{position:relative;width:450px;height:800px;overflow:hidden;background:#0d121c}
.bg{position:absolute;inset:0;width:450px;height:800px;object-fit:fill;display:block}
.grid{position:absolute;left:39px;top:80px;width:372px;display:grid;grid-template-columns:repeat(7,48px);gap:4px}
.grid img{width:48px;height:48px;image-rendering:pixelated;display:block}
.paddle{position:absolute;left:179px;top:641px;width:92px;height:40px}
.paddle .mat{position:absolute;left:9px;top:24px;width:74px;height:8px;image-rendering:pixelated}
.paddle .fmL{position:absolute;left:-6px;top:0;width:28px;height:36px;image-rendering:pixelated}
.paddle .fmR{position:absolute;right:-6px;top:0;width:28px;height:36px;image-rendering:pixelated}
.ball{position:absolute;left:206px;top:400px;width:39px;height:51px;image-rendering:pixelated}
.hud-top{position:absolute;left:8px;right:8px;top:8px;height:32px;display:flex;align-items:center;gap:8px}
.hud-box{flex:1;display:flex;align-items:center;gap:4px;background:rgba(10,14,26,.45);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:4px 6px;min-width:0}
.hud-box img{width:16px;height:16px;image-rendering:pixelated;flex-shrink:0}
.hud-box span{font-size:15px;font-weight:700;white-space:nowrap}
.goal{position:absolute;left:8px;right:8px;top:44px;height:28px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:15px;font-weight:700;background:rgba(10,14,26,.35);border-radius:8px}
.goal img{width:16px;height:16px;image-rendering:pixelated}
.hint{position:absolute;left:25px;right:25px;bottom:12px;text-align:center;font-size:12px;color:#a6b8cc;font-weight:600}
.skill{position:absolute;right:20px;bottom:188px;width:130px;height:52px;border-radius:10px;background:#b3401f;color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 0 rgba(0,0,0,.25)}
.skill img{width:20px;height:20px;image-rendering:pixelated}
.vpad{position:absolute;bottom:20px;width:120px;height:110px;border-radius:999px;background:rgba(255,255,255,.10);border:2px solid rgba(255,255,255,.35);color:#fff;font-size:34px;font-weight:800;display:flex;align-items:center;justify-content:center}
.vpad.L{left:18px}.vpad.R{right:18px}
.ov{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px}
.ov.menu{background:rgba(13,18,26,.92)}
.ov.level{background:rgba(13,26,20,.90)}
.ov.over{background:rgba(31,13,13,.92)}
.ov.pause{background:rgba(13,15,26,.85)}
.title{font-size:28px;font-weight:900;text-align:center}
.title.sm{font-size:26px}
.title.fail{color:#ff6659}
.sub{font-size:13px;color:#b2c7e0;text-align:center;line-height:1.5;font-weight:600}
.stats{font-size:15px;color:#ffe070;text-align:center;font-weight:700;line-height:1.6}
.stats.plain{color:#fff}
.btn{min-width:260px;padding:12px 18px;border-radius:10px;font-size:16px;font-weight:800;color:#1a1208;text-align:center;background:#ffb020;box-shadow:0 4px 0 rgba(0,0,0,.22)}
.btn.ghost{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.18)}
.btn.ad{background:#345c94;color:#fff}
.btn.char{background:#593d1a;color:#ffe9c9;font-size:13px;min-width:300px;line-height:1.35}
.shop{width:380px;display:flex;flex-direction:column;gap:6px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px}
.shop h3{text-align:center;font-size:18px;font-weight:800}
.shop .bal{text-align:center;color:#ffe070;font-weight:700;font-size:14px}
.shop-row{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.06);border-radius:8px;padding:8px}
.shop-row img{width:28px;height:28px;image-rendering:pixelated;flex-shrink:0}
.shop-row .info{flex:1;text-align:left;font-size:12px;font-weight:700;line-height:1.35}
.shop-row .price{font-size:12px;font-weight:800;color:#1a1208;background:#ffb020;border-radius:8px;padding:6px 8px;white-space:nowrap}
.shop-row .price.ad{background:#345c94;color:#fff}
.shop-row .price.green{background:#337352;color:#fff}
.chars{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;width:380px}
.chars .c{width:64px;text-align:center;background:rgba(255,255,255,.07);border-radius:10px;padding:6px 4px;border:1px solid rgba(255,255,255,.1)}
.chars .c img{width:39px;height:51px;image-rendering:pixelated}
.chars .c .n{font-size:11px;font-weight:800;margin-top:2px}
.item-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.item-row img{width:32px;height:32px;image-rendering:pixelated;background:rgba(0,0,0,.25);border-radius:6px;padding:2px}
.test-coin{position:absolute;right:8px;top:46px;padding:6px 10px;border-radius:8px;background:#cc9e1a;color:#1a1208;font-size:12px;font-weight:800}
'@

function Write-Screen([string]$name, [string]$bodyHtml) {
  $html = @"
<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"/><title>$name</title>
<style>
$css
</style></head><body>
<div class="phone" data-name="$name">
$bodyHtml
</div></body></html>
"@
  $path = Join-Path $screenDir "$name.html"
  [IO.File]::WriteAllText($path, $html, [Text.UTF8Encoding]::new($false))
  Write-Output "wrote $name bytes=$($html.Length)"
}

$field = @"
<img class="bg" src="$($A.bg)" alt="bg"/>
<div class="grid">
<img src="$($A.winF2)"/><img src="$($A.winN)"/><img src="$($A.winF1)"/><img src="$($A.winR)"/><img src="$($A.winN)"/><img src="$($A.winF3)"/><img src="$($A.winN)"/>
<img src="$($A.winN)"/><img src="$($A.winF2)"/><img src="$($A.winN)"/><img src="$($A.winN)"/><img src="$($A.winF1)"/><img src="$($A.winN)"/><img src="$($A.winF2)"/>
<img src="$($A.winF1)"/><img src="$($A.winN)"/><img src="$($A.winRR)"/><img src="$($A.winN)"/><img src="$($A.winF2)"/><img src="$($A.winN)"/><img src="$($A.winN)"/>
<img src="$($A.winN)"/><img src="$($A.winF3)"/><img src="$($A.winN)"/><img src="$($A.winF1)"/><img src="$($A.winN)"/><img src="$($A.winR)"/><img src="$($A.winN)"/>
<img src="$($A.winF2)"/><img src="$($A.winN)"/><img src="$($A.winN)"/><img src="$($A.winN)"/><img src="$($A.winF1)"/><img src="$($A.winN)"/><img src="$($A.winF2)"/>
<img src="$($A.winN)"/><img src="$($A.winF1)"/><img src="$($A.winN)"/><img src="$($A.winF2)"/><img src="$($A.winN)"/><img src="$($A.winN)"/><img src="$($A.winF3)"/>
<img src="$($A.winF1)"/><img src="$($A.winN)"/><img src="$($A.winR)"/><img src="$($A.winN)"/><img src="$($A.winF2)"/><img src="$($A.winN)"/><img src="$($A.winN)"/>
<img src="$($A.winN)"/><img src="$($A.winF2)"/><img src="$($A.winN)"/><img src="$($A.winF1)"/><img src="$($A.winN)"/><img src="$($A.winN)"/><img src="$($A.winF1)"/>
</div>
<div class="paddle">
<img class="fmL" src="$($A.fmL)"/><img class="mat" src="$($A.mat)"/><img class="fmR" src="$($A.fmR)"/>
</div>
"@

$hud = @"
<div class="hud-top">
<div class="hud-box"><img src="$($A.icLv)"/><span>3</span></div>
<div class="hud-box"><img src="$($A.icSc)"/><span style="margin:0 auto">2460</span></div>
<div class="hud-box"><img src="$($A.icCn)"/><span style="margin:0 auto">1280</span></div>
<div class="hud-box"><img src="$($A.icLife)"/><span style="margin-left:auto">3</span></div>
</div>
<div class="goal"><img src="$($A.icFire)"/><span>火 5</span><img src="$($A.icRescue)"/><span>人 3</span><span>· 双通道</span></div>
"@

Write-Screen 'G01-Menu' @"
$field
<img class="ball" src="$($A.cat)" style="top:560px;left:205px"/>
<div class="ov menu">
<div class="title">救火英雄</div>
<div class="sub">灭火或救人 · 双通道过关<br>Godot 4.7 · IAA 验证版</div>
<div class="stats">最高分 12840　金币 1280</div>
<div class="btn char">角色：小猫 · 敏捷（点击切换）</div>
<div class="btn">开始游戏</div>
<div class="chars">
<div class="c"><img src="$($A.cat)"/><div class="n">小猫</div></div>
<div class="c"><img src="$($A.dog)"/><div class="n">小狗</div></div>
<div class="c"><img src="$($A.panda)"/><div class="n">熊猫</div></div>
<div class="c"><img src="$($A.capy)"/><div class="n">卡皮</div></div>
<div class="c"><img src="$($A.fox)"/><div class="n">狐狸</div></div>
</div>
</div>
<div class="test-coin">+500 金币</div>
"@

Write-Screen 'G02-InGame' @"
$field
<img class="ball" src="$($A.cat)"/>
$hud
<div class="skill"><img src="$($A.icSkill)"/>影分身</div>
<div class="vpad L">◀</div>
<div class="vpad R">▶</div>
<div class="hint">A/D 或拖拽移动 · 空格/点击发射 · Esc 暂停</div>
"@

Write-Screen 'G03-LevelClear-Shop' @"
$field
<div class="ov level">
<div class="title sm">扑灭成功！</div>
<div class="stats plain">本关奖励<br>分数 +860　金币 +80</div>
<div class="btn ad">看广告 · 双倍金币</div>
<div class="shop">
<h3>补给队 · 过关补给</h3>
<div class="bal">金币 1360</div>
<div class="shop-row"><img src="$($A.panda)"/><div class="info">熊猫 · 力量：灭火效率+1级</div><div class="price">2000 金币解锁</div></div>
<div class="shop-row"><img src="$($A.itemWide)"/><div class="info">长条 · 蹦床加长 8 秒</div><div class="price green">100 金币</div></div>
<div class="shop-row"><img src="$($A.itemExt)"/><div class="info">灭火器 · 下关首次着火自灭</div><div class="price green">120 金币</div></div>
<div class="shop-row"><img src="$($A.itemUp)"/><div class="info">1UP · 灭火等级 +1</div><div class="price green">200 金币</div></div>
<div class="shop-row"><div class="info">商品不满意？</div><div class="price ad">看广告刷新</div></div>
</div>
<div class="btn">下一关 →</div>
</div>
"@

Write-Screen 'G04-GameOver' @"
$field
<div class="ov over">
<div class="title sm fail">任务失败…</div>
<div class="stats plain">本局得分 1980<br>最高分 12840<br>金币 1280<br>到达第 3 关</div>
<div class="btn ad">看广告 · 复活</div>
<div class="btn">重新开始</div>
<div class="btn ghost">主菜单</div>
</div>
"@

Write-Screen 'G05-Pause' @"
$field
<img class="ball" src="$($A.cat)" style="opacity:.55"/>
$hud
<div class="ov pause">
<div class="title sm">已暂停</div>
<div class="btn">继续</div>
<div class="btn ghost">主菜单</div>
</div>
"@

Write-Screen 'G06-AssetBoard' @"
<div class="ov menu" style="justify-content:flex-start;padding-top:20px;gap:10px">
<div class="title sm">Godot PNG 资产板</div>
<div class="sub">除特效外 · fire-hero-godot/assets</div>
<img src="$($A.bg)" style="width:110px;height:196px;border:1px solid rgba(255,255,255,.2);border-radius:8px"/>
<div class="item-row">
<img src="$($A.winN)"/><img src="$($A.winF1)"/><img src="$($A.winF2)"/><img src="$($A.winF3)"/>
<img src="$($A.winR)"/><img src="$($A.winRR)"/>
</div>
<div class="item-row">
<img src="$($A.fmL)" style="width:28px;height:36px"/><img src="$($A.mat)" style="width:74px;height:8px;align-self:center"/><img src="$($A.fmR)" style="width:28px;height:36px"/>
</div>
<div class="chars">
<div class="c"><img src="$($A.cat)"/><div class="n">cat</div></div>
<div class="c"><img src="$($A.dog)"/><div class="n">dog</div></div>
<div class="c"><img src="$($A.panda)"/><div class="n">panda</div></div>
<div class="c"><img src="$($A.capy)"/><div class="n">capy</div></div>
<div class="c"><img src="$($A.fox)"/><div class="n">fox</div></div>
</div>
<div class="item-row">
<img src="$($A.icLv)"/><img src="$($A.icSc)"/><img src="$($A.icCn)"/><img src="$($A.icLife)"/>
<img src="$($A.icPause)"/><img src="$($A.icSkill)"/><img src="$($A.icFire)"/><img src="$($A.icRescue)"/>
</div>
<div class="item-row">
<img src="$($A.itemBag)"/><img src="$($A.itemWide)"/><img src="$($A.itemHam)"/>
<img src="$($A.itemExt)"/><img src="$($A.itemUp)"/><img src="$($A.itemFb)"/>
</div>
<div class="item-row"><img src="$($A.vilR)" style="width:40px;height:40px"/></div>
</div>
"@

Write-Output 'HTML done. Importing to Pixso...'

# ---- Pixso import ----
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
    clientInfo = @{ name = 'godot-replica'; version = '1' }
  }
} | ConvertTo-Json -Compress -Depth 6
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
    if ($obj.error) { return ('ERROR: ' + ($obj.error | ConvertTo-Json -Compress -Depth 6)) }
    if ($obj.result -and $obj.result.content) {
      return (($obj.result.content | ForEach-Object { if ($_.text) { $_.text } else { $_ | ConvertTo-Json -Compress } }) -join "`n")
    }
    return $Raw
  } catch { return $Raw }
}

# New page for Godot replica to avoid clobbering old prototypes
$prep = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
let page = null;
for (const p of pixso.root.children) {
  if (p.name === "Godot-UI-Replica") { page = p; break; }
}
if (!page) {
  page = pixso.createPage("Godot-UI-Replica");
}
await pixso.setCurrentPageAsync(page);
for (const c of [...page.children]) {
  try { c.remove(); } catch (e) {}
}
return { pageId: page.id, pageName: page.name, cleared: true };
'@ }
Write-Output ('PREP: ' + (Get-McpText $prep))

$screens = @(
  @{ file = 'G01-Menu.html'; name = 'G01-Menu'; col = 0; row = 0 }
  @{ file = 'G02-InGame.html'; name = 'G02-InGame'; col = 1; row = 0 }
  @{ file = 'G03-LevelClear-Shop.html'; name = 'G03-LevelClear-Shop'; col = 2; row = 0 }
  @{ file = 'G04-GameOver.html'; name = 'G04-GameOver'; col = 0; row = 1 }
  @{ file = 'G05-Pause.html'; name = 'G05-Pause'; col = 1; row = 1 }
  @{ file = 'G06-AssetBoard.html'; name = 'G06-AssetBoard'; col = 2; row = 1 }
)

$GAPX = 80; $GAPY = 120; $W = 450; $H = 800
$results = @()

foreach ($s in $screens) {
  $path = Join-Path $screenDir $s.file
  $html = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
  Write-Output ("--- import $($s.file) len=$($html.Length) ---")
  try {
    $c2d = Invoke-McpTool -Name 'code_to_design' -Arguments @{
      htmlStr = $html
      width = 450
      height = 800
    } -TimeoutSec 240
    Write-Output ('C2D: ' + (Get-McpText $c2d))
  } catch {
    Write-Output ('C2D FAIL: ' + $_.Exception.Message)
    continue
  }

  $tx = [int]($s.col * ($W + $GAPX))
  $ty = [int]($s.row * ($H + $GAPY))
  $nmJson = ($s.name | ConvertTo-Json)
  $placeScript = @"
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
const named = /^G0[1-6]-/;
let phone = null;
for (let i = phones.length - 1; i >= 0; i--) {
  if (!named.test(phones[i].name || '')) { phone = phones[i]; break; }
}
if (!phone) {
  const tops = page.children.filter(n => n.type === 'FRAME' && !named.test(n.name || '') && !(n.name || '').startsWith('label-'));
  phone = tops[tops.length - 1];
}
if (!phone) return { error: 'no phone', tops: page.children.map(n => n.name) };
if (phone.parent && phone.parent.id !== page.id) page.appendChild(phone);
phone.name = targetName;
phone.x = tx;
phone.y = ty;
try { if ('resize' in phone) phone.resize(450, 800); } catch (e) {}
for (const c of [...page.children]) {
  if ((c.name || '').startsWith('label-')) continue;
  if (named.test(c.name || '')) continue;
  let has = false;
  function scan(n) { if (!n) return; if (named.test(n.name || '')) has = true; if (n.children) for (const x of n.children) scan(x); }
  scan(c);
  if (!has) { try { c.remove(); } catch (e) {} }
}
return { placed: { id: phone.id, name: phone.name, x: phone.x, y: phone.y, w: phone.width, h: phone.height } };
"@
  $place = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = $placeScript } -TimeoutSec 60
  $pt = Get-McpText $place
  Write-Output ('PLACE: ' + $pt)
  $results += $pt
  Start-Sleep -Milliseconds 500
}

# labels
$lab = Invoke-McpTool -Name 'eval_script' -Arguments @{ script = @'
const page = pixso.currentPage;
let font = { family: "Inter", style: "Bold" };
try { await pixso.loadFontAsync(font); } catch (e) {
  font = { family: "Roboto", style: "Bold" };
  try { await pixso.loadFontAsync(font); } catch (e2) {}
}
const labels = [];
for (const frame of page.children) {
  if (frame.type !== "FRAME") continue;
  if (!(frame.name || "").startsWith("G0")) continue;
  const existing = page.children.find(n => n.name === "label-" + frame.name);
  if (existing) existing.remove();
  const t = pixso.createText();
  try { t.fontName = font; } catch (e) {}
  t.characters = frame.name;
  t.fontSize = 22;
  t.fills = [{ type: "SOLID", color: { r: 1, g: 0.82, b: 0.29 } }];
  t.name = "label-" + frame.name;
  t.x = frame.x;
  t.y = frame.y - 36;
  page.appendChild(t);
  labels.push(t.name);
}
return {
  page: page.name,
  frames: page.children.filter(n => n.type === "FRAME").map(n => ({ id: n.id, name: n.name, x: n.x, y: n.y, w: n.width, h: n.height })),
  labels
};
'@ }
$labText = Get-McpText $lab
Write-Output ('FINAL: ' + $labText)
[IO.File]::WriteAllText((Join-Path $outDir 'import-result.json'), $labText, [Text.UTF8Encoding]::new($false))

# export screenshots for first 3
try {
  $obj = $labText | ConvertFrom-Json
  $ids = @($obj.frames | Select-Object -First 3 | ForEach-Object { $_.id })
  if ($ids.Count -gt 0) {
    $shot = Invoke-McpTool -Name 'take_screenshot' -Arguments @{ nodeIds = $ids } -TimeoutSec 120
    $prev = Join-Path $outDir 'previews'
    New-Item -ItemType Directory -Force -Path $prev | Out-Null
    [IO.File]::WriteAllText((Join-Path $prev 'shot-batch0.json'), $shot, [Text.UTF8Encoding]::new($false))
    $so = $shot | ConvertFrom-Json
    $i = 0
    foreach ($c in $so.result.content) {
      $b64 = $null
      if ($c.data) { $b64 = $c.data }
      elseif ($c.text) {
        $m = [regex]::Match([string]$c.text, 'data:image/png;base64,([A-Za-z0-9+/=]+)')
        if ($m.Success) { $b64 = $m.Groups[1].Value }
      }
      if ($b64) {
        $png = Join-Path $prev ("preview-$i.png")
        [IO.File]::WriteAllBytes($png, [Convert]::FromBase64String($b64))
        Write-Output "preview $png"
        $i++
      }
    }
  }
  foreach ($f in @($obj.frames)) {
    $exp = Invoke-McpTool -Name 'get_export_image' -Arguments @{
      guid = $f.id
      exportSettings = @{ constraint = @{ type = 2; value = 450 }; imageType = 1 }
    } -TimeoutSec 60
    $et = Get-McpText $exp
    if ($et -match 'http://localhost:3667/export/[a-f0-9\-]+\.png') {
      $png = Join-Path $prev ("$($f.name).png")
      Invoke-WebRequest -Uri $Matches[0] -OutFile $png -TimeoutSec 30 -UseBasicParsing
      Write-Output "export $($f.name) size=$((Get-Item $png).Length)"
    }
  }
} catch {
  Write-Output ('export note: ' + $_.Exception.Message)
}

Write-Output 'ALL DONE'
