---
component: quick-actions
category: game
tokens: [bg-2, bg-3, ink-2, rule, ink, radius-md, font-heading, dur-fast, ease-out]
layout: 4列网格
---

# 快捷入口 (Quick Actions)

## 规格

| 属性 | 值 |
|------|-----|
| 布局 | `grid-template-columns: repeat(4, 1fr)` |
| 图标 | 36×36 圆角方块 `--bg-3` 底 |
| 标签 | 10px 粗体 |

## 代码

```html
<div class="quick-actions">
  <div class="quick-action">
    <div class="qa-icon">⚔</div>
    <span class="qa-label">战斗</span>
  </div>
  <div class="quick-action">
    <div class="qa-icon">🏪</div>
    <span class="qa-label">商店</span>
  </div>
  <div class="quick-action">
    <div class="qa-icon">✨</div>
    <span class="qa-label">召唤</span>
  </div>
  <div class="quick-action">
    <div class="qa-icon">🏆</div>
    <span class="qa-label">竞技</span>
  </div>
</div>
```

```css
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-2);
  background: var(--bg-2);
  border: 1px solid var(--rule);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.quick-action:hover { border-color: var(--ink-2); background: var(--bg-3); }

.qa-icon {
  font-size: 22px;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--bg-3);
}
.qa-label {
  font-size: 10px; font-weight: 600;
  color: var(--ink-2);
  font-family: var(--font-heading);
}
```
