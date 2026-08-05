---
component: screen-header
category: layout
variants: [with-back, with-action]
tokens: [bg, ink, muted, rule, font-heading, radius-sm, dur-fast, ease-out]
---

# 页面标题栏 (Screen Header)

## 规格

| 属性 | 值 |
|------|-----|
| 高度 | 56px |
| 左侧 | 返回按钮 `‹` (热区 44×44) |
| 中部 | 页面标题 (18px Bold) |
| 右侧 | 可选操作按钮 |

## 代码

```html
<div class="screen-header">
  <button class="sh-back">‹</button>
  <h2 class="sh-title">页面标题</h2>
  <button class="sh-action">编辑</button>
</div>
```

```css
.screen-header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 var(--space-4);
  background: var(--bg);
  border-bottom: 1px solid var(--rule);
  flex-shrink: 0;
  gap: var(--space-3);
}

.sh-back {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: var(--ink);
  border: none; background: none; cursor: pointer;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  margin-left: -8px;
}
.sh-back:hover { background: var(--bg-3); }

.sh-title {
  flex: 1;
  font-family: var(--font-heading);
  font-size: 18px; font-weight: 700;
  color: var(--ink);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sh-action {
  font-family: var(--font-heading);
  font-size: 13px; font-weight: 600;
  color: var(--accent);
  border: none; background: none; cursor: pointer;
  padding: 8px 12px; border-radius: var(--radius-sm);
  white-space: nowrap;
  flex-shrink: 0;
}
.sh-action:hover { background: var(--bg-3); }
```
