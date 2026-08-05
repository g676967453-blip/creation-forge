---
category: index
description: 造化坊游戏 UI 组件库总索引。所有组件的规格 + 可复用 HTML/CSS 代码。
version: "2.0"
canvas: 720×1280
---

# 游戏 UI 组件库

> 🏭 单一数据源 — 组件规格 + 代码都在此目录。AI 读取 MD 获取规格，工具链提取代码块生成展示页。

## 组件分类

### 基础组件 (Basic)

| 组件 | 文件 | 变体 | 状态覆盖 |
|------|------|------|---------|
| 按钮 | [button.md](button.md) | primary / secondary / outline / danger / ghost / icon | idle / hover / active / disabled / loading |
| 标签 | [badge.md](badge.md) | 5 品质 + success / danger / new / dot | — |
| 卡片 | [card.md](card.md) | 4 品质 + selected / locked | idle / selected / locked |
| 进度条 | [progress-bar.md](progress-bar.md) | HP / EXP / 能量 | >50% / 20-50% / <20% |
| 槽位 | [slot.md](slot.md) | 3 尺寸 × 4 品质 | filled / empty / locked / equipped |
| 页签 | [tab.md](tab.md) | 顶部 Tab / 底部 Tab | idle / active |
| 开关 | [toggle.md](toggle.md) | — | on / off |
| 输入框 | [input.md](input.md) | — | idle / focus / error / disabled |

### 布局组件 (Layout)

| 组件 | 文件 | 用途 |
|------|------|------|
| HUD 顶栏 | [hud.md](hud.md) | 玩家信息 + 资源 + 经验条 |
| 底部导航 | [dock.md](dock.md) | 5 Tab + 中间突出主按钮 |
| 页面标题栏 | [screen-header.md](screen-header.md) | 返回 + 标题 + 操作 |
| 侧边抽屉 | [drawer.md](drawer.md) | 侧滑菜单 |
| 排序栏 | [sort-bar.md](sort-bar.md) | 列表筛选/排序 |

### 游戏专用组件 (Game)

| 组件 | 文件 | 关键特性 |
|------|------|---------|
| 英雄卡牌 | [hero-card.md](hero-card.md) | 品质边框 + 星级 + HP/ATK 条 + 元素图标 + 选中/锁定态 |
| 道具框 | [item-frame.md](item-frame.md) | 品质边框 + 数量角标 + 已装备标记 + 空槽/锁定态 |
| 技能框 | [skill-frame.md](skill-frame.md) | 品质边框 + 能量消耗 + 冷却倒计时 + 锁定态 |
| TIPS 浮窗 | [tooltip.md](tooltip.md) | 品质标题栏 + 属性行 + 三角箭头 + 长按触发 |
| 弹窗体系 | [dialog.md](dialog.md) | Alert / Modal / BottomSheet / Toast |
| 任务卡片 | [quest-card.md](quest-card.md) | 进度条 + 奖励 + 状态 |
| 活动横幅 | [event-banner.md](event-banner.md) | 倒计时 + 入口 |
| 快捷入口 | [quick-actions.md](quick-actions.md) | 4 格网格 |

## 使用方式

### 给人看
运行 `npx tsx tools/build-component-lib.ts` → 生成 `dist/components/index.html`

### 给 AI 看
Claude 读取 `components/_index.md` 了解组件总览，按需读取具体组件 MD 获取规格和代码。

### 给原型用
原型生成器 (`prototype-generator.ts`) 从组件 MD 提取代码块，注入原型模板。

### 给规范文档用
`spec-renderer.ts` 引用组件库渲染结果，替换硬编码的组件 HTML。
