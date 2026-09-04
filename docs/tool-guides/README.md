# 工具指南 (Tool Guides)

> 我们用到的工具软件知识库。每个工具覆盖三个维度：是什么、怎么用、AI 怎么配合。  
> 总导航：[../README.md](../README.md)

## 目录

| 工具 | 用途 | 文档 |
|------|------|------|
| Git | 版本控制 | [01-介绍](git/01-git-intro.md) · [02-操作](git/02-git-operations.md) · [03-人机协作](git/03-git-human-ai-collab.md) |
| GitHub | 代码托管平台 | [01-介绍](github/01-github-intro.md) · [02-操作](github/02-github-operations.md) · [03-人机协作](github/03-github-human-ai-collab.md) |
| Pixso | UI 设计工具 | [人机协作](pixso-human-ai-collaboration.md) · [加帖工作流笔记](pixso-workflow-add-post.md) · 导入动作见 [../workflows/Pixso-导入操作.md](../workflows/Pixso-导入操作.md) |
| Claude Code Skills | AI 游戏开发技能包 | [使用说明](game-dev-skills.md) — 游戏开发技能包（Godot/Phaser/Three.js 等） |

## 命名规范

```
{工具名}/
├── 01-{工具名}-intro.md            ← 软件介绍：它是什么、解决什么问题
├── 02-{工具名}-operations.md       ← 操作流程：常用操作步骤
└── 03-{工具名}-human-ai-collab.md  ← 人机协作：AI 能帮你做什么、怎么配合
```

## 与项目文档的区别

| | `docs/zh-CN/` | `docs/tool-guides/` | `docs/workflows/` |
|--|---------------|---------------------|-------------------|
| 定位 | 项目宪法与工程约定 | 工具软件知识库 | 可触发的标准流程 |
| 内容 | 哲学/技术栈/编码 Git 约定 | 软件介绍/操作教程/人机协作 | 触发条件、人机步骤、产出 |
| 范围 | 只和造化坊相关 | 跨项目通用的工具知识 | 造化坊日常动作 |
| 示例 | 提交信息格式（权威） | Git 是什么、常用命令 | `/git-commit` 提交推送 |

### Git 主从

- **约定权威**：[../zh-CN/06-git-conventions.md](../zh-CN/06-git-conventions.md)  
- **本目录**：学会用 Git / GitHub  
- **流程**：[../workflows/Git-提交推送.md](../workflows/Git-提交推送.md)
