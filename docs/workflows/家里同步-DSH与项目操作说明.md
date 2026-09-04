# 家里同步操作说明（DeepSeek Harness + 项目资料）

> 适用仓库：`J:\ceshi`（GitHub：`creation-forge`）  
> 目的：公司改完配置/插件/项目后，家里 `git pull` 按本文操作，保持一致。  
> 更新：2026-09-04

---

## 0. 先看懂：什么会同步、什么不会

| 会同步（Git） | 不会同步（需本机处理） |
|---|---|
| 项目资料（`projects/`、`docs/`、`造化仪表盘/works/` 等） | API Key / `.credentials.yaml` |
| Harness 便携包 `造化仪表盘/tools/dsh-harness/` | 聊天记录 `~/.dsh/sessions` |
| 已优化的 `dsh-worktable` 插件 | `node_modules`、DSH 缓存/日志 |
| （可选）工作台状态 JSON | 各机器本地密钥与登录态 |

**重要：**

1. 不要用浏览器直接打开 `http://127.0.0.1:43120`（会 403）。请用 **DSH Desktop 应用窗口**。  
2. 装完插件后必须 **完全退出 DSH Desktop（托盘也退）再打开**，只刷新页面不够。  
3. 密钥永远本机配置，不要提交到 Git。

---

## 1. 家里：拉取最新代码

在 PowerShell 或 Git Bash 中：

```powershell
# 进入你的 ceshi 仓库目录（盘符可能不是 J:，以实际克隆路径为准）
cd <你的-ceshi-路径>

git status
git pull origin main
```

若有冲突：

```powershell
git status
# 先处理冲突文件，或暂存本地改动：
git stash -u
git pull origin main
git stash pop
```

确认便携包已存在：

```powershell
dir 造化仪表盘\tools\dsh-harness
dir 造化仪表盘\tools\dsh-harness\plugins\dsh-worktable\lib
```

应能看到：

- `README.md`
- `scripts\install-to-machine.ps1`
- `plugins\dsh-worktable\lib\client.js`
- `plugins\dsh-worktable\lib\index.js`

---

## 2. 家里：安装 / 更新 DeepSeek Harness 插件与配置

### 2.1 前提

- 已安装 **DSH Desktop**
- 终端能运行 `dsh`（一般随 Desktop 装好；若没有，先打开一次 Desktop 再开新终端）

检查：

```powershell
dsh --help
```

### 2.2 一键安装（推荐）

```powershell
cd <你的-ceshi-路径>\造化仪表盘\tools\dsh-harness\scripts

powershell -NoProfile -ExecutionPolicy Bypass -File .\install-to-machine.ps1
```

脚本会：

1. 把 `plugins/dsh-worktable` 拷到 `%USERPROFILE%\.dsh\plugins-cache\dsh-worktable`
2. 合并写入 `profiles\desktop` / `profiles\web` 的 `package.json`（加入 worktable）
3. 执行 `dsh plugin --profile desktop|web add "link:..."`

### 2.3 安装后必做

1. **完全退出 DSH Desktop**（任务栏托盘图标右键退出）  
2. 重新打开 DSH Desktop  
3. 窗口内 **Ctrl + F5** 硬刷新  

### 2.4 验证 Harness

在 DSH Desktop 里检查：

- [ ] 侧栏底部有 **工作台**
- [ ] 能打开 **控制室 / 项目**
- [ ] 资源管理器顶部路径可以输入并回车跳转
- [ ] 文件上 **右键** 有菜单；「复制路径」能用
- [ ] 删除/重命名：若仍 HTTP 404，说明没重启 Desktop，再退干净重开一次

可选命令验证：

```powershell
dsh --profile desktop --dump-config | findstr worktable
```

应能看到 `dsh-worktable`。

---

## 3. 家里：配置 API Key（仅本机，不进 Git）

Git **不会**带来密钥。家里需要自行配置：

1. 打开 DSH Desktop → **设置**
2. 配置模型 / Provider（与公司一致的可用网关）
3. 或设置环境变量（示例，按你实际 provider）：

```powershell
# 示例：仅作说明，按你家里实际密钥填写
# [System.Environment]::SetEnvironmentVariable('XAI_API_KEY','你的key','User')
```

参考模板（无密钥）：

`造化仪表盘/tools/dsh-harness/templates/settings.yaml.example`

**不要**把真实 `settings.yaml` / `.credentials.yaml` 提交进仓库。

---

## 4. 家里：同步工作台状态（项目列表/绑定/布局）

工作台状态在 **DSH Desktop 的 localStorage**，不在普通项目文件里。

### 4.1 若公司已导出并提交了状态文件

仓库中若有：

`造化仪表盘/tools/dsh-harness/state/worktable-state.json`

则在家里导入：

1. 用 **DSH Desktop** 打开：  
   `造化仪表盘/tools/dsh-harness/scripts/worktable-state-tool.html`  
   （可复制到当前工作区，或在资源管理器中打开；必须在 Desktop 环境内，localStorage 才是同一份）
2. 「选择 JSON 文件」选 `worktable-state.json`，或粘贴内容到文本框
3. 若公司是 `J:\ceshi`、家里盘符不同，先填路径映射，例如：  
   - 旧前缀：`J:\ceshi`  
   - 新前缀：`D:\ceshi`（改成你家里真实路径）  
   - 点「对文本框做替换」
4. 点 **从文本框写入 localStorage**
5. 刷新 DSH 页面

### 4.2 若还没有 state 文件

公司侧先导出一次（见第 6 节），push 后再在家里 pull + 导入。

---

## 5. 家里：项目资料同步

项目文件跟 Git 走即可：

```powershell
cd <你的-ceshi-路径>
git pull origin main
```

日常改项目：

```powershell
git status
git add <文件>
git commit -m "说明"
git push
```

公司/家里都通过 `origin/main` 对齐。

---

## 6. 公司侧：改完后如何更新给家里（备查）

### 6.1 导出 Harness 包（插件又改过时）

```powershell
cd J:\ceshi\造化仪表盘\tools\dsh-harness\scripts
powershell -NoProfile -ExecutionPolicy Bypass -File .\export-from-machine.ps1
```

### 6.2 导出工作台状态（可选）

1. Desktop 打开 `worktable-state-tool.html`
2. 导出 → 保存为 `造化仪表盘/tools/dsh-harness/state/worktable-state.json`

### 6.3 提交并推送

```powershell
cd J:\ceshi
git add 造化仪表盘/tools/dsh-harness
git commit -m "chore(dsh): update harness portable pack"
git add <项目文件...>
git commit -m "docs/feat: 项目更新说明"
git push origin main
```

---

## 7. 一页速查（家里每次 pull 后）

```text
1. cd <ceshi路径> && git pull
2. powershell -NoProfile -ExecutionPolicy Bypass -File 造化仪表盘\tools\dsh-harness\scripts\install-to-machine.ps1
3. 完全退出并重启 DSH Desktop
4. Ctrl+F5
5. （可选）导入 造化仪表盘\tools\dsh-harness\state\worktable-state.json
6. （如需要）设置里配置 API Key
7. 验证：工作台 / 资源管理器地址栏 / 右键菜单
```

---

## 8. 常见问题

### Q1：浏览器打开 43120 失败 / 403 / SOMETHING WENT WRONG  
用 **DSH Desktop 窗口**，不要外部浏览器当主入口。

### Q2：右键菜单有，删除/重命名没反应或 HTTP 404  
服务端插件没加载到新路由：完全退出 Desktop 再开，不要只刷新。

### Q3：install 提示找不到 dsh  
先启动一次 DSH Desktop，新开终端再跑脚本；或把 Desktop 的 host-commands 加入 PATH。

### Q4：工作台项目路径不对  
导入 state 前做盘符/根路径替换（工具内「路径盘符映射」）。

### Q5：两台都改了同一文件冲突  
`git pull` 冲突时先沟通以谁为准；或 `stash` → pull → `stash pop` 后手动合并。

### Q6：能不能只靠 J 盘网盘不同步 Git？  
可以拷文件，但插件 `link:` 路径、冲突和历史都更差；**推荐 Git 为主、网盘仅备份。**

---

## 9. 相关路径

| 说明 | 路径 |
|---|---|
| 本说明（仓库根） | `家里同步-DSH与项目操作说明.md` |
| 便携包详细说明 | `造化仪表盘/tools/dsh-harness/README.md` |
| 安装脚本 | `造化仪表盘/tools/dsh-harness/scripts/install-to-machine.ps1` |
| 导出脚本 | `造化仪表盘/tools/dsh-harness/scripts/export-from-machine.ps1` |
| 工作台状态工具 | `造化仪表盘/tools/dsh-harness/scripts/worktable-state-tool.html` |
| 本机 DSH 数据 | `%USERPROFILE%\.dsh\` |

---

## 10. 安全提醒

- 仓库请保持 **私有**（状态 JSON 含本机路径）
- 提交前可检查：

```powershell
cd <ceshi路径>
git grep -i "sk-\|api_key\|password" -- 造化仪表盘/tools/dsh-harness
```

不应出现真实密钥。