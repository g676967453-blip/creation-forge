---
name: project-项目结构
description: 造化坊五板块自治 + 平台层关键目录速览
author: claude
updated: 2026-09-04
---

# 项目结构速览

## 核心入口文件

| 文件 | 用途 | 适用 AI |
|------|------|---------|
| AI_COLLABORATION.md | 多 AI 共同协议 | 全部 |
| CLAUDE.md | Claude 专属操作手册 | Claude |
| .trea/config.md | TREA 入口配置 | TREA |
| .lobster/config.md | LobsterAl 入口配置 | LobsterAl |

## 关键目录（2026-09-04 五板块化）

| 目录 | 内容 | 读写策略 |
|------|------|---------|
| `造化仪表盘/` | 板块1 中枢：目标规划.md / 个人待办.md / works/ 日志 / reports/ / data/ / tools/ 仪表盘工具链 | 目标/待办/collect-data.ts 需锁 |
| `projects/` | 板块2 项目库：GAME-002 / IAA / game-bot / interaction-spec-system / qin-court-audience / 情景认知小程序 / 概念设计工作流 / 立项组合-202609 | 按项目分工 |
| `docs/` | 板块3 知识库：纯知识文档（zh-CN / workflows / tool-guides / specs / knowledge / personal-work-records / en） | 大多只读 |
| `asset-pipeline/` | 板块4 美术制作（产出在桌面 asset-pipeline-outputs/） | 按板块 CLAUDE |
| `xiaohongshu/` | 板块5 自媒体 | 按板块 CLAUDE |
| `memory/` | 平台层：跨 AI 共享记忆 | 全部可读写 |
| `tools/` | 平台层：仅平台级工具（scaffold-game / check / convert-encoding / extract_pdf / batch-removebg / _archive） | 无锁 |
| `.ai-locks/` | 文件锁 | 自动管理 |
| `.claude/` | Claude 专属配置 | 其他 AI 只读 |

> 板块白名单 = `造化仪表盘/ projects/ docs/ asset-pipeline/ xiaohongshu/`；新增一级目录须用户批准。
> 数据单向下沉：板块2–5 引用板块1 只能读，不写板块1 数据。

## 活跃项目路径（板块2 + 板块4/5）

- `projects/GAME-002/` — Godot 4.7 独立游戏（入口 GAME-002/CLAUDE.md，子目录 开仙门/ 等，~80%）
- `projects/IAA/` — IAA 救火英雄：企划/成本清单已入库，Godot 工程 + 好友排行（2026-09）
- `projects/interaction-spec-system/` — 交互规范生成系统 (v2.x，MD 单一数据源)
- `projects/qin-court-audience/` — HTML5 问答游戏 (已完成)
- `projects/概念设计工作流/` — 三国诡异 Q 版概念设计（含参考图）
- `asset-pipeline/`（板块4） — AI 美术生产线（产出存桌面 asset-pipeline-outputs/）
- `xiaohongshu/`（板块5） — 小红书内容创作（素材源声明 → 帖子 → 发布）

**来源：** CLAUDE.md（五板块地图） · docs/zh-CN/04-project-structure.md · 造化仪表盘/目标规划.md
**适用 AI：** 全部
