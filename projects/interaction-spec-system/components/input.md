---
component: input
category: basic
states: [idle, focus, error, disabled]
tokens: [accent, danger, bg, rule, rule-2, ink, muted-2, radius-sm, font-body]
---

# 输入框 (Input)

## 规格

| 属性 | 值 |
|------|-----|
| 高度 | 28~36px |
| 默认 | `--bg` 底 + 1px `--rule-2` 边框 |
| 聚焦 | 1px `--accent` 边框 |
| 错误 | 1px `--danger` 边框 + 错误提示 |
| 禁用 | 40% 透明度 |

## 代码

```html
<!-- 默认 -->
<input class="input" type="text" placeholder="请输入...">

<!-- 聚焦态 (浏览器默认 :focus) -->

<!-- 错误态 -->
<input class="input input-error" type="text" value="错误内容">
<span class="input-error-msg">请输入正确的格式</span>

<!-- 禁用 -->
<input class="input" type="text" placeholder="不可编辑" disabled>
```

```css
.input {
  height: 36px;
  padding: 0 12px;
  background: var(--bg);
  border: 1px solid var(--rule-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--ink);
  outline: none;
  transition: border-color var(--dur-fast) var(--ease-out);
  width: 100%;
}
.input::placeholder { color: var(--muted-2); }
.input:focus { border-color: var(--accent); }
.input:disabled { opacity: 0.4; cursor: not-allowed; background: var(--bg-3); }
.input-error { border-color: var(--danger); }
.input-error-msg {
  display: block;
  font-size: 11px;
  color: var(--danger);
  margin-top: 4px;
}
```
