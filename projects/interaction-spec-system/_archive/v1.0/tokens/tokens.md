# Design Token 参考

> 🤖 AI 可读的 Token 速查表。生成新项目的 CSS/组件/原型时，从此文件读取变量定义。

## 使用方式

```html
<link rel="stylesheet" href="tokens/base.css">
```

或在生成自包含 HTML 时，将 `base.css` 内容内联到 `<style>` 标签中。

## Token 速查

### 背景色阶

| Token | 色值 | 用途 |
|-------|------|------|
| `--bg` | `#FFFFFF` | 页面底色 |
| `--bg-2` | `#F8F9FA` | 卡片/面板背景 |
| `--bg-3` | `#F1F3F5` | 次级背景 / hover 态 |
| `--bg-4` | `#E9ECEF` | 禁用态 / 骨架屏 |

### 文字色阶

| Token | 色值 | 用途 |
|-------|------|------|
| `--ink` | `#212529` | 标题 / 主要文字 |
| `--ink-2` | `#343A40` | 正文 |
| `--muted` | `#868E96` | 次要文字 / 辅助说明 |
| `--muted-2` | `#ADB5BD` | placeholder / 更弱文字 |

### 品牌色

| Token | 默认值 | 用途 |
|-------|--------|------|
| `--accent` | `#c8964a` | 品牌主色（按钮/选中态/链接） |
| `--accent-hover` | `#b8833e` | hover 态（自动 darken ~10%） |
| `--accent-pressed` | `#a07032` | 按下态（自动 darken ~20%） |
| `--accent-bg` | `rgba(200,150,74,0.08)` | 品牌色浅底 |
| `--on-accent` | `#FFFFFF` | 品牌色上的文字色 |

### 功能色

| Token | 色值 | 语义 |
|-------|------|------|
| `--success` | `#3ca374` | 成功/正向 |
| `--warning` | `#e67700` | 警告/提醒 |
| `--danger` | `#c92a2a` | 危险/错误/删除 |
| `--info` | `#1864ab` | 信息/链接 |

每个功能色有对应的 `-bg` 浅色背景变量。

### 品质色 (RPG)

| Token | 色值 | 品质 |
|-------|------|------|
| `--q-common` | `#868E96` | 普通 |
| `--q-rare` | `#1864AB` | 稀有 |
| `--q-epic` | `#6741D9` | 史诗 |
| `--q-legendary` | `#E67700` | 传说 |
| `--q-myth` | `#C92A2A` | 神话 |

每个品质色有对应的 `-bg` 浅色背景变量。

### 间距 (8px 基线)

| Token | 值 | 网格单位 | 用途 |
|-------|-----|---------|------|
| `--space-1` | 4px | 0.5gu | 极小间距（图标-文字） |
| `--space-2` | 8px | 1gu | 组件内紧凑间距 |
| `--space-3` | 12px | 1.5gu | 组件内标准间距 |
| `--space-4` | 16px | 2gu | 标准组件间距 |
| `--space-5` | 24px | 3gu | 区块间距 |
| `--space-6` | 32px | 4gu | 大区块间距 |
| `--space-7` | 48px | 6gu | 页面级留白 |
| `--space-8` | 64px | 8gu | 页眉/页脚留白 |

### 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-xs` | 2px | 极小元素 |
| `--radius-sm` | 4px | 按钮/输入框/标签 |
| `--radius-md` | 8px | 卡片/面板 |
| `--radius-lg` | 12px | 弹窗/大卡片 |
| `--radius-xl` | 16px | 手机框/大面板 |
| `--radius-full` | 9999px | 药丸形状/圆形 |

### 阴影

| Token | 用途 |
|-------|------|
| `--shadow-xs` | 极浅（分隔线替代） |
| `--shadow-sm` | 卡片悬浮 |
| `--shadow-md` | 下拉菜单/浮层 |
| `--shadow-lg` | 弹窗 |
| `--shadow-xl` | 模态框/抽屉 |
| `--shadow-modal` | 最顶层弹窗 |
| `--shadow-glow-accent` | 选中态品牌色发光 |

### z-index

| Token | 值 | 层级 |
|-------|-----|------|
| `--z-base` | 0 | 内容层 |
| `--z-hud` | 100 | HUD/顶栏/底栏 |
| `--z-panel` | 200 | 面板/抽屉 |
| `--z-modal` | 300 | 弹窗/遮罩 |
| `--z-modal-high` | 400 | 弹窗上的弹窗 |
| `--z-top` | 500 | 全局最顶层 |

### Motion

| Token | 值 |
|-------|-----|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `--dur-instant` | `100ms` |
| `--dur-fast` | `200ms` |
| `--dur-base` | `300ms` |
| `--dur-slow` | `500ms` |

### 字体

| Token | 值 |
|-------|-----|
| `--font-heading` | 系统中文字体栈（标题用） |
| `--font-body` | 系统中文字体栈（正文用） |
| `--font-mono` | 等宽字体栈（代码/数值用） |

### 排版预设

| Token | 对应 |
|-------|------|
| `--text-display` | 28px Bold — 大标题/结算 |
| `--text-h1` | 22px Bold — 页面标题 |
| `--text-h2` | 18px SemiBold — 分区标题 |
| `--text-body` | 14px Regular — 正文 |
| `--text-label` | 12px Medium — 标签/按钮 |
| `--text-caption` | 11px Regular — 辅助说明 |
| `--text-small` | 10px Regular — 角标/极小文字 |

### 游戏 HUD 专用

| Token | 默认值 | 用途 |
|-------|--------|------|
| `--hud-height` | 64px | 顶栏高度 |
| `--dock-height` | 72px | 底部导航高度 |
| `--safe-top` | 44px | 顶部安全区 |
| `--safe-bottom` | 34px | 底部安全区 |

---

## 颜色注入规则

`base.css` 中的品牌色和品质色是默认值。通过 YAML frontmatter 注入时，替换以下映射：

| YAML 参数 | 替换的 CSS 变量 |
|-----------|----------------|
| `color_primary` | `--accent`, `--accent-hover`(darken 10%), `--accent-pressed`(darken 20%), `--accent-bg`(alpha 0.08) |
| `color_success` | `--success`, `--success-bg` |
| `color_warning` | `--warning`, `--warning-bg` |
| `color_danger` | `--danger`, `--danger-bg` |
| `color_info` | `--info`, `--info-bg` |
| `rarity_colors.common` | `--q-common`, `--q-common-bg` |
| `rarity_colors.rare` | `--q-rare`, `--q-rare-bg` |
| `rarity_colors.epic` | `--q-epic`, `--q-epic-bg` |
| `rarity_colors.legendary` | `--q-legendary`, `--q-legendary-bg` |

## 间距铁律

- 所有尺寸、间距必须是 **8 的倍数**
- 最小触控热区 ≥ **44×44px**（画布 720 下的最小值）
- 主 CTA 按钮：宽 ≥ **280px**，高 ≥ **52px**
- 按钮间距 ≥ **16px**
