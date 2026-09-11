---
date: 2026-09-11
ai: claude
type: 交付
status: 完成
tags: [IAA, Godot, 代码规范, 工程审计, GodotPrompter, Agent技能]
---

# [2026-09-11] IAA 工程审计 + 接入 GodotPrompter 技能包（让 AI 不再乱写 Godot 代码）

> 产出链接：工程 [projects/IAA/fire-hero-godot/](../../projects/IAA/fire-hero-godot/)、
> 安装脚本 [tools/install-godot-skills.ps1](../../tools/install-godot-skills.ps1)、
> 上游 [jame581/GodotPrompter](https://github.com/jame581/GodotPrompter)
> 提交：`ced5f77`（504 文件）

---

## 📋 问题解决日志

### 遇到了什么

用户三连问：**1. 代码规范性 2. 场景节点规范性 3. 工程架构是否合理**。

审计过程中暴露出一个比"某行代码不规范"更根本的问题：**AI 每次写 Godot 代码都没有约束，全靠当场自由发挥**。规范只存在于"每个人（每次会话）的脑子里"，所以每次都在重新发明一遍写法。用户随即提出正解——去 GitHub 找 Godot 开发技能包装上，把规范变成 AI 会主动去读的东西。

### AI 怎么协作的

**第一步：三项审计，全部用可复现命令取证，不靠印象**

| 维度 | 取到的硬数据 | 结论 |
|------|-------------|------|
| 代码规范 | 168 函数 / 167 有返回类型（**99%**）；431 变量 / 431 显式类型（**100%**） | A-：静态类型覆盖罕见地高 |
| 命名 | `-CaseSensitive` 重扫（首次扫描因 Select-String 默认忽略大小写误报） | 100% 合规 |
| 场景 | 57 节点；对每个节点名做全脚本引用扫描 | 挖出孤儿节点 `Hint` |
| 架构 | 依赖扇出统计 | `game_root.gd` 941 行 / 54 函数 / 扇出 11 类 / 担 7 类职责 |
| 长函数 | 逐文件括号扫描 | 9 个 >40 行，最长 `_render_shop_rows()` 79 行 |
| 发布链 | **pck 构建时间 vs git 提交时间比对** | 挖出 P0 导出阻塞（见下） |

**第二步：时间线比对挖出 P0（本次审计最有价值的发现）**

```
web-build/index.pck   构建于 09/11 11:40:28   ← 上次 H5 导出
ef4a351 MCP 插件接入   提交于 09/11 11:42      ← 比导出晚 2 分钟
project.godot         修改于 09/11 12:50:54   ← 插件写入 MCPRuntimeProbe autoload
```

MCP 插件往 `project.godot` 注入了一个 autoload，但导出预设里是 `exclude_filter="addons/*"`——**条目留下、目标脚本被排掉，下次打包就会加载失败**。而插件源码里明确写了「禁用插件也不移除这条 autoload」（`mcp_server_native.gd:547`），所以它不会自愈。现在手机跑的那份不受影响（早于插件），**风险只在下次重新导出时引爆**。

**第三步：候选技能包横向评估**

| 候选 | 许可 | 内容 | 判定 |
|------|------|------|------|
| [jame581/GodotPrompter](https://github.com/jame581/GodotPrompter) | MIT | 691★，55 个 Godot 4.x 技能 | ✅ **选中** |
| [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | — | 已装仓库里，15 个 Godot 技能 | 全是引擎 API，**无任何规范/审查技能** |
| [shihabshahrier/Godot-Skill](https://github.com/shihabshahrier/Godot-Skill) | — | 1 个技能 | 太薄 |

GodotPrompter 正好补上缺口：`gdscript-patterns`（461 行）、`godot-code-review`（500 行，带 BAD/GOOD 反例）、`scene-organization`、`godot-project-setup`、`state-machine`、`event-bus`、`resource-pattern`。

**第四步：装三处 + 真挂载验证**

### 产出结果

**安装位置（三处同步，55 个技能）**

1. `.claude/skills/` — Claude Code 仓库级，打开仓库根即加载
2. `templates/game-godot/.claude/skills/` — 新 Godot 项目模板自带
3. `~/.dsh/.agent-presets/godot/` — DSH agent preset「Godot 开发」

**验证（都是实测，不是推断）**

- 55 个技能 frontmatter 在三个目标**全部合规**（`name` kebab-case 且与目录同名、`description` 齐备）
- DSH preset 经 `agentPresets.standingKeyFor('godot')` **真实挂载通过**，roster 显示 `trust=user`
- 安装脚本**幂等**，复跑退出码 0
- 上游 `CLAUDE.md` 经查是**它自己仓库的贡献者指南**（讲提 PR / 跑 CI），已排除，避免污染本项目规则

**审计修复清单（已写入待办）**

- P0：导出前清理 `MCPRuntimeProbe` autoload
- P1：Toast z-order（提示被面板遮挡）、孤儿节点 `Hint`、死常量 `TEX_FIRE`、拆分 `game_root.gd`
- 顺带修正：根 `CLAUDE.md` 原写「Godot 节点命名用 snake_case」——**与 Godot 官方风格指南冲突**，项目实际用的 PascalCase 才是对的，已改正并挂接技能索引（按约定走了 `.ai-locks/` 取锁→改→释放）

### 关联项目

板块2 · projects/IAA（救火英雄 fire-hero-godot，Godot 4.7.1）
板块1 · 平台层（`.claude/skills/`、`templates/game-godot/`、`tools/`、`CLAUDE.md`）

---

## 🧠 关键知识点（跨 AI 共享）

1. **Agent 技能发现只有一层** — `dsh-skill-filesystem` 文档原文：*"nested `**/SKILL.md` files are deliberately not discovered"*。所以技能必须扁平放 `<name>/SKILL.md`，**不能加分类子目录**，否则一个都加载不到。
2. **DSH 不读 `.claude/skills/`** — 它的技能根是 `.dsh/skills`、`.agents/skills`、`~/.dsh/skills`、`~/.agents/skills`，以及 preset 的 `customSkillDirs`。给 DSH 装技能必须走 preset。
3. **`standingKeyFor()` 才是真挂载验证** — roster 的 `broken` 字段只是形状检查（文件能否解析），任何"包不存在 / 配置非法 / 行未激活 / 服务泄漏到 root realm"都能通过它。别拿 `broken` 当验证。
4. **vendor 上游前先读它的 `CLAUDE.md`** — 名字像"给使用方的规则"，实际可能是它自己仓库的贡献者指南。

---

## 🎬 视频生产草案（三幕结构）

### 第一幕：遇到了什么问题

让 AI 写游戏代码，最烦的不是它写不出来，是**它每次都换一种写法**。这次让 AI 审计自己的项目，它查完给出评级——但真正的问题是：**规范从来没被写下来，只存在于每次对话的临时共识里**。

- 核心问题：AI 写代码没有稳定约束，"规范"每次会话重新发明一遍
- 为什么这是个问题：项目越大，风格越散，review 成本越高
- 如果没有 AI 会怎样：人工逐文件查规范，3290 行看到眼花，还查不出"两次会话写法不一致"这种跨时间问题

### 第二幕：AI 怎么协作解决的

- **我是这样问 AI 的**：「1. 检查当前项目代码规范性 2. 场景节点规范性 3. 项目工程架构是否合理」
- **AI 给了什么方案**：不是给印象分，而是**给可复现的取证命令**——静态类型覆盖率扫到小数点、对 57 个节点名做全脚本引用扫描找孤儿、用 pck 构建时间 vs git 提交时间比对挖出导出阻塞
- **中间有什么调整/追问**：审计出报告后，追问「所以以后怎么防止？」，转向 GitHub 找 Godot 技能包；候选里发现仓库**已经装过**一套 gamedev 技能库（15 个 Godot 技能），但全是 API 类、**一个规范类都没有**——这个对比很关键
- **最终方案**：GodotPrompter（MIT / 691★ / 55 技能）装到三处，并用 `standingKeyFor` 做真挂载验证；顺手修正 `CLAUDE.md` 里一条和 Godot 官方风格冲突的命名规则

### 第三幕：效果展示

- **最终效果**：AI 写 Godot 代码前会先读 `gdscript-patterns` / `godot-code-review` / `scene-organization`；新开的 Godot 项目模板自带这 55 个技能
- **演示方式（截图/GIF/屏幕录制）**：展示「新会话选 'Godot 开发' preset → 提问 → AI 引用官方规范回答」的对比
- **学到的关键点**：**规范不该靠"叮嘱 AI 记住"，而该做成它会主动去读的文件**。审计的真正产出不是报告，是暴露了"规范无人持有"这个结构问题

### 一句话总结（金句候选）

> 与其每次都叮嘱 AI「别乱写」，不如把规范做成它会主动去读的技能。

### 配图/视频素材清单

- [ ] 审计数据表（99% 类型覆盖 / 100% 命名合规 / 9 个长函数）
- [ ] 时间线比对图：pck 11:40 vs MCP 提交 11:42 → 导出阻塞是怎么埋下的
- [ ] 三处安装位置示意图
- [ ] `standingKeyFor` 返回 MOUNTED OK 的终端截图
- [ ] 金句卡片

---

## 📌 后续待办

**P0 · 发布阻塞（做 APK / 重导 H5 之前必须处理）**

- [ ] 清理 `project.godot` 的 `MCPRuntimeProbe` autoload（或改 `exclude_filter` 保留 `addons/godot_mcp/runtime/*`），否则导出包启动时报错

**P1 · 影响可玩性 / 可维护性**

- [ ] 修 `main.tscn` 的 Toast z-order——Toast(child 235) 在 Overlays(252) 之前绘制，提示被过关/商店面板盖住，玩家看不到反馈
- [ ] 删除孤儿节点 `Hint`（57 节点全脚本引用扫描，仅此一个零引用）
- [ ] 删除 `brick.gd:9` 死常量 `TEX_FIRE`（火窗已改用 `TEX_FIRE_LV1/2/3`）
- [ ] 拆分 `game_root.gd`（941 行 / 54 函数 / 扇出 11 类 / 担 7 类职责）——建议先抽「商店」与「技能分身」两块，约可减 300 行

**P2 · 打磨**

- [ ] 统一碰撞形状定义位置（`Rect_paddle` 场景里写了 size 又被 `paddle.gd:132` 覆盖；`Circle_ball` 场景里完全没尺寸，真实半径在 `ball.gd:48`）
- [ ] `scripts/game/sfx_player.gd` 移入 `scripts/autoload/`（它是 autoload 却不在 autoload 目录）
- [ ] `game_root` ↔ `main_ui` 改信号解耦（现为双向直接调用）
- [ ] 拆 `_render_shop_rows()`（79 行）

**待实战验证**

- [ ] 用新接入的 `godot-code-review` 清单对 IAA 做一轮完整复查，验证技能是否真的能拦住不规范写法
- [ ] 新开一个会话选「Godot 开发」preset，确认 55 个技能出现在技能目录（preset 只能在空会话切换，本会话无法验证）

---

_模板版本：v1.0_
