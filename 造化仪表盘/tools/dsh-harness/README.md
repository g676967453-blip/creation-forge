# DSH Harness 便携同步包

把 **DeepSeek Harness 配置 + 已装插件（含 dsh-worktable 本地优化）+ 工作台状态** 放进 `J:\ceshi`（creation-forge）仓库，用 Git 在公司/家里对齐。

## 不会同步的内容

- API Key / `.credentials.yaml`（各机器本地配置）
- `sessions/` 聊天记录
- `node_modules`、Electron 缓存、日志
- 整盘镜像 `C:\Users\...\.dsh`（只同步可移植子集）

## 目录

```text
造化仪表盘/tools/dsh-harness/
  profiles/desktop|web/   # package.json + cordis.patch.yml
  plugins/dsh-worktable/  # 当前优化后的插件（含 lib/）
  templates/settings.yaml.example
  scripts/
    export-from-machine.ps1
    install-to-machine.ps1
    dashboard-service.ps1 # 仪表盘本地服务(:3456) 登录自启管理
    worktable-state-tool.html
  state/worktable-state.example.json
```

## 仪表盘本地服务登录自启（dashboard-server :3456）

仪表盘的「任务 ✓/✗ 完成/取消」等操作需要本地服务跑在 `http://127.0.0.1:3456`。
`scripts/dashboard-service.ps1` 用**当前用户「启动文件夹」**实现登录级自启（无需管理员权限），
并自行以仓库根为工作目录定位 `造化仪表盘/tools/dashboard-server.ts`（可随仓库换盘符）。

```powershell
cd <仓库>\造化仪表盘\tools\dsh-harness\scripts
powershell -NoProfile -ExecutionPolicy Bypass -File .\dashboard-service.ps1 -Action install    # 注册自启 + 立即启动
powershell -NoProfile -ExecutionPolicy Bypass -File .\dashboard-service.ps1 -Action uninstall  # 移除自启 + 停止
powershell -NoProfile -ExecutionPolicy Bypass -File .\dashboard-service.ps1 -Action status     # 查状态
```

- 幂等：3456 已在监听时重复 install/start 不会重启。
- 日志：`造化仪表盘/reports/dashboard-service.{out,err}.log`。
- 装好后**下次登录**自动生效；当前立即启动可跑一次 `-Action start`。
- 注意：Windows PowerShell 5.1 需 UTF-8 带 BOM 解析中文脚本；若改了本脚本请保持 BOM。

## 机器 A（导出）

```powershell
cd J:\ceshi\造化仪表盘\tools\dsh-harness\scripts
powershell -NoProfile -ExecutionPolicy Bypass -File .\export-from-machine.ps1
```

工作台项目/绑定/布局（localStorage）：

1. 用 DSH Desktop 打开 `scripts/worktable-state-tool.html`
   - 可将该 HTML 拖到 Desktop 窗口，或复制到工作区后用 file 协议/本地静态页打开（必须同源 localStorage）
   - 最稳妥：在 Desktop 会话里让 AI/开发者工具执行导出逻辑，或把 HTML 放到当前 workspace 用资源管理器打开为站点
2. 点击「导出」得到 `worktable-state.json`
3. 保存到 `造化仪表盘/tools/dsh-harness/state/worktable-state.json`

然后 Git：

```powershell
cd J:\ceshi
git add 造化仪表盘/tools/dsh-harness
git commit -m "chore(dsh): portable harness pack + worktable"
git push
```

## 机器 B（安装）

```powershell
cd <你的 ceshi 克隆路径>\造化仪表盘\tools\dsh-harness\scripts
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-to-machine.ps1
```

然后：

1. **完全退出** DSH Desktop（托盘也退）并重新打开  
2. Ctrl+F5  
3. 用 `worktable-state-tool.html` 导入 `state/worktable-state.json`  
4. 若盘符不同，导入前在工具里做路径前缀映射（如 `J:\ceshi` → `D:\ceshi`）  
5. 本地配置 API Key（设置 UI / 环境变量），**不要从 Git 拷密钥**

## 验证清单

- [ ] `dsh --profile desktop --dump-config` 含 `dsh-worktable`
- [ ] 侧栏出现工作台
- [ ] 资源管理器可输入路径
- [ ] 右键菜单可复制路径；删除/重命名需重启后服务端路由生效
- [ ] 导入 state 后项目列表恢复

## 当前 worktable 本地优化摘要

- 项目文件夹「更改」：系统选目录失败时应用内路径编辑
- 资源管理器：可编辑地址栏
- 资源管理器：右键打开/复制路径/复制/重命名/删除/新建/粘贴
- 服务端：`/api/worktable/rm|rename|copy|open-path`

## 安全

- 仓库请保持 **private**（状态 JSON 含本机路径）
- 提交前自查：`git grep -i "apiKey\|sk-\|password" 造化仪表盘/tools/dsh-harness`

---

更多「家里 pull 后逐步操作」见 [家里同步-DSH与项目操作说明.md](../../../docs/workflows/家里同步-DSH与项目操作说明.md)。
