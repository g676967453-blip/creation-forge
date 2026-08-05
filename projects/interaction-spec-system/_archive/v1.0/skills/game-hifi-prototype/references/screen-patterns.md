# 常用屏幕模式

> 生成游戏原型时，从这些模式中选择屏幕布局。

## 屏幕总览

| 屏幕 | 用途 | 关键组件 |
|------|------|---------|
| Home | 主界面/大厅 | hero-banner, quick-actions, quest-card, event-banner |
| Heroes | 角色/英雄列表 | sort-bar, tab, hero-card (grid) |
| Detail | 角色/物品详情 | hero-card, progress-bar, item-frame, skill-frame, tooltip |
| Battle | 战斗界面 | skill-frame, progress-bar |
| Bag | 背包/仓库 | item-frame (grid), sort-bar, tab |
| Shop | 商店 | quest-card (商品列表) |
| Summon | 召唤/抽卡 | hero-card, dialog, quick-actions |
| Arena | 竞技场 | hero-card (列表), progress-bar |
| Guild | 公会 | quest-card (成员列表), quick-actions |
| Mail | 邮件 | quest-card (邮件列表) |
| Settings | 设置 | toggle, input, dialog (modal) |

## 屏幕结构模式

### 列表型 (Heroes / Bag / Mail)

```
┌──────────────────┐
│ Screen Header    │ ← 返回 + 标题 + 操作
├──────────────────┤
│ Sort Bar / Tab   │ ← 筛选/排序 (可选)
├──────────────────┤
│                  │
│ Scrollable       │
│ Grid / List      │ ← 核心内容区
│                  │
├──────────────────┤
│ Bottom Actions   │ ← 批量操作 (可选)
└──────────────────┘
```

### 详情型 (Detail / Settings)

```
┌──────────────────┐
│ Portrait / Hero  │ ← 上方视觉区 (可选)
├──────────────────┤
│                  │
│ Scrollable       │
│ Stat / Form /    │ ← 信息/配置区
│ Equip / Skill    │
│                  │
└──────────────────┘
```

### 主页型 (Home)

```
┌──────────────────┐
│ HUD              │ ← 顶栏常驻
├──────────────────┤
│ Hero Banner      │ ← 主视觉
├──────────────────┤
│ Quick Actions    │ ← 快捷入口 4 格
├──────────────────┤
│ Event Banner     │ ← 活动 (可选)
├──────────────────┤
│ Quest List       │ ← 任务 (可选)
└──────────────────┘
```

### 战斗型 (Battle)

```
┌──────────────────┐
│ Battle HUD       │ ← 波次/时间
├──────────────────┤
│                  │
│ Battlefield      │
│                  │
├──────────────────┤
│ Skill Bar        │ ← 技能按钮
└──────────────────┘
```

## HUD + Dock 模式

大部分屏幕共享：
- **HUD 顶栏**：玩家头像 + EXP 条 + 资源 + 活动入口
- **Dock 底栏**：5 Tab 导航（含中间突出 CTA 按钮）

战斗、全屏弹窗等场景选择性地隐藏 HUD/Dock。
