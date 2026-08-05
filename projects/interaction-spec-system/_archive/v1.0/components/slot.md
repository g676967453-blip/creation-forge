---
component: slot
category: basic
variants: [common, rare, epic, legendary, empty, locked, equipped]
sizes: [lg:96, md:72, sm:48]
tokens: [q-common, q-rare, q-epic, q-legendary, accent, radius-sm]
---

# 槽位 (Slot)

## 规格

| 规格 | 尺寸 | 边框 | 特征 |
|------|------|------|------|
| 大槽 | 96×96 | 3px 品质色 | 数量角标 16~18px |
| 标准槽 | 72×72 | 2px 品质色 | 数量角标 14~16px |
| 小槽 | 48×48 | 2px 品质色 | 无数量角标 |

### 状态

| 状态 | 视觉 |
|------|------|
| filled | 品质边框 + 图标 + 数量角标 |
| equipped | filled + 左上角 "E" 标记 |
| selected | 金色边框 + glow |
| empty | 虚线 + 50% 透明度 |
| locked | 虚线 + 40% 透明度 + 🔒 |

## 代码

```html
<!-- 标准槽 (已装备) -->
<div class="slot slot-rare slot-equipped">
  <div class="slot-icon">◆</div>
  <div class="slot-equipped-mark">E</div>
  <div class="slot-qty">x99</div>
</div>

<!-- 空槽 -->
<div class="slot slot-empty"></div>

<!-- 锁定槽 -->
<div class="slot slot-locked">🔒</div>

<!-- 选中态 -->
<div class="slot slot-epic slot-selected">
  <div class="slot-icon">⚡</div>
</div>
```

```css
.slot {
  width: 72px; height: 72px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all var(--dur-fast) var(--ease-out);
  cursor: pointer;
  flex-shrink: 0;
}

/* 品质 */
.slot-common { border: 2px solid var(--q-common); background: var(--q-common-bg); }
.slot-rare { border: 2px solid var(--q-rare); background: var(--q-rare-bg); }
.slot-epic { border: 2px solid var(--q-epic); background: var(--q-epic-bg); }
.slot-legend { border: 2px solid var(--q-legendary); background: var(--q-legendary-bg); }

/* 状态 */
.slot-empty { border: 2px dashed var(--rule-2); background: var(--bg-3); opacity: 0.5; cursor: default; }
.slot-locked { border: 2px dashed var(--rule-2); opacity: 0.3; cursor: not-allowed; font-size: 20px; }
.slot-selected { border-color: var(--accent); box-shadow: var(--shadow-glow-accent); }

.slot-icon { font-size: 28px; color: var(--muted); }
.slot-qty {
  position: absolute; bottom: 2px; right: 2px;
  font-family: var(--font-mono); font-size: 11px; font-weight: 700;
  color: #fff; background: rgba(0,0,0,0.55);
  padding: 1px 4px; border-radius: var(--radius-xs);
  line-height: 1.3;
}
.slot-equipped-mark {
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px;
  background: var(--accent); color: #fff;
  border-radius: 2px;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

/* 尺寸 */
.slot-lg { width: 96px; height: 96px; }
.slot-sm { width: 48px; height: 48px; }
.slot-sm .slot-icon { font-size: 20px; }
```
