---
component: card
category: basic
variants: [neutral, common, rare, epic, legendary, selected, locked]
tokens: [q-common, q-rare, q-epic, q-legendary, accent, radius-md, shadow-sm, shadow-glow-accent]
---

# 卡片 (Card)

## 规格

| 属性 | 值 |
|------|-----|
| 宽度 | 200~240px (竖版单卡) |
| 边框 | 2px 实线，按品质着色 |
| 圆角 | `--radius-md` (8px) |
| 内边距 | `--space-4` (16px) |

### 状态

| 状态 | 视觉表现 |
|------|---------|
| neutral | `--rule` 边框 + `--bg-2` 底色 |
| 品质卡 | 对应品质色边框 + 浅底色 |
| selected | `--accent` 金色边框 + `--shadow-glow-accent` |
| locked | 虚线边框 + 40% 透明度 + `🔒` 标记 |

## 代码

```html
<!-- 品质卡片 -->
<div class="card card-rare">
  <div class="card-badge badge badge-rare">稀有</div>
  <div class="card-art">🖼</div>
  <div class="card-name">物品名称</div>
  <div class="card-desc">简短描述文字</div>
</div>

<!-- 选中态 -->
<div class="card card-epic selected">
  <div class="card-badge badge badge-epic">史诗</div>
  <div class="card-art">🖼</div>
  <div class="card-name">物品名称</div>
</div>

<!-- 锁定态 -->
<div class="card card-legend locked">
  <div class="card-lock-icon">🔒</div>
  <div class="card-art">🖼</div>
  <div class="card-name">???</div>
</div>
```

```css
.card {
  background: var(--bg-2);
  border: 2px solid var(--rule);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  position: relative;
  transition: all var(--dur-fast) var(--ease-out);
  cursor: pointer;
  min-width: 120px;
}
.card:hover { border-color: var(--muted-2); transform: translateY(-2px); box-shadow: var(--shadow-sm); }

/* 品质边框 */
.card-common { border-color: var(--q-common); background: var(--q-common-bg); }
.card-rare { border-color: var(--q-rare); background: var(--q-rare-bg); }
.card-epic { border-color: var(--q-epic); background: var(--q-epic-bg); }
.card-legend { border-color: var(--q-legendary); background: var(--q-legendary-bg); }

/* 状态 */
.card.selected { border-color: var(--accent); box-shadow: var(--shadow-glow-accent); }
.card.locked { opacity: 0.4; border-style: dashed; cursor: not-allowed; filter: grayscale(0.4); }
.card.locked:hover { transform: none; box-shadow: none; }

.card-badge { position: absolute; top: 8px; left: 8px; }
.card-lock-icon { position: absolute; top: 8px; right: 8px; font-size: 14px; }
.card-art {
  width: 48px; height: 48px;
  background: var(--bg-3);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: var(--muted);
}
.card-name { font-size: 14px; font-weight: 700; color: var(--ink); text-align: center; }
.card-desc { font-size: 11px; color: var(--muted); text-align: center; line-height: 1.4; }
```
