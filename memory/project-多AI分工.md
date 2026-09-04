---
name: project-多AI分工
description: 各 AI 的领域分工与协作边界（消除"5 身份 1 主力"）
author: claude
updated: 2026-08-14
---

# 多 AI 分工

> 分工目的：消除「5 个身份、1 个主力」的局面，让每个 AI 有明确领域、避免踩线冲突。
> 分工写入共享记忆（**不改各 AI 配置文件**，各自配置由用户/本人维护）。

## 分工表

| AI | 标签 | 领域 | 负责项目/线 | 状态 |
|----|------|------|------------|------|
| Claude | `[claude]` | 游戏开发 + 美术管线 + 系统基建 | GAME-002 开仙门、asset-pipeline、交互规范系统、工作流/仪表盘/记忆体系 | 🟢 主力，负责跨线协调 |
| Codex | `[codex]` | 工具链工程（TypeScript） | interaction-spec-system 工具链、spec 生成器、代码工程维护 | 🟢 已有 4 条日志 |
| LobsterAl | `[lobster]` | 市场调研 + 数据分析 | TBH 复刻（调研线）、竞品/市场分析、内容选题研究 | 🟢 已完成 TBH 调研 |
| TREA | `[trea]` | 内容创作 + 知识库整理 | 小红书内容线、docs/personal-work-records 整理 | ⚪ 未启动，待首次会话确认 |
| Libtv | `[libtv]` | 视频生产 | 三幕结构视频、游戏宣传素材、造化仪表盘/works/ 日志转视频（Libtv skill 自带视频/音频工作流） | ⚪ 未启动，待首次会话确认 |

## 协作边界

- 各 AI 在自己领域内主导；跨领域改动前先查 `造化仪表盘/works/` 最近日志 + `memory/` 确认无冲突
- 共享文件（目标规划/待办/MEMORY 等）一律走 `.ai-locks/` 锁协议
- 分工可调整：用户可随时改；AI 提议调整需用户确认
- 首次会话的 AI：先读 ONBOARDING.md → AI_COLLABORATION.md → MEMORY.md → 本文件，然后向用户确认自己的领域

## 待办

- [ ] TREA / Libtv 首次会话时向用户确认分工是否合适（领域可调）
- [ ] LobsterAl 的 TBH 复刻若立项，按立项流程（docs/workflows/06-立项流程.md）推进

**来源：** AI_COLLABORATION.md 身份表 · 造化仪表盘/works/ 各 AI 日志分布（2026-08-14 统计）
**适用 AI：** 全部
