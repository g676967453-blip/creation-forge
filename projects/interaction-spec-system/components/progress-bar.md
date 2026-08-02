---
component: progress-bar
category: basic
variants: [hp, exp, energy]
states: [high, medium, low]
tokens: [success, warning, danger, info, accent, space-2, radius-full, dur-slow, ease-out]
---

# 进度条 (Progress Bar)

## 规格

| 类型 | 高度 | 颜色规则 | 用途 |
|------|------|---------|------|
| HP 血条 | 10~12px | \>50% `--success` / 20-50% `--warning` / \<20% `--danger` | 生命值 |
| EXP 经验 | 6~8px | `--info` | 经验/等级进度 |
| 能量/大招 | 8~10px | 渐变 (绿→金) | 技能充能 |

## 代码

```html
<!-- HP 血条 (高血量) -->
<div class="progress-bar">
  <span class="progress-label">HP</span>
  <div class="progress-track">
    <div class="progress-fill hp-high" style="width: 85%;"></div>
  </div>
  <span class="progress-value">85%</span>
</div>

<!-- HP 血条 (低血量) -->
<div class="progress-bar">
  <span class="progress-label">HP</span>
  <div class="progress-track">
    <div class="progress-fill hp-low" style="width: 18%;"></div>
  </div>
  <span class="progress-value danger">18%</span>
</div>

<!-- EXP 经验条 -->
<div class="progress-bar">
  <span class="progress-label">EXP</span>
  <div class="progress-track progress-track-sm">
    <div class="progress-fill exp-fill" style="width: 60%;"></div>
  </div>
  <span class="progress-value">60%</span>
</div>
```

```css
.progress-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.progress-label {
  font-size: 10px;
  color: var(--muted);
  width: 28px;
  text-align: right;
  flex-shrink: 0;
  font-weight: 600;
}
.progress-track {
  flex: 1;
  height: 10px;
  background: var(--bg-3);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-track-sm { height: 6px; }
.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--dur-slow) var(--ease-out);
}

/* HP 颜色 */
.hp-high { background: var(--success); }
.hp-mid { background: var(--warning); }
.hp-low { background: var(--danger); }
.exp-fill { background: var(--info); }
.energy-fill { background: linear-gradient(90deg, var(--success), var(--accent)); }

.progress-value {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink-2);
  font-weight: 600;
  width: 36px;
  flex-shrink: 0;
}
.progress-value.danger { color: var(--danger); }
```
