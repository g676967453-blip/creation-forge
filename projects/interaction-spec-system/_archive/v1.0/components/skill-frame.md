---
component: skill-frame
category: game
states: [ready, cooldown, locked, empty]
tokens: [q-common, q-rare, q-epic, q-legendary, info, font-mono, radius-sm, dur-slow]
size: 72×72
---

# 技能框 (Skill Frame)

## 规格

| 属性 | 值 |
|------|-----|
| 尺寸 | 72×72 |
| 图标区 | 居中，占 70% |
| 能量消耗 | 左上角，`--info` 底白字 |

## 代码

```html
<!-- 可用 -->
<div class="skill-frame skill-frame-legend">
  <div class="sf-icon">🔥</div>
  <div class="sf-energy">50</div>
</div>

<!-- 冷却中 -->
<div class="skill-frame skill-frame-epic">
  <div class="sf-icon">❄</div>
  <div class="sf-cooldown">12s</div>
  <div class="sf-energy">30</div>
</div>

<!-- 锁定 -->
<div class="skill-frame skill-frame-locked">🔒</div>

<!-- 空 -->
<div class="skill-frame skill-frame-empty"></div>
```

```css
.skill-frame {
  width: 72px; height: 72px;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.skill-frame:hover { transform: scale(1.05); }

/* 品质 */
.skill-frame-common { border: 2px solid var(--q-common); background: var(--q-common-bg); }
.skill-frame-rare { border: 2px solid var(--q-rare); background: var(--q-rare-bg); }
.skill-frame-epic { border: 2px solid var(--q-epic); background: var(--q-epic-bg); }
.skill-frame-legend { border: 2px solid var(--q-legendary); background: var(--q-legendary-bg); }

/* 状态 */
.skill-frame-locked { border: 2px dashed var(--rule-2); opacity: 0.3; cursor: not-allowed; font-size: 20px; }
.skill-frame-empty { border: 2px dashed var(--rule-2); background: var(--bg-3); opacity: 0.4; cursor: default; }

/* 内部 */
.sf-icon { font-size: 28px; }
.sf-energy {
  position: absolute; top: 2px; left: 2px;
  padding: 1px 4px; border-radius: 99px;
  background: var(--info); color: #fff;
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
}
.sf-cooldown {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono); font-size: 16px; font-weight: 700;
  color: #fff;
}
.sf-name {
  font-size: 10px; color: var(--ink-2); font-family: var(--font-heading);
  text-align: center; margin-top: 2px;
}
```
