# ONBOARDING.md — 所有 AI 助手首次对话必读

> ⚠️ **强制要求：每个 AI 助手在本项目的首次对话中，必须先读完本文档列出的所有必读文件，确认理解后才能开始执行任何任务。**

---

## 🚨 速查卡（30 秒了解底线）

| 类别 | 规则 | 后果 |
|------|------|------|
| 📁 目录 | **所有项目必须放在 `projects/` 下** | 根目录建项目 = 违规 |
| 📁 目录 | **禁止在根目录新建一级文件夹**（除非用户明确要求） | 打乱项目结构 |
| 🔒 锁 | 修改 8 个共享文件前必须获取 `.ai-locks/` 锁 | 两个 AI 互相覆盖 |
| 🏷️ 标签 | Git 提交必须带 `[身份标签]` 前缀 + `Co-Authored-By` 签名 | 无法追溯谁做了什么 |
| 📝 日志 | 工作记录写入 `works/YYYY-MM-DD-[身份标签]-*.md` | 日志归属混乱 |
| ⚔️ 冲突 | Git 冲突**禁止自动解决**，保留标记让用户决策 | 静默丢失他人工作 |

---

## 📖 必读文件清单（按顺序，5 分钟读完）

### 1️⃣ [AI_COLLABORATION.md](./AI_COLLABORATION.md) — 共同宪法 ⭐

所有 AI 的共同行为准则，包含：
- Section 2.3：**目录结构约定** ← 特别重要！
- Section 2.4：不可随意修改的文件
- Section 4：文件锁协议
- Section 6：冲突解决规则

### 2️⃣ [memory/MEMORY.md](./memory/MEMORY.md) — 项目当前状态

了解当前活跃项目、待办事项、用户偏好。**每次会话开始时都应重读。**

### 3️⃣ 你自己的配置文件

| AI | 配置文件 | 说明 |
|----|---------|------|
| Claude | [CLAUDE.md](./CLAUDE.md) | 项目编码规范、技术栈、AI 行为模式 |
| TREA | [.trea/config.md](./.trea/config.md) | TREA 专属配置、必读文件、用户期望 |
| Lobster | [.lobster/config.md](./.lobster/config.md) | Lobster 专属配置、必读文件、用户期望 |
| Libtv | [.libtv/README.md](./.libtv/README.md) | Libtv 项目配置与协作规则 |
| Codex | 无专用文件，直接遵守本文档 + AI_COLLABORATION.md | — |

### 4️⃣ [docs/zh-CN/operational-loop.md](./docs/zh-CN/operational-loop.md) — 日常运转线路图

了解造化坊的日常循环：遇到问题 → AI 协作 → 产出 → 工作记录 → 视频草案。

---

## 🔴 硬性禁止（违者后果自负）

### 目录操作

```
❌ 禁止：在根目录创建新的一级文件夹
   正确做法：项目 → projects/；工具脚本 → tools/；文档 → docs/

❌ 禁止：在 projects/ 外创建项目目录
   正确做法：所有项目统一放在 projects/<项目名>/

❌ 禁止：删除或移动以下目录（除非用户明确指示）
   docs/、works/、projects/、shared/、templates/、tools/、reports/、memory/
```

### 文件操作

```
❌ 禁止：不获取锁就修改共享文件
❌ 禁止：自动解决 Git 冲突
❌ 禁止：修改其他 AI 的配置文件（.trea/、.lobster/、.libtv/）
❌ 禁止：修改 docs/zh-CN/manifesto.md（核心理念宣言）
```

---

## ✅ 首个对话自检清单

在开始执行任何任务前，确认以下所有项：

- [ ] 已读 AI_COLLABORATION.md（重点是 2.3 目录结构 + 2.4 不可修改文件 + 4 文件锁）
- [ ] 已读 memory/MEMORY.md（了解当前活跃项目和待办）
- [ ] 知道自己的身份标签和提交签名
- [ ] 知道工作记录的文件命名格式
- [ ] 知道哪些文件修改前需要获取锁
- [ ] 知道「所有项目放在 projects/ 下」
- [ ] 知道「禁止在根目录新建一级文件夹」

---

## 🔧 快速参考

### Git 提交格式

```
[身份标签] type: 中文描述

Co-Authored-By: AI名称 <邮箱>
```

### 工作记录文件名

```
works/YYYY-MM-DD-[身份标签]-简短描述.md
```

### 需要锁的共享文件

`docs/目标规划.md`、`docs/个人待办.md`、`tools/collect-data.ts`、`CLAUDE.md`、`AI_COLLABORATION.md`、`.claude/settings.json`、`memory/MEMORY.md`、`memory/` 下 `.md` 文件

---

_此文件是造化坊多 AI 协作的安全带。新 AI 加入时，用户应指引其首先阅读本文档。_
