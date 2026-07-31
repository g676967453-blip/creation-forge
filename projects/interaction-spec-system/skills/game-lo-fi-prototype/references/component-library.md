# 游戏 UI 组件清单 (Component Library)

> 低保真原型可用的标准组件模板。所有组件用 HTML + inline CSS 实现，零依赖。

---

## 一、屏幕级容器

### 1.1 全屏页面模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=750, initial-scale=1.0">
<title>[屏幕名] - 低保真原型</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --lo-ink: #222; --lo-fill: #E0E0E0; --lo-muted: #999; --lo-bg: #FAFAFA;
    --lo-space-sm: 8px; --lo-space-md: 16px; --lo-space-lg: 24px; --lo-space-xl: 32px;
  }
  body {
    width: 750px; min-height: 1334px; margin: 0 auto;
    background: var(--lo-bg);
    font-family: 'Courier New', monospace;
  }
  /* ↓ 在此填入组件样式 ↓ */
</style>
</head>
<body>
  <!-- ↓ 在此填入页面内容 ↓ -->
</body>
</html>
```

---

## 二、HUD 组件（战斗中常驻信息）

### 2.1 顶部信息栏

```html
<!-- tr: none -->
<div style="
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--lo-space-md) var(--lo-space-lg);
  border-bottom: 2px solid var(--lo-ink);
  height: 64px;
">
  <span style="font-size: 24px;">⚔ [关卡 3/10]</span>
  <span style="font-size: 24px;">❤ [生命: 80/100]</span>
  <span style="font-size: 24px;">💰 [金币: 250]</span>
</div>
```

### 2.2 底部操作栏

```html
<div style="
  position: fixed; bottom: 0; width: 750px;
  display: flex; gap: var(--lo-space-md);
  padding: var(--lo-space-md) var(--lo-space-lg);
  padding-bottom: 40px; /* 底部安全区 */
  border-top: 2px solid var(--lo-ink);
  background: var(--lo-bg);
">
  <button class="lo-btn" style="flex:1;">[技能 A]</button>
  <button class="lo-btn" style="flex:1;">[技能 B]</button>
  <button class="lo-btn" style="flex:2;">[攻击]</button>
</div>
```

---

## 三、菜单组件

### 3.1 标题画面

```html
<div style="
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 1334px; gap: var(--lo-space-xl);
">
  <!-- 游戏标题 -->
  <div style="
    border: 4px solid var(--lo-ink); padding: var(--lo-space-xl) 64px;
    text-align: center;
  ">
    <div style="font-size: 48px; font-weight: bold;">[游戏标题]</div>
    <div style="font-size: var(--lo-text-base); color: var(--lo-muted);
                margin-top: var(--lo-space-sm);">
      [副标题占位]
    </div>
  </div>

  <!-- 菜单按钮组 -->
  <div style="display: flex; flex-direction: column; gap: var(--lo-space-md);
              width: 320px;">
    <button class="lo-btn" autofocus>开始游戏 [↓→继续, →→设置]</button>
    <button class="lo-btn">继续游戏 [↑开始, ↓设置]</button>
    <button class="lo-btn">设置 [↑继续, ↓退出]</button>
    <button class="lo-btn" style="margin-top: var(--lo-space-xl);">退出游戏</button>
  </div>
</div>
```

### 3.2 设置面板（弹窗叠加）

```html
<!-- 遮罩层 -->
<div style="
  position: fixed; inset: 0; background: rgba(250,250,250,0.8);
  display: flex; align-items: center; justify-content: center;
">
  <!-- 面板 -->
  <div style="
    width: 560px; border: 2px solid var(--lo-ink); border-radius: 4px;
    background: var(--lo-bg); padding: var(--lo-space-lg);
  ">
    <div style="font-size: var(--lo-text-lg); border-bottom: 2px solid var(--lo-ink);
                padding-bottom: var(--lo-space-sm); margin-bottom: var(--lo-space-md);">
      [设置]
    </div>

    <!-- 设置项 -->
    <div style="display: flex; justify-content: space-between; align-items: center;
                padding: var(--lo-space-sm) 0; border-bottom: 1px dashed var(--lo-muted);">
      <span>[音效音量]</span>
      <span style="color: var(--lo-muted);">[████████░░] 80%</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center;
                padding: var(--lo-space-sm) 0; border-bottom: 1px dashed var(--lo-muted);">
      <span>[音乐音量]</span>
      <span style="color: var(--lo-muted);">[██████░░░░] 60%</span>
    </div>

    <!-- 底部按钮 -->
    <div style="display: flex; gap: var(--lo-space-md); justify-content: flex-end;
                margin-top: var(--lo-space-lg);">
      <button class="lo-btn">[返回]</button>  <!-- 焦点回到触发按钮 -->
    </div>
  </div>
</div>
```

---

## 四、列表组件

### 4.1 纵向滚动列表

```html
<div style="
  border: 2px solid var(--lo-ink); border-radius: 4px;
  overflow-y: auto; max-height: 600px;
">
  <!-- 列表项 -->
  <div style="
    display: flex; align-items: center; gap: var(--lo-space-md);
    padding: var(--lo-space-md);
    border-bottom: 1px dashed var(--lo-muted);
  ">
    <div style="width: 64px; height: 64px; border: 2px solid var(--lo-muted);
                display: flex; align-items: center; justify-content: center;
                color: var(--lo-muted); font-size: 12px;">
      [图]
    </div>
    <div style="flex:1;">
      <div style="font-size: var(--lo-text-base);">[列表项标题]</div>
      <div style="font-size: 12px; color: var(--lo-muted);">[描述文字占位]</div>
    </div>
    <span style="color: var(--lo-muted);">→</span>
  </div>
  <!-- ... 更多列表项 ... -->
</div>
```

### 4.2 网格布局（背包/卡片选择）

```html
<!-- tr: none -->
<div style="
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: var(--lo-space-md); padding: var(--lo-space-md);
">
  <!-- 格子 -->
  <div style="
    aspect-ratio: 3/4; border: 2px solid var(--lo-ink); border-radius: 4px;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; cursor: pointer;
  ">
    <div style="width: 80%; height: 60%; border: 2px dashed var(--lo-muted);
                display: flex; align-items: center; justify-content: center;
                color: var(--lo-muted); font-size: 12px;">
      [卡面]
    </div>
    <div style="margin-top: var(--lo-space-sm); font-size: 14px;">[卡名]</div>
  </div>
  <!-- ... 更多格子（共 6 个占示例） -->
</div>
```

---

## 五、弹窗/对话框

### 5.1 确认弹窗

```html
<!-- 遮罩 + 弹窗 -->
<div style="
  position: fixed; inset: 0; background: rgba(250,250,250,0.85);
  display: flex; align-items: center; justify-content: center;
">
  <div style="
    width: 480px; border: 2px solid var(--lo-ink); border-radius: 4px;
    background: var(--lo-bg); padding: var(--lo-space-lg);
    text-align: center;
  ">
    <div style="font-size: var(--lo-text-lg); margin-bottom: var(--lo-space-md);">
      [确认操作？]
    </div>
    <div style="color: var(--lo-muted); margin-bottom: var(--lo-space-lg);">
      ～～～～～～～～～～～～
    </div>
    <div style="display: flex; gap: var(--lo-space-md);">
      <button class="lo-btn" style="flex:1;">取消</button>
      <button class="lo-btn" style="flex:1; background: var(--lo-fill);">确认</button>
    </div>
  </div>
</div>
```

### 5.2 Toast 提示

```html
<!-- 底部浮出提示 -->
<div style="
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  border: 2px dashed var(--lo-ink); padding: var(--lo-space-sm) var(--lo-space-lg);
  background: var(--lo-bg); font-size: var(--lo-text-base);
">
  [操作成功]
</div>
```

---

## 六、状态显示组件

### 6.1 进度条 / 血条

```html
<div style="display: flex; align-items: center; gap: var(--lo-space-sm);">
  <span style="font-size: 14px; width: 40px;">HP</span>
  <div style="flex:1; height: 16px; border: 2px solid var(--lo-ink); border-radius: 2px;">
    <div style="width: 70%; height: 100%; background: var(--lo-fill);"></div>
  </div>
  <span style="font-size: 14px; width: 60px; text-align: right;">70/100</span>
</div>
```

### 6.2 标签/徽章

```html
<span style="
  display: inline-block; border: 2px solid var(--lo-ink); border-radius: 4px;
  padding: 2px 8px; font-size: 12px;
">传说</span>

<span style="
  display: inline-block; border: 2px dashed var(--lo-muted); border-radius: 4px;
  padding: 2px 8px; font-size: 12px; color: var(--lo-muted);
">已装备</span>
```

### 6.3 Tab 切换栏

```html
<div style="display: flex; border-bottom: 2px solid var(--lo-ink);">
  <button class="lo-btn" style="border-bottom: none; border-radius: 4px 4px 0 0;
    background: var(--lo-fill);">[标签 A]</button>
  <button class="lo-btn" style="border-bottom: none; border-radius: 0;">[标签 B]</button>
  <button class="lo-btn" style="border-bottom: none; border-radius: 0;">[标签 C]</button>
</div>
```

---

## 七、组件索引

| 组件 | 适用场景 | 变体 |
|------|----------|------|
| 顶部信息栏 | HUD 常驻数值（金币/体力/关卡） | 左/中/右 三种布局 |
| 底部操作栏 | 战斗技能按钮、主CTA | 2~4 按钮等分 |
| 标题画面 | 主菜单入口 | 居中/偏上 |
| 设置面板 | 音量/操控/账号等选项 | 弹窗叠加式 |
| 纵向列表 | 关卡选择、背包、图鉴 | 单行/双行信息 |
| 网格布局 | 卡片背包、装备栏 | 2~4 列 |
| 确认弹窗 | 删除/购买/退出确认 | 单按钮/双按钮 |
| Toast 提示 | 操作结果反馈 | 成功/失败/警告 |
| 进度条 | 血条/经验条/加载条 | 水平/圆形 |
| 标签/徽章 | 品质/状态标注 | 实线/虚线 |
| Tab 栏 | 多分类内容切换 | 顶部/底部 |
