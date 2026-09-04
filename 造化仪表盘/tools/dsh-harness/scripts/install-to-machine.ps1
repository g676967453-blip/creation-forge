# install-to-machine.ps1
# Install portable DSH harness pack into local ~/.dsh
param(
  [string]$DshHome = $(if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }),
  [ValidateSet('desktop','web','both')]
  [string]$Profiles = 'both',
  [switch]$SkipPluginAdd,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$PackRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

function Write-Info($m) { Write-Host "[install] $m" }
function Write-Warn($m) { Write-Host "[install] WARN $m" -ForegroundColor Yellow }

Write-Info "PackRoot = $PackRoot"
Write-Info "DshHome  = $DshHome"
Write-Info "Profiles = $Profiles"

$pluginSrc = Join-Path $PackRoot 'plugins\dsh-worktable'
if (-not (Test-Path (Join-Path $pluginSrc 'lib\index.js'))) { throw "missing plugin: $pluginSrc\lib\index.js" }
if (-not (Test-Path (Join-Path $pluginSrc 'lib\client.js'))) { throw "missing plugin: $pluginSrc\lib\client.js" }

# Ensure dsh CLI
$dshCmd = Get-Command dsh -ErrorAction SilentlyContinue
if (-not $dshCmd) {
  Write-Warn 'dsh command not found in PATH. Will still copy files; run dsh plugin manually later.'
}

New-Item -ItemType Directory -Force -Path $DshHome | Out-Null
$cacheDir = Join-Path $DshHome 'plugins-cache'
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null
$pluginDst = Join-Path $cacheDir 'dsh-worktable'
if ($WhatIf) {
  Write-Info "WhatIf: would sync plugin -> $pluginDst"
} else {
  if (Test-Path $pluginDst) { Remove-Item -Recurse -Force $pluginDst }
  New-Item -ItemType Directory -Force -Path $pluginDst | Out-Null
  & robocopy $pluginSrc $pluginDst /E /XD node_modules /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
  Write-Info "plugin installed at $pluginDst"
}

$targets = @()
if ($Profiles -eq 'both') { $targets = @('desktop','web') } else { $targets = @($Profiles) }

foreach ($p in $targets) {
  $srcPkg = Join-Path $PackRoot "profiles\$p\package.json"
  $dstDir = Join-Path $DshHome "profiles\$p"
  $dstPkg = Join-Path $dstDir 'package.json'
  New-Item -ItemType Directory -Force -Path $dstDir | Out-Null

  # merge bundles + dependency
  $src = Get-Content $srcPkg -Raw | ConvertFrom-Json
  $dst = $null
  if (Test-Path $dstPkg) {
    try { $dst = Get-Content $dstPkg -Raw | ConvertFrom-Json } catch { $dst = $null }
  }
  if (-not $dst) {
    $dst = [pscustomobject]@{
      name = "dsh-profile-$p"
      private = $true
      dependencies = [pscustomobject]@{}
      dsh = [pscustomobject]@{ profile = [pscustomobject]@{ bundles = @() } }
    }
  }
  if (-not $dst.dependencies) { $dst | Add-Member dependencies ([pscustomobject]@{}) -Force }
  if (-not $dst.dsh) { $dst | Add-Member dsh ([pscustomobject]@{ profile = [pscustomobject]@{ bundles = @() } }) -Force }
  if (-not $dst.dsh.profile) { $dst.dsh | Add-Member profile ([pscustomobject]@{ bundles = @() }) -Force }

  # set portable-to-machine absolute link for worktable
  $linkPath = ($pluginDst -replace '\\','/')
  $dst.dependencies | Add-Member -NotePropertyName 'dsh-worktable' -NotePropertyValue ("link:" + $linkPath) -Force

  # merge bundles
  $bundles = @()
  if ($dst.dsh.profile.bundles) { $bundles += @($dst.dsh.profile.bundles) }
  if ($src.dsh.profile.bundles) { $bundles += @($src.dsh.profile.bundles) }
  $bundles = $bundles | Where-Object { $_ } | Select-Object -Unique
  foreach ($must in @('@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app','dsh-worktable')) {
    if ($bundles -notcontains $must) { $bundles += $must }
  }
  $dst.dsh.profile.bundles = @($bundles)

  # keep web version pins if present on src and missing on dst
  if ($p -eq 'web' -and $src.dependencies) {
    foreach ($name in @('@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app')) {
      $srcVal = $src.dependencies.$name
      $dstVal = $dst.dependencies.$name
      if ($srcVal -and -not $dstVal) {
        $dst.dependencies | Add-Member -NotePropertyName $name -NotePropertyValue $srcVal -Force
      }
    }
  }

  if ($WhatIf) {
    Write-Info "WhatIf: would write $dstPkg"
  } else {
    $json = $dst | ConvertTo-Json -Depth 12
    [IO.File]::WriteAllText($dstPkg, $json, (New-Object System.Text.UTF8Encoding $false))
    Write-Info "wrote $dstPkg"

    $srcPatch = Join-Path $PackRoot "profiles\$p\cordis.patch.yml"
    $dstPatch = Join-Path $dstDir 'cordis.patch.yml'
    if ((Test-Path $srcPatch) -and -not (Test-Path $dstPatch)) {
      Copy-Item $srcPatch $dstPatch
      Write-Info "copied cordis.patch.yml for $p"
    }
  }

  if (-not $SkipPluginAdd -and -not $WhatIf -and $dshCmd) {
    Write-Info "dsh plugin --profile $p add link:$pluginDst"
    & dsh plugin --profile $p add "link:$pluginDst"
    if ($LASTEXITCODE -ne 0) {
      Write-Warn "dsh plugin add exit code $LASTEXITCODE for profile $p"
    } else {
      Write-Info "plugin add ok for $p"
    }
  }
}

Write-Host ''
Write-Host '==== NEXT STEPS ====' -ForegroundColor Cyan
Write-Host '1) Fully quit DSH Desktop (tray too) and reopen'
Write-Host '2) Hard refresh UI (Ctrl+F5)'
Write-Host '3) Optional: import worktable state via scripts/worktable-state-tool.html'
Write-Host '4) Configure API keys locally (never from Git): DSH settings / env vars'
Write-Host '5) Verify: sidebar Worktable, explorer path input, right-click file ops'
Write-Host ''
Write-Info 'DONE'