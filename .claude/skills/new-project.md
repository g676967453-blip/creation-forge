---
description: 创建项目：确定方向 → 选择类型和技术栈（4类：游戏/自媒体/管线/其他）→ 项目初始化 → 注册到体系 → 创建项目CLAUDE.md → 第一份工作记录 → 同步仪表盘。当用户说"新建项目""开始一个新游戏""创建项目""/new-project"时使用。
---

# /new-project — 创建项目

## 触发
用户说 `/new-project` 或 "新建项目" 或 "开始一个新游戏" 或 "创建一个项目" 或 "我想做 XX"

## 执行步骤

### 1. 确定方向
协作者模式提问引导：
- 你想做什么？（一句话核心）
- 做完后长什么样？（产出物形态）
- 为什么要做？（动机/学习目标）
- 预期多久？（时间尺度）
- 有没有参考？

### 2. 确定类型和技术栈
归入四类之一：

| 类型 | 技术栈 | 模板 |
|------|--------|------|
| 🎮 游戏 | Phaser/Godot/Three.js | `templates/game-phaser/`（完整） / `templates/game-godot/`（占位） |
| 📱 自媒体 | HTML/CSS + Puppeteer | 参考 `projects/xiaohongshu/` |
| 🔧 工具/管线 | Node.js/TypeScript | 参考 `projects/asset-pipeline/` |
| 📝 其他 | 按需 | 无模板 |

推荐时给出：推荐理由 + 替代选项 + 选型风险。Godot 模板必须警告是占位符。

### 3. 项目初始化
- Phaser：`npm run scaffold`（需确认脚手架是否适配扁平 projects/ 结构）
- 其他类型：手动创建目录结构，复制参考项目的 CLAUDE.md 模板
- **必须**：从 `templates/PROGRESS.md` 复制进度表模板，填写初始状态

### 4. 注册到体系
- `tools/collect-data.ts` projects[] 追加条目
- `docs/workflows/变更日志.md` 追加记录

### 5. 创建项目 CLAUDE.md
按类型参考现有项目结构生成初稿，用户补充特有规则。

### 6. 第一份工作记录
按 `works/_template.md` 生成 `works/YYYY-MM-DD-创建{项目名}.md`

### 7. 同步仪表盘
执行 `/update-dashboard`，用户验证。

## 约束
- 先问后建：不能根据一句话直接创建
- 必须写入 `projects/`，必须在 `collect-data.ts` 注册
- 每个项目必须有 CLAUDE.md
- 目录名 kebab-case，不破坏现有三个项目
- Godot 模板占位警告必须告知用户

> 完整流程见 [docs/workflows/创建项目.md](../docs/workflows/创建项目.md)
