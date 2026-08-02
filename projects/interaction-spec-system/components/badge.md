---
component: badge
category: basic
variants: [neutral, common, rare, epic, legendary, myth, success, danger, new, dot]
tokens: [q-common, q-rare, q-epic, q-legendary, q-myth, success, danger, radius-xs, font-mono]
---

# 标签 (Badge)

## 规格

| 变体 | 颜色 | 用途 |
|------|------|------|
| neutral | `--bg-4` 底 + `--ink-2` 字 | 通用标签 |
| common | `--q-common-bg` 底 + `--q-common` 字 | 普通品质 |
| rare | `--q-rare-bg` 底 + `--q-rare` 字 | 稀有品质 |
| epic | `--q-epic-bg` 底 + `--q-epic` 字 | 史诗品质 |
| legendary | `--q-legendary-bg` 底 + `--q-legendary` 字 | 传说品质 |
| myth | `--q-myth-bg` 底 + `--q-myth` 字 | 神话品质 |
| success | `--success-bg` 底 + `--success` 字 | 成功/正向 |
| danger | `--danger-bg` 底 + `--danger` 字 | 危险/错误 |
| new | `--danger` 底 + `#fff` 字 | 新内容提示 |
| dot | 8×8px 红色圆点 | 通知红点 |

## 代码

```html
<!-- 品质标签 -->
<span class="badge badge-common">普通</span>
<span class="badge badge-rare">稀有</span>
<span class="badge badge-epic">史诗</span>
<span class="badge badge-legend">传说</span>
<span class="badge badge-myth">神话</span>

<!-- 状态标签 -->
<span class="badge badge-success">已完成</span>
<span class="badge badge-danger">已过期</span>
<span class="badge badge-new">NEW</span>

<!-- 通知 -->
<span class="badge badge-dot"></span>
<span class="badge badge-neutral">+99</span>
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  line-height: 1.4;
}

/* 品质 */
.badge-common { background: var(--q-common-bg); color: var(--q-common); border: 1px solid rgba(134,142,150,0.2); }
.badge-rare { background: var(--q-rare-bg); color: var(--q-rare); border: 1px solid rgba(24,100,171,0.2); }
.badge-epic { background: var(--q-epic-bg); color: var(--q-epic); border: 1px solid rgba(103,65,217,0.2); }
.badge-legend { background: var(--q-legendary-bg); color: var(--q-legendary); border: 1px solid rgba(230,119,0,0.2); }
.badge-myth { background: var(--q-myth-bg); color: var(--q-myth); border: 1px solid rgba(201,42,42,0.2); }

/* 状态 */
.badge-success { background: var(--success-bg); color: var(--success); border: 1px solid rgba(60,163,116,0.2); }
.badge-danger { background: var(--danger-bg); color: var(--danger); border: 1px solid rgba(201,42,42,0.2); }
.badge-new { background: var(--danger); color: #fff; border: none; }
.badge-neutral { background: var(--bg-4); color: var(--ink-2); border: 1px solid var(--rule-2); }

/* 红点 */
.badge-dot {
  width: 8px; height: 8px; padding: 0;
  border-radius: 50%;
  background: var(--danger);
  border: 1px solid var(--bg);
}
```
