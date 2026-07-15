# 星火工坊 (Spark Forge)

> **星星之火，可以燎原** —— 每一个小项目都是点燃创造力的火花。

星火工坊是一个以「项目制学习」为核心的独立游戏开发工作室。我们通过完成一个个游戏项目来学习编程、设计和协作——而非死啃教材。

---

## 三大支柱

### 🎯 项目制学习 (Project-Based Learning)

学习不是看完一本教材，而是做完一个个项目。每个项目都有明确的学习目标，难度循序渐进。**完成比完美重要。**

### 🤖 人与AI协作 (Human-AI Collaboration)

AI 不是替代人类创造力，而是放大它。在这里，AI 同时扮演三个角色：协作者（一起头脑风暴）、导师（解释概念和模式）、加速器（快速验证想法）。

### 🎮 独立游戏开发 (Indie Game Development)

目标是做出可以玩的游戏，而非完美的代码。玩法原型 > 画面精美，快速迭代 > 一次做对，完成发布 > 无限打磨。

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 创建你的第一个游戏项目
cp -r templates/game-phaser projects/tutorial/01-hello-canvas
cd projects/tutorial/01-hello-canvas
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器 http://localhost:3000
```

---

## 项目结构

```
spark-forge/
├── docs/zh-CN/       ← 📚 中文文档（项目哲学、技术栈、工作流等）
├── journals/         ← 📝 学习日志（按日期组织）
├── ai-collab/        ← 🤖 AI协作产物（提示词、决策记录、复盘）
├── shared/           ← 📦 共享库（跨项目复用的工具和类型）
│   ├── utils/        ← @spark-forge/utils
│   ├── types/        ← @spark-forge/types
│   └── assets/       ← 共享资源（字体/音频/精灵）
├── templates/        ← 🔧 项目模板
│   └── game-phaser/  ← Phaser 游戏模板
├── projects/         ← 🎮 所有游戏项目
│   ├── tutorial/     ← 教程项目（按难度编号 01~11）
│   ├── originals/    ← 原创游戏
│   └── sandbox/      ← 实验沙盒
└── tools/            ← 🛠️ 开发工具脚本
```

---

## 技术栈

| 层级     | 技术                | 用途                     |
| -------- | ------------------- | ------------------------ |
| 语言     | TypeScript 5.x      | 类型安全，AI协作效率最高 |
| 2D引擎   | Phaser 3.80+        | 成熟的2D游戏框架         |
| 构建     | Vite 6.x            | 亚秒级热更新             |
| 测试     | Vitest              | Vite原生，快速           |
| Lint     | ESLint 9 + Prettier | 代码质量                 |
| 未来备选 | Godot 4.x           | 原生游戏引擎体验         |

---

## 学习路径

| 阶段    | 项目                                     | 核心技能                        |
| ------- | ---------------------------------------- | ------------------------------- |
| 🟢 基础 | 01-hello-canvas → 03-simple-platformer   | Phaser结构、输入处理、物理引擎  |
| 🟡 进阶 | 04-puzzle-game → 06-shmup-shooter        | 状态管理、UI系统、对象池        |
| 🟠 系统 | 07-local-multiplayer → 09-procedural-gen | 多人游戏、WebSocket、程序化生成 |
| 🔴 发布 | 10-full-game → 11-packaging              | 完整游戏 + Electron桌面打包     |

---

## AI 协作

本项目深度集成 AI 协作。AI（Claude Code）会根据上下文自动切换三种模式：

- **协作者** — 创意讨论时平等贡献想法
- **导师** — 遇到困难时先解释「为什么」再教「怎么做」
- **加速器** — 熟练任务时快速产出代码

详见 [CLAUDE.md](./CLAUDE.md) 了解完整的 AI 行为规范。

---

## 开发工具

- **Git GUI:** GitKraken（推荐）
- **AI 助手:** Claude Code
- **编辑器:** VS Code（推荐安装 Prettier 和 ESLint 插件）

---

## 许可

MIT License — 学习、分享、创造。

---

_初始化于 2026-07-15 · 星火工坊_
