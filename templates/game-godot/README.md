# Godot 游戏模板

> Godot 4 项目起点（含 **MCP 插件** + **GodotPrompter 技能包**，AI 可直接操作项目并按官方规范写码）。

## 已预置：Godot MCP Native 插件

模板自带 `addons/godot_mcp/`，新建项目复制本模板后即可用 AI 通过 MCP 操作工程（场景、脚本、节点、资源、调试）。

- 来源：[yurineko73/Godot-MCP-Native](https://github.com/yurineko73/Godot-MCP-Native)（GDScript 原生实现，**零依赖**）
- 版本：v1.0.8
- 启用：`project.godot` 的 `[editor_plugins]` 已含 `res://addons/godot_mcp/plugin.cfg`

### 给已有项目安装（无需手工拷贝）

```powershell
powershell -File tools/install-godot-mcp.ps1 -ProjectPath "<Godot 项目目录>"
```

脚本会：复制插件 → 在 `project.godot` 启用 → 打印启动与连接说明（幂等，可重复执行）。

### 启动 MCP 服务

| 方式 | 命令 |
|------|------|
| 编辑器内 | 打开 Godot → 右侧 **MCP 面板** → 启动（默认端口 **9080**） |
| 命令行/无头 | `godot --editor --path "<项目>" -- --mcp-server --mcp-port=9080` |

验证：`curl http://127.0.0.1:9080/` → 返回 endpoints 信息即正常

### AI 客户端连接

HTTP 模式，MCP 端点为 `http://127.0.0.1:9080/mcp`（SSE 同址 GET）。
Cursor / Trae / Cline / Claude Desktop 等通过 `mcp-remote` 接入，详见插件自带 `addons/godot_mcp/README.zh.md`。

> ⚠️ 导出游戏包时应在导出预设的 `exclude_filter` 填 `addons/*`，避免插件被打进包体。

---

## 已预置：GodotPrompter 技能包

模板自带 `.claude/skills/` 下 **55 个 Godot 4.x 专属 Agent Skills**，用途是让 AI 按 Godot 官方风格写 GDScript / 场景树 / 工程结构 —— 而不是自由发挥。

- 来源：[jame581/GodotPrompter](https://github.com/jame581/GodotPrompter)（**MIT** 许可）
- 版本：v1.13.2（commit `eae755a1`）
- 入口技能：`using-godot-prompter`（索引）；写码前优先读 `gdscript-patterns`、`godot-code-review`、`scene-organization`
- 覆盖：项目结构、GDScript 模式与进阶、场景组织、资源模式、事件总线、状态机、组件系统、UI、物理、输入、动画、音频、存档、测试、性能、调试、导出与移动端
- 许可与来源取证见同目录 `GODOT-PROMPTER-LICENSE.txt`、`GODOT-PROMPTER-SOURCE.md`

### 给已有项目安装

```powershell
powershell -NoProfile -File tools/install-godot-skills.ps1
```

脚本会：拉取上游 → 复制到 `.claude/skills/` 与 `templates/game-godot/.claude/skills/` → 附许可与来源（幂等，可重复执行）。
加 `-DshPresetId godot` 还会在 `%USERPROFILE%\.dsh\.agent-presets\godot\` 建一个带这些技能的 DSH agent preset。

> ⚠️ 技能必须是扁平的 `<name>/SKILL.md`。Claude Code 与 `dsh-skill-filesystem` 的技能发现都只有一层，**嵌套的 `**/SKILL.md` 不会被发现**，所以不要给技能加分类子目录。

---

## 计划内容（其余部分待补齐）

- Godot 4 项目结构
- 基础场景模板（2D）
- 常用节点配置（CharacterBody2D, TileMap, AnimationPlayer 等）
- Phaser 与 Godot 的概念对照表

> GDScript 编码规范已由上方 **GodotPrompter 技能包**覆盖（`gdscript-patterns` / `godot-code-review` / `scene-organization`）。

## 参考

- [技术栈详解](../../docs/zh-CN/02-tech-stack.md)
- [Godot 官方文档](https://docs.godotengine.org/)
