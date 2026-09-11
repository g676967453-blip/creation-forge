# 启动 Godot MCP 服务（无头实例）
#
# 用途：不打开 Godot 编辑器 GUI，直接以无头模式启动 MCP 服务，供 AI 客户端连接
# 用法：
#   powershell -File tools/start-godot-mcp.ps1 -ProjectPath "J:\ceshi\projects\IAA\fire-hero-godot"
#   可选：-Port 9080
#
# 验证：curl http://127.0.0.1:9080/  → 返回 endpoints 即正常

param(
    [string]$ProjectPath = "J:\ceshi\projects\IAA\fire-hero-godot",
    [int]$Port = 9080
)

$ErrorActionPreference = "Stop"

# 常见 Godot 可执行文件位置（按优先级）
$candidates = @(
    "F:\Godot_v4.7-stable_win64.exe\Godot_v4.7-stable_win64_console.exe",
    "F:\Godot_v4.7-stable_win64.exe\Godot_v4.7-stable_win64.exe",
    "C:\软件\Godot_v4.7.1-stable_win64.exe\Godot_v4.7.1-stable_win64_console.exe"
)
$godot = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $godot) {
    Write-Host "未自动找到 Godot，请输入完整路径："
    $godot = Read-Host "Godot 可执行文件"
}
if (-not (Test-Path (Join-Path $ProjectPath "project.godot"))) {
    Write-Error "未找到 project.godot：$ProjectPath"
}

# 端口占用检查
$used = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($used) {
    Write-Host "[!] 端口 $Port 已被占用（PID $($used.OwningProcess -join ',')）。"
    Write-Host "    可能已有一个 MCP 服务在跑，或你的 Godot 编辑器面板已启动服务。"
    Write-Host "    如要另起，请换端口：-Port 19080"
    exit 1
}

Write-Host "[..] 启动 Godot MCP 服务"
Write-Host "     引擎: $godot"
Write-Host "     项目: $ProjectPath"
Write-Host "     端口: $Port"
Write-Host "     （关闭此窗口即停止服务）"
Write-Host ""

# 前台运行，便于看到日志与 Ctrl+C 停止
& $godot --headless --editor --path $ProjectPath -- --mcp-server --mcp-port=$Port
