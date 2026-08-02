---
component: quest-card
category: game
tokens: [bg-2, ink, muted, rule, success, warning, info, radius-md, font-heading, font-mono, dur-fast, ease-out, shadow-sm]
---

# 任务卡片 (Quest Card)

## 规格

| 属性 | 值 |
|------|-----|
| 布局 | 图标(38×38) + 信息区(flex) + 奖励 |
| 进度条 | 高 4px，颜色按进度类型 |

## 代码

```html
<div class="quest-card">
  <div class="qc-icon">📋</div>
  <div class="qc-info">
    <div class="qc-title">每日登录</div>
    <div class="qc-desc">累计登录 7 天</div>
    <div class="qc-progress">
      <div class="qc-progress-fill" style="width:57%"></div>
    </div>
  </div>
  <div class="qc-reward">💰 500</div>
</div>
```

```css
.quest-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-2);
  border: 1px solid var(--rule);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.quest-card:hover { border-color: var(--ink-2); box-shadow: var(--shadow-sm); }

.qc-icon {
  width: 38px; height: 38px;
  border-radius: var(--radius-sm);
  background: var(--bg-3);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.qc-info { flex: 1; min-width: 0; }
.qc-title { font-size: 13px; font-weight: 700; font-family: var(--font-heading); color: var(--ink); }
.qc-desc { font-size: 10px; color: var(--muted); margin-top: 1px; }
.qc-progress {
  width: 100%; height: 4px;
  background: var(--bg-3);
  border-radius: 2px; margin-top: 4px;
  overflow: hidden;
}
.qc-progress-fill {
  height: 100%; border-radius: 2px;
  background: var(--success);
  transition: width var(--dur-slow) var(--ease-out);
}
.qc-progress-fill.gold { background: var(--warning); }
.qc-progress-fill.blue { background: var(--info); }

.qc-reward {
  font-family: var(--font-mono);
  font-size: 11px; font-weight: 700;
  color: var(--warning);
  white-space: nowrap;
  flex-shrink: 0;
}
.qc-status {
  font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: var(--radius-sm);
  white-space: nowrap; flex-shrink: 0;
}
.qc-status.done { background: var(--success-bg); color: var(--success); }
.qc-status.claim { background: var(--warning-bg); color: var(--warning); }
```
