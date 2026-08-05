---
component: tab
category: basic
variants: [top-tab, bottom-tab]
tokens: [accent, ink, muted, rule, font-heading, dur-fast, ease-out]
---

# 页签 (Tab)

## 规格

| 类型 | 高度 | 选中态 | 位置 |
|------|------|--------|------|
| 顶部 Tab | 44px | 底部 2px `--accent` 指示线 | 导航栏下方 |
| 底部 Tab | 80~100px | 图标 + 文字变 `--accent` | 屏幕底部 |

## 代码

```html
<!-- 顶部 Tab -->
<div class="tab-row">
  <button class="tab active">全部</button>
  <button class="tab">武器</button>
  <button class="tab">防具</button>
  <button class="tab">道具</button>
</div>

<!-- 底部 Tab (含中间突出按钮) -->
<div class="tab-dock">
  <button class="dock-item active">
    <span class="dock-icon">🏠</span>
    <span class="dock-label">主页</span>
  </button>
  <button class="dock-item">
    <span class="dock-icon">👥</span>
    <span class="dock-label">英雄</span>
  </button>
  <button class="dock-cta">＋</button>
  <button class="dock-item">
    <span class="dock-icon">🎒</span>
    <span class="dock-label">背包</span>
  </button>
  <button class="dock-item">
    <span class="dock-icon">⚙</span>
    <span class="dock-label">设置</span>
  </button>
</div>
```

```css
/* 顶部 Tab */
.tab-row {
  display: flex;
  border-bottom: 1px solid var(--rule);
  flex-shrink: 0;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 13px;
  font-weight: 700;
  font-family: var(--font-heading);
  color: var(--muted);
  cursor: pointer;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all var(--dur-fast) var(--ease-out);
}
.tab:hover { color: var(--ink-2); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }

/* 底部 Dock */
.tab-dock {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 8px 12px;
  background: var(--bg);
  border-top: 1px solid var(--rule);
  height: 72px;
}
.dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: none;
  background: none;
  font-family: inherit;
  transition: all var(--dur-fast) var(--ease-out);
}
.dock-item:hover { background: var(--bg-3); }
.dock-icon { font-size: 20px; }
.dock-label { font-size: 10px; font-weight: 600; color: var(--muted); font-family: var(--font-heading); }
.dock-item.active .dock-icon { color: var(--accent); }
.dock-item.active .dock-label { color: var(--accent); }

/* 中间突出按钮 */
.dock-cta {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 24px;
  border: 3px solid var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-top: -18px;
  box-shadow: var(--shadow-md);
  transition: all var(--dur-fast) var(--ease-out);
}
.dock-cta:hover { transform: scale(1.08); box-shadow: var(--shadow-lg); }
```
