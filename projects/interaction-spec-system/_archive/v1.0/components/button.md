---
component: button
category: basic
variants: [primary, secondary, outline, danger, ghost, icon]
sizes: [sm, md, lg]
states: [idle, hover, active, disabled, loading]
tokens: [accent, accent-hover, accent-pressed, on-accent, ink, bg-3, bg-4, radius-sm, font-heading, dur-fast, ease-out]
touch_min: 44×44
---

# 按钮 (Button)

## 规格

| 类型 | 推荐尺寸 | 最小尺寸 | 颜色 | 用途 |
|------|---------|---------|------|------|
| Primary | 280×52 | 200×44 | `--accent` 底 + `--on-accent` 字 | 主 CTA / 确认 |
| Secondary | 200×44 | 160×40 | `--bg-3` 底 + `--ink` 字 + `--rule-2` 边框 | 次要操作 |
| Outline | 200×44 | 160×40 | 透明底 + `--ink` 字 + `--rule-2` 边框 | 弱化操作 |
| Danger | 200×44 | 160×40 | `--danger-bg` 底 + `--danger` 字 | 删除/危险操作 |
| Ghost | auto×36 | 88×36 | 透明底 + `--muted` 字 | 最弱操作 |
| Icon | 48×48 | 44×44 | `--bg-3` 底 + `--ink-2` 图标 | 图标按钮 |

### 尺寸变体

| Size | 高度 | Padding | 字号 |
|------|------|---------|------|
| sm | 36px | 6px 16px | 12px |
| md (默认) | 44px | 10px 24px | 14px |
| lg | 52px | 14px 32px | 16px |

### 状态

| 状态 | 视觉表现 |
|------|---------|
| idle | 标准配色 |
| hover | 背景色微亮 / 边框加深 |
| active | 背景色加深 + scale(0.97) |
| disabled | 40% 透明度 + cursor: not-allowed |
| loading | 内置旋转指示器 + 文字变 `...` |

## 代码

```html
<!-- Primary -->
<button class="btn btn-primary">确认</button>
<button class="btn btn-primary" disabled>确认</button>

<!-- Secondary -->
<button class="btn btn-secondary">取消</button>

<!-- Outline -->
<button class="btn btn-outline">查看更多</button>

<!-- Danger -->
<button class="btn btn-danger">删除</button>

<!-- Ghost -->
<button class="btn btn-ghost">跳过</button>

<!-- Icon -->
<button class="btn btn-icon">⚙</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">小按钮</button>
<button class="btn btn-primary btn-lg">大按钮</button>

<!-- Block (full width) -->
<button class="btn btn-primary btn-block">全宽按钮</button>
```

```css
.btn {
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-out);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  line-height: 1.2;
  white-space: nowrap;
  user-select: none;
  min-width: 44px;
  min-height: 44px;
}

/* Variants */
.btn-primary {
  background: var(--accent);
  color: var(--on-accent);
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:active { background: var(--accent-pressed); transform: scale(0.97); }

.btn-secondary {
  background: var(--bg-3);
  color: var(--ink);
  border: 1px solid var(--rule-2);
}
.btn-secondary:hover { background: var(--bg-4); border-color: var(--muted-2); }

.btn-outline {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--rule-2);
}
.btn-outline:hover { background: var(--bg-3); border-color: var(--muted); }

.btn-danger {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid rgba(201, 42, 42, 0.2);
}
.btn-danger:hover { background: rgba(201, 42, 42, 0.15); }

.btn-ghost {
  background: transparent;
  color: var(--muted);
  padding: 6px 16px;
}
.btn-ghost:hover { color: var(--ink); background: var(--bg-3); }

.btn-icon {
  width: 48px; height: 48px; padding: 0;
  background: var(--bg-3);
  border: 1px solid var(--rule-2);
  border-radius: var(--radius-sm);
  color: var(--ink-2);
  font-size: 18px;
}
.btn-icon:hover { background: var(--bg-4); color: var(--ink); }

/* Sizes */
.btn-sm { font-size: 12px; padding: 6px 16px; height: 36px; }
.btn-lg { font-size: 16px; padding: 14px 32px; height: 52px; }

/* States */
.btn:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
.btn-block { width: 100%; }
```
