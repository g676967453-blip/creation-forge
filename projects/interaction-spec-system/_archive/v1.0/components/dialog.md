---
component: dialog
category: game
variants: [alert, modal, bottom-sheet, toast]
tokens: [bg, bg-2, ink, muted, accent, danger, rule, rule-2, radius-md, radius-lg, shadow-modal, z-modal, dur-base, ease-spring, font-heading]
---

# 弹窗体系 (Dialog)

## 规格

| 类型 | 尺寸 | 位置 | 关闭方式 |
|------|------|------|---------|
| Alert | W70% H:auto | 居中 | 点击按钮 |
| Modal | W80% H≤60% | 居中 | 关闭按钮/遮罩 |
| BottomSheet | W100% H≤45% | 底部滑出 | 下拉/遮罩 |
| Toast | auto×32px | 底部居中 | 2~3s 自动消失 |

### 通用规范
- 遮罩：`rgba(0,0,0,0.45)`，z-index: `--z-modal`
- 弹出动画：scale(0.9→1) + opacity(0→1)，`--dur-base` `--ease-spring`
- 不嵌套弹窗（多步骤=分步表单）

## 代码

```html
<!-- Alert -->
<div class="dialog-overlay">
  <div class="dialog-alert">
    <div class="dlg-title">确认删除</div>
    <div class="dlg-body">确定删除此项？此操作不可撤销。</div>
    <div class="dlg-actions">
      <button class="dlg-btn dlg-btn-cancel">取消</button>
      <button class="dlg-btn dlg-btn-confirm">确认</button>
    </div>
  </div>
</div>

<!-- Modal -->
<div class="dialog-overlay">
  <div class="dialog-modal">
    <div class="dlg-title">
      设置
      <button class="dlg-close">✕</button>
    </div>
    <div class="dlg-body">
      <div class="dlg-row"><span>音效</span><span>80%</span></div>
      <div class="dlg-row"><span>音乐</span><span>60%</span></div>
      <div class="dlg-row"><span>画质</span><span>高</span></div>
    </div>
  </div>
</div>

<!-- BottomSheet -->
<div class="dialog-overlay">
  <div class="dialog-sheet">
    <div class="sheet-handle"></div>
    <div class="sheet-row">分享到微信</div>
    <div class="sheet-row">分享到朋友圈</div>
    <div class="sheet-row sheet-cancel">取消</div>
  </div>
</div>

<!-- Toast -->
<div class="dialog-toast">操作成功</div>
```

```css
/* Overlay */
.dialog-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: var(--z-modal);
  display: flex; align-items: center; justify-content: center;
}

/* Alert */
.dialog-alert {
  width: 70%; max-width: 500px;
  background: var(--bg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-modal);
  animation: dialogIn var(--dur-base) var(--ease-spring);
}
@keyframes dialogIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

.dlg-title {
  text-align: center;
  font-family: var(--font-heading); font-size: 16px; font-weight: 700;
  color: var(--ink);
  padding: 16px 0 8px;
  display: flex; align-items: center; justify-content: center;
}
.dlg-body {
  padding: 8px 16px;
  font-size: 13px; color: var(--ink-2);
  text-align: center;
  min-height: 40px;
  display: flex; align-items: center; justify-content: center;
}
.dlg-actions {
  display: flex;
  border-top: 1px solid var(--rule);
}
.dlg-btn {
  flex: 1; text-align: center; padding: 12px 0;
  font-size: 14px; border: none; background: none; cursor: pointer;
  font-family: var(--font-heading); font-weight: 600;
  transition: background var(--dur-fast);
}
.dlg-btn:hover { background: var(--bg-3); }
.dlg-btn-cancel { color: var(--muted); border-right: 1px solid var(--rule); }
.dlg-btn-confirm { color: var(--accent); }
.dlg-btn-danger { color: var(--danger); }

.dlg-close {
  position: absolute; right: 12px;
  width: 28px; height: 28px;
  border: none; background: none; cursor: pointer;
  font-size: 16px; color: var(--muted);
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
}
.dlg-close:hover { background: var(--bg-3); }

/* Modal */
.dialog-modal {
  width: 80%; max-width: 580px; max-height: 60%;
  background: var(--bg);
  border-radius: var(--radius-lg);
  overflow-y: auto;
  box-shadow: var(--shadow-modal);
  animation: dialogIn var(--dur-base) var(--ease-spring);
}
.dlg-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px var(--space-4);
  border-bottom: 1px solid var(--rule);
  font-size: 13px;
}
.dlg-row:last-child { border-bottom: none; }

/* BottomSheet */
.dialog-sheet {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: var(--bg);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding-bottom: var(--space-4);
  animation: sheetIn var(--dur-base) var(--ease-out);
  box-shadow: var(--shadow-modal);
}
@keyframes sheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
.sheet-handle {
  width: 32px; height: 4px;
  background: var(--rule-2);
  border-radius: 2px;
  margin: 8px auto 12px;
}
.sheet-row {
  padding: 12px var(--space-4);
  font-size: 14px; color: var(--ink);
  text-align: center; cursor: pointer;
  border-bottom: 1px solid var(--rule);
}
.sheet-row:hover { background: var(--bg-3); }
.sheet-row:last-child { border-bottom: none; }
.sheet-cancel { color: var(--muted); }

/* Toast */
.dialog-toast {
  position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.8); color: #fff;
  padding: 8px 20px;
  border-radius: var(--radius-full);
  font-size: 13px; font-weight: 600;
  z-index: var(--z-top);
  white-space: nowrap;
  animation: toastIn var(--dur-base) var(--ease-out);
}
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
```
