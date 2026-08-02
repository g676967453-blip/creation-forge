---
component: toggle
category: basic
states: [on, off]
tokens: [success, bg-3, rule, radius-full, dur-base, ease-out]
size: 51×31
---

# 开关 (Toggle)

## 规格

| 属性 | 值 |
|------|-----|
| 尺寸 | 51×31px |
| 关闭态 | `--rule` 底 + 白色滑块 (左) |
| 开启态 | `--success` 底 + 白色滑块 (右) |

## 代码

```html
<!-- 关闭 -->
<div class="toggle"></div>

<!-- 开启 -->
<div class="toggle on"></div>
```

```css
.toggle {
  width: 51px; height: 31px;
  background: var(--rule);
  border-radius: var(--radius-full);
  position: relative;
  cursor: pointer;
  transition: background var(--dur-base) var(--ease-out);
  flex-shrink: 0;
}
.toggle::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 27px; height: 27px;
  background: #fff;
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
  transition: left var(--dur-base) var(--ease-out);
}
.toggle.on { background: var(--success); }
.toggle.on::after { left: 22px; }
```
