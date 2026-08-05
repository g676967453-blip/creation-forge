---
component: hud
category: layout
tokens: [bg, rule, ink, muted, muted-2, info, warning, accent, q-epic, font-heading, font-mono, space-2, radius-sm, radius-full, dur-slow, ease-out]
---

# HUD 顶栏 (Heads-Up Display)

## 规格

| 区域 | 内容 | 尺寸 |
|------|------|------|
| 左侧 | 玩家头像 + 名称 + 等级 | 头像 32×32 |
| 中部 | EXP 进度条 | 高 4px |
| 右侧 | 资源图标 (金币/体力) + 活动入口 | 图标 16×16 |
| 高度 | 含状态栏 ~64px | |

## 代码

```html
<header class="hud">
  <!-- 玩家信息 -->
  <div class="hud-player">
    <div class="hud-avatar">
      <div class="hud-avatar-frame"></div>
      <span>A</span>
    </div>
    <div class="hud-player-info">
      <span class="hud-name">玩家名称</span>
      <span class="hud-lv">Lv.42</span>
    </div>
  </div>

  <!-- EXP 条 -->
  <div class="hud-exp-wrapper">
    <div class="hud-exp">
      <div class="hud-exp-fill" style="width:65%"></div>
    </div>
    <div class="hud-exp-label">65%</div>
  </div>

  <!-- 资源 -->
  <div class="hud-resources">
    <div class="hud-res">
      <span class="hud-res-icon gold"></span>
      <span>12,345</span>
    </div>
    <div class="hud-res">
      <span class="hud-res-icon stamina"></span>
      <span>98/120</span>
    </div>
  </div>

  <!-- 活动入口 -->
  <div class="hud-event">⚡ 活动</div>
</header>
```

```css
.hud {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 34px 12px 8px;
  background: var(--bg);
  border-bottom: 1px solid var(--rule);
  z-index: var(--z-hud);
  position: relative;
  flex-shrink: 0;
  height: 64px;
}

.hud-player {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
}
.hud-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--bg-4);
  border: 2px solid var(--rule-2);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  overflow: hidden;
  font-size: 12px; font-weight: 700; color: var(--muted);
}
.hud-avatar-frame {
  position: absolute; inset: -2px;
  border-radius: 50%;
  border: 2px solid var(--q-epic);
  pointer-events: none;
}
.hud-player-info { display: flex; flex-direction: column; }
.hud-name { font-size: 11px; font-weight: 700; font-family: var(--font-heading); line-height: 1.1; color: var(--ink); }
.hud-lv { font-family: var(--font-mono); font-size: 9px; color: var(--muted); }

.hud-exp-wrapper { flex: 1; margin: 0 2px; }
.hud-exp { height: 4px; background: var(--bg-3); border-radius: var(--radius-full); overflow: hidden; }
.hud-exp-fill { height: 100%; background: var(--ink-2); border-radius: var(--radius-full); transition: width var(--dur-slow) var(--ease-out); }
.hud-exp-label { font-family: var(--font-mono); font-size: 8px; color: var(--muted-2); margin-top: 2px; text-align: right; }

.hud-resources { display: flex; align-items: center; gap: 4px; }
.hud-res {
  display: flex; align-items: center; gap: 4px;
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  padding: 3px 8px; border-radius: var(--radius-sm);
  background: var(--bg-3); cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
}
.hud-res:hover { background: var(--bg-4); }
.hud-res-icon {
  width: 16px; height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}
.hud-res-icon.gold { background: linear-gradient(135deg, #f59f00, var(--warning)); }
.hud-res-icon.stamina { background: linear-gradient(135deg, #339af0, var(--info)); }

.hud-event {
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background: var(--warning-bg);
  border: 1px solid rgba(230, 119, 0, 0.2);
  font-size: 9px; font-weight: 700;
  color: var(--warning);
  cursor: pointer;
  white-space: nowrap;
}
