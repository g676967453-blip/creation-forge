# 如何导出 worktable-state.json（必须在 DSH Desktop 内）

外部脚本无法可靠读取 Desktop 正在占用的 Local Storage。请在 **DSH Desktop 应用窗口**里导出：

## 方法 A（推荐）：状态工具页

1. 在 DSH Desktop 中打开：
   `tools/dsh-harness/scripts/worktable-state-tool.html`
2. 点击「导出到文本框 + 下载 JSON」
3. 将下载的文件保存为：
   `tools/dsh-harness/state/worktable-state.json`
4. 回到终端：

```powershell
cd <ceshi路径>
git add tools/dsh-harness/state/worktable-state.json
git commit -m "chore(dsh): export worktable localStorage state"
git push
```

## 方法 B：开发者工具控制台

在 DSH Desktop 页面按 F12（若可用）或注入控制台，执行：

```javascript
(() => {
  const keys = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('dsh.worktable')) keys[k] = localStorage.getItem(k);
  }
  const data = { exportedAt: new Date().toISOString(), origin: location.origin, keys };
  console.log(JSON.stringify(data, null, 2));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'worktable-state.json';
  a.click();
})();
```

把得到的 `worktable-state.json` 放到 `tools/dsh-harness/state/` 后 commit + push。