# GodotPrompter 技能包一键安装
#
# 用途：给仓库安装 GodotPrompter —— 55 个 Godot 4.x 专属 Agent Skills，
#       让 AI 按 Godot 官方风格写 GDScript / 场景树 / 工程结构，而不是自由发挥。
#
# 来源：https://github.com/jame581/GodotPrompter （MIT，作者 Jan Mesarc）
#
# 用法：
#   powershell -NoProfile -File tools/install-godot-skills.ps1
#   powershell -NoProfile -File tools/install-godot-skills.ps1 -DshPresetId godot
#   powershell -NoProfile -File tools/install-godot-skills.ps1 -Force -Version v1.13.2
#
# 安装位置：
#   1) <repo>\.claude\skills\                         Claude Code 仓库级（打开仓库根即加载）
#   2) <repo>\templates\game-godot\.claude\skills\    新 Godot 项目模板
#   3) <DSH_HOME>\.agent-presets\<id>\skills\         可选，DSH agent preset（需 -DshPresetId）
#
# 关键约束：技能必须是扁平的 <name>/SKILL.md。
#   dsh-skill-filesystem 与 Claude Code 的技能发现都只有一层，
#   嵌套的 **/SKILL.md 不会被发现 —— 所以不要给技能加分类子目录。

param(
    [string]$Version = "v1.13.2",
    [string]$RepoUrl = "https://github.com/jame581/GodotPrompter",
    [string[]]$Targets = @(),
    [string]$DshPresetId = "",
    [string]$BasePresetDir = "",
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false

# ---------- 0) 目标目录 ----------
if (-not $Targets -or $Targets.Count -eq 0) {
    $Targets = @(
        (Join-Path $RepoRoot ".claude\skills"),
        (Join-Path $RepoRoot "templates\game-godot\.claude\skills")
    )
}
$Targets = $Targets | ForEach-Object { $_.Trim('"').TrimEnd([char]92) }

# ---------- 1) 取上游源码 ----------
$WorkDir = Join-Path $env:TEMP "godot-prompter-$Version"
if ($Force -and (Test-Path $WorkDir)) {
    Write-Host "[..] -Force：删除旧副本 $WorkDir"
    Remove-Item $WorkDir -Recurse -Force
}
if (-not (Test-Path (Join-Path $WorkDir "skills"))) {
    Write-Host "[..] 克隆 $RepoUrl ($Version) -> $WorkDir"
    # 必须把两个流都收进变量：git 会把进度和 detached-HEAD 提示写到 stderr，
    # 在 $ErrorActionPreference = "Stop" 下若让它直接落到控制台，
    # PowerShell 5.1 会把整次调用判为失败（退出码 1），即使克隆其实成功。
    $cloneOut = & git -c http.proxy= -c https.proxy= clone --quiet --depth 1 --branch $Version $RepoUrl $WorkDir 2>&1
    if ($LASTEXITCODE -ne 0) {
        $cloneOut | ForEach-Object { Write-Host "  $_" }
        throw "git clone 失败（退出码 $LASTEXITCODE）"
    }
} else {
    Write-Host "[OK] 复用已有副本 $WorkDir（用 -Force 重新拉取）"
}

$SrcSkills = Join-Path $WorkDir "skills"
if (-not (Test-Path $SrcSkills)) { throw "未找到 $SrcSkills" }
$SkillDirs = Get-ChildItem $SrcSkills -Directory
$Sha = (& git -C $WorkDir rev-parse HEAD).Trim()
Write-Host "[OK] 上游 $($SkillDirs.Count) 个技能，commit $Sha"

# ---------- 2) 复制到各目标 ----------
function Write-Provenance {
    param([string]$Dir, [int]$Count)
    Copy-Item (Join-Path $WorkDir "LICENSE") (Join-Path $Dir "GODOT-PROMPTER-LICENSE.txt") -Force
    $body = @"
# GodotPrompter — 上游来源与许可

- 仓库: $RepoUrl
- 版本: $Version
- commit: $Sha
- 许可: MIT（见 GODOT-PROMPTER-LICENSE.txt）
- 作者: Jan Mesarc / GodotPrompter Contributors
- 同步时间: $(Get-Date -Format 'yyyy-MM-dd')
- 技能数: $Count

## 重新同步

``````powershell
powershell -NoProfile -File tools/install-godot-skills.ps1 -Force
``````

## 说明

本目录为上游 ``skills/`` 的原样副本。上游 ``hooks/``（SessionStart 路由卡）与
``.claude-plugin/`` 依赖 Claude Code 插件运行时（``${CLAUDE_PLUGIN_ROOT}``），
未随本副本安装；``using-godot-prompter`` 技能已保留为入口索引。

**上游 ``CLAUDE.md`` 是它自己仓库的贡献者指南，不适用于使用方项目。**
"@
    [System.IO.File]::WriteAllText((Join-Path $Dir "GODOT-PROMPTER-SOURCE.md"), $body, $Utf8NoBom)
}

foreach ($t in $Targets) {
    New-Item -ItemType Directory -Force -Path $t | Out-Null
    $existing = Get-ChildItem $t -Force | ForEach-Object { $_.BaseName }
    $clash = $SkillDirs | Where-Object { $existing -contains $_.Name }
    if ($clash) {
        Write-Host "[..] $t 已有 $($clash.Count) 个同名技能，将刷新为 $Version 版本"
    }
    foreach ($s in $SkillDirs) {
        Copy-Item $s.FullName $t -Recurse -Force
    }
    Write-Provenance -Dir $t -Count $SkillDirs.Count
    Write-Host "[OK] $t  ->  $((Get-ChildItem $t -Directory).Count) 个技能目录"
}

# ---------- 3) 可选：DSH agent preset ----------
if ($DshPresetId) {
    if ($DshPresetId -notmatch '^[a-z0-9][a-z0-9-]*$') {
        throw "DshPresetId 必须是 [a-z0-9][a-z0-9-]* : $DshPresetId"
    }
    $DshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE ".dsh" }
    $PresetDir = Join-Path $DshHome ".agent-presets\$DshPresetId"

    # 找出厂 standard preset 作为复制源
    if (-not $BasePresetDir) {
        $cands = @(
            (Join-Path $DshHome "module-mirror\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\dsh-agent-presets\presets"),
            (Join-Path $env:LOCALAPPDATA "Programs\LobsterAI\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\dsh-agent-presets\presets"),
            (Join-Path $env:LOCALAPPDATA "Programs\LobsterAI\node_modules\@deepseek-ai\dsh\config\agent-presets")
        )
        foreach ($c in $cands) {
            if (Test-Path (Join-Path $c "standard\agent.cordis.yml")) { $BasePresetDir = $c; break }
        }
    }
    if (-not $BasePresetDir) {
        throw "未找到出厂 preset 目录，请用 -BasePresetDir 指定（需含 standard\agent.cordis.yml）"
    }
    $BaseYml = Join-Path $BasePresetDir "standard\agent.cordis.yml"
    Write-Host "[..] preset 源: $BaseYml"

    New-Item -ItemType Directory -Force -Path (Join-Path $PresetDir "skills") | Out-Null
    foreach ($s in $SkillDirs) { Copy-Item $s.FullName (Join-Path $PresetDir "skills") -Recurse -Force }
    Copy-Item (Join-Path $WorkDir "LICENSE") (Join-Path $PresetDir "skills\GODOT-PROMPTER-LICENSE.txt") -Force

    # preset.yml
    $presetYml = @"
name: Godot 开发
description: 标准编码 Agent，另带 GodotPrompter 的 $($SkillDirs.Count) 个 Godot 4.x 专属技能（规范 GDScript、场景组织、架构模式、UI、音频、测试、导出与移动端），用于避免不规范开发。
"@
    [System.IO.File]::WriteAllText((Join-Path $PresetDir "preset.yml"), $presetYml, $Utf8NoBom)

    # 复制组合，并给 skill-filesystem 加上 preset 本地技能根
    $lines = [System.Collections.Generic.List[string]]::new()
    [System.IO.File]::ReadAllLines($BaseYml, [System.Text.Encoding]::UTF8) | ForEach-Object { $lines.Add($_) }

    $header = @"
# The ``$DshPresetId`` agent preset: the full coding agent, plus GodotPrompter's $($SkillDirs.Count)
# Godot 4.x domain skills — so this agent writes GDScript, scene trees, and
# project layout the way Godot itself documents them, instead of improvising.
#
# Copied from the shipped ``standard`` preset; everything below is verbatim except
# the ``skill-filesystem`` row, which gains this preset's own skill root.
# Upstream: $RepoUrl (MIT, $Version, $($Sha.Substring(0,8))).
"@ -split "`n" | ForEach-Object { $_.TrimEnd("`r") }

    # 用新头部替换原第一行注释
    $lines.RemoveAt(0)
    for ($i = $header.Count - 1; $i -ge 0; $i--) { $lines.Insert(0, $header[$i]) }

    $sf = 0..($lines.Count - 1) | Where-Object { $lines[$_] -match '^- id: skill-filesystem' } | Select-Object -First 1
    if (-not $sf) { throw "组合中未找到 skill-filesystem 行，无法挂载技能根" }
    $nameIdx = $sf + 1
    if ($lines[$nameIdx] -notmatch 'dsh-skill-filesystem') { throw "skill-filesystem 结构异常: $($lines[$nameIdx])" }

    $cfg = @'
  # 技能随本 preset 走：`baseUrl` 是 preset 自身目录，所以无论 preset 装在哪台
  # 机器、仓库换成哪一个 Godot 项目，技能根都能解析到。
  # 上游技能是扁平的 `<name>/SKILL.md`，满足 skill-filesystem 的单层发现规则。
  config:
    customSkillDirs:
      - !!js "process.getBuiltinModule('node:url').fileURLToPath(new URL('skills/', baseUrl))"
'@ -split "`n" | ForEach-Object { $_.TrimEnd("`r") }
    for ($i = $cfg.Count - 1; $i -ge 0; $i--) { $lines.Insert($nameIdx + 1, $cfg[$i]) }

    [System.IO.File]::WriteAllLines((Join-Path $PresetDir "agent.cordis.yml"), $lines, $Utf8NoBom)
    Write-Host "[OK] DSH preset -> $PresetDir  ($((Get-ChildItem (Join-Path $PresetDir 'skills') -Directory).Count) 个技能)"
    Write-Host "     在 DSH 里新开一个会话并选择预设「Godot 开发」即可生效。"
}

# ---------- 4) 结果 ----------
Write-Host ""
Write-Host "===== 安装完成 ====="
foreach ($t in $Targets) {
    $n = (Get-ChildItem $t -Directory).Count
    $kb = [math]::Round((Get-ChildItem $t -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
    Write-Host ("  {0}  {1} 个技能目录 / {2} KB" -f $t, $n, $kb)
}
Write-Host ""
Write-Host "入口技能：using-godot-prompter（索引）；写码前优先读 godot-code-review / gdscript-patterns。"
