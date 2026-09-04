# export-from-machine.ps1
# Export current machine DSH portable config + worktable plugin into this pack.
param(
  [string]$DshHome = $(if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }),
  [switch]$IncludeStatePlaceholder
)

$ErrorActionPreference = 'Stop'
$PackRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $PackRoot 'plugins'))) {
  $PackRoot = $PSScriptRoot + '\..'
  $PackRoot = [IO.Path]::GetFullPath($PackRoot)
}

function Write-Info($m) { Write-Host "[export] $m" }

Write-Info "PackRoot = $PackRoot"
Write-Info "DshHome  = $DshHome"

if (-not (Test-Path $DshHome)) { throw "DSH home not found: $DshHome" }

# 1) profiles
foreach ($p in @('desktop','web')) {
  $srcDir = Join-Path $DshHome "profiles\$p"
  $dstDir = Join-Path $PackRoot "profiles\$p"
  New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
  foreach ($f in @('package.json','cordis.patch.yml')) {
    $s = Join-Path $srcDir $f
    if (Test-Path $s) {
      Copy-Item -Force $s (Join-Path $dstDir $f)
      Write-Info "copied profile $p/$f"
    }
  }
  # rewrite dsh-worktable dependency to portable relative link
  $pkgPath = Join-Path $dstDir 'package.json'
  if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    if (-not $pkg.dependencies) { $pkg | Add-Member -NotePropertyName dependencies -NotePropertyValue ([pscustomobject]@{}) }
    $pkg.dependencies | Add-Member -NotePropertyName 'dsh-worktable' -NotePropertyValue 'link:../../plugins/dsh-worktable' -Force
    if (-not $pkg.dsh) { $pkg | Add-Member dsh ([pscustomobject]@{ profile = ([pscustomobject]@{ bundles = @() }) }) }
    if (-not $pkg.dsh.profile) { $pkg.dsh | Add-Member profile ([pscustomobject]@{ bundles = @() }) -Force }
    $bundles = @($pkg.dsh.profile.bundles)
    if ($bundles -notcontains 'dsh-worktable') { $bundles += 'dsh-worktable' }
    # ensure base bundles present for web/desktop
    foreach ($b in @('@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app')) {
      if ($bundles -notcontains $b) { $bundles = @($b) + $bundles }
    }
    $pkg.dsh.profile.bundles = $bundles
    $json = $pkg | ConvertTo-Json -Depth 10
    [IO.File]::WriteAllText($pkgPath, $json, (New-Object System.Text.UTF8Encoding $false))
    Write-Info "normalized $p package.json dependencies/bundles"
  }
}

# 2) worktable plugin from plugins-cache (prefer versioned dir)
$cache = Join-Path $DshHome 'plugins-cache'
$candidates = @()
if (Test-Path $cache) {
  $candidates = Get-ChildItem $cache -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'dsh-worktable*' } | Sort-Object LastWriteTime -Descending
}
$pluginSrc = $null
if ($candidates -and $candidates.Count -gt 0) { $pluginSrc = $candidates[0].FullName }
if (-not $pluginSrc) {
  foreach ($p in @('desktop','web')) {
    $nm = Join-Path $DshHome "profiles\$p\node_modules\dsh-worktable"
    if (Test-Path $nm) { $pluginSrc = (Resolve-Path $nm).Path; break }
  }
}
if (-not $pluginSrc) { throw 'dsh-worktable plugin source not found under plugins-cache or profile node_modules' }

$pluginDst = Join-Path $PackRoot 'plugins\dsh-worktable'
if (Test-Path $pluginDst) { Remove-Item -Recurse -Force $pluginDst }
New-Item -ItemType Directory -Force -Path $pluginDst | Out-Null
Write-Info "copy plugin from $pluginSrc"
& robocopy $pluginSrc $pluginDst /E /XD node_modules /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if (-not (Test-Path (Join-Path $pluginDst 'lib\client.js'))) { throw 'plugin copy missing lib/client.js' }
if (-not (Test-Path (Join-Path $pluginDst 'lib\index.js'))) { throw 'plugin copy missing lib/index.js' }
Write-Info 'plugin copied'

# 3) settings example
$settings = Join-Path $DshHome 'settings.yaml'
$tplDir = Join-Path $PackRoot 'templates'
New-Item -ItemType Directory -Force -Path $tplDir | Out-Null
if (Test-Path $settings) {
  $body = [IO.File]::ReadAllText($settings)
  $out = "# DSH settings TEMPLATE (no secrets).`r`n# Set API keys via env vars / DSH credentials UI. Never commit real keys.`r`n`r`n" + $body
  [IO.File]::WriteAllText((Join-Path $tplDir 'settings.yaml.example'), $out, (New-Object System.Text.UTF8Encoding $false))
  Write-Info 'wrote templates/settings.yaml.example'
}

Write-Info 'DONE. Next: commit tools/dsh-harness, then on other machine run install-to-machine.ps1'
Write-Info 'Export worktable localStorage via scripts/worktable-state-tool.html inside DSH Desktop if needed.'