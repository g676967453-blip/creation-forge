# Godot MCP 插件一键安装（Godot-MCP-Native）
#
# 用途：给任意 Godot 4 项目安装 MCP 插件（AI 可通过 MCP 操作项目：场景/脚本/节点/资源/调试）
# 插件来源：https://github.com/yurineko73/Godot-MCP-Native （GDScript 原生实现，零依赖）
#
# 用法：
#   pwsh -File tools/install-godot-mcp.ps1 -ProjectPath "J:\ceshi\projects\IAA\fire-hero-godot"
#   （不传 ProjectPath 则交互输入）
#
# 效果：
#   1) 复制 addons/godot_mcp 到目标项目
#   2) 在 project.godot 的 [editor_plugins] 中启用插件
#   3) 打印启动/连接说明

param(
    [string]$ProjectPath = ""
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$PluginSource = Join-Path $RepoRoot "templates\game-godot\addons\godot_mcp"

if (-not $ProjectPath) {
    $ProjectPath = Read-Host "请输入 Godot 项目目录（含 project.godot）"
}
$ProjectPath = $ProjectPath.Trim('"').TrimEnd([char]92)

$projectFile = Join-Path $ProjectPath "project.godot"
if (-not (Test-Path $projectFile)) {
    Write-Error "未找到 project.godot：$projectFile"
}
if (-not (Test-Path $PluginSource)) {
    Write-Error "未找到插件源：$PluginSource（请确认仓库 templates/game-godot/addons/godot_mcp 存在）"
}

# 1) 复制插件
$addonsDir = Join-Path $ProjectPath "addons"
New-Item -ItemType Directory -Path $addonsDir -Force | Out-Null
$target = Join-Path $addonsDir "godot_mcp"
if (Test-Path $target) {
    Write-Host "[..] 已存在 addons/godot_mcp，覆盖更新"
    Remove-Item $target -Recurse -Force
}
Copy-Item $PluginSource $target -Recurse -Force
Write-Host "[OK] 插件已复制 -> addons/godot_mcp"

# 2) 在 project.godot 启用插件
$pluginRes = "res://addons/godot_mcp/plugin.cfg"
$content = Get-Content $projectFile -Raw -Encoding UTF8
$section = "[editor_plugins]"
$entry = "enabled=PackedStringArray(`"$pluginRes`")"

if ($content -match [regex]::Escape($section)) {
    if ($content -match [regex]::Escape($pluginRes)) {
        Write-Host "[OK] project.godot 已启用该插件（跳过）"
    } else {
        # 已有 [editor_plugins] 段：把路径追加进 enabled 数组
        $pattern = "(?s)(\[editor_plugins\].*?enabled=PackedStringArray\()([^)]*)(\))"
        $content = [regex]::Replace($content, $pattern, {
            param($m)
            $inner = $m.Groups[2].Value
            $newInner = if ($inner.Trim() -eq "") { "`"$pluginRes`"" } else { "$inner, `"$pluginRes`"" }
            "$($m.Groups[1].Value)$newInner$($m.Groups[3].Value)"
        })
        Set-Content -Path $projectFile -Value $content -Encoding UTF8 -NoNewline
        Write-Host "[OK] 已在 project.godot 的 [editor_plugins] 追加启用项"
    }
} else {
    $content = $content.TrimEnd() + "`n`n$section`n`n$entry`n"
    Set-Content -Path $projectFile -Value $content -Encoding UTF8 -NoNewline
    Write-Host "[OK] 已在 project.godot 新建 [editor_plugins] 并启用插件"
}

# 3) 使用说明
Write-Host ""
Write-Host "===== 启动 MCP 服务 ====="
Write-Host "方式 A（编辑器内）：打开 Godot -> 右侧 MCP 面板 -> 启动（默认端口 9080）"
Write-Host "方式 B（命令行/无头）："
Write-Host "  godot --editor --path `"$ProjectPath`" -- --mcp-server --mcp-port=9080"
Write-Host ""
Write-Host "===== 验证 ====="
Write-Host "  curl http://127.0.0.1:9080/     # 返回 endpoints 信息即正常"
Write-Host ""
Write-Host "===== AI 客户端连接（HTTP 模式）====="
Write-Host "  Cursor/Trae/Claude Desktop 等配置 mcp-remote 指向 http://127.0.0.1:9080/mcp"
Write-Host "  详见插件自带文档：addons/godot_mcp/README.zh.md"
