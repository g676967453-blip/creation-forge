# DSH 信息日报 · 2026-09-11

> 报告期：2026-09-10 ~ 2026-09-11（第 2 期） ｜ 生成方式：自动（`dsh --profile headless` + 联网检索） ｜ 数据源：本机文件系统 + npm registry + GitHub Releases
> 采集时间：2026-09-11 06:47 (+08:00)

本期只有一件真事：上游在 09-10 23:09(+08:00) 补发了 **`v0.1.5-rc.2`**（候选版收尾打磨，无破坏性变更），本机 CLI 停在 `latest = 0.1.5-rc.1`，**本体不用动**；真正值得动手的仍是昨天已提示的 `dsh-worktable` 0.3.0 → 0.3.3。另外本机 `~/.dsh` 这次多了一个 `headless` profile —— 这正是今天这份日报能无人值守生成的底座。

---

## ① 本机 DSH 环境快照

| 项 | 值 |
| --- | --- |
| DSH CLI 版本 | **0.1.5-rc.1** |
| 安装路径 | `C:\Users\Administrator\AppData\Roaming\npm\node_modules\@deepseek-ai\dsh` |
| npm `latest` 标签 | 0.1.5-rc.1 —— **已是最新** |
| npm `next` 标签 | 0.1.5-rc.2 —— 更新的预发布版（灰度通道） |
| Node 运行时 | v24.15.0 |
| 系统 | win32 x64 · 10.0.26200 |
| DSH_HOME | `C:\Users\Administrator\.dsh` |
| 已启用 profile | `headless`（`@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-headless`）、`web`（`@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`） |
| 默认模型 | provider `deepseek-official` · model **`deepseek-flash`** · reasoningEffort `low` |
| 模型凭据 | 已配置（仅检查存在性，不读取内容） |
| 活跃会话数 | 2 |
| 插件 | `dsh-worktable` **0.3.0**（本地优化版，上游最新 0.3.3） |
| 仓库状态 | `main` @ `70e814c`（2026-09-10），未提交改动 19 项 |

**一句话结论**：DSH 本体已是最新、不用动；真正有更新价值的是 worktable 插件——但仓库里是本地优化版，**必须先 diff 再升级，不能直接覆盖**。

---

## ② 更新与变更提醒

### 1. DSH 本体 —— 无需升级（`updateAvailable: false`）

- 本机 `0.1.5-rc.1` 就是 npm `latest`，**已是最新**。
- 上游另有 `next = 0.1.5-rc.2`、`alpha = 0.1.5-alpha.2`，都是预发布通道，**不建议**日常切过去。
- 若确实想试 rc.2，命令与风险：

  ```sh
  npm i -g @deepseek-ai/dsh@next
  ```

  风险：预发布版不保证稳定，且 Session 格式为 V3、**升级后的会话不支持降级读取**；升级前先备份 `~/.dsh/sessions/`。生效步骤：升级后完整退出并重启 `dsh`。

### 2. `dsh-worktable` 0.3.0 → 0.3.3 —— 有更新，先 diff 再升级

上游三个版本的变更：

| 版本 | 发布 | 关键内容 |
| --- | --- | --- |
| v0.3.1 | 09-03 | 修复 v0.3.0 发布包非标准 npm 格式、安装会报错的问题 |
| v0.3.2 | 09-05 | 文件夹选择显示「等待选择…」、新增「手动输入」绝对路径入口、失败显式报错 |
| v0.3.3 | 09-06 | 适配 DSH 0.1.2-rc.1 / 0.1.1-rc.2；数据读取不再依赖默认安装路径（自定义 `DSH_HOME` 也能读到项目与分组）；修复点击项目卡片无反应 |

⚠️ **升级前必须注意两点**

1. **仓库内是本地优化版，不是原版 0.3.0。**
   `造化仪表盘/tools/dsh-harness/plugins/dsh-worktable` 带自加的「可编辑地址栏 / 右键文件操作 / `/api/worktable/rm|rename|copy|open-path`」等改动（见 dsh-harness README 的「本地优化摘要」）。直接拉上游 0.3.3 覆盖会**丢掉这些改动**。
   正确顺序：下载上游 tgz 解包 → 与仓库版本 diff → 把本地改动 rebase 到 0.3.3 → 再替换。
2. **兼容性未被上游声明。** v0.3.3 官方只声明测过 DSH `0.1.2-rc.1` 与 `0.1.1-rc.2`，**没有**声明兼容你现在跑的 `0.1.5-rc.1`；而 0.1.5-rc.1 恰好改了 Web 插件面板 API（`sidebar.panellist` / `main`，原 `conversation` slot 迁移）。升级后必须实测再决定是否长期保留。

**要升级时的命令**（注意：先备份仓库内本地版）：

```sh
dsh plugin --profile web add "https://github.com/Aisland-SJL/dsh-worktable/releases/latest/download/dsh-worktable.tgz"
```

装完**完整退出 DSH 并重启**，再刷新页面；升完实测四项：项目卡片点击 / 文件夹选择 / 资源管理器右键 / 控制台布局。

> **建议**：当前工作台既然能用，就不急着升。等要升时按上面顺序做。

---

## ③ 本周期 DSH 动态

### 发布节奏

| 日期 | 版本 | 说明 |
| --- | --- | --- |
| 09-02 | `dsh-v0.1.2-alpha.5` | 修复从 0.1.1-rc.2 升级后启动失败 / 会话标题丢失 |
| 09-03 | `dsh-v0.1.2-rc.1` | 0.1.2 首个候选版：折叠过程内容、token 统计、子代理双向 `send_message` |
| 09-04 | `dsh-v0.1.3-alpha.1` | Session 格式升 v2；`SessionHandle` 破坏性变更 |
| 09-07 | `dsh-v0.1.3-alpha.2` | 「在应用中打开」；子代理支持排队 / 编辑 / Steer |
| 09-08 | `dsh-v0.1.5-alpha.1` | 动态系统提示词不破坏 KV Cache；实验性右侧 Sidebar |
| 09-09 | `dsh-v0.1.5-alpha.2` | Sidebar 文档预览（MD / 代码 / HTML / PDF / 图片） |
| 09-10 | `dsh-v0.1.5-rc.1` ← 你已装 | 0.1.5 首个候选版，汇总自 0.1.2-rc.1 以来全部变更 |
| **09-10** | **`dsh-v0.1.5-rc.2`** ← 本期新增 | 反馈提交加弹窗确认；交付文件卡片排版与图标优化 |

### 与你直接相关的变更

- **`v0.1.5-rc.2`（本期唯一新增）**：点赞 / 点踩都要经弹窗确认才提交，失败时保留已填内容并提示 —— 提 bug 更不容易手滑，也不会白填。
- **`v0.1.5-rc.2`**：交付文件卡片排版、对话间距、代码文件图标重做，产物更易辨认、界面更紧凑 —— 对天天看 `reports/*.html`、Godot 场景文件的人直接可感。
- **本机新增 `headless` profile**（`@deepseek-ai/dsh-headless`）：配合 0.1.5-rc.1 把 headless 默认文件工具定为 `read` / `write` / `edit`，才有本日报的全自动生成链路。

### 需要注意的破坏性 / 行为变更

- **本期（rc.2）无新增破坏性变更**，只是体验打磨。
- rc.1 的三条仍然生效，升级 / 写插件前要记住：**Session 格式 V3**（升级后不支持降级读取）、**headless/SDK/ACP 默认 `read`/`write`/`edit`**、**插件 API 调整**（移除 `ctx.agent`；`Inbox` 变类型接口；Web 面板改走 `sidebar.panellist` 与 `main`）。

来源：[v0.1.5-rc.2](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.2) · [v0.1.5-rc.1](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.1) · [npm dist-tags](https://registry.npmjs.org/@deepseek-ai/dsh) · [官方 README](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.zh.md)

---

## ④ 使用技巧（偏向「怎么用」）

### 技巧 1 · 用 `headless` profile 做无人值守定时任务

- **一句话**：`dsh --profile headless "任务描述"` 能在无界面环境下跑完整 agent 回合，stdout 只出最终结果、进度走 stderr，适合挂计划任务。
- **怎么做**：

  ```powershell
  $env:DSH_PERMISSION_MODE = 'workspace-write'
  dsh --profile headless "读取并严格执行 造化仪表盘/reports/dsh-daily/_data/<日期>.prompt.md，生成今日 DSH 日报。"
  ```

  配合 `造化仪表盘/tools/dsh-report/register-dsh-daily-task.ps1 -Action install` 注册 Windows 计划任务。
- **对你的价值**：仪表盘与工作台——日报、板块数据刷新这类「固定动作」可以完全离线自动跑，你只看结果。

### 技巧 2 · 把右侧 Sidebar 当「第二屏」，产物直接交付预览

- **一句话**：模型可以**显式交付文件**到右侧 Sidebar，支持 Markdown / 代码高亮 / HTML / PDF / 图片，多标签、分栏、全屏，还能用默认应用打开或在文件管理器中定位。
- **怎么做**：让 agent 完成任务后交付产物路径（例如 `造化仪表盘/reports/造化坊仪表盘.html`）；在 Sidebar 里切换标签对照查看；需要编辑时右键「用默认应用打开」。
- **对你的价值**：AI 美术产线——参考图、规格 PDF、Godot 截图与文档可以在同一屏并排比对，不用来回切资源管理器。

### 技巧 3 · 写插件 / 改 worktable 前，先对齐 0.1.5 的插件面板 API

- **一句话**：0.1.5 起插件全局面板改由 `sidebar.panellist` 与 `main` 注册，原 `conversation` Slot 迁成 `main` 下的 `conversation` key。
- **怎么做**：在自己的插件 `dsh.plugin.json` / 客户端入口里按新 API 注册面板；同时把 `ctx.agent` 改为显式传入 Agent、`Inbox` 只当类型用（通过 `agent.inbox` 读写）。
- **对你的价值**：仪表盘与工作台——worktable 的本地优化改动要跟着这套 API 走，否则 0.1.5 上加载失败，也会拖住以后的升级。

### 技巧 4 · 用 `/feedback` 提 bug（rc.2 起有确认弹窗）

- **一句话**：反馈可独立提交，不必继续对话；rc.2 起点赞 / 点踩都先弹窗确认，提交失败会保留已填内容。
- **怎么做**：在输入框输入 `/feedback`，写明明细；或对某条回答直接点赞 / 点踩并在弹窗里确认。提交会附带相关会话内容。
- **对你的价值**：小红书自媒体 / 游戏开发——遇到「选择文件夹窗口不置前」这类宿主缺陷时，能一条带上下文的反馈发上去，比截图描述有效。

### 技巧 5 · Session 已升 V3：升级前备份，别指望降级

- **一句话**：受支持的旧日志会迁移成新版日志并**保留原文件**，但升级后的会话**不支持降级读取**。
- **怎么做**：升级 `dsh` 前先复制一份 `~/.dsh/sessions/`；自定义日志读取脚本要按 `session-format-v2-to-v3/README.zh.md` 适配。
- **对你的价值**：仪表盘与工作台——`sessions/` 不在 git 同步范围内（dsh-harness 便携包也不含它），风险可控，但**别在升级后再把 DSH 降级回去**。

---

## ⑤ 今天可以试一下

1. **修掉日报工具链的路径错位**：`run-dsh-daily.ps1` 生成的提示词让 headless 把报告写回 `_data/<日期>.prompt.md`（被 gitignore 的中间文件），而脚本真正读取的是 `reports/dsh-daily/<日期>.md`——把模板里的 `%%PROMPT_REL_PATH%%` 改指日报正文路径，看是否能让自动链路一次跑通。
2. **给 worktable 做一次「预备 diff」**：下载 v0.3.3 的 tgz 解包，与 `造化仪表盘/tools/dsh-harness/plugins/dsh-worktable` 对比，把本地改动列成清单（先不替换），为将来升级铺路。

---

## ⑥ 与本仓库的联动

- **本日报工具链**在 `造化仪表盘/tools/dsh-report/`，产出在 `造化仪表盘/reports/dsh-daily/`，并可经仪表盘 `/board/` 静态服务直接读（`http://127.0.0.1:3456/board/dsh-daily/`）。本期发现提示词路径与脚本读取路径不一致（见 ⑤-1），属工具链自身待修项。
- **`dsh-harness` 便携包**：worktable 的升级取舍见第 ② 节；便携包本身不同步 `sessions/`，Session V3 升级不影响跨机器同步。
- **本机 profile 新增 `headless`**：与本日报的自动生成链路一致；对应便携包 `造化仪表盘/tools/dsh-harness/profiles/` 下目前只有 `web` / `desktop` 两个 profile —— 若希望换机器后也能自动出日报，需要把 headless profile 也纳入便携包。
- **`dsh-worktable` 本地版仍是 0.3.0**：上游 0.3.3 未声明兼容 0.1.5-rc.1，暂不升级。

---

## ⑦ 附录：数据源与失败项

**数据源**

- 本机文件系统：`~/.dsh/settings.yaml`、`~/.dsh/profiles/*/package.json`、`~/.dsh/sessions/`、仓库 `dsh-worktable` 包
- npm registry：`@deepseek-ai/dsh` 的 `dist-tags`（本机采集 + `registry.npmjs.org` 复核）
- GitHub Releases API：`deepseek-ai/deepseek-harness`、`Aisland-SJL/dsh-worktable`
- 官方 README：`deepseek-ai/deepseek-harness` 的 `README.zh.md`

**采集异常**

| 项 | 级别 | 说明 |
| --- | --- | --- |
| `web_fetch` | warn | GitHub Releases 网页版首次抓取失败，已改用 `.atom` 与 Releases API 取到同日数据，结论不受影响 |
| `web_fetch` | warn | 第三方实践文章 ofox.ai 抓取失败，本期未采用任何媒体报道，全部结论来自官方一手来源 |

**未采集项（有意）**

- 任何 API Key / `.credentials.yaml` 内容 —— 只报「是否已配置」的布尔值。
