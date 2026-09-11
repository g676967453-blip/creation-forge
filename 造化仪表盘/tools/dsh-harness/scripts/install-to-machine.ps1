# install-to-machine.ps1
# Install portable DSH harness pack into local ~/.dsh (profiles only; no worktable).
param(
  [string]$DshHome = $(if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }),
  [ValidateSet('desktop', 'web', 'both')]
  [string]$Profiles = 'both',
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$PackRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))

function Write-Info($m) { Write-Host "[install] $m" }
function Write-Warn($m) { Write-Host "[install] WARN $m" -ForegroundColor Yellow }

Write-Info "PackRoot = $PackRoot"
Write-Info "DshHome  = $DshHome"
Write-Info "Profiles = $Profiles"

New-Item -ItemType Directory -Force -Path $DshHome | Out-Null

$targets = @()
if ($Profiles -eq 'both') { $targets = @('desktop', 'web') } else { $targets = @($Profiles) }

foreach ($p in $targets) {
  $srcPkg = Join-Path $PackRoot "profiles\$p\package.json"
  if (-not (Test-Path $srcPkg)) {
    Write-Warn "missing profile package: $srcPkg"
    continue
  }
  $dstDir = Join-Path $DshHome "profiles\$p"
  $dstPkg = Join-Path $dstDir 'package.json'
  New-Item -ItemType Directory -Force -Path $dstDir | Out-Null

  $src = Get-Content $srcPkg -Raw | ConvertFrom-Json
  $dst = $null
  if (Test-Path $dstPkg) {
    try { $dst = Get-Content $dstPkg -Raw | ConvertFrom-Json } catch { $dst = $null }
  }
  if (-not $dst) {
    $dst = [pscustomobject]@{
      name         = "dsh-profile-$p"
      private      = $true
      dependencies = [pscustomobject]@{}
      dsh          = [pscustomobject]@{ profile = [pscustomobject]@{ bundles = @() } }
    }
  }
  if (-not $dst.dependencies) { $dst | Add-Member dependencies ([pscustomobject]@{}) -Force }
  if (-not $dst.dsh) { $dst | Add-Member dsh ([pscustomobject]@{ profile = [pscustomobject]@{ bundles = @() } }) -Force }
  if (-not $dst.dsh.profile) { $dst.dsh | Add-Member profile ([pscustomobject]@{ bundles = @() }) -Force }

  # drop worktable dependency if any
  if ($dst.dependencies.PSObject.Properties.Name -contains 'dsh-worktable') {
    $dst.dependencies.PSObject.Properties.Remove('dsh-worktable')
  }

  # merge bundles without worktable
  $bundles = @()
  if ($dst.dsh.profile.bundles) { $bundles += @($dst.dsh.profile.bundles) }
  if ($src.dsh.profile.bundles) { $bundles += @($src.dsh.profile.bundles) }
  $bundles = $bundles | Where-Object { $_ -and $_ -ne 'dsh-worktable' } | Select-Object -Unique
  foreach ($must in @('@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app')) {
    if ($bundles -notcontains $must) { $bundles += $must }
  }
  $dst.dsh.profile.bundles = @($bundles)

  # keep web version pins if present on src and missing on dst
  if ($p -eq 'web' -and $src.dependencies) {
    foreach ($name in @('@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app')) {
      $srcVal = $src.dependencies.$name
      $dstVal = $dst.dependencies.$name
      if ($srcVal -and -not $dstVal) {
        $dst.dependencies | Add-Member -NotePropertyName $name -NotePropertyValue $srcVal -Force
      }
    }
  }

  if ($WhatIf) {
    Write-Info "WhatIf: would write $dstPkg"
  }
  else {
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
}

# remove leftover worktable plugin cache / links on this machine
$cache = Join-Path $DshHome 'plugins-cache'
if (Test-Path $cache) {
  Get-ChildItem $cache -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like 'dsh-worktable*' } |
    ForEach-Object {
      if ($WhatIf) { Write-Info "WhatIf: would remove $($_.FullName)" }
      else {
        Remove-Item -Recurse -Force $_.FullName
        Write-Info "removed cache $($_.Name)"
      }
    }
}
foreach ($p in $targets) {
  $nm = Join-Path $DshHome "profiles\$p\node_modules\dsh-worktable"
  if (Test-Path $nm) {
    if ($WhatIf) { Write-Info "WhatIf: would remove $nm" }
    else {
      Remove-Item -Recurse -Force $nm
      Write-Info "removed $nm"
    }
  }
}

Write-Host ''
Write-Host '==== NEXT STEPS ====' -ForegroundColor Cyan
Write-Host '1) Fully quit DSH Desktop (tray too) and reopen'
Write-Host '2) Hard refresh UI (Ctrl+F5)'
Write-Host '3) Configure API keys locally (never from Git): DSH settings / env vars'
Write-Host '4) Worktable plugin has been removed from this pack and local profiles'
Write-Host ''
Write-Info 'DONE'
