---
component: hero-card
category: game
variants: [common, rare, epic, legendary, selected, locked]
tokens: [q-common, q-rare, q-epic, q-legendary, accent, ink, muted, danger, success, radius-sm, radius-md, shadow-sm, shadow-glow-accent, font-heading, font-mono]
size: 160×220
---

# 英雄卡牌 (Hero Card)

## 规格

| 属性 | 值 |
|------|-----|
| 卡牌尺寸 | 160×220 |
| 立绘区 | 上方 55~60%，品质边框包裹 |
| 名称 | 14~16px Bold，居中 |
| 品质标签 | 左上角，品质色底 + 白字 |
| 元素图标 | 右上角 24×24 |
| 星级 | `★` 金色 |
| HP/ATK 条 | 高 6~8px，品质色/功能色 |

## 代码

```html
<div class="hero-card hero-card-epic">
  <div class="hc-art">
    <div class="hc-rarity-badge badge badge-epic">史诗</div>
    <div class="hc-element">🔥</div>
  </div>
  <div class="hc-info">
    <div class="hc-name">暗影术士</div>
    <div class="hc-stars">★★★★☆</div>
    <div class="hc-stat">
      <span class="hc-stat-label">HP</span>
      <div class="hc-stat-track"><div class="hc-stat-fill" style="width:85%"></div></div>
      <span class="hc-stat-val">85%</span>
    </div>
    <div class="hc-stat">
      <span class="hc-stat-label">ATK</span>
      <div class="hc-stat-track"><div class="hc-stat-fill hc-atk" style="width:70%"></div></div>
      <span class="hc-stat-val">70%</span>
    </div>
  </div>
</div>
```

```css
.hero-card {
  width: 160px; height: 220px;
  border-radius: var(--radius-md);
  border: 2px solid var(--rule);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
  background: var(--bg-2);
}
.hero-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.hero-card.selected { border-color: var(--accent); box-shadow: var(--shadow-glow-accent); }
.hero-card.locked { opacity: 0.4; border-style: dashed; cursor: not-allowed; filter: grayscale(0.4); }

/* 品质边框 */
.hero-card-common { border-color: var(--q-common); }
.hero-card-rare { border-color: var(--q-rare); }
.hero-card-epic { border-color: var(--q-epic); }
.hero-card-legend { border-color: var(--q-legendary); }

/* 立绘区 */
.hc-art {
  flex: 0 0 55%;
  border-bottom: 1px solid var(--rule);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: var(--bg-4);
  color: var(--muted);
  font-size: 32px;
}
.hc-rarity-badge { position: absolute; top: 4px; left: 4px; }
.hc-element {
  position: absolute; top: 4px; right: 4px;
  width: 24px; height: 24px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
}

/* 信息区 */
.hc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 8px;
}
.hc-name { font-size: 14px; font-weight: 700; font-family: var(--font-heading); color: var(--ink); }
.hc-stars { font-size: 10px; color: var(--accent); letter-spacing: 1px; }

/* 属性条 */
.hc-stat { display: flex; align-items: center; gap: 4px; width: 100%; }
.hc-stat-label { font-size: 9px; color: var(--muted); width: 22px; text-align: right; flex-shrink: 0; }
.hc-stat-track { flex: 1; height: 6px; background: var(--bg-3); border-radius: var(--radius-full); overflow: hidden; }
.hc-stat-fill { height: 100%; border-radius: var(--radius-full); background: var(--success); transition: width var(--dur-slow) var(--ease-out); }
.hc-atk { background: var(--danger); }
.hc-stat-val { font-family: var(--font-mono); font-size: 8px; color: var(--muted-2); }
```
