---
component: tooltip
category: game
variants: [common, rare, epic, legendary]
tokens: [q-common, q-rare, q-epic, q-legendary, bg, ink, muted, radius-sm, shadow-md, font-heading, font-mono]
trigger: 长按 ≥500ms
size: max-w 280px
---

# TIPS 浮窗 (Tooltip)

## 规格

| 属性 | 值 |
|------|-----|
| 最大宽度 | 280px |
| 最小宽度 | 160px |
| 标题栏 | 品质色底 + 白字，高 28px |
| 内容区 | `--space-2`~`--space-3` padding |
| 属性行 | 标签-数值 两端对齐 |
| 箭头 | 8×6 CSS 三角形，指向触发元素 |
| 触发 | 长按 ≥500ms |
| 消失 | 松手/点击其他区域 |

## 代码

```html
<div class="tooltip tooltip-legend">
  <div class="tt-title">龙焰之刃</div>
  <div class="tt-body">传说中龙骑士的佩剑，蕴含龙焰之力。</div>
  <div class="tt-row"><span class="tt-key">ATK</span><span class="tt-val">+32~78</span></div>
  <div class="tt-row"><span class="tt-key">暴击率</span><span class="tt-val">+15%</span></div>
  <div class="tt-row"><span class="tt-key">特效</span><span class="tt-val">龙焰灼烧</span></div>
  <div class="tt-arrow"></div>
</div>
```

```css
.tooltip {
  max-width: 280px; min-width: 160px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid;
  flex-shrink: 0;
  position: relative;
}

/* 品质 */
.tooltip-common { border-color: var(--q-common); }
.tooltip-rare { border-color: var(--q-rare); }
.tooltip-epic { border-color: var(--q-epic); }
.tooltip-legend { border-color: var(--q-legendary); }

.tt-title {
  padding: 4px 8px;
  color: #fff;
  font-family: var(--font-heading); font-size: 12px; font-weight: 700;
}
.tooltip-common .tt-title { background: var(--q-common); }
.tooltip-rare .tt-title { background: var(--q-rare); }
.tooltip-epic .tt-title { background: var(--q-epic); }
.tooltip-legend .tt-title { background: var(--q-legendary); }

.tt-body {
  padding: 6px 8px;
  font-size: 11px; color: var(--ink-2);
  background: var(--bg);
  line-height: 1.45;
}
.tt-row {
  display: flex; justify-content: space-between;
  padding: 3px 8px;
  font-size: 11px; background: var(--bg);
}
.tt-row:last-of-type { padding-bottom: 6px; }
.tt-key { color: var(--muted); }
.tt-val { font-family: var(--font-mono); font-weight: 700; color: var(--ink); }

.tt-arrow {
  width: 0; height: 0;
  margin: 0 auto;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
}
.tooltip-legend .tt-arrow { border-top: 6px solid var(--q-legendary); }
.tooltip-epic .tt-arrow { border-top: 6px solid var(--q-epic); }
.tooltip-rare .tt-arrow { border-top: 6px solid var(--q-rare); }
.tooltip-common .tt-arrow { border-top: 6px solid var(--q-common); }
```
