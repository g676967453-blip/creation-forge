---
component: event-banner
category: game
tokens: [q-epic, q-epic-bg, ink, muted, danger, radius-md, font-heading, font-mono, dur-fast, ease-out]
---

# 活动横幅 (Event Banner)

## 规格

| 属性 | 值 |
|------|-----|
| 底色 | `--q-epic-bg` + 品质色边框 |
| 布局 | 图标 + 信息 + 倒计时 |

## 代码

```html
<div class="event-banner">
  <div class="ev-icon">🎉</div>
  <div class="ev-info">
    <div class="ev-title">限时召唤 · 龙焰降临</div>
    <div class="ev-desc">传说品质出现率 UP！</div>
  </div>
  <div class="ev-time">23:59:59</div>
</div>
```

```css
.event-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: linear-gradient(135deg, var(--q-epic-bg), rgba(24,100,171,0.04));
  border: 1px solid rgba(103,65,217,0.15);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.event-banner:hover { border-color: rgba(103,65,217,0.3); }

.ev-icon { font-size: 24px; flex-shrink: 0; }
.ev-info { flex: 1; min-width: 0; }
.ev-title { font-size: 13px; font-weight: 700; font-family: var(--font-heading); color: var(--ink); }
.ev-desc { font-size: 10px; color: var(--muted); margin-top: 1px; }
.ev-time {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 700;
  color: var(--danger);
  white-space: nowrap;
  flex-shrink: 0;
}
```
