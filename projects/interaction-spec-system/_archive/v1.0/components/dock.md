---
component: dock
category: layout
variants: [standard, with-center-cta, with-badge]
tokens: [bg, rule, ink, muted, accent, on-accent, danger, font-heading, font-mono, radius-sm, radius-full, shadow-md, shadow-lg, dur-fast, ease-out]
---

# 底部导航 (Dock)

## 规格

| 属性 | 值 |
|------|-----|
| 高度 | 72px |
| 内容区 | `justify-content: space-around` |
| 中间突出按钮 | 48×48 圆形，`--accent` 底，margin-top: -18px |

## 代码

```html
<nav class="dock">
  <button class="dock-item active">
    <span class="dock-icon">🏠</span>
    <span class="dock-label">主页</span>
  </button>
  <button class="dock-item">
    <span class="dock-icon">👥</span>
    <span class="dock-label">英雄</span>
    <span class="dock-badge">3</span>
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
</nav>
```

```css
.dock {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 6px 8px 12px;
  background: var(--bg);
  border-top: 1px solid var(--rule);
  flex-shrink: 0;
  z-index: var(--z-hud);
  position: relative;
  height: 72px;
}

.dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  position: relative;
  padding: 4px 10px;
  min-width: 52px;
  border-radius: var(--radius-sm);
  border: none;
  background: none;
  font-family: inherit;
  transition: all var(--dur-fast) var(--ease-out);
}
.dock-item:hover { background: var(--bg-3); }
.dock-item.active .dock-icon,
.dock-item.active .dock-label { color: var(--accent); }

.dock-icon { font-size: 20px; line-height: 1; }
.dock-label { font-size: 10px; font-weight: 600; color: var(--muted); font-family: var(--font-heading); }

/* 红点与角标 */
.dock-dot {
  position: absolute; top: 2px; right: 6px;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--danger);
  border: 1px solid var(--bg);
}
.dock-badge {
  position: absolute; top: -2px; right: -2px;
  min-width: 15px; height: 15px;
  border-radius: 8px;
  background: var(--danger); color: var(--bg);
  font-size: 9px; font-weight: 700;
  font-family: var(--font-mono);
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
  border: 1px solid var(--bg);
}

/* 中间突出 CTA */
.dock-cta {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: var(--accent); color: var(--on-accent);
  font-size: 24px;
  display: flex; align-items: center; justify-content: center;
  margin-top: -18px;
  border: 3px solid var(--bg);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.dock-cta:hover { transform: scale(1.08); box-shadow: var(--shadow-lg); }
```
