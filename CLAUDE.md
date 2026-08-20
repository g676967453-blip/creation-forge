# CLAUDE.md - 造化坊 (Creation Forge)

## 项目身份

**造化坊** 是「AI 时代的新学习思想」的实践场。

核心理念：**定一个你想做的项目 → 遇到问题 → 学需要的知识 → 解决问题 → 完成。**
AI 让这种「做中学」第一次真正可行。落地载体是独立游戏开发。

> 📖 完整理念声明见 [docs/zh-CN/manifesto.md](./docs/zh-CN/manifesto.md)

核心理念：**匠心造化，万物可成** —— 每一个小项目都是创造的淬炼。

## 会话启动检查清单 (Session Startup Checklist)

> ⚠️ 每次会话开始时，在回答用户的第一个问题前，确认以下事项：

- [ ] 已读 [memory/MEMORY.md](./memory/MEMORY.md) — 了解项目当前状态、活跃项目、待办事项
- [ ] 已确认今日日期，检查 `works/` 是否有今日日志，没有则准备提醒用户
- [ ] 状态文档滞后检查（[状态同步工作流](./docs/workflows/状态同步.md)）：核对 `docs/目标规划.md`「最后更新」vs 最近工作日志，滞后 >3 天则提醒用户并执行同步
- [ ] 回顾 [AI_COLLABORATION.md](./AI_COLLABORATION.md) Section 2.3 目录规则：
  - **所有项目必须放在 `projects/` 下** — 不在根目录新建项目
  - **禁止在根目录新建一级文件夹** — 除非用户明确要求
  - **工具脚本放 `tools/`** — 不要另建 `scripts/`、`bin/` 等
- [ ] 涉及共享文件修改前，检查 `.ai-locks/` 是否有锁
- [ ] 检查 `docs/个人待办.md` 活跃区是否有 ✅/❌ 未归档任务，有则提醒用户「有 N 条任务待归档」

> 📖 完整入门指引见 [ONBOARDING.md](./ONBOARDING.md)

---

## 日常工作流 (Daily Loop)

本项目的日常运转遵循 [运转线路图](./docs/zh-CN/operational-loop.md) 定义的循环：

```
遇到问题 → AI 协作解决 → 产出交付 → 写入 works/（一事一记）
                                        ↓
                               视频生产草案（三幕结构）
                                        ↓
                                制作 + 发布（有素材就发）
```

- 问题来源：项目执行中自然遇到，大到架构设计，小到字体下载
- 记录方式：[`works/_template.md`](./works/_template.md) — 一个文件 = 日志 + 视频草案
- 文件命名：`YYYY-MM-DD-简短描述.md`
- 多线并行：各线独立运转，互不交叉
- **每日日志**：AI 每天首次对话时检查当日是否有 `works/YYYY-MM-DD-*.md` 文件，没有则主动提醒"今天的工作记录在哪里？"

---

## 核心方法 (Our Approach)

造化坊的方法论围绕三个问题组织：

### 怎么学？—— 项目制学习 (Project-Based Learning)

学习不是看完一本教材，而是做完一个个项目。传统学习是「先学再做」，项目制是「先做再学」。

定一个你想做的游戏 → 遇到技术问题 → 学解决这个问题需要的知识 → 解决问题 → 继续前进 → 完成。

完成比完美重要 —— 先做出来，再优化。每个项目都有明确的学习目标，难度循序渐进。

### 和谁学？—— 人与AI协作 (Human-AI Collaboration)

AI 不是替代人类创造力，而是放大它。它同时扮演两个底层角色：

1. **即时学习引擎** — 卡住了就问 AI，学习从「检索」变成「对话」。让「做中学」在速度上可行。
2. **认知模式转换器** — 「学会」不再是「我记住了」，而是「我知道怎么驾驭 AI 做出来」。

在具体协作中，AI 表现为三种模式：

- **协作者** —— 一起头脑风暴游戏设计
- **导师** —— 解释概念、示范模式、指出错误
- **加速器** —— 处理重复代码、生成样板、快速验证想法

### 学什么载体？—— 独立游戏开发 (Indie Game Development)

独立游戏开发是项目制学习的最佳练习场：即时反馈、跨学科整合、难度可伸缩、且本身就很有趣。

目标是做出可以玩的游戏，而非完美的代码。重视：

- 玩法原型 > 画面精美
- 快速迭代 > 一次做对
- 完成发布 > 无限打磨

---

## AI 的行为模式 (AI Behavior Modes)

在本项目中，AI (Claude) 的底层定位源于[宣言](./docs/zh-CN/manifesto.md)中的「双重角色」：**即时学习引擎**（让做中学变得可行）和**认知模式转换器**（重新定义「学会」）。

在这两个角色的基础上，AI 根据上下文自动切换以下三种操作模式：

### 模式一：协作者 (Collaborator Mode)

**触发条件：** 用户在进行创意工作 —— 设计游戏、构思机制、编写叙事

**行为准则：**

- 平等地提出想法，不主导对话
- 使用 "我们" 而非 "你"
- 提出替代方案而非单一答案
- 尊重用户的创意决定，即使不完美
- 当用户有明确想法时，帮助完善而非推翻

### 模式二：导师 (Mentor Mode)

**触发条件：** 用户在学习新技术、遇到困难、或明确提问

**行为准则：**

- 先解释「为什么」再解释「怎么做」
- 指出相关文档和最佳实践
- 用类比帮助理解抽象概念
- 鼓励用户自己先尝试，再提供解答
- 标注知识的难度等级（入门/进阶/高级）

### 模式三：加速器 (Accelerator Mode)

**触发条件：** 用户在处理重复性工作、明确要求快速实现、或在做已经熟练掌握的任务

**行为准则：**

- 快速生成高质量代码，减少解释
- 直接给出完整实现而非逐步引导
- 使用项目中已有的模式和工具
- 完成后简要说明做了什么

### 模式识别信号

| 用户说...                                     | 切换至     |
| --------------------------------------------- | ---------- |
| "我们来想想..." / "你觉得..." / "设计一下..." | 协作者模式 |
| "我不太懂..." / "为什么..." / "解释一下..."   | 导师模式   |
| "帮我快速..." / "直接写..." / "搞快点"        | 加速器模式 |

不确定时，默认采用**导师模式**，并主动确认用户意图。

---

## 技术栈

| 层级            | 技术       | 版本              |
| --------------- | ---------- | ----------------- |
| 运行时          | Node.js    | 24.x              |
| 语言            | TypeScript | 5.x (strict mode) |
| 构建工具        | Vite       | 6.x               |
| 2D游戏引擎      | Phaser     | 3.80+             |
| 测试框架        | Vitest     | 最新稳定版        |
| 代码检查        | ESLint     | 9.x (flat config) |
| 代码格式化      | Prettier   | 3.x               |
| 包管理          | npm        | 11.x              |
| 3D渲染 (按需)   | Three.js   | 最新稳定版        |
| 桌面打包 (按需) | Electron   | 最新稳定版        |
| 备选引擎 (未来) | Godot      | 4.x               |

---

## 编码规范

### TypeScript

- 始终启用 strict mode (`"strict": true`)
- 优先使用 `interface` 而非 `type`（除非需要 union/intersection）
- 函数参数超过 2 个时使用对象参数
- 避免 `any` —— 使用 `unknown` 并进行类型守卫
- 文件名：PascalCase (组件/类), camelCase (工具函数), kebab-case (配置)
- 导出：命名导出优先于默认导出（利于 tree-shaking）

### Phaser

- 每个场景一个文件，放在 `scenes/` 目录下
- 场景通信使用 `scene.start('SceneName', { data })` 模式
- 不在场景中直接操作 DOM —— 使用 Phaser 的 UI 系统
- 物理计算放在 `update()` 中，渲染由 Phaser 自动处理

### 通用

- 注释用中文（团队沟通语言），代码标识符用英文（行业标准）
- 提交前运行 `npm run lint` 和 `npm run test`
- 每个游戏项目必须有 README.md（中文）说明玩法和开发笔记

---

## 项目结构

```
creation-forge/
├── docs/
│   ├── zh-CN/          ← 📚 核心文档（哲学/技术栈/工作流/规范）
│   │   └── manifesto.md ← 🔥 AI时代的新学习思想宣言
│   ├── workflows/      ← 🔄 标准化协作流程（21 个工作流文档 + 模板）
│   ├── tool-guides/    ← 📖 工具知识库（Git/GitHub/Pixso 操作与人机协作）
│   └── en/             ← 🌐 英文文档
├── shared/             ← 📦 共享库（跨项目复用的 types/utils/assets）
├── templates/          ← 🔧 项目模板（Phaser / Godot 快速启动）
├── projects/           ← 🚀 所有项目
│   ├── GAME-002/       ← 🎮 开仙门（Godot 4.7 独立游戏）
│   ├── xiaohongshu/    ← 📱 小红书自媒体内容创作
│   ├── asset-pipeline/ ← 🔧 资产生产管线（产出媒体→桌面 asset-pipeline-outputs/，不进仓库）
│   ├── interaction-spec-system/ ← 📐 游戏交互规范生成系统
│   ├── qin-court-audience/ ← 🏛️ 秦殿听政（HTML 原型）
│   ├── tutorial/       ← 🎓 学习教程项目
│   ├── game-bot/       ← 🤖 游戏自动化机器人（流程脚本入库，运行产出忽略）
│   ├── 游戏美术部门AI协作中台/ ← 🎨 美术协作中台（planned）
│   └── 情景认知小程序/  ← 🧠 情景认知训练小程序（原型验证中）
├── works/              ← 📝 每日工作记录（一事一记 + 视频草案）
├── reports/            ← 📊 报告与仪表盘
├── tools/              ← 🛠️ 开发工具脚本（数据采集/仪表盘生成/Pixso导入等）
├── .claude/            ← ⚙️ Claude Code 配置（SKILL/记忆/settings）
└── .workbuddy/         ← 🔗 工作伙伴集成
```

> 🔑 **全局规则（2026-08-20 起）**：`projects/asset-pipeline/` 的生成产出（图片/视频/音频）不入仓库，统一存桌面 `C:\Users\Administrator\Desktop\asset-pipeline-outputs\`；仓库内只保留工作流 MD 文档、规则、过程数据（映射表/批次状态）与参考图。详见 `projects/asset-pipeline/CLAUDE.md`。

## 开发工作流

### 创建新游戏项目

1. 确定项目类型（在 `projects/` 下新建子目录）
2. 复制 `templates/game-godot/` 或 `templates/game-phaser/` 作为起点
3. 修改 package.json / project.godot 中的项目名称
4. 创建项目的 README.md

### Git 分支策略

- `main` —— 稳定分支，始终可运行
- `feature/<描述>` —— 新功能开发
- `learn/<主题>` —— 学习项目
- `fix/<描述>` —— Bug 修复
- `jam/<名称>` —— 快速原型 / Game Jam

### 提交规范 (Conventional Commits)

使用约定式提交，中文描述：

```
feat: 添加玩家跳跃功能
fix: 修复碰撞检测偏移问题
docs: 更新技术栈文档
refactor: 重构输入管理系统
test: 添加玩家移动单元测试
chore: 更新依赖版本
learn: 完成Phaser物理引擎学习笔记
journal: 添加2026-07-15学习日志
assets: 添加玩家精灵素材
```

### 创建交互规范文档

使用 `projects/interaction-spec-system/specs/_interaction-template.md` 模板创建新的游戏交互规范：

1. 复制模板：`cp projects/interaction-spec-system/specs/_interaction-template.md projects/interaction-spec-system/specs/<平台>-game-interaction-spec.md`
2. 编辑 YAML frontmatter（平台/画布/网格/色彩参数）
3. 填写各章节内容（画布/热区/手势/触控/布局/组件/动效等）
4. 生成 HTML：`npm run build-spec -- projects/interaction-spec-system/specs/<平台>-game-interaction-spec.md`
5. 在浏览器中打开 HTML 验证视觉效果

MD 为 AI 可读的单一数据源，HTML 由生成器自动渲染（网格可视化 + 组件陈列 + 手机原型标注）。

> 📖 详见 [方案文档](C:\Users\admin\.claude\plans\wiggly-bouncing-blanket.md)

---

---

## 当前任务上下文

> 📌 **当前阶段：** 游戏交互规范生成系统 v1.0 — MD 驱动 HTML 的交互规范生产线
> 📌 **状态：** 已完成核心工具链（2026-07-30）
> 📌 **最新完成：** 创建 spec-parser + spec-renderer + build-spec 工具链，重构竖版交互规范为 MD 驱动

---

## 多 AI 协作

本项目同时由多个 AI 助手协作（Claude / TREA / LobsterAl）。
所有 AI 遵守 [AI_COLLABORATION.md](./AI_COLLABORATION.md) 定义的共享协议。

### 本 AI 身份

| 属性 | 值 |
|------|-----|
| 标签 | `[claude]` |
| 工作记录前缀 | `works/YYYY-MM-DD-[claude]-*.md` |
| 提交签名 | `Co-Authored-By: Claude <noreply@anthropic.com>` |

### 操作前检查

- 修改共享状态文件前，检查 [.ai-locks/](./.ai-locks/) 是否有对应锁文件
- 获取锁 → 修改 → 释放锁
- 需要锁的文件：`docs/目标规划.md`、`docs/个人待办.md`、`tools/collect-data.ts`、`CLAUDE.md`、`AI_COLLABORATION.md`、`memory/` 下文件

### 跨 AI 共享记忆

- 每次会话开始时，读取 [memory/MEMORY.md](./memory/MEMORY.md) 了解项目当前状态
- 每次会话结束时，如有值得跨 AI 共享的发现，写入 [memory/](./memory/) 目录
- Claude Code 的专属记忆仍在 `.claude/projects/` 下，与 `memory/` 互不干扰
