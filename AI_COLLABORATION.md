# AI_COLLABORATION.md — 造化坊多 AI 协作协议

> **定位：** 所有 AI 助手（Claude / TREA / LobsterAl / 其他）在造化坊项目中的共同行为准则。
> 每个 AI 应在自己的配置文件中引用本文档。本文档是 AI 无关的——不假设任何特定 AI 工具的能力。

---

## 1. 项目身份

**造化坊 (Creation Forge)** 是「AI 时代的新学习思想」的实践场。

核心理念：**定一个你想做的项目 → 遇到问题 → 学需要的知识 → 解决问题 → 完成。**
AI 让这种「做中学」第一次真正可行。落地载体是独立游戏开发。

金句：**匠心造化，万物可成** —— 每一个小项目都是创造的淬炼。

> 📖 完整理念声明见 [docs/zh-CN/manifesto.md](./docs/zh-CN/manifesto.md)
> 📖 日常运转规则见 [docs/zh-CN/operational-loop.md](./docs/zh-CN/operational-loop.md)

---

## 2. 所有 AI 必须遵守的规则

> 🔴 **首次对话先读 [ONBOARDING.md](./ONBOARDING.md)** —— 30 秒速查卡 + 5 分钟必读文件清单。违反目录规则会被要求回滚。

### 2.1 编码规范

- TypeScript strict mode，`interface` 优先于 `type`
- 函数参数超过 2 个使用对象参数
- 避免 `any`，使用 `unknown` + 类型守卫
- 文件名：PascalCase（组件/类）、camelCase（工具函数）、kebab-case（配置）
- 注释用**中文**，代码标识符用**英文**
- 命名导出优先于默认导出

> 详见 [docs/zh-CN/05-coding-standards.md](./docs/zh-CN/05-coding-standards.md)

### 2.2 Git 提交规范

使用 Conventional Commits，中文描述，**必须带 AI 身份标签**：

```
[身份标签] type: 中文描述

Co-Authored-By: AI名称 <邮箱>
```

允许的 type：`feat` / `fix` / `docs` / `refactor` / `test` / `chore` / `learn` / `journal` / `assets`

### 2.3 五板块结构约定（2026-09-04 起）

```
ever-forge/                    ← 平台共享层（ONBOARDING/AI_COLLABORATION/CLAUDE.md · memory/ · .ai-locks/
│   │                             .claude/ · templates/ · shared/ · tools/ 平台工具 · pdf_libs/）
├── 造化仪表盘/                ← 🧭 板块1 · 中枢：个人日程/任务 + 各板块变动检测 → 工作日志 + Git 管理
│   │                             （CLAUDE.md README.md 目标规划.md 个人待办.md · works/ · reports/ ·
│   │                              data/ · tools/{collect-data,generate-dashboard,dashboard-server,
│   │                              todo-file,new-journal}.ts + dsh-harness/）
├── projects/                  ← 🚀 板块2 · 项目库（GAME-002/IAA/interaction-spec-system/game-bot/
│   │                             qin-court-audience/情景认知小程序/概念设计工作流 等全部项目）
├── docs/                      ← 📚 板块3 · 知识库（纯知识：zh-CN/workflows/tool-guides/specs/
│   │                             knowledge/personal-work-records/en）
├── asset-pipeline/            ← 🎨 板块4 · 美术制作（自 projects/ 升根）
└── xiaohongshu/               ← 📱 板块5 · 自媒体（自 projects/ 升根）
```

> 📐 完整板块结构说明见 [docs/zh-CN/04-project-structure.md](./docs/zh-CN/04-project-structure.md)

#### 🔴 硬性目录规则（所有 AI 必须遵守）

| 规则 | 说明 |
|------|------|
| **新板块目录必须用户批准** | 板块白名单 = `造化仪表盘/ projects/ docs/ asset-pipeline/ xiaohongshu/`；新增一级目录须先向用户说明理由并获取批准 |
| **项目必须放板块2 `projects/` 下** | 任何新项目的唯一合法位置是 `projects/<项目名>/` |
| **日志/待办/目标放板块1** | 工作记录 `造化仪表盘/works/`；活数据 `造化仪表盘/目标规划.md`、`造化仪表盘/个人待办.md`；不在 docs/ 或根目录新建这些表 |
| **工具脚本随板块走** | 属于哪个板块的工具放该板块 `tools/`；平台级工具才放根 `tools/`，不另建 `scripts/`、`bin/` |
| **知识文档放板块3 `docs/`** | 不在板块外散落知识正文 `.md`（平台文档 ONBOARDING/AI_COLLABORATION/CLAUDE.md 除外） |
| **资产管线产出不进仓库** | `asset-pipeline/` 生成的图片/视频/音频存桌面 `asset-pipeline-outputs/`；仓库内只保留工作流文档、规则、过程数据、参考图 |

**违反目录规则 = 打乱板块结构，会被用户要求回滚修改。**

#### 跨板块引用约定

- 板块间一律写**显式相对链接**（从源文件深度算 `../`），禁止写歧义短路径
- 数据依赖单向下沉：板块2–5 依赖板块1 日志/待办时，在板块 CLAUDE.md/README 中声明素材源路径；板块1 不反向依赖板块知识正文
- 结构性改动其他板块的文件，先向用户说明再动手；断链/路径小修可直接顺手修

### 2.4 不可随意修改的文件

以下文件属于项目基础设施，除非用户明确要求，否则不应修改：

- `docs/zh-CN/manifesto.md` — 核心理念宣言
- `docs/zh-CN/operational-loop.md` — 运转线路图
- `package.json` / `tsconfig.base.json` / `eslint.config.mjs` — 构建配置
- `.claude/settings.json` — Claude 专属配置（其他 AI 可读不可改）
- 其他 AI 的配置文件（`.trea/config.md`、`.lobster/config.md`、`.libtv/`、`.workbuddy/`）——除非用户一次性授权（2026-09-04 已授权五板块重构同步），禁止 AI 互改

---

## 3. AI 身份标记

每个 AI 在所有操作中使用统一的身份标签：

| AI | 身份标签 | 提交签名 | 配置文件 | 工作记录前缀（板块1） |
|----|---------|---------|---------|------------|
| Claude | `[claude]` | `Co-Authored-By: Claude <noreply@anthropic.com>` | [CLAUDE.md](./CLAUDE.md) | `造化仪表盘/works/YYYY-MM-DD-[claude]-*.md` |
| 字节 TREA | `[trea]` | `Co-Authored-By: TREA <noreply@bytedance.com>` | [.trea/config.md](./.trea/config.md) | `造化仪表盘/works/YYYY-MM-DD-[trea]-*.md` |
| LobsterAl | `[lobster]` | `Co-Authored-By: LobsterAl <noreply@lobster.ai>` | [.lobster/config.md](./.lobster/config.md) | `造化仪表盘/works/YYYY-MM-DD-[lobster]-*.md` |
| Codex | `[codex]` | `Co-Authored-By: Codex <noreply@openai.com>` | Codex Desktop / CLI 会话配置 | `造化仪表盘/works/YYYY-MM-DD-[codex]-*.md` |
| Libtv | `[libtv]` | `Co-Authored-By: Libtv <noreply@libtv.dev>` | [.libtv/README.md](./.libtv/README.md) | `造化仪表盘/works/YYYY-MM-DD-[libtv]-*.md` |

> 💡 新增 AI 助手时，在此表追加一行，并创建对应的配置文件。

---

## 4. 文件锁协议

### 4.1 什么时候需要锁

修改以下**共享状态文件**前，必须检查并获取锁：

- `ONBOARDING.md`
- `造化仪表盘/目标规划.md`
- `造化仪表盘/个人待办.md`
- `造化仪表盘/tools/collect-data.ts`
- `CLAUDE.md`
- `AI_COLLABORATION.md`（本文档）
- `.claude/settings.json`
- `memory/MEMORY.md`
- `memory/` 下的任何 `.md` 文件

### 4.2 锁文件格式

在 `.ai-locks/` 目录下创建锁文件，命名格式：`[身份标签]-[目标文件名].lock`

```yaml
---
ai: claude
file: 造化仪表盘/目标规划.md
operation: 更新季度目标
locked_at: 2026-08-02T14:30:00+08:00
expires_at: 2026-08-02T15:00:00+08:00  # 30分钟自动过期
---
```

### 4.3 操作流程

```
修改前 → 检查 .ai-locks/ 是否有对应锁文件
  ├─ 无锁 → 创建锁文件 → 修改 → 删除锁文件
  ├─ 有锁但已过期 → 覆盖旧锁 → 修改 → 删除锁文件
  └─ 有锁且未过期 → ⚠️ 报告用户：「[AI名称] 正在修改此文件，等待中...」
```

### 4.4 重要规则

- **只读不需要锁** — 读取任何文件都不需要锁
- **30 分钟自动过期** — 防止 AI 崩溃后锁残留
- **锁文件不提交到 Git** — 已在 `.gitignore` 中排除
- **普通文件不需要锁** — 只锁高频冲突的共享状态文件

> 详见 [.ai-locks/README.md](./.ai-locks/README.md)

---

## 5. 工作记录规范

### 5.1 文件命名

```
造化仪表盘/works/YYYY-MM-DD-[身份标签]-简短描述.md
```

示例：
- `造化仪表盘/works/2026-08-03-[claude]-重构spec渲染器.md`
- `造化仪表盘/works/2026-08-03-[trea]-设计新关卡.md`
- `造化仪表盘/works/2026-08-06-[codex]-添加协作身份.md`

### 5.2 Frontmatter 格式

每个工作记录文件必须包含 YAML frontmatter，其中 **必须声明 `ai` 字段**：

```yaml
---
date: 2026-08-03
ai: claude
type: 功能开发
status: 完成
tags: [interaction-spec-system, 重构]
---
```

### 5.3 内容结构

遵循 [造化仪表盘/works/_template.md](./造化仪表盘/works/_template.md) 定义的两区块结构：
1. 问题解决日志（遇到了什么 / AI 怎么协作 / 产出结果 / 关联项目）
2. 视频生产草案（三幕结构 + 金句候选 + 素材清单）

---

## 6. 冲突解决

### 6.1 Git 冲突

当 git merge/rebase 遇到冲突时：

1. **不要自动解决** — 即使能判断出"正确"的版本
2. **标记冲突区域** — 在文件中保留 `<<<<<<<` / `=======` / `>>>>>>>` 标记
3. **报告用户** — 说明冲突来源（哪个 AI 的哪次提交）、冲突内容、建议的解决方向
4. **等待用户指示** — 不自行选择保留哪个版本

### 6.2 逻辑冲突

当你的修改可能与其他 AI 的工作产生逻辑冲突时（即使没有 git 冲突）：

1. 检查 `造化仪表盘/works/` 最近的工作记录，了解其他 AI 在做什么
2. 检查 `memory/` 共享记忆，了解项目当前状态
3. 如有疑问，在修改前向用户确认

---

## 7. 共享记忆使用

造化坊有一个跨 AI 共享的记忆系统：[memory/](./memory/)。

- **每次会话开始时**，读取 `memory/MEMORY.md` 了解项目当前状态
- **每次会话结束时**，如有值得跨 AI 共享的发现，写入 `memory/`
- 修改记忆时更新 `updated` 字段
- 同一主题更新已有文件，不新建

> 详见 [memory/README.md](./memory/README.md)

---

## 8. 当前活跃项目

| 项目 | 路径 | 状态 |
|------|------|------|
| 开仙门 (GAME-002) | `projects/GAME-002/` | 🟡 开发中 — V0.1 核心循环 ~80%，08-14 祝福系统规则收敛 |
| 交互规范系统 | `projects/interaction-spec-system/` | 🟢 运转中 — v2.1 组件库 + 调参工具 |
| 资产管线 | `asset-pipeline/` | 🟢 投产中 — 图标/建筑双管线，08-14 鲤鱼花灯批次 |
| 秦王殿奏对 | `projects/qin-court-audience/` | 🟢 已完成 — v1.0 |
| 小红书 | `xiaohongshu/` | 🟢 运转中 — 15 期已发布 |
| game-bot | `projects/game-bot/` | 🟢 在役 — AI 游戏自动化工作流（08-10 仪表盘注册） |
| 情景认知小程序 | `projects/情景认知小程序/` | 🟡 原型验证中 — prototype/sim.js 原型验证 |
| TBH 复刻 | 调研完成，待立项 | 🔵 调研完成 — 市场+实机分析（08-06） |

---

_本文档由 Claude 创建于 2026-08-02。任何 AI 都可以提议修改——但修改前请先获取文件锁。_
