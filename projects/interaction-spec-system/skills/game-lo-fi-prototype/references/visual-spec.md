# 低保真视觉规范 (Lo-Fi Visual Spec)

> 本规范定义了游戏低保真交互原型的视觉语言。目标：**剥离一切色彩和装饰，只验证布局和交互**。

---

## 一、画布规范

| 参数 | 值 | 说明 |
|------|-----|------|
| 基准宽度 | 750px | 竖版手游基准宽度 |
| 基准高度 | 1334px | 对应 iPhone 6/7/8 比例 |
| 适配高度 | 1624px | 全面屏适配，内容区以中心锚点纵向拓展 |
| 缩放策略 | `max-width: 750px; margin: 0 auto;` | 浏览器预览时居中，不拉伸 |

```css
/* 所有原型文件的基础样式 */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  width: 750px;
  min-height: 1334px;
  margin: 0 auto;
  background: #FAFAFA;
  font-family: 'Courier New', 'Source Code Pro', 'Noto Sans SC', monospace;
  -webkit-font-smoothing: none;  /* 保持线框图锐利感 */
}
```

---

## 二、色彩系统

低保真原型严格使用 **4 色系统**，禁止引入任何其他颜色：

| Token | 色值 | 用途 | CSS 变量 |
|-------|------|------|----------|
| 线框黑 | `#222222` | 所有边框、文字、图标线条 | `--lo-ink` |
| 填充灰 | `#E0E0E0` | 组件背景填充、卡片底色 | `--lo-fill` |
| 强调灰 | `#999999` | 次要文字、虚线、分隔线、禁用态 | `--lo-muted` |
| 背景白 | `#FAFAFA` | 页面背景 | `--lo-bg` |

```css
:root {
  --lo-ink:   #222222;
  --lo-fill:  #E0E0E0;
  --lo-muted: #999999;
  --lo-bg:    #FAFAFA;
}
```

### 禁止使用的视觉元素

- ❌ 渐变（任何方向、任何颜色）
- ❌ 阴影（box-shadow / text-shadow）
- ❌ 圆角 > 4px
- ❌ 彩色（即使是品牌色也不行）
- ❌ 图片/图标（用占位符替代）
- ❌ 透明度/半透明效果

---

## 三、网格系统

所有元素对齐 **8px 基础网格**。

| 层级 | 值 | 用途 |
|------|-----|------|
| 基础单位 | 8px | 所有间距的基数 |
| xs | 4px | 极小间距（仅图标与文字之间） |
| sm | 8px | 组件内紧凑间距 |
| md | 16px | 标准组件间距 |
| lg | 24px | 区块间距 |
| xl | 32px | 大区块间距 |
| 2xl | 48px | 页面级留白 |
| 3xl | 64px | 页眉/页脚留白 |

```css
:root {
  --lo-space-xs:  4px;
  --lo-space-sm:  8px;
  --lo-space-md:  16px;
  --lo-space-lg:  24px;
  --lo-space-xl:  32px;
  --lo-space-2xl: 48px;
  --lo-space-3xl: 64px;
}
```

---

## 四、排版系统

**原则**：只用一种等宽字体，两个字号。

| Token | 字号 | 行高 | 用途 |
|-------|------|------|------|
| 标题 | 24px | 1.4 | 屏幕标题、对话框标题、大按钮文字 |
| 正文 | 16px | 1.6 | 所有正文、列表项、小按钮文字、标签 |

```css
:root {
  --lo-font-mono: 'Courier New', 'Source Code Pro', 'Noto Sans SC', monospace;
  --lo-text-lg: 24px;
  --lo-text-base: 16px;
  --lo-leading-lg: 1.4;
  --lo-leading-base: 1.6;
}
```

### 文字占位符规范

当内容未确定时，使用以下占位符：

| 占位类型 | 写法 | 示例 |
|----------|------|------|
| 短文本 | `[文字占位]` | 按钮文字、标签 |
| 长文本 | `～～～～～～～～` | 段落描述、对话文本 |
| 标题 | `[标题占位：XXX]` | 屏幕标题、卡片标题 |
| 数值 | `[数值]` | HUD 数值显示 |

---

## 五、线框组件基础样式

所有组件共享以下基础样式：

```css
/* 线框容器 */
.lo-box {
  border: 2px solid var(--lo-ink);
  border-radius: 4px;
  padding: var(--lo-space-md);
  background: var(--lo-bg);
}

/* 线框按钮 */
.lo-btn {
  border: 2px solid var(--lo-ink);
  border-radius: 4px;
  padding: var(--lo-space-sm) var(--lo-space-lg);
  font-family: var(--lo-font-mono);
  font-size: var(--lo-text-base);
  color: var(--lo-ink);
  background: var(--lo-bg);
  cursor: pointer;
  text-align: center;
  min-height: 48px;  /* 触控最低高度 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lo-btn:active {
  background: var(--lo-fill);  /* 按下反馈 */
}

.lo-btn[disabled] {
  border-color: var(--lo-muted);
  color: var(--lo-muted);
  cursor: not-allowed;
}

/* 线框输入/文本区 */
.lo-input {
  border: 2px solid var(--lo-ink);
  border-radius: 4px;
  padding: var(--lo-space-sm) var(--lo-space-md);
  font-family: var(--lo-font-mono);
  font-size: var(--lo-text-base);
  color: var(--lo-ink);
  background: var(--lo-bg);
  width: 100%;
}

/* 图片占位符（斜线填充） */
.lo-image-placeholder {
  border: 2px dashed var(--lo-muted);
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 4px,
    var(--lo-fill) 4px,
    var(--lo-fill) 8px
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lo-muted);
  font-size: var(--lo-text-base);
}

/* 图标占位符 */
.lo-icon-placeholder {
  border: 2px solid var(--lo-muted);
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--lo-muted);
  font-size: 12px;
}

/* 可点击区域标注（虚线框） */
.lo-clickable {
  outline: 2px dashed var(--lo-muted);
  outline-offset: 2px;
}

/* 选中/激活态 */
.lo-active {
  background: var(--lo-fill);
  border-color: var(--lo-ink);
}

/* 安全区标注 */
.lo-safe-area-top {
  border-bottom: 1px dashed var(--lo-muted);
  padding-bottom: var(--lo-space-sm);
  margin-bottom: var(--lo-space-sm);
  font-size: 12px;
  color: var(--lo-muted);
}

.lo-safe-area-bottom {
  border-top: 1px dashed var(--lo-muted);
  padding-top: var(--lo-space-sm);
  margin-top: var(--lo-space-sm);
  font-size: 12px;
  color: var(--lo-muted);
}
```

---

## 六、文件命名规范

```
{两位序号}-{屏幕名拼音小写}-lo-fi.html

示例：
01-kaitian-heimu-lo-fi.html        # 开场黑幕
02-qi-ling-xuanze-lo-fi.html       # 器灵选择
03-guanli-zhujiemian-lo-fi.html    # 经营主界面
```

每个文件自包含（inline CSS + 结构 HTML），零外部依赖，双击即可在浏览器预览。
