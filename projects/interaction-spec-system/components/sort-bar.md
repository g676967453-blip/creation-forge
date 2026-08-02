---
component: sort-bar
category: layout
tokens: [bg, ink, muted, rule, accent, on-accent, font-heading, radius-sm, dur-fast, ease-out]
---

# 排序栏 (Sort Bar)

## 规格

| 属性 | 值 |
|------|-----|
| 高度 | 40px |
| 按钮 | 圆角 `--radius-sm`，未选中 `--muted` 字，选中 `--accent` 底 + 白字 |

## 代码

```html
<div class="sort-bar">
  <button class="sort-btn active">全部</button>
  <button class="sort-btn">等级 ↑</button>
  <button class="sort-btn">稀有度</button>
  <button class="sort-btn">属性</button>
</div>
```

```css
.sort-bar {
  display: flex;
  gap: 6px;
  padding: 8px var(--space-4);
  border-bottom: 1px solid var(--rule);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.sort-bar::-webkit-scrollbar { display: none; }

.sort-btn {
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px; font-weight: 600;
  font-family: var(--font-heading);
  border: 1px solid var(--rule);
  background: var(--bg);
  cursor: pointer;
  color: var(--muted);
  white-space: nowrap;
  flex-shrink: 0;
  transition: all var(--dur-fast) var(--ease-out);
}
.sort-btn:hover { border-color: var(--ink-2); color: var(--ink-2); }
.sort-btn.active { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
```
