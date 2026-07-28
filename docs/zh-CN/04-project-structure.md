# 04 — 项目结构说明

## 全景图

```
creation-forge/                     # 项目根目录
│
├── 📄 CLAUDE.md                    # ★ AI协作指南（最重要）
├── 📄 README.md                    # 项目主页
├── 📄 package.json                 # 工作区根配置
├── 📄 tsconfig.base.json           # 共享 TypeScript 配置
│
├── 📁 .claude/                     # Claude Code 配置
│   └── settings.json               # 权限和钩子
│
├── 📁 .vscode/                     # VS Code 配置
│   ├── settings.json               # 编辑器设置
│   └── extensions.json             # 推荐插件
│
├── 📁 docs/                        # 📚 文档中心
│   ├── zh-CN/                      # 中文文档（主要）
│   │   ├── manifesto.md            # 🔥 AI时代的新学习思想（核心理念）
│   │   ├── operational-loop.md      # 🔄 日常运转线路图
│   │   ├── user-manual.md            # 📖 操作手册（给人看的）
│   │   ├── 01-project-philosophy.md
│   │   ├── 02-tech-stack.md
│   │   ├── 03-workflow.md
│   │   ├── 04-project-structure.md  ← 你在这里
│   │   ├── 05-coding-standards.md
│   │   ├── 06-git-conventions.md
│   │   └── 07-glossary.md
│   └── en/                         # 英文文档（精简版）
│       └── README.md
│
├── 📁 works/                       # 🔄 日常运转工作单元（一事一记）
│   ├── README.md                   # 目录说明
│   └── _template.md                # 工作单元模板（日志+视频草案）
│
├── 📁 shared/                      # 📦 共享代码库
│   ├── utils/                      # @creation-forge/utils
│   │   └── src/                    # 工具函数
│   ├── types/                      # @creation-forge/types
│   │   └── src/                    # 类型定义
│   └── assets/                     # 共享资源
│       ├── fonts/
│       ├── audio/
│       └── sprites/ui/
│
├── 📁 templates/                   # 🔧 项目模板
│   ├── game-phaser/                # Phaser 游戏模板
│   │   ├── src/main.ts             # 入口文件
│   │   ├── src/scenes/             # 场景目录
│   │   ├── index.html              # HTML 入口
│   │   ├── package.json            # 项目配置
│   │   ├── tsconfig.json           # TS 配置
│   │   └── vite.config.ts          # Vite 配置
│   └── game-godot/                 # Godot 模板
│       └── README.md
│
├── 📁 projects/                    # 🚀 所有项目
│   ├── GAME-002/                   # 开仙门（Godot 4.7 独立游戏）
│   ├── xiaohongshu/                # 小红书自媒体内容创作

│   ├── originals/                  # 原创游戏
│   └── sandbox/                    # 实验沙盒
│
└── 📁 tools/                       # 🛠️ 开发工具
    ├── scaffold-game.ts            # 项目脚手架
    └── new-journal.ts              # 日志生成器
```

---

## 各目录设计意图

### `docs/` — 文档中心

| 原则     | 说明                                 |
| -------- | ------------------------------------ |
| 中文为主 | 团队沟通语言是中文，文档优先用中文写 |
| 编号排序 | 01-07 按照从概念到细节的顺序排列     |
| 英文精简 | `en/` 下只放概览，详细内容指向中文   |
| 即查即用 | 每个文档独立可读，不要求按顺序读     |

### `works/` — 日常运转工作单元

**一事一记**。一个文件 = 问题解决日志 + 视频生产草案。

文件命名：`YYYY-MM-DD-简短描述.md`。每条线独立运转，互不交叉。

详见 [运转线路图](./operational-loop.md) 了解完整循环。

### `shared/` — 共享库

使用 npm workspace 协议 (`@creation-forge/*`) 引用。不写相对路径 `../../../shared/utils`。

```typescript
// ✅ 正确
import { clamp, lerp } from '@creation-forge/utils';

// ❌ 避免
import { clamp } from '../../../shared/utils/src/math';
```

### `projects/` — 游戏项目

三个分类：

| 目录         | 用途                   | AI 模式偏向 |
| ------------ | ---------------------- | ----------- |

| `originals/` | 独立创作，综合运用     | 协作者模式  |
| `sandbox/`   | 快速实验，随时可丢弃   | 加速器模式  |

### `templates/` — 项目模板

复制即用。每个模板包含最小可运行配置（入口文件、构建配置、HTML、package.json）。
