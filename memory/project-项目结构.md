---
name: project-项目结构
description: 造化坊关键目录和文件速览
author: claude
updated: 2026-08-02
---

# 项目结构速览

## 核心入口文件

| 文件 | 用途 | 适用 AI |
|------|------|---------|
| AI_COLLABORATION.md | 多 AI 共同协议 | 全部 |
| CLAUDE.md | Claude 专属操作手册 | Claude |
| .trea/config.md | TREA 入口配置 | TREA |
| .lobster/config.md | LobsterAl 入口配置 | LobsterAl |

## 关键目录

| 目录 | 内容 | 读写策略 |
|------|------|---------|
| `docs/` | 文档中心 + 目标规划.md（权威数据源） | 大多只读，目标规划/待办可写 |
| `works/` | 每日工作记录 | 全部可写（带 AI 身份） |
| `memory/` | 跨 AI 共享记忆 | 全部可读写 |
| `projects/` | 5 个活跃项目 | 按项目分工 |
| `tools/` | 开发工具脚本 | collect-data.ts 需锁 |
| `reports/` | 仪表盘和审查报告 | 按需写入 |
| `.ai-locks/` | 文件锁 | 自动管理 |
| `.claude/` | Claude 专属配置 | 其他 AI 只读 |

## 活跃项目路径

- `projects/GAME-002/开仙门/` — Godot 4.7 独立游戏 (~80%)
- `projects/interaction-spec-system/` — 交互规范生成工具 (v1.0)
- `projects/asset-pipeline/` — 资产生产管线 (等 GAME-002 稳定)
- `projects/qin-court-audience/` — HTML5 问答游戏 (v1.0 已完成)
- `projects/xiaohongshu/` — 小红书内容创作 (15 期)

**来源：** CLAUDE.md · docs/zh-CN/04-project-structure.md · docs/目标规划.md
**适用 AI：** 全部
