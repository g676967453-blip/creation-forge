# register-dsh-daily-task.ps1
# DSH 信息日报「自动生成」的两种挂载方式管理脚本。
#
# 方式 A（精确到点，需管理员执行一次）：Windows 计划任务，周一~周五 09:00
# 方式 B（零权限备选）：登录启动文件夹，早上首次登录后补跑当天日报
#
# 用法：
#   # 方式 A（请在「管理员」PowerShell 里执行）
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\register-dsh-daily-task.ps1 -Action install
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\register-dsh-daily-task.ps1 -Action install -Time 08:30
#
#   # 方式 B（普通权限即可）
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\register-dsh-daily-task.ps1 -Action install-startup
#
#   # 查看 / 触发 / 卸载
#   ... -Action status
#   ... -Action run-now
#   ... -Action uninstall            # 卸计划任务
#   ... -Action uninstall-startup    # 卸登录自启
#
# 设计要点：
#   * 幂等：install 直接 -Force 覆盖同名任务/同名启动项，重复执行不报错。
#   * 仓库根由脚本位置推导，可随仓库换盘符，不硬编码路径。
#   * 不在仓库内保存任何密码。
#   * 方式 B 用 .vbs 隐藏窗口拉起，避免登录时弹控制台。
#
# 注意：本文件必须保存为 UTF-8 **带 BOM**，Windows PowerShell 5.1 才能正确解析中文。

param(
  [ValidateSet('install','install-startup','uninstall','uninstall-startup','status','run-now')]
  [string]$Action = 'status',
  [string]$Time = '09:00',
  [string]$TaskName = '造化坊-DSH日报'
)

$ErrorActionPreference = 'Stop'

# --- 定位路径：本文件在 <repo>\造化仪表盘\tools\dsh-report\ 下 ---
$ScriptDir = [IO.Path]::GetFullPath($PSScriptRoot)
$ToolsDir  = Split-Path -Parent $ScriptDir
$RepoRoot  = Split-Path -Parent (Split-Path -Parent $ToolsDir)
$Runner    = Join-Path $ScriptDir 'run-dsh-daily.ps1'

if (-not (Test-Path $Runner)) { throw "未找到生成脚本: $Runner" }

$StartupDir = [Environment]::GetFolderPath('Startup')
$StartupVbs = Join-Path $StartupDir '造化坊-DSH日报.vbs'

function Write-Info($m) { Write-Host "[dsh-daily-task] $m" }

function Get-PowerShellExe {
  $pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
  if ($pwsh) { return $pwsh.Source }
  $fallback = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
  if (Test-Path $fallback) { return $fallback }
  throw '未找到可用的 PowerShell 解释器（pwsh / powershell.exe）'
}

function Get-Task {
  return Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}

switch ($Action) {

  'install' {
    $psExe = Get-PowerShellExe
    Write-Info "解释器: $psExe"
    Write-Info "仓库根: $RepoRoot"
    Write-Info "生成脚本: $Runner"

    $arg = '-NoProfile -ExecutionPolicy Bypass -File "' + $Runner + '"'
    $taskAction = New-ScheduledTaskAction -Execute $psExe -Argument $arg -WorkingDirectory $RepoRoot

    # 每周一~周五
    $trigger = New-ScheduledTaskTrigger -Weekly `
      -DaysOfWeek Monday, Tuesday, Wednesday, Thursday, Friday -At $Time

    $settings = New-ScheduledTaskSettingsSet `
      -StartWhenAvailable `
      -MultipleInstances IgnoreNew `
      -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
      -AllowStartIfOnBatteries `
      -DontStopIfGoingOnBatteries

    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" `
      -LogonType Interactive -RunLevel Limited

    if (Get-Task) { Write-Info "同名任务已存在，将被覆盖（幂等）" }

    try {
      Register-ScheduledTask -TaskName $TaskName -Action $taskAction -Trigger $trigger `
        -Settings $settings -Principal $principal -Force `
        -Description '每工作日自动生成 DeepSeek Harness 信息日报（造化坊）' | Out-Null
    } catch {
      Write-Info "注册失败：$($_.Exception.Message)"
      Write-Info ""
      Write-Info "本机策略不允许非管理员进程创建计划任务。请二选一："
      Write-Info "  1) 右键以「管理员身份」运行 PowerShell，再执行同一条 install 命令；"
      Write-Info "  2) 改用零权限的登录自启方式： -Action install-startup"
      exit 1
    }

    Write-Info "已注册计划任务：$TaskName（周一~周五 $Time）"
    Write-Info "首次运行会自动初始化 headless profile（写入 ~/.dsh/profiles），属正常现象。"
  }

  'install-startup' {
    $vbs = @"
' 造化坊-DSH日报：登录时隐藏窗口补跑当天日报（幂等判断在 run-dsh-daily.ps1 内）
Set sh = CreateObject("WScript.Shell")
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$Runner""", 0, False
"@
    # 必须用 UTF-16LE（-Encoding Unicode）：仓库路径含中文，
    # 而 WSH 只对 ANSI 或带 BOM 的 UTF-16 脚本正确解码；ASCII/UTF-8 会把中文路径变成 ?。
    Set-Content -Path $StartupVbs -Value $vbs -Encoding Unicode
    Write-Info "已写入登录自启：$StartupVbs"
    Write-Info "生效时机：下次登录（早上首次登录后自动补跑当天日报；已存在则跳过）"
    Write-Info "卸载：-Action uninstall-startup"
  }

  'uninstall' {
    $existing = Get-Task
    if (-not $existing) { Write-Info "计划任务不存在，无需卸载：$TaskName"; exit 0 }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Info "已移除计划任务：$TaskName"
  }

  'uninstall-startup' {
    if (-not (Test-Path $StartupVbs)) { Write-Info "登录自启不存在，无需卸载：$StartupVbs"; exit 0 }
    Remove-Item -Path $StartupVbs -Force
    Write-Info "已移除登录自启：$StartupVbs"
  }

  'status' {
    Write-Info "目标脚本：$Runner"
    Write-Info ""

    $task = Get-Task
    if ($task) {
      $info = Get-ScheduledTaskInfo -TaskName $TaskName
      Write-Info "【方式 A · 计划任务】已注册"
      Write-Info "  状态：$($task.State)"
      Write-Info "  触发器：$($task.Triggers | ForEach-Object { "$($_.DaysOfWeek) $($_.StartBoundary)" })"
      Write-Info "  上次运行：$($info.LastRunTime)（结果码 $($info.LastTaskResult)）"
      Write-Info "  下次运行：$($info.NextRunTime)"
    } else {
      Write-Info "【方式 A · 计划任务】未注册"
      Write-Info "  注册（需管理员）：-Action install"
    }

    Write-Info ""
    if (Test-Path $StartupVbs) {
      Write-Info "【方式 B · 登录自启】已安装：$StartupVbs"
    } else {
      Write-Info "【方式 B · 登录自启】未安装"
      Write-Info "  安装（无需管理员）：-Action install-startup"
    }

    $reports = Join-Path $RepoRoot '造化仪表盘\reports\dsh-daily'
    if (Test-Path $reports) {
      $latest = Get-ChildItem $reports -Filter '*.md' -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}\.md$' } |
        Sort-Object Name -Descending | Select-Object -First 1
      if ($latest) {
        Write-Info ""
        Write-Info "已有最新日报：$($latest.Name)（$($latest.LastWriteTime)）"
      }
    }
  }

  'run-now' {
    $task = Get-Task
    if ($task) {
      Write-Info "立即触发计划任务：$TaskName"
      Start-ScheduledTask -TaskName $TaskName
      Write-Info "已触发。用 -Action status 看结果码；日志见 造化仪表盘/reports/dsh-daily/logs/"
    } else {
      Write-Info "计划任务未注册，改为前台直接运行生成脚本…"
      & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Runner
    }
  }
}
