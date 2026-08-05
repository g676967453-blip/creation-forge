---
component: item-frame
category: game
variants: [common, rare, epic, legendary]
sizes: [lg:96, md:72, sm:48]
states: [filled, empty, locked, equipped]
tokens: [q-common, q-rare, q-epic, q-legendary, accent, radius-sm, font-mono, dur-fast, ease-out]
---

# 道具框 (Item Frame)

## 规格

| 规格 | 尺寸 | 边框 |
|------|------|------|
| 大框 | 96×96 | 3px 品质色 |
| 标准框 | 72×72 | 2px 品质色 |
| 小框 | 48×48 | 2px 品质色 |

## 代码

```html
<div class="item-frame item-frame-rare item-frame-equipped">
  <div class="if-icon">🗡</div>
  <div class="if-equipped-mark">E</div>
  <div class="if-qty">x99</div>
</div>

<div class="item-frame item-frame-empty"></div>
<div class="item-frame item-frame-locked">🔒</div>
```

```css
.item-frame {
  width: 72px; height: 72px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.item-frame:hover { transform: scale(1.05); }

/* 品质 */
.item-frame-common { border: 2px solid var(--q-common); background: var(--q-common-bg); }
.item-frame-rare { border: 2px solid var(--q-rare); background: var(--q-rare-bg); }
.item-frame-epic { border: 2px solid var(--q-epic); background: var(--q-epic-bg); }
.item-frame-legend { border: 2px solid var(--q-legendary); background: var(--q-legendary-bg); }

/* 状态 */
.item-frame-empty { border: 2px dashed var(--rule-2); background: var(--bg-3); opacity: 0.5; cursor: default; }
.item-frame-locked { border: 2px dashed var(--rule-2); opacity: 0.3; cursor: not-allowed; }
.item-frame-selected { border-color: var(--accent); box-shadow: var(--shadow-glow-accent); }

/* 内部 */
.if-icon { font-size: 28px; }
.if-qty {
  position: absolute; bottom: 2px; right: 2px;
  font-family: var(--font-mono); font-size: 11px; font-weight: 700;
  color: #fff; background: rgba(0,0,0,0.55);
  padding: 1px 4px; border-radius: 2px; line-height: 1.3;
}
.if-equipped-mark {
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px;
  background: var(--accent); color: #fff;
  border-radius: 2px;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

/* 尺寸 */
.item-frame-lg { width: 96px; height: 96px; }
.item-frame-sm { width: 48px; height: 48px; }
.item-frame-sm .if-icon { font-size: 20px; }
```
