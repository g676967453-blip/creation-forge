# 开仙门 — UI 设计规范 v1

> **用途**：所有 UI 界面（HTML 原型 + Godot 引擎实现 + Lovart AI 生成）的**唯一视觉真相源**。
> **最后更新**：2026-07-28
> **配套**：HTML 原型用 CSS 变量；Lovart 生成用色板参考图 + Prompt 模板；Godot 用 Theme 常量。
> **关联**：[开仙门-美术绘制规范-v2](开仙门-美术绘制规范-v2.md)（像素艺术/角色/特效） · [开仙门-UI组件库](../ui-prototypes/开仙门-UI组件库.html)（可渲染组件展示）

---

## 目录

1. [色彩系统](#1-色彩系统)
2. [字体系统](#2-字体系统)
3. [间距系统](#3-间距系统)
4. [圆角系统](#4-圆角系统)
5. [阴影系统](#5-阴影系统)
6. [UI 组件规格](#6-ui-组件规格)
7. [CSS 变量速查表](#7-css-变量速查表)
8. [Lovart 生成用色值对照](#8-lovart-生成用色值对照)

---

## 1. 色彩系统

### 1.1 背景色阶（Background）

> 用于界面底色、遮罩、面板背景。从深到浅。

| Token | HEX | RGB | 用途 |
|-------|-----|-----|------|
| `--bg-black` | `#0a0a0f` | (10,10,15) | 开场黑幕、全屏遮罩底层 |
| `--bg-primary` | `#141416` | (20,20,22) | 主界面底色 |
| `--bg-surface` | `#1a1a1e` | (26,26,30) | 面板/卡片底色 |
| `--bg-elevated` | `#222228` | (34,34,40) | 悬浮面板/弹窗底色 |
| `--bg-overlay` | `rgba(0,0,0,0.55)` | — | 模态遮罩 |

### 1.2 表面色阶（Surface）

> 用于卡片、槽位、列表项等交互元素的填充色。

| Token | HEX | RGB | 用途 |
|-------|-----|-----|------|
| `--surface-default` | `#1e1e24` | (30,30,36) | 默认表面（卡片/按钮底） |
| `--surface-hover` | `#2a2a32` | (42,42,50) | 悬浮态表面 |
| `--surface-pressed` | `#16161c` | (22,22,28) | 按下态表面 |
| `--surface-disabled` | `#121218` | (18,18,24) | 禁用态表面 |
| `--surface-input` | `#1a1a20` | (26,26,32) | 输入框/槽位底色 |

### 1.3 文字色阶（Text）

> 从最亮到最暗。确保 WCAG AA 对比度（≥4.5:1 正文）。

| Token | HEX | RGB | 用途 |
|-------|-----|-----|------|
| `--text-primary` | `#e8e8f0` | (232,232,240) | 标题、重要文字 |
| `--text-body` | `#c0c0cc` | (192,192,204) | 正文、描述文字 |
| `--text-secondary` | `#8888a0` | (136,136,160) | 辅助信息、标签 |
| `--text-disabled` | `#555568` | (85,85,104) | 禁用态文字、占位符 |
| `--text-inverse` | `#1a1a1e` | (26,26,30) | 亮底上的深色字（如亮色按钮内） |

### 1.4 边框色阶（Border）

| Token | HEX | RGB | 用途 |
|-------|-----|-----|------|
| `--border-active` | `#d0d0d8` | (208,208,216) | 选中/激活态边框 |
| `--border-default` | `#3a3a48` | (58,58,72) | 默认边框 |
| `--border-subtle` | `#2a2a36` | (42,42,54) | 弱边框、分割线 |
| `--border-dashed` | `#2a2a36` | (42,42,54) | 虚线边框（空槽位/占位） |
| `--border-disabled` | `#1e1e28` | (30,30,40) | 禁用态边框 |

### 1.5 品质色（Quality）

> 用于道具、技能、装备等有稀有度区分的元素边框和角标。

| Token | 品质 | HEX | RGB | 用途 |
|-------|------|-----|-----|------|
| `--quality-common` | 普通 | `#8888a0` | (136,136,160) | 灰白色边框 |
| `--quality-rare` | 稀有 | `#6699bb` | (102,153,187) | 蓝灰色边框 |
| `--quality-epic` | 史诗 | `#9977bb` | (153,119,187) | 紫灰色边框 |
| `--quality-legendary` | 传说 | `#bb9966` | (187,153,102) | 暖金色边框 |

### 1.6 状态色（Status）

> 用于 HP 条、状态标识、反馈提示。

| Token | HEX | RGB | 用途 |
|-------|-----|-----|------|
| `--status-hp-full` | `#4ecca3` | (78,204,163) | HP 健康（>60%） |
| `--status-hp-mid` | `#ccaa44` | (204,170,68) | HP 中等（30%-60%） |
| `--status-hp-low` | `#cc4444` | (204,68,68) | HP 危险（<30%） |
| `--status-success` | `#4ecca3` | (78,204,163) | 成功/正面反馈 |
| `--status-warning` | `#ccaa44` | (204,170,68) | 警告 |
| `--status-danger` | `#cc4444` | (204,68,68) | 危险/负面反馈 |

---

## 2. 字体系统

### 2.1 字体文件

| 用途 | 字体 | 文件路径 |
|------|------|---------|
| 中文正文 | 阿里巴巴普惠体 55R | `res://assets/fonts/AlibabaPuHuiTi-3-55-Regular.woff2` |
| 中文标题 | 阿里巴巴普惠体 65M | `res://assets/fonts/AlibabaPuHuiTi-3-65-Medium.woff2` |
| 英文/数字 | （同上，阿里巴巴普惠体包含拉丁字符） | — |

### 2.2 字号阶梯

| Token | 大小 | 行高 | 用途 |
|-------|------|------|------|
| `--fs-display` | 32px | 44px | 超大标题（封面/结算） |
| `--fs-h1` | 28px | 38px | 界面主标题 |
| `--fs-h2` | 20px | 28px | 分区标题、卡片名称 |
| `--fs-body` | 14px | 22px | 正文、描述文字 |
| `--fs-label` | 12px | 18px | 标签、按钮文字 |
| `--fs-caption` | 11px | 16px | 辅助说明、道具名 |
| `--fs-small` | 10px | 14px | 极小文字、角标 |

### 2.3 字重

| Token | Weight | 用途 |
|-------|--------|------|
| `--fw-bold` | 700 | 标题、强调 |
| `--fw-semibold` | 600 | 卡片名称、按钮 |
| `--fw-regular` | 400 | 正文、描述 |
| `--fw-light` | 300 | 辅助说明 |

### 2.4 字间距

| 场景 | letter-spacing | 示例 |
|------|---------------|------|
| 中文大标题 | 6px | "选 择 器 灵" |
| 中文小标题 | 4px | 器灵名称 |
| 英文/数字 | 2px | "ANCIENT TOME" |
| 正文 | 0（默认） | 描述文字 |

---

## 3. 间距系统

> 基于 4px 基准网格。所有 padding / margin / gap 必须是 4 的倍数。

| Token | 值 | 用途 |
|-------|-----|------|
| `--sp-2xs` | 4px | 极小间距（图标与文字之间） |
| `--sp-xs` | 8px | 组件内小间距 |
| `--sp-sm` | 12px | 同行元素间距 |
| `--sp-md` | 16px | 组件间距、列表项间距 |
| `--sp-lg` | 24px | 区块间距 |
| `--sp-xl` | 32px | 大区块间距 |
| `--sp-2xl` | 48px | 页面级间距（标题与内容之间） |
| `--sp-3xl` | 64px | 超大间距（页面边距） |

### 3.1 界面安全区（1280×720 标准画布）

| 区域 | 位置 | 说明 |
|------|------|------|
| 顶部留白 | y: 60px | 标题起始位置，避免贴顶 |
| 底部留白 | y: 660px | 操作按钮区域的安全下边界 |
| 左右留白 | x: 40-60px | 内容区与屏幕边缘的距离 |
| 内容最大宽度 | 840px | 居中文本/面板的建议最大宽度 |

---

## 4. 圆角系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-none` | 0 | 无圆角（表格/分割线） |
| `--radius-sm` | 2px | 极小圆角（槽位/标签/小按钮） |
| `--radius-md` | 4px | 标准圆角（卡片/面板/按钮） |
| `--radius-lg` | 8px | 大圆角（弹窗/主面板） |
| `--radius-full` | 999px | 胶囊形（状态标签/头像） |

---

## 5. 阴影系统

> 外发光用于强调选中态。投影用于区分层级。

| Token | 值 | 用途 |
|-------|-----|------|
| `--glow-selected` | `0 0 16px rgba(208,208,216,0.15)` | 选中态外发光 |
| `--glow-legendary` | `0 0 12px rgba(187,153,102,0.25)` | 传说品质发光 |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.4)` | 卡片/面板投影 |
| `--shadow-popup` | `0 4px 24px rgba(0,0,0,0.6)` | 弹窗/模态投影 |
| `--shadow-inner` | `inset 0 1px 3px rgba(0,0,0,0.3)` | 内阴影（按下态/输入框） |

---

## 6. UI 组件规格

> 标准 UI 组件的核心尺寸。HTML 原型和 Godot 引擎实现均以此为准。

### 6.1 按钮

| 类型 | 宽 | 高 | 圆角 | 说明 |
|------|-----|-----|------|------|
| 主按钮 | 200px | 48px | 4px | 确认/开始等主要操作 |
| 次按钮 | 160px | 40px | 4px | 取消/返回等次要操作 |
| 小按钮 | 120px | 32px | 2px | 列表内的操作按钮 |

### 6.2 卡片

| 类型 | 宽 | 高 | 圆角 | 说明 |
|------|-----|-----|------|------|
| 器灵选择卡片 | 240px | 320px | 8px | 含图标+名称+描述 |
| 器灵缩略卡片 | 120px | 72px | 4px | 轮播/切换用小卡片 |
| 山峰卡片 | 180px | 200px | 8px | 山峰选择 |

### 6.3 槽位

| 类型 | 尺寸 | 圆角 | 说明 |
|------|------|------|------|
| 道具槽 | 72×72 | 2px | 装备/道具格子 |
| 技能槽 | 200×56 | 4px | 技能框（含图标+描述） |
| 空槽位 | 同上 | 同上 | 虚线边框 + 暗淡底色 |

### 6.4 条

| 类型 | 宽 | 高 | 圆角 | 说明 |
|------|-----|-----|------|------|
| HP 条（头顶） | ~120px | 8px | 4px | 器灵/角色头顶 |
| HP 条（面板） | ~200px | 12px | 4px | 信息面板内 |
| 经验条 | 自适应 | 8px | 4px | 填充色随进度 |

### 6.5 面板

| 类型 | 宽 | 高 | 圆角 | 说明 |
|------|-----|-----|------|------|
| 居中弹窗 | 520px | 自适应 | 8px | 确认/选择面板 |
| 侧边面板 | 480px | 100% | — | 详情/信息面板 |
| 底部抽屉 | 100% | 自适应 | 8px(上) | 操作菜单 |

### 6.6 插图占位

| 类型 | 尺寸 | 边框 | 说明 |
|------|------|------|------|
| 器灵/角色插画 | 320×400 | `--border-dashed` | 虚线框 + 人物图标 + 尺寸标注文字 |

---

## 7. CSS 变量速查表

> 复制以下代码块到 HTML 原型的 `<style>` 标签中，即可使用所有设计 Token。

```css
:root {
  /* === 背景 === */
  --bg-black: #0a0a0f;
  --bg-primary: #141416;
  --bg-surface: #1a1a1e;
  --bg-elevated: #222228;
  --bg-overlay: rgba(0,0,0,0.55);

  /* === 表面 === */
  --surface-default: #1e1e24;
  --surface-hover: #2a2a32;
  --surface-pressed: #16161c;
  --surface-disabled: #121218;
  --surface-input: #1a1a20;

  /* === 文字 === */
  --text-primary: #e8e8f0;
  --text-body: #c0c0cc;
  --text-secondary: #8888a0;
  --text-disabled: #555568;
  --text-inverse: #1a1a1e;

  /* === 边框 === */
  --border-active: #d0d0d8;
  --border-default: #3a3a48;
  --border-subtle: #2a2a36;
  --border-dashed: #2a2a36;
  --border-disabled: #1e1e28;

  /* === 品质 === */
  --quality-common: #8888a0;
  --quality-rare: #6699bb;
  --quality-epic: #9977bb;
  --quality-legendary: #bb9966;

  /* === 状态 === */
  --status-hp-full: #4ecca3;
  --status-hp-mid: #ccaa44;
  --status-hp-low: #cc4444;
  --status-success: #4ecca3;
  --status-warning: #ccaa44;
  --status-danger: #cc4444;

  /* === 字号 === */
  --fs-display: 32px;
  --fs-h1: 28px;
  --fs-h2: 20px;
  --fs-body: 14px;
  --fs-label: 12px;
  --fs-caption: 11px;
  --fs-small: 10px;

  /* === 字重 === */
  --fw-bold: 700;
  --fw-semibold: 600;
  --fw-regular: 400;
  --fw-light: 300;

  /* === 间距 === */
  --sp-2xs: 4px;
  --sp-xs: 8px;
  --sp-sm: 12px;
  --sp-md: 16px;
  --sp-lg: 24px;
  --sp-xl: 32px;
  --sp-2xl: 48px;
  --sp-3xl: 64px;

  /* === 圆角 === */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-full: 999px;

  /* === 阴影 === */
  --glow-selected: 0 0 16px rgba(208,208,216,0.15);
  --glow-legendary: 0 0 12px rgba(187,153,102,0.25);
  --shadow-card: 0 2px 8px rgba(0,0,0,0.4);
  --shadow-popup: 0 4px 24px rgba(0,0,0,0.6);
  --shadow-inner: inset 0 1px 3px rgba(0,0,0,0.3);

  /* === 字体 === */
  --font-cn: 'Noto Sans SC', 'Alibaba PuHuiTi 55R', sans-serif;
}
```

---

## 8. Lovart 生成用色值对照

> Lovart 生成时，直接引用下表色值。配合 `_参考-UI色板.png` 作为视觉参考。

| 用途 | HEX | Lovart Prompt 中描述 |
|------|-----|-------------------|
| 背景主色 | `#141416` | dark charcoal background |
| 背景面板 | `#1a1a1e` | dark surface panels |
| 文字主色 | `#e8e8f0` | off-white text |
| 边框激活 | `#d0d0d8` | light gray active border |
| 品质-传说 | `#bb9966` | warm golden legendary border |
| 品质-稀有 | `#6699bb` | muted blue-gray rare border |
| 品质-史诗 | `#9977bb` | muted purple epic border |
| HP 健康 | `#4ecca3` | jade green HP bar |
| HP 危险 | `#cc4444` | muted red low HP warning |

---

_关联：[开仙门-美术绘制规范-v2](开仙门-美术绘制规范-v2.md) · [开仙门-UI组件库](../ui-prototypes/开仙门-UI组件库.html) · [_template.html](../ui-prototypes/_template.html)_
