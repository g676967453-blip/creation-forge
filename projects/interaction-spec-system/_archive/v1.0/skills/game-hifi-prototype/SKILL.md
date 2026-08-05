---
name: game-hifi-prototype
description: >
  制作游戏高保真交互原型 — 基于 interaction-spec-system 组件库，快速组装可点击的多屏手机游戏原型。五步工作流：选择平台 → 配置屏幕 → 组装组件 → 生成原型 → 走查清单。输出 720×1280 自包含 HTML，浏览器直接预览。
  trigger: 用户说出「高保真原型」「交互原型」「可点击原型」「hifi prototype」或明确要求制作可交互的游戏 UI 原型。
  do NOT trigger on: 低保真线框图请求（→ game-lo-fi-prototype）、纯视觉设计讨论、代码实现讨论。
license: Apache-2.0
compatibility: 引擎无关。输出 HTML/CSS/JS（零依赖，浏览器可预览）。依赖 interaction-spec-system 组件库。
metadata:
  engine: none
  category: prototyping
  difficulty: intermediate
  status: active
---

# 游戏高保真交互原型 (Game Hi-Fi Interactive Prototype)

用 interaction-spec-system 的组件库快速组装可点击走通的多屏游戏原型。720×1280 竖版手机框，含 HUD、Dock 导航、屏幕切换、弹窗系统。

---

## 何时使用

- 用户说"做一个可交互原型"/"高保真原型"/"手机游戏原型"
- 用户需要验证多屏流转 + 组件交互的完整流程
- 低保真原型走查通过后，进入高保真阶段
- 用户需要一个可以演示给团队的交互式原型

**何时不使用**：
- 用户要线框图 → 触发 `game-lo-fi-prototype`
- 用户要单个组件 → 直接引用 `components/*.md`
- 用户要规范文档 → 使用 `build-interaction-spec.ts`

---

## 五步工作流

### ① 选择平台与画布

**默认：竖版手游 720×1280**

如需调整，告知用户当前只支持竖版 720×1280（其他平台预设待扩展）。

### ② 配置屏幕清单

和用户确认需要哪些屏幕。从常用模式中选择：

| 屏幕 ID | 名称 | 适用场景 |
|---------|------|---------|
| home | 主页 | 大厅/主界面 |
| heroes | 英雄列表 | 角色选择 |
| detail | 详情 | 角色/物品详情 |
| battle | 战斗 | 战斗界面 |
| bag | 背包 | 道具仓库 |
| shop | 商店 | 商城 |
| summon | 召唤 | 抽卡 |
| arena | 竞技场 | PvP |
| guild | 公会 | 社交 |
| mail | 邮件 | 消息 |
| settings | 设置 | 配置 |

**产出**：屏幕 ID 列表 + 每屏的核心内容描述

### ③ 为每屏选配组件

从组件库中选择组件填入每屏。参考 `references/component-catalog.md`。

常用组合：
- **Home**: `event-banner` + `quick-actions` + `quest-card`
- **Heroes**: `sort-bar` + `tab` + `hero-card` (grid)
- **Detail**: `hero-card` + `progress-bar` + `item-frame` + `skill-frame` + `tooltip`
- **Bag**: `tab` + `item-frame` (grid)
- **Shop**: `quest-card` (as product list)
- **Settings**: `toggle` + `input` + `dialog`

直接使用组件的 HTML 代码块（从 `components/*.md` 读取），粘贴到对应屏幕中。

### ④ 生成原型

运行命令：
```bash
npx tsx tools/build-prototype.ts --config <配置JSON> --out dist/prototypes/<项目名>.html
```

或使用 `--demo` 生成内置 Demo 原型。

配置文件格式见下方「原型配置」。

### ⑤ 走查清单

在浏览器中打开生成的 HTML，逐项检查：

**屏幕流转**
- [ ] 每屏可通过 Dock 或按钮到达
- [ ] 每屏有返回路径（返回按钮或 Dock 切换）
- [ ] 弹窗可关闭，关闭后焦点回到触发按钮
- [ ] 无死胡同屏幕

**组件状态**
- [ ] 按钮有 hover/active 视觉反馈
- [ ] 卡片有 selected/locked 态展示
- [ ] 进度条颜色随数值变化（绿→黄→红）
- [ ] 技能框有冷却倒计时展示
- [ ] 道具框有 empty/locked/equipped 态

**视觉一致性**
- [ ] 所有屏幕使用相同的 CSS Token（无颜色偏差）
- [ ] 稀有度色彩贯穿一致（common/rare/epic/legendary）
- [ ] 间距为 8px 倍数
- [ ] 字体大小在 Token 定义的范围内

**交互完整性**
- [ ] Dock 按钮点击切换屏幕（有 active 态）
- [ ] 列表/网格内容区域可滚动
- [ ] 弹窗遮罩点击可关闭

---

## 原型配置格式

```json
{
  "title": "项目名",
  "canvas": "720×1280",
  "showHud": true,
  "screens": [
    {
      "id": "home",
      "name": "主页",
      "sections": [
        { "html": "<div>...</div>" }
      ]
    },
    {
      "id": "heroes",
      "name": "英雄列表",
      "sections": [
        { "type": "sort-bar" },
        { "html": "..." }
      ]
    }
  ],
  "dock": [
    { "id": "home", "label": "主页", "icon": "🏠" },
    { "id": "heroes", "label": "英雄", "icon": "👥", "badge": 3 },
    { "id": "battle", "label": "", "icon": "", "centerCta": true },
    { "id": "bag", "label": "背包", "icon": "🎒" },
    { "id": "shop", "label": "商店", "icon": "🏪" }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 原型标题 |
| `showHud` | boolean | 是否显示 HUD 顶栏 |
| `screens[]` | array | 屏幕列表 |
| `screens[].id` | string | 屏幕唯一 ID（用于路由） |
| `screens[].showHud` | boolean | 此屏是否显示 HUD（默认 true，战斗可设 false） |
| `sections[]` | array | 屏幕内容区块 |
| `sections[].type` | string | 组件名（从 components/ 查找，自动注入 HTML） |
| `sections[].html` | string | 直接 HTML（优先级高于 type） |
| `dock[]` | array | Dock 导航项 |
| `dock[].centerCta` | boolean | 中间突出 CTA 按钮 |

---

## 输出物

```
dist/prototypes/<项目名>.html   ← 自包含可交互原型
```

---

## 关键原则

1. **组件库是唯一数据源** — 不从零写 HTML，从 `components/*.md` 读取代码块组装
2. **Token 驱动** — 所有颜色/间距/字体从 `tokens/base.css` 读取
3. **先走通再美化** — 先确保所有屏幕能点击到达，再调整布局细节
4. **720×1280 唯一** — 当前只支持竖版 720×1280，不做多分辨率
5. **保持自包含** — 输出的 HTML 文件零依赖，双击浏览器即可预览
