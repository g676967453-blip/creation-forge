# DSH 信息日报 · 2026-09-11

> 报告期：2026-09-10 ~ 2026-09-11（第 2 期） ｜ 生成方式：自动（`dsh --profile headless` + 联网检索） ｜ 数据源：本机文件系统 + npm registry + GitHub Releases
> 采集时间：2026-09-11 06:52 (+08:00)

本期上游只多了一件小事：**`v0.1.5-rc.2`**（09-10 23:09 +08:00 发布，纯体验打磨、无破坏性变更），本机 CLI 仍停在 npm `latest = 0.1.5-rc.1`，**本体不用动**；真正值得动手的仍只有 `dsh-worktable` 0.3.0 → 0.3.3，而且**必须先 diff**。仓库这边，日报工具链已随 `62dd942` 入库，生成提示词的目标路径也已指向日报正文——上一期 ⑤-1 的路径错位已修好。

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
| 活跃会话数 | 2（存储：`session_projcache`、`workspace.json`） |
| 插件 | `dsh-worktable` **0.3.0**（仓库内本地优化版，上游最新 0.3.3） |
| 仓库状态 | `main` @ `62dd942`（2026-09-11），未提交改动 13 项 |

**一句话结论**：DSH 本体已是最新、不用动；真正有更新价值的是 worktable 插件——但仓库里是本地优化版，**必须先 diff 再升级，不能直接覆盖**。

---

## ② 更新与变更提醒

### 1. DSH 本体 —— 无需升级（`updateAvailable: false`）

- 本机 `0.1.5-rc.1` 就是 npm `latest`，**已是最新**；npm registry 复核结果一致（`latest = 0.1.5-rc.1`、`next = 0.1.5-rc.2`、`alpha = 0.1.5-alpha.2`）。
- `next` / `alpha` 都是预发布通道，**不建议**日常切过去。若确实想试 `rc.2`：

  ```sh
  npm i -g @deepseek-ai/dsh@next
  ```

  **风险**：预发布版不保证稳定；Session 格式为 V3，**升级后的会话不支持降级读取**。升级前先备份 `~/.dsh/sessions/`，升级后完整退出并重启 `dsh` 才生效。

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
   另：上游明确说明「选择文件夹窗口不置前」是 **DSH 宿主的已知缺陷**，不是插件问题。

**要升级时的命令**（先备份仓库内本地版）：

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

> 报告期内（09-10 ~ 09-11）**没有比 `v0.1.5-rc.2` 更新的发布**：Releases feed 最后一次更新停在 09-10，本期无新增版本。

### 与你直接相关的变更

- **`v0.1.5-rc.2`（本期唯一新增）**：点赞 / 点踩都要经弹窗确认才提交，失败时保留已填内容并提示 —— 提 bug 更不容易手滑，也不会白填。
- **`v0.1.5-rc.2`**：交付文件卡片排版、对话间距、代码文件图标重做，产物更易辨认、界面更紧凑 —— 对天天看 `reports/*.html`、Godot 场景文件的人直接可感。
- **本机两个 profile**（`headless` + `web`）：配合 0.1.5 起 headless 默认文件工具为 `read` / `write` / `edit`，才有本日报的自动生成链路。

### 需要注意的破坏性 / 行为变更

- **本期（rc.2）无新增破坏性变更**，只是体验打磨。
- rc.1 的三条仍然生效，升级 / 写插件前要记住：**Session 格式 V3**（升级后不支持降级读取）、**headless/SDK/ACP 默认 `read`/`write`/`edit`**、**插件 API 调整**（移除 `ctx.agent`；`Inbox` 变类型接口；Web 面板改走 `sidebar.panellist` 与 `main`）。
- **Windows 相关修复值得知道**：本地非终端子进程不再弹控制台窗口；Windows 盘符根目录 Workspace 的路径校验已修；原生文件夹选择器「不置前」问题仍是宿主已知缺陷（见 worktable v0.3.3 说明）。

来源：[v0.1.5-rc.2](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.2) · [v0.1.5-rc.1](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.5-rc.1) · [Releases feed](https://github.com/deepseek-ai/deepseek-harness/releases.atom) · [npm dist-tags](https://registry.npmjs.org/@deepseek-ai/dsh) · [dsh-worktable v0.3.3](https://github.com/Aisland-SJL/dsh-worktable/releases/tag/v0.3.3)

---

## ④ 使用技巧（偏向「怎么用」）

### 技巧 1 · 用 `headless` profile 做无人值守定时任务

- **一句话**：`dsh --profile headless "任务描述"` 能在无界面环境下跑完整 agent 回合，stdout 只出最终结果、进度走 stderr，适合挂计划任务。
- **怎么做**：

  ```powershell
  $env:DSH_PERMISSION_MODE = 'workspace-write'
  dsh --profile headless "读取并严格执行 造化仪表盘/reports/dsh-daily/_data/<日期>.prompt.md，生成今日 DSH 日报。"
  ```

  配合 `造化仪表盘/tools/dsh-report/register-dsh-daily-task.ps1 -Action install` 注册 Windows 计划任务，`-Action status` 查上次结果码。
- **对你的价值**：仪表盘与工作台——日报、板块数据刷新这类「固定动作」可以完全离线自动跑，你只看结果。本期这份日报就是这条链路跑出来的。

### 技巧 2 · 把右侧 Sidebar 当「第二屏」，产物直接交付预览

- **一句话**：模型可以**显式交付文件**到右侧 Sidebar，支持 Markdown / 代码高亮 / HTML / PDF / 图片，多标签、分栏、全屏，还能用默认应用打开或在文件管理器中定位。
- **怎么做**：让 agent 完成任务后交付产物路径（例如 `造化仪表盘/reports/造化坊仪表盘.html`）；在 Sidebar 里切换标签对照查看；需要编辑时右键「用默认应用打开」。
- **对你的价值**：AI 美术产线——参考图、规格 PDF、Godot 截图与文档可以在同一屏并排比对，不用来回切资源管理器。

### 技巧 3 · 参考资料一律「拖进来」，不限类型

- **一句话**：Web 支持上传任意类型文件，文件与图片在同一预览区混排，后台上传有进度、可取消、切会话仍续显。
- **怎么做**：把 PDF 规格、参考图、Godot 场景文件直接拖进输入框；文件会存到本地路径，模型可用文件工具按需读取，而不是一次性全塞进上下文。
- **对你的价值**：IAA / 概念设计工作流的参考文档可以一次性投喂，不用先转格式；需要时再让模型按路径精读，省 token。

### 技巧 4 · 养成看「会话统计」的习惯，把成本管住

- **一句话**：统计拆成了「轮次与速度」和「精确 Token 与缓存命中」两个摘要。
- **怎么做**：点开会话统计，重点看缓存命中率——命中高说明上下文前缀稳定；重复读文件、乱改系统提示词都会拉低它（0.1.5 起动态改系统提示词已不破坏 KV Cache，但模型需显式声明支持）。
- **对你的价值**：日报这类周期性任务最容易悄悄烧 token，有数字才能判断要不要降级成 `-NoLlm`（零 token，只出硬事实）。

### 技巧 5 · 写插件 / 改 worktable 前，先对齐 0.1.5 的插件面板 API

- **一句话**：0.1.5 起插件全局面板改由 `sidebar.panellist` 与 `main` 注册，原 `conversation` Slot 迁成 `main` 下的 `conversation` key。
- **怎么做**：在自己的插件 `dsh.plugin.json` / 客户端入口里按新 API 注册面板；同时把 `ctx.agent` 改为显式传入 Agent，`Inbox` 只当类型用（通过 `agent.inbox` 读写）。
- **对你的价值**：仪表盘与工作台——worktable 的本地优化改动要跟着这套 API 走，否则 0.1.5 上加载失败，也会拖住以后的升级。

---

## ⑤ 今天可以试一下

1. **给 worktable 做一次「预备 diff」**：下载 v0.3.3 的 tgz 解包，与 `造化仪表盘/tools/dsh-harness/plugins/dsh-worktable` 对比，把本地改动列成清单（**先不替换**），为将来升级铺路。
2. **跑一次日报全链路自检**：用 `run-dsh-daily.ps1 -Force` 重跑，确认生成提示词里的目标路径已指向 `reports/dsh-daily/<日期>.md`（本期已确认修好），并核对报告正文确实被覆盖写入而不是落到 `_data/`。

---

## ⑥ 与本仓库的联动

- **日报工具链已入库**：仓库 head 是 `62dd942`「[dsh] feat: DSH 信息日报——首期基线 + 每工作日自动推送」，产出在 `造化仪表盘/reports/dsh-daily/`，可经仪表盘 `/board/` 静态服务直接读（`http://127.0.0.1:3456/board/dsh-daily/`）。
- **上一期的路径错位已修好**：`run-dsh-daily.ps1` 用 `%%REPORT_REL_PATH%%` → `造化仪表盘/reports/dsh-daily/<日期>.md` 生成提示词，本期提示词的目标路径与脚本读取路径一致（上一期 ⑤-1 可结案）。
- **`dsh-harness` 便携包**：worktable 的本地优化版仍是 0.3.0，上游 0.3.3 未声明兼容 0.1.5-rc.1，**暂不升级**。便携包不同步 `sessions/`，Session V3 升级不影响跨机器同步。
- **headless profile 尚未进便携包**：本机 `~/.dsh` 已有 `headless`，但 `造化仪表盘/tools/dsh-harness/profiles/` 下目前只有 `web` / `desktop` —— 若希望换机器后也能自动出日报，需要把 `headless` profile 也纳入便携包。
- **工作区未提交改动 13 项**：日报工具链入库后仍有未提交内容，建议按板块拆开提交，别让日报相关的中间产物混进来。

---

## ⑦ 附录：数据源与失败项

**数据源**

- 本机文件系统：`~/.dsh/settings.yaml`、`~/.dsh/profiles/*/package.json`、`~/.dsh/sessions/`、仓库 `dsh-worktable` 包
- npm registry：`@deepseek-ai/dsh` 的 `dist-tags`（本机采集 + `registry.npmjs.org` 复核，结果一致）
- GitHub Releases API：`deepseek-ai/deepseek-harness`、`Aisland-SJL/dsh-worktable`（经 `.atom` feed 取到完整条目）
- 仓库工具链：`造化仪表盘/tools/dsh-report/`（提示词模板与目标路径核对）

**采集异常**

| 项 | 级别 | 说明 |
| --- | --- | --- |
| `web_fetch` | warn | GitHub Releases 网页版返回被导航内容占满、有效条目不可读，已改用 `releases.atom` 取到完整发布说明，结论不受影响 |
| `web_search` | warn | 第三方技术媒体文章（阿里云开发者社区、腾讯云社区、163 等）时效与来源无法核验，本期**未采用**任何媒体报道，全部结论来自官方一手来源 |

**未采集项（有意）**

- 任何 API Key / `.credentials.yaml` 内容 —— 只报「是否已配置」的布尔值。
