# [2026-07-23] 汇报同步 + 工作流维护 + SKILL 体系讨论

---

## 📋 问题解决日志

### 一、汇报说明书同步

执行 `/同步报告`，发现 `workDescs` 映射表严重滞后——works/ 15 篇日志，仅 9 篇有描述。过去几天用户手动创建的日志（道具图标管线、工作流固化、小红书新帖、UI 制作）全部显示 "—"。

- 补充 6 条描述（asset-pipeline、clash-royale-icons、workflow-maintenance、workflow-solidified、xiaohongshu-post13-14、开场黑幕UI制作）
- 重新生成 Excel，近期动态 15 条全覆盖
- 期间遇到文件锁（Excel 未关），关闭后正常生成

### 二、工作流文档维护（用户手动）

用户巡检并更新了工作流体系中的多份文档：

| 文件 | 变更 |
|------|------|
| `docs/workflows/小红书-制作帖子.md` | v1→v2：适配扁平目录（去掉文案库/HTML库 中间层），Pixso 单文件导入 |
| `docs/workflows/Pixso-导入操作.md` | 协议更新（SSE→Streamable HTTP），路径更新 |
| `docs/workflows/GAME002-功能开发.md` | 新增 UI 制作流程引用（先走 GAME002-UI制作 再写代码） |
| `docs/workflows/README.md` | 新增 GAME002-UI制作 流程（v2，策划→美术需求） |
| `docs/workflows/GAME002-UI制作.md` | 新建（场景清单→交互设计→视觉方向→资产拆解） |
| `docs/workflows/GAME002-UI层命名规范.md` | 新建（5 固定名 + 5 后缀体系） |

### 三、小红书项目精简（用户手动）

| 操作 | 说明 |
|------|------|
| `projects/xiaohongshu/CLAUDE.md` 重写 | 项目结构简化：去掉文案库/HTML库 中间层，统一为 `YYYY-MM-DD-主题/` 扁平目录 |
| 删除 `_archive/` 5 个旧版 HTML | post-01-v1~v4、post-03-v1 清理 |
| 删除 `_template-v2.html` | 不再需要，样式从最新帖子拷贝 |
| `_template.md` 更新 | 匹配当前流程 |

### 四、工具知识库更新

| 文件 | 变更 |
|------|------|
| `docs/tool-guides/README.md` | 新增 Claude Code Skills 条目（48 个游戏开发技能） |

### 五、SKILL 体系讨论

| 话题 | 结论 |
|------|------|
| SKILL 存放位置 | `.claude/skills/`（英文文件名，中文触发词） |
| 能否复制共享给朋友 | 不能直接复制——SKILL 绑定项目上下文。可分享的是 `docs/tool-guides/git/` + `github/`（通用知识）和双层结构思路 |

### 六、日志日期修正

昨天误将 `/同步报告` 工作附到 `2026-07-22-开场黑幕UI制作.md` 末尾。已剥离，独立为本文。

---

## 当前全盘未提交状态

自 07-15 初始提交以来，累计未提交变更涵盖：

| 域 | 新增 | 修改 | 删除 |
|----|------|------|------|
| 工作流体系 | `docs/workflows/`（7 文档） | — | — |
| SKILL 执行层 | `.claude/skills/`（3 文件） | — | — |
| 工具知识库 | `docs/tool-guides/`（7 文档） | — | — |
| 项目文档 | — | `docs/zh-CN/` 7 文件 | — |
| 小红书 | — | CLAUDE.md、_template.md | `_archive/` 5 文件、`_template-v2.html` |
| GAME-002 | `ui-prototypes/`（4 HTML + 3 PNG）、`美术需求-开场黑幕.md` | project.godot、main_root.gd | — |
| 新项目 | `projects/asset-pipeline/`（docs/scripts/outputs/templates） | — | — |
| 基础设施 | `works/` 15 篇日志 | CLAUDE.md、README.md | `ai-collab/`、`journals/`、`.uploads/` |
| 汇报 | — | `generate-report.ts`、Excel | — |

> 建议尽快 `/提交` 一次，避免变更堆积。

### 关联项目

造化坊 · 基础设施 + 小红书 + GAME-002 + asset-pipeline

---

## 附：周度复盘 + 5 项改进执行

同日进行了第一周全盘复盘（[week1-retrospective](2026-07-23-week1-retrospective.md)），发现 5 个改进项并全部执行：

| # | 改进项 | 状态 |
|---|--------|------|
| #0 | 改进追踪文档 `docs/workflows/改进追踪.md` | ✅ |
| #1 | SKILL 实质化：YAML frontmatter + `description` 自动发现 + 触发词修正 | ✅ |
| #2 | Excel 锁文件前置检查 | ✅ |
| #3 | CLAUDE.md 每日日志检查规则 | ✅ |
| #4 | workDescs 自动从标题行提取（手动映射表清空） | ✅ |

**重要认识修正**：`.claude/skills/*.md` 扁平文件本身就是有效的 SKILL，不是"假 SKILL"。加上 `description` 后 Claude 可根据上下文自动发现。
