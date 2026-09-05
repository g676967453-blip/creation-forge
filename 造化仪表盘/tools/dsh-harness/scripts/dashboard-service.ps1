# dashboard-service.ps1
# 造化坊仪表盘本地服务（dashboard-server :3456）的登录自启管理脚本。
#
# 用途：
#   * 以「仓库根」为工作目录静默启动 npx tsx 造化仪表盘/tools/dashboard-server.ts
#   * 幂等：若 3456 已在监听则不再重复启动
#   * install/uninstall 注册当前用户「启动文件夹」自启（登录级，无需管理员权限）
#
# 用法：
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\dashboard-service.ps1 -Action install
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\dashboard-service.ps1 -Action uninstall
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\dashboard-service.ps1 -Action start
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\dashboard-service.ps1 -Action status
#
# 本脚本以自身位置推导仓库根（<repo>/造化仪表盘/tools/dsh-harness/scripts），
# 故可随仓库移动到任意盘符，不硬编码路径。

param(
  [ValidateSet('install','uninstall','start','stop','status')]
  [string]$Action = 'status'
)

$ErrorActionPreference = 'Stop'

# --- 定位仓库根：本文件在 <repo>\造化仪表盘\tools\dsh-harness\scripts\ 下 ---
$ScriptDir = [IO.Path]::GetFullPath($PSScriptRoot)
# scripts -> dsh-harness -> tools -> 造化仪表盘 -> repo
$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ScriptDir)))
$ServerTs = Join-Path $RepoRoot '造化仪表盘\tools\dashboard-server.ts'
$RunCmd   = Join-Path $RepoRoot 'node_modules\.bin\tsx.cmd'

if (-not (Test-Path $ServerTs)) { throw "未找到 dashboard-server.ts: $ServerTs" }

function Write-Info($m) { Write-Host "[dashboard-service] $m" }

function Get-IsListening {
  return [bool](Get-NetTCPConnection -LocalPort 3456 -State Listen -ErrorAction SilentlyContinue)
}

# --- 启动（幂等）---
function Start-Dashboard {
  if (Get-IsListening) { Write-Info '3456 已在监听，跳过启动'; return }
  Write-Info "工作目录: $RepoRoot"
  Write-Info "服务脚本: $ServerTs"

  # tsx 可执行方式：优先仓库 node_modules，缺失则退回 npx tsx
  $launch = @()
  if (Test-Path $RunCmd) {
    $launch = @($RunCmd, $ServerTs)
  } else {
    $launch = @('npx', 'tsx', $ServerTs)
  }

  $logDir = Join-Path $RepoRoot '造化仪表盘\reports'
  $outLog = Join-Path $logDir 'dashboard-service.out.log'
  $errLog = Join-Path $logDir 'dashboard-service.err.log'

  # Start-Process 静默后台启动（无窗口），stdout/stderr 重定向到日志
  $argList = @()
  for ($i = 1; $i -lt $launch.Length; $i++) { $argList += $launch[$i] }
  $p = Start-Process -FilePath $launch[0] -ArgumentList $argList `
        -WorkingDirectory $RepoRoot -WindowStyle Hidden `
        -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
  Write-Info "已启动 dashboard-server，PID=$($p.Id)（日志见 $logDir）"
}

function Stop-Dashboard {
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'dashboard-server' } |
    ForEach-Object { Write-Info "终止 node PID=$($_.ProcessId)"; Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Write-Info '已停止（若仍有残留占用 3456，请手动确认）'
}

function Show-Status {
  if (Get-IsListening) {
    $proc = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -match 'dashboard-server' } | Select-Object -First 1
    Write-Info "状态: 运行中 (3456 监听中, PID=$($proc.ProcessId))"
  } else {
    Write-Info '状态: 未运行 (3456 未监听)'
  }
  $startup = Get-StartupLauncher
  Write-Info "登录自启: $(if ($startup -and (Test-Path $startup)) { '已安装 -> ' + $startup } else { '未安装' })"
}

# --- 启动文件夹 .lnk 启动器路径 ---
# 用 .lnk（快捷方式）而非 .cmd：仓库路径含中文，.cmd 的 ASCII/ANSI 会丢字符，
# 而 .lnk 由 WScript.Shell 生成、路径以 UTF-16 保存，可正确承载中文路径。
$LauncherName = 'zaohua-dashboard.lnk'
function Get-StartupDir { return [Environment]::GetFolderPath('Startup') }
function Get-StartupLauncher { return Join-Path (Get-StartupDir) $LauncherName }

# 生成 .lnk：指向 powershell 跑本脚本 start（最小化窗口）
function Write-Launcher {
  $launcher = Get-StartupLauncher
  $ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
  $scriptFile = Join-Path $PSScriptRoot 'dashboard-service.ps1'

  $sh = New-Object -ComObject WScript.Shell
  $lnk = $sh.CreateShortcut($launcher)
  $lnk.TargetPath = $ps
  $lnk.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptFile`" -Action start"
  $lnk.WorkingDirectory = $PSScriptRoot
  $lnk.WindowStyle = 7   # 7 = minimized
  $lnk.Description = '造化坊仪表盘本地服务 (dashboard-server :3456) 登录自启'
  $lnk.Save()
  return $launcher
}

# --- 安装 / 卸载（登录启动文件夹）---
function Install-Autostart {
  $launcher = Write-Launcher
  Write-Info "已写入登录自启启动器: $launcher"
  Start-Dashboard
  Write-Info ''
  Write-Info '下次登录时 dashboard-server (3456) 将自动启动。'
}

function Uninstall-Autostart {
  $launcher = Get-StartupLauncher
  if (Test-Path $launcher) {
    Remove-Item -Force $launcher
    Write-Info "已移除登录自启启动器: $launcher"
  } else {
    Write-Info '登录自启启动器不存在，无需卸载'
  }
  Stop-Dashboard
}

switch ($Action) {
  'install'   { Install-Autostart }
  'uninstall' { Uninstall-Autostart }
  'start'     { Start-Dashboard }
  'stop'      { Stop-Dashboard }
  'status'    { Show-Status }
}
