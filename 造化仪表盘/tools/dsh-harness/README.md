# DSH Harness 便携同步包

把 **DeepSeek Harness 配置（profiles）** 放进 `J:\ceshi`（creation-forge）仓库，用 Git 在公司/家里对齐。

> 2026-09-10 起已移除 `dsh-worktable`（工作台插件）。本包只同步 profile bundles 与安装脚本。

## 不会同步的内容

- API Key / `.credentials.yaml`（各机器本地配置）
- `sessions/` 聊天记录
- `node_modules`、Electron 缓存、日志
- 整盘镜像 `C:\Users\...\.dsh`（只同步可迁移子集）

## 目录

```text
造化仪表盘/tools/dsh-harness/
  profiles/desktop|web/   # package.json + cordis.patch.yml
  templates/settings.yaml.example
  scripts/
    export-from-machine.ps1
    install-to-machine.ps1
    dashboard-service.ps1 # 仪表盘本地服务(:3456) 登录自启管理
```

## 仪表盘本地服务登录自启（dashboard-server :3456）

仪表盘的「任务 ✅/❌ 完成/取消」等操作需要本地服务跑在 `http://127.0.0.1:3456`。  
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
- 装好后**下次登录**自动生效；当前立即启动可再跑一次 `-Action start`。

## 机器 A（导出）

```powershell
cd J:\ceshi\造化仪表盘\tools\dsh-harness\scripts
powershell -NoProfile -ExecutionPolicy Bypass -File .\export-from-machine.ps1
```

然后 Git：

```powershell
cd J:\ceshi
git add 造化仪表盘/tools/dsh-harness
git commit -m "chore(dsh): portable harness pack"
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
3. 本地配置 API keys（切勿从 Git 提交密钥）

## 卸载工作台插件（本机）

若旧环境仍挂着 `dsh-worktable`，跑一次 `install-to-machine.ps1` 会从 profile 去掉该 bundle，并清理 `plugins-cache/dsh-worktable*`。也可手动删除：

- `%USERPROFILE%\.dsh\plugins-cache\dsh-worktable*`
- `%USERPROFILE%\.dsh\profiles\desktop|web\node_modules\dsh-worktable`
- profile `package.json` 里的 `dependencies.dsh-worktable` 与 `bundles` 中的 `dsh-worktable`
