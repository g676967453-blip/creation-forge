# HTML 原型图设计规范（策划案用）

> **版本**：v1.0 | **日期**：2026-07-28
> **用途**：为功能策划案中的 HTML 原型图提供统一视觉标准。策划可直接按本规范复制粘贴组件代码。
> **设计基准**：[器灵选择.html](../../../ui-prototypes/器灵选择.html) — 本规范中所有色值、字号、组件尺寸均以该文件为参考实现。

---

## 1. 概述

### 1.1 什么情况下用

写功能策划文档时，用 HTML 原型图来描述界面布局和交互，比纯文字更直观、比截图更易修改。

适用场景：
- 功能规划文档中的「界面描述」章节
- 功能需求文档中的「UI 布局」章节
- 需要向美术/程序传达界面意图时

### 1.2 设计原则

- **全内联样式**：所有 CSS 写在 `style="..."` 属性中，不依赖外部样式表或 `<style>` 块中的类
- **固定画布**：统一 1280×720，和 Godot 项目分辨率一致
- **直接能用**：本规范中的代码片段可直接复制粘贴到新原型中
- **暗色主题**：深色背景 + 浅色文字，和游戏实际风格一致

### 1.3 与其他规范的关系

| 文档 | 关系 |
|------|------|
| [开仙门-UI设计规范.md](../../../美术制作/开仙门-UI设计规范.md) | CSS 变量 + 组件类的完整定义（Pixso→Godot 工作流用） |
| [开仙门-UI组件库.html](../../../ui-prototypes/开仙门-UI组件库.html) | 所有组件的 class 版本渲染展示 |
| **本规范** | 策划案专用版，内联样式 + 精简到策划需要的组件 |

> 本规范是**子集 + 内联版**。完整组件库和 CSS Token 系统见上方两份文档。

---

## 2. 画布与背景

### 2.1 标准骨架

每个原型 HTML 都从以下骨架开始：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>界面名称</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  /* 品质色快捷类（可选，Pixso导入时用内联style替代） */
  .q-common    { border-color: #777777; }
  .q-rare      { border-color: #6699bb; }
  .q-epic      { border-color: #9977bb; }
  .q-legendary { border-color: #bb9966; }
</style>
</head>
<body style="margin:0; padding:0; background:#1a1a1a; display:flex; justify-content:center; align-items:center; min-height:100vh;">

<section style="width:1280px; height:720px; position:relative; overflow:hidden; flex-shrink:0;">

  <!-- Bg — 放在最后（Pixso 图层顺序：Bg 在视觉最底层 = DOM 需在最后） -->
  <div style="position:absolute; inset:0; z-index:1; background:linear-gradient(180deg, #1a1a1c 0%, #141416 50%, #1a1a1c 100%);"></div>

  <!-- Root — 放在最前（Pixso 图层顺序：内容在视觉最上层 = DOM 需在最前） -->
  <main style="position:absolute; inset:0; z-index:3; display:flex;">
    <!-- 你的界面内容 -->
  </main>

  <!-- Mask（可选）— 全屏遮罩 -->
  <!-- <div style="position:absolute; inset:0; z-index:2; background:rgba(0,0,0,0.55);"></div> -->

  <!-- TopOverlay（可选）— 顶部渐暗条 -->
  <!-- <div style="position:absolute; top:0; left:0; right:0; height:60px; z-index:4; background:linear-gradient(180deg, rgba(20,20,22,0.9) 0%, transparent 100%); pointer-events:none;"></div> -->

</section>

</body>
</html>
```

### 2.2 Bg / Mask / Root 的 DOM 顺序

```
HTML 中的顺序：  Root → Mask → Bg        （Root 在前，Bg 在后）
                 ↑ 前 = Pixso 图层树底部 = 视觉最上层
                 ↓ 后 = Pixso 图层树顶部 = 视觉最底层

z-index（浏览器预览用）：
  Root: z-index:3  （内容）
  Mask: z-index:2  （遮罩）
  Bg:   z-index:1  （背景）
```

> 这是和普通 Web 开发相反的顺序。原因是 Pixso 的 `code_to_design` 按 DOM 顺序堆叠图层，先出现者在底部。

---

## 3. 色彩系统

### 3.1 背景色阶

| 用途 | 色值 | 说明 |
|------|------|------|
| 最暗底 | `#0a0a0f` | 极少使用，超暗区域 |
| 主背景 | `#141416` | 画布背景渐变的中间色 |
| 内容区表面 | `#1a1a1a` / `#1a1a1c` / `#1a1a1e` | body 背景、区域底色 |
| 高亮表面 | `#1e1e1e` / `#222222` | 卡片、槽位、按钮区 |
| 输入区表面 | `#252525` | 图标背景等细微层次 |

### 3.2 文字色阶

| 用途 | 色值 | 适用 |
|------|------|------|
| 主标题 | `#e0e0e0` | 页面大标题、器灵名称 |
| 正文 | `#aaaaaa` / `#c0c0cc` | 描述文字、技能名 |
| 辅助 | `#888888` / `#999999` | 区域标签、道具名 |
| 次级 | `#777777` / `#666666` | 次要说明 |
| 禁用 | `#555555` / `#444444` / `#333333` | 锁定态文字、占位 |
| 反色 | `#1a1a1a` | 亮色按钮上的深色文字 |

### 3.3 边框色阶

| 用途 | 色值 | 说明 |
|------|------|------|
| 激活/选中 | `#cccccc` | 选中卡片边框、亮色按钮背景 |
| 默认 | `#3a3a3a` / `#444444` / `#555555` | 一般边框、分割线 |
| 虚线 | `#2a2a2a` / `#3a3a3a` | 空槽、锁定卡片 |
| 品质-传说 | `#bb9966` | 金色，传说级道具 |
| 品质-史诗 | `#9977bb` | 紫色，史诗级道具 |
| 品质-稀有 | `#6699bb` | 蓝色，稀有级道具 |
| 品质-普通 | `#777777` | 灰色，普通级道具 |

### 3.4 状态色

| 用途 | 色值 | 说明 |
|------|------|------|
| 成功/满血 | `#4ecca3` | 绿色 |
| 警告/半血 | `#ccaa44` | 黄色 |
| 危险/残血 | `#cc4444` | 红色 |

### 3.5 色值使用原则

- 策划案原型中**直接用 hex 值写在 `style="..."` 里**，不用 CSS 变量
- 保持本规范中的色值，不要自行调整（确保所有策划文档视觉统一）
- 如需新增颜色（如新品质色），先在 UI 设计规范中补充，再同步到本规范

---

## 4. 字体规范

### 4.1 字体栈

```
font-family: 'Noto Sans SC', 'Alibaba PuHuiTi 55R', sans-serif
```

> Alibaba PuHuiTi 55R 是 Godot 引擎中实际使用的字体；Noto Sans SC 是浏览器中的降级方案。

### 4.2 字号阶梯

| 层级 | 字号 | 用途 | 示例 |
|------|------|------|------|
| 大标题 | `28px` | 页面主标题 | "选择器灵" |
| 按钮字 | `16px` | 主按钮文字 | "开 始 游 戏" |
| 正文 | `13px` | 描述文字、卡片名 | "蕴藏万界知识的古书器灵" |
| 标签 | `12px` | 区域标签、英文副标题 | "携带道具" |
| 说明 | `11px` | 技能描述、技能名 | "战斗失败免死" |
| 小字 | `10px` | 道具名 | "古卷残页" |
| 微字 | `9px` | 卡片状态标注 | "已觉醒" / "未解锁" |

### 4.3 字重

| 字重 | font-weight | 用途 |
|------|-------------|------|
| 粗体 | `700` | 大标题、按钮文字 |
| 半粗 | `600` | 卡片名称 |
| 常规 | `400` | 正文描述 |

### 4.4 字间距

| 间距 | letter-spacing | 适用场景 |
|------|---------------|----------|
| 宽 | `6px` | 页面大标题（"选择器灵"）、主按钮（"开 始 游 戏"） |
| 中 | `4px` | 器灵名称（"百 世 书"） |
| 窄 | `2px` | 区域标签、英文文字、占位说明 |

---

## 5. 组件规格

> 每个组件列出**内联样式版**代码 — 可直接复制到策划案原型中。

### 5.1 按钮

#### 主按钮（可用态）

```html
<div style="width:200px; height:48px; display:flex; align-items:center; justify-content:center;
  background:#cccccc; border-radius:3px; cursor:pointer;">
  <p style="margin:0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
    font-size:16px; font-weight:700; color:#1a1a1a; letter-spacing:6px;">开 始 游 戏</p>
</div>
```

#### 主按钮（禁用态）

```html
<div style="width:200px; height:48px; display:flex; align-items:center; justify-content:center;
  background:#333333; border-radius:3px; cursor:not-allowed; opacity:0.5;">
  <p style="margin:0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
    font-size:16px; font-weight:700; color:#666666; letter-spacing:6px;">开 始 游 戏</p>
</div>
```

#### 次要按钮

```html
<div style="width:160px; height:40px; display:flex; align-items:center; justify-content:center;
  background:transparent; border:1px solid #3a3a3a; border-radius:3px; cursor:pointer;">
  <p style="margin:0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
    font-size:12px; font-weight:600; color:#c0c0cc; letter-spacing:4px;">返回</p>
</div>
```

#### 小按钮

```html
<div style="width:120px; height:32px; display:flex; align-items:center; justify-content:center;
  background:#1e1e1e; border:1px solid #3a3a3a; border-radius:2px; cursor:pointer;">
  <p style="margin:0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
    font-size:11px; font-weight:600; color:#c0c0cc; letter-spacing:2px;">确认</p>
</div>
```

### 5.2 道具槽位 (72×72)

#### 传说品质 (legendary)

```html
<div style="width:72px; height:72px; background:#222222; border:2px solid #bb9966;
  border-radius:3px; display:flex; align-items:center; justify-content:center; position:relative;">
  <!-- 道具图标（占位用 SVG） -->
  <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="#999999" stroke-width="1.5">
    <rect x="3" y="5" width="12" height="10" rx="1"/>
    <path d="M6 5V3h6v2"/>
  </svg>
  <!-- 品质圆点 -->
  <div style="position:absolute; top:4px; right:4px; width:6px; height:6px;
    background:#bb9966; border-radius:50%;"></div>
</div>
<!-- 名称在槽位外部 -->
<p style="width:72px; margin:4px 0 0 0; text-align:center;
  font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
  font-size:10px; color:#999999;">古卷残页</p>
```

#### 史诗品质 (epic)

```html
<div style="width:72px; height:72px; background:#222222; border:2px solid #9977bb;
  border-radius:3px; display:flex; align-items:center; justify-content:center; position:relative;">
  <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="#999999" stroke-width="1.5">
    <polygon points="9,1 12,6 17,7 13,11 14,17 9,14 4,17 5,11 1,7 6,6"/>
  </svg>
  <div style="position:absolute; top:4px; right:4px; width:6px; height:6px;
    background:#9977bb; border-radius:50%;"></div>
</div>
<p style="width:72px; margin:4px 0 0 0; text-align:center;
  font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
  font-size:10px; color:#999999;">道具名称</p>
```

#### 稀有品质 (rare)

```html
<div style="width:72px; height:72px; background:#222222; border:2px solid #6699bb;
  border-radius:3px; display:flex; align-items:center; justify-content:center; position:relative;">
  <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="#999999" stroke-width="1.5">
    <circle cx="9" cy="9" r="5"/>
    <path d="M9 6v3l2 2"/>
  </svg>
  <div style="position:absolute; top:4px; right:4px; width:6px; height:6px;
    background:#6699bb; border-radius:50%;"></div>
</div>
<p style="width:72px; margin:4px 0 0 0; text-align:center;
  font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
  font-size:10px; color:#888888;">道具名称</p>
```

#### 普通品质 (common)

```html
<div style="width:72px; height:72px; background:#222222; border:2px solid #777777;
  border-radius:3px; display:flex; align-items:center; justify-content:center; position:relative;">
  <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="#999999" stroke-width="1.5">
    <rect x="2" y="2" width="14" height="14" rx="2"/>
  </svg>
  <div style="position:absolute; top:4px; right:4px; width:6px; height:6px;
    background:#777777; border-radius:50%;"></div>
</div>
<p style="width:72px; margin:4px 0 0 0; text-align:center;
  font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
  font-size:10px; color:#888888;">道具名称</p>
```

#### 空槽位

```html
<div style="width:72px; height:72px; background:#1a1a1a; border:1px dashed #2a2a2a;
  border-radius:3px; display:flex; align-items:center; justify-content:center;">
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="#333333" stroke-width="1.5">
    <line x1="9" y1="3" x2="9" y2="15"/>
    <line x1="3" y1="9" x2="15" y2="9"/>
  </svg>
</div>
<p style="width:72px; margin:4px 0 0 0; text-align:center;
  font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
  font-size:10px; color:#444444;">空槽位</p>
```

#### 锁定态

```html
<div style="width:72px; height:72px; background:#121212; border:1px dashed #2a2a2a;
  border-radius:3px; display:flex; align-items:center; justify-content:center; opacity:0.4;">
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="#333333" stroke-width="1.5">
    <rect x="5" y="7" width="8" height="7" rx="1"/>
    <path d="M7 7V5a2 2 0 0 1 4 0v2"/>
  </svg>
</div>
<p style="width:72px; margin:4px 0 0 0; text-align:center;
  font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
  font-size:10px; color:#444444;">???</p>
```

### 5.3 技能槽位 (200×56)

```html
<div style="width:200px; height:56px; background:#1e1e1e; border:1px solid #3a3a3a;
  border-radius:3px; display:flex; align-items:center; padding:0 14px; gap:10px;">
  <!-- 技能图标 -->
  <div style="width:30px; height:30px; background:#252525; border:1px solid #444444;
    border-radius:3px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#888888" stroke-width="1.5">
      <polygon points="7,1 13,13 1,13"/>
      <circle cx="7" cy="9" r="2"/>
    </svg>
  </div>
  <p style="margin:0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
    font-size:11px; color:#666666; line-height:1.5;">技能描述第一行<br>技能描述第二行</p>
</div>
<!-- 名称在槽位外部 -->
<p style="width:200px; margin:4px 0 0 0; text-align:center;
  font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
  font-size:11px; color:#aaaaaa;">轮回庇护</p>
```

### 5.4 缩略卡片 (120×72)

#### 选中态

```html
<figure style="width:120px; height:72px; display:flex; align-items:center; justify-content:center;
  margin:0; border:2px solid #cccccc; border-radius:3px; background:#1e1e1e; cursor:pointer;">
  <div style="text-align:center;">
    <p style="margin:0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
      font-size:13px; font-weight:600; color:#e0e0e0;">百世书</p>
    <p style="margin:1px 0 0 0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
      font-size:9px; color:#777777;">已觉醒</p>
  </div>
</figure>
```

#### 锁定态

```html
<figure style="width:120px; height:72px; display:flex; align-items:center; justify-content:center;
  margin:0; border:1px dashed #2a2a2a; border-radius:3px; background:#121212;
  opacity:0.5; cursor:not-allowed;">
  <div style="text-align:center;">
    <p style="margin:0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
      font-size:13px; font-weight:600; color:#555555;">???</p>
    <p style="margin:0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
      font-size:9px; color:#333333;">未解锁</p>
  </div>
</figure>
```

### 5.5 大卡片 (240×320) — 选择器灵用

```html
<!-- 选中态 -->
<figure style="width:240px; height:320px; display:flex; align-items:center; justify-content:center;
  margin:0; border:2px solid #d0d0d8; border-radius:8px; background:#1a1a1e;
  box-shadow:0 0 16px rgba(208,208,216,0.15); cursor:pointer;">
  <div style="text-align:center;">
    <p style="margin:0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
      font-size:28px; font-weight:700; color:#e0e0e0; letter-spacing:4px;">百 世 书</p>
    <p style="margin:4px 0 0 0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
      font-size:12px; color:#888888;">古书器灵</p>
  </div>
</figure>
```

### 5.6 插图占位 (320×400)

```html
<div style="width:320px; height:400px; border:1px dashed #3a3a3a; border-radius:4px;
  display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative;">
  <!-- 占位图标 -->
  <div style="width:48px; height:48px; border:1px solid #444444; border-radius:50%;
    display:flex; align-items:center; justify-content:center; margin-bottom:12px;">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#555555" stroke-width="1.5">
      <circle cx="10" cy="7" r="4"/>
      <path d="M2 18c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
    </svg>
  </div>
  <p style="margin:0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
    font-size:13px; color:#555555; text-align:center; letter-spacing:2px;">器灵插图</p>
  <p style="margin:4px 0 0 0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
    font-size:11px; color:#3a3a3a; text-align:center;">128×160 像素艺术</p>
</div>
```

### 5.7 分割线

```html
<!-- 短分割线 48×2 -->
<div style="width:48px; height:2px; background:#555555; margin-bottom:20px;"></div>

<!-- 长分割线 60×2 -->
<div style="width:60px; height:2px; background:#3a3a3a;"></div>
```

### 5.8 区域标签

```html
<p style="margin:0 0 12px 0; font-family:'Noto Sans SC','Alibaba PuHuiTi 55R',sans-serif;
  font-size:12px; color:#888888; letter-spacing:2px;">携带道具</p>
```

### 5.9 品质圆点 (6×6)

```html
<!-- 传说 -->
<div style="width:6px; height:6px; background:#bb9966; border-radius:50%;"></div>
<!-- 史诗 -->
<div style="width:6px; height:6px; background:#9977bb; border-radius:50%;"></div>
<!-- 稀有 -->
<div style="width:6px; height:6px; background:#6699bb; border-radius:50%;"></div>
<!-- 普通 -->
<div style="width:6px; height:6px; background:#777777; border-radius:50%;"></div>
```

### 5.10 进度条

#### HP 条（面板版 200×12）

```html
<div style="width:200px; height:12px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:2px; overflow:hidden;">
  <div style="width:85%; height:100%; background:#4ecca3; border-radius:1px;"></div>
</div>
```

#### HP 条（头顶版 120×8）

```html
<div style="width:120px; height:8px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:1px; overflow:hidden;">
  <div style="width:45%; height:100%; background:#ccaa44; border-radius:1px;"></div>
</div>
```

#### EXP 条

```html
<div style="width:200px; height:8px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:2px; overflow:hidden;">
  <div style="width:60%; height:100%; background:#4ecca3; border-radius:1px;"></div>
</div>
```

> 血量色值：满血 `#4ecca3`（绿）、半血 `#ccaa44`（黄）、残血 `#cc4444`（红）

### 5.11 顶部渐暗条

```html
<div style="position:absolute; top:0; left:0; right:0; height:60px; z-index:4;
  background:linear-gradient(180deg, rgba(20,20,22,0.9) 0%, transparent 100%);
  pointer-events:none;"></div>
```

### 5.12 箭头（左右切换用）

```html
<!-- 左箭头 28×28 -->
<div style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#555555" stroke-width="1.5">
    <polyline points="8,2 3,6 8,10"/>
  </svg>
</div>

<!-- 右箭头 28×28 -->
<div style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#555555" stroke-width="1.5">
    <polyline points="4,2 9,6 4,10"/>
  </svg>
</div>
```

---

## 6. 布局模式

### 6.1 左右分栏（器灵选择式）

```
┌──────────────────────────────────────────────┐
│  左侧固定 480px    │     右侧弹性填充         │
│                    │                          │
│   器灵插图占位     │   标题 + 分割线           │
│   (320×400)       │   描述文字                │
│                    │                          │
│   器灵名称         │   道具槽位区              │
│                    │   技能槽位区              │
│                    │                          │
│                    │   底部：卡片轮播 + 按钮    │
└──────────────────────────────────────────────┘
```

```html
<main style="position:absolute; inset:0; z-index:3; display:flex;">
  <!-- 左侧 -->
  <aside style="width:480px; height:100%; display:flex; flex-direction:column;
    align-items:center; justify-content:center; padding:60px 40px;">
    <!-- 插图 + 名称 -->
  </aside>
  <!-- 右侧 -->
  <section style="flex:1; height:100%; display:flex; flex-direction:column;
    justify-content:center; padding:60px 60px 60px 0;">
    <!-- 标题 + 分割线 + 描述 + 槽位区 + 底部按钮 -->
  </section>
</main>
```

### 6.2 居中面板（弹窗式）

```html
<main style="position:absolute; inset:0; z-index:3;
  display:flex; align-items:center; justify-content:center;">
  <div style="width:520px; padding:48px; background:#1a1a1e;
    border:1px solid #3a3a3a; border-radius:8px;
    box-shadow:0 4px 24px rgba(0,0,0,0.6);">
    <!-- 面板内容 -->
  </div>
</main>
```

---

## 7. 交互状态速查

| 状态 | 边框 | 背景 | 文字色 | 光标 | 其他 |
|------|------|------|--------|------|------|
| **正常** | `#3a3a3a` / `#444444` | `#1e1e1e` / `#222222` | `#aaaaaa` | pointer | — |
| **选中** | `#cccccc` | `#1e1e1e` | `#e0e0e0` | pointer | 可选加光晕 |
| **锁定** | `1px dashed #2a2a2a` | `#121212` | `#555555` | not-allowed | opacity:0.4~0.5 |
| **空槽** | `1px dashed #2a2a2a` | `#1a1a1a` | `#444444` | default | + 号 SVG |
| **按钮禁用** | 无 | `#333333` | `#666666` | not-allowed | opacity:0.5 |

---

## 8. 使用指南

### 8.1 新建一个原型

1. 复制第 2 节的「标准骨架」代码
2. 修改 `<title>` 为界面名称
3. 在 `<main>` 中按第 6 节选择布局模式
4. 从第 5 节复制需要的组件代码，替换占位文字
5. 在浏览器中打开 HTML 文件查看效果

### 8.2 与组件库的配合

- 如需更多组件或 class 版代码，参考 [开仙门-UI组件库.html](../../../ui-prototypes/开仙门-UI组件库.html)
- class 版代码适合在组件库页面内预览，但策划案原型用内联版更可靠

### 8.3 @pixso 注释（可选但推荐）

如果原型后续可能导入 Pixso，建议加上 `<!-- @pixso LayerName -->` 注释：

```html
<!-- @pixso SpiritSelectUi -->
<section style="...">
  <!-- @pixso Bg -->
  <div style="..."></div>
  <!-- @pixso Root -->
  <main style="...">
    <!-- @pixso TitleText -->
    <p style="...">选择器灵</p>
  </main>
</section>
```

### 8.4 规范的维护

- 本规范是策划案场景的**子集**。新增组件的完整版先在 [开仙门-UI设计规范.md](../../../美术制作/开仙门-UI设计规范.md) 中定义，再以精简内联版同步到本规范
- 色值、字号、组件尺寸的修改需要同时更新本规范 MD + HTML 两份文件

---

## 附录 A：快速参考卡

### 色值速查

```
背景: #141416 / #1a1a1a / #1e1e1e / #222222 / #252525
文字: #e0e0e0 / #aaaaaa / #888888 / #777777 / #555555
边框: #cccccc(选中) / #3a3a3a(默认) / #2a2a2a(虚线)
品质: #bb9966(传说) / #9977bb(史诗) / #6699bb(稀有) / #777777(普通)
状态: #4ecca3(绿) / #ccaa44(黄) / #cc4444(红)
按钮: #cccccc(可用底) / #1a1a1a(可用字) / #333333(禁用底) / #666666(禁用字)
```

### 组件尺寸速查

```
按钮 主:200×48  次:160×40  小:120×32
槽位 道具:72×72  技能:200×56
卡片 缩略:120×72  大:240×320
进度条 HP面板:200×12  HP头顶:120×8  EXP:200×8
分割线 48×2 / 60×2
箭头 28×28
品质圆点 6×6
插图占位 320×400
```

### 字号速查

```
28px → 大标题    16px → 按钮字    13px → 正文
12px → 标签      11px → 说明      10px → 小字      9px → 微字
```

### 字间距速查

```
6px → 大标题/主按钮    4px → 名称    2px → 标签/英文
```

---

## 附录 B：相关文档索引

| 文档 | 路径 |
|------|------|
| UI 设计规范（完整 Token + 组件） | [开仙门-UI设计规范.md](../../../美术制作/开仙门-UI设计规范.md) |
| UI 组件库（class 版渲染） | [开仙门-UI组件库.html](../../../ui-prototypes/开仙门-UI组件库.html) |
| 本规范 HTML 视觉指南 | [HTML原型设计规范.html](./HTML原型设计规范.html) |
| 原型起始模板 | [_template.html](../../../ui-prototypes/_template.html) |
| 功能规划文档模板 | [功能规划文档模板.md](../模板/功能规划文档模板.md) |
| 功能需求文档模板 | [功能需求文档模板.md](../模板/功能需求文档模板.md) |

---

> **版本历史**
> - v1.0 (2026-07-28)：初版，以器灵选择.html 为基准，覆盖色彩/字体/10 种组件/2 种布局/交互状态速查
