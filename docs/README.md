# docs · 造化坊知识库总导航

> 最后更新：2026-09-04  
> 给**人**和 **AI** 用的文档入口。先选对「桶」，再打开具体文件。

---

## 30 秒选桶

| 我要… | 去哪 | 例子 |
|------|------|------|
| 看今天待办 / 改目标 | **板块1 造化仪表盘/** | [个人待办.md](../造化仪表盘/个人待办.md) · [目标规划.md](../造化仪表盘/目标规划.md) |
| 了解造化坊是什么、怎么写代码 | **zh-CN/** | [manifesto](./zh-CN/manifesto.md) · [01–07 规范](./zh-CN/README.md) |
| 按步骤做一件事（人机分工） | **workflows/** | [工作流目录](./workflows/README.md) |
| 学某个软件怎么用 | **tool-guides/** | [工具指南](./tool-guides/README.md) |
| 查必须遵守的规格 | **specs/** | [规范收口](./specs/README.md) |
| 查领域知识（IAA/立项长文/审查） | **knowledge/** | [领域知识索引](./knowledge/README.md) |
| 查主美工作沉淀 / 对话认知点 | **personal-work-records/** | [个人工作记录](./personal-work-records/README.md) · [认知点索引](./personal-work-records/00-认知点索引.md) |
| 看英文极简介绍 | **en/** | [en/README](./en/README.md)（**非**双语维护） |
| 看数据仪表盘 | 板块1 [造化仪表盘/reports/](../造化仪表盘/reports/) | ⚠️ 这是**仪表盘**，不是文档树 |

> 📌 **板块定位（2026-09-04 起）：** docs/ 是板块3 **纯知识库**——待办/目标等活数据已迁板块1 造化仪表盘/；日常日志在 `造化仪表盘/works/`（一事一记）。

---

## 分区一览

```
docs/                        ← 板块3 · 知识库（纯知识）
├── README.md                 ← 你在这里
├── zh-CN/                    ← 宪法 + 工程规范
├── knowledge/                ← 领域知识索引（逻辑分桶；正文可仍在 zh-CN）
├── workflows/                ← 可触发的标准流程
├── tool-guides/              ← 工具三维（是什么 / 怎么用 / AI 怎么配合）
├── specs/                    ← 可执行技术规范收口
├── personal-work-records/    ← 主美个人知识库 + 认知点
└── en/                       ← 英文极简概述（可选）
（活数据 个人待办/目标规划 与 仪表盘已迁 造化仪表盘/，docs 不再持有）
```

### 活数据 · 流程 · 知识 · 规格

| 类型 | 含义 | 主位置 |
|------|------|--------|
| **活数据** | 会变的状态表 | 板块1 `造化仪表盘/个人待办.md` / `目标规划.md` |
| **流程** | 触发条件 + 人机步骤 + 产出路径 | `workflows/` |
| **知识** | 为什么、模型、口径、长文手册 | `knowledge/` 索引 + `zh-CN` 部分长文 + `personal-work-records` |
| **规格** | 必须遵守的命名/导出/约定 | `specs/` + `zh-CN/05–06` |
| **工具** | 软件本身怎么用 | `tool-guides/` |
| **当日叙事** | 今天解决了什么 | 板块1 `造化仪表盘/works/` |

---

## 交叉主题（主从约定）

避免同一主题多处改、改漏：

| 主题 | 权威（主） | 教程/操作 | 流程动作 |
|------|------------|-----------|----------|
| **Git 分支与提交格式** | [zh-CN/06-git-conventions](./zh-CN/06-git-conventions.md) | [tool-guides/git](./tool-guides/git/01-git-intro.md) | [workflows/Git-提交推送](./workflows/Git-提交推送.md) |
| **Pixso** | — | [tool-guides/pixso-*](./tool-guides/README.md) | [workflows/Pixso-导入操作](./workflows/Pixso-导入操作.md) |
| **立项** | 流程：[06-立项流程](./workflows/06-立项流程.md) | 长文：[AI游戏三章](./zh-CN/AI游戏从立项到制作到变现_完整三章.md)（见 knowledge） | 同上 |
| **IAA / 买量** | [knowledge · IAA](./knowledge/README.md#iaa--买量与合规) | — | 相关待办在 造化仪表盘/个人待办.md |
| **目标 / 待办** | 数据：板块1 两表（[目标规划](../造化仪表盘/目标规划.md) · [个人待办](../造化仪表盘/个人待办.md)） | — | [目标管理](./workflows/目标管理.md) · [个人待办管理](./workflows/个人待办管理.md) |
| **UI / 交互规范** | 项目内 interaction-spec + personal rewritten | — | [specs 收口](./specs/README.md) |

---

## 维护约定（短）

1. **新增长文** → 先问：是流程？规格？还是知识？对号入座；知识类在 `knowledge/README` 登记。  
2. **新增工作流** → 必须进 `workflows/README` 表；建议带 frontmatter：`name/version/status/skill/updated`。  
3. **口述认知点** → 结构化进 `personal-work-records/` → 登 [认知点索引](./personal-work-records/00-认知点索引.md) → 可选 `works/` 一事一记。  
4. 仪表盘（GH Pages 站点）已随板块1 迁移到 `造化仪表盘/reports/`；docs/ 只做知识导航，不挂可执行页面。  
5. 改板块1 的 `个人待办` / `目标规划` / `collect-data.ts` 与根协作协议前，检查 `.ai-locks/`。

---

## 相关仓外入口

| 文档 | 位置 |
|------|------|
| 项目身份与 AI 行为 | 仓根 [CLAUDE.md](../CLAUDE.md) |
| 多 AI 协议 | [AI_COLLABORATION.md](../AI_COLLABORATION.md) |
| 跨 AI 记忆 | [memory/MEMORY.md](../memory/MEMORY.md) |
| 入门 | [ONBOARDING.md](../ONBOARDING.md) |
| 板块1 中枢（目标/待办/works/仪表盘） | [造化仪表盘/CLAUDE.md](../造化仪表盘/CLAUDE.md) |
