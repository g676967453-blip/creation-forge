# DSH 信息日报

> 每个工作日自动采集「本机 DSH 环境硬事实 + 上游动态」，产出一份**偏向怎么用**的日报。
> 属于板块1（造化仪表盘）的产出物，权威数据是 Markdown，HTML 只是视图。

## 怎么看

| 方式 | 入口 |
| --- | --- |
| 仪表盘网页（推荐） | <http://127.0.0.1:3456/board/dsh-daily/>（需 dashboard-server 在跑） |
| 最新一期网页 | [index.html](./index.html) |
| 最新一期正文 | [latest.md](./latest.md) |
| 历史各期 | `YYYY-MM-DD.md` / `.html` |

> `dashboard-server` 未启动时：`npx tsx 造化仪表盘/tools/dashboard-server.ts`，或看 `造化仪表盘/tools/dsh-report/register-dsh-daily-task.ps1 -Action status`。

## 怎么手动生成

```powershell
cd <仓库根>\造化仪表盘\tools\dsh-report

# 正常生成（联网检索 + 整理，消耗少量 token）
powershell -NoProfile -ExecutionPolicy Bypass -File .\run-dsh-daily.ps1

# 强制重生成今天
powershell -NoProfile -ExecutionPolicy Bypass -File .\run-dsh-daily.ps1 -Force

# 只出硬事实，零 token（离线/省钱）
powershell -NoProfile -ExecutionPolicy Bypass -File .\run-dsh-daily.ps1 -NoLlm

# 只采集事实 + 生成提示词，不调用模型（调试）
powershell -NoProfile -ExecutionPolicy Bypass -File .\run-dsh-daily.ps1 -DryRun

# 指定日期
powershell -NoProfile -ExecutionPolicy Bypass -File .\run-dsh-daily.ps1 -Date 2026-09-12
```

## 自动化挂载

两种方式，可任选其一（互不冲突）：

| 方式 | 时间 | 权限 | 安装 |
| --- | --- | --- | --- |
| A · Windows 计划任务 | 周一~周五 **09:00** 精确触发 | **需管理员执行一次** | `-Action install`（管理员 PowerShell） |
| B · 登录启动文件夹 | 早上**首次登录后**补跑当天 | 无需管理员 | `-Action install-startup` |

```powershell
# 查看当前状态（两种方式 + 最新日报）
powershell -NoProfile -ExecutionPolicy Bypass -File .\register-dsh-daily-task.ps1 -Action status

# 立即跑一次
powershell -NoProfile -ExecutionPolicy Bypass -File .\register-dsh-daily-task.ps1 -Action run-now

# 卸载
powershell -NoProfile -ExecutionPolicy Bypass -File .\register-dsh-daily-task.ps1 -Action uninstall
powershell -NoProfile -ExecutionPolicy Bypass -File .\register-dsh-daily-task.ps1 -Action uninstall-startup
```

> ⚠️ 本机（`DESKTOP-UL74322`）实测**不允许非管理员进程创建计划任务**（`schtasks /create` 直接 `Access is denied`），
> 因此方式 A 必须在**管理员 PowerShell**里执行；否则请用方式 B。

## 目录结构

```text
造化仪表盘/reports/dsh-daily/
├── README.md            # 本文件（系列说明 + 索引）
├── index.html           # 最新一期网页（仪表盘入口指向这里）
├── latest.md            # 最新一期正文的稳定路径
├── YYYY-MM-DD.md        # 各期正文（权威数据）
├── YYYY-MM-DD.html      # 各期网页视图
├── _data/
│   ├── YYYY-MM-DD.json  # 采集器产出的硬事实（证据，入库）
│   └── YYYY-MM-DD.prompt.md  # 该期提示词（可再生，已 gitignore）
└── logs/                # 运行日志与 headless 输出（已 gitignore）
```

工具链在 `造化仪表盘/tools/dsh-report/`：

| 文件 | 作用 |
| --- | --- |
| `collect-dsh-env.mjs` | 零依赖采集器：本机 DSH 版本/模型/profile/插件 + npm registry 最新版 + 上游 release |
| `render-dsh-daily.mjs` | 零依赖 Markdown→HTML 渲染（仓库根无 markdown 库，故自写子集渲染） |
| `report-template.md` | 日报章节模板（提示词内嵌它，改模板即改日报结构） |
| `run-dsh-daily.ps1` | 编排：采集 → 提示词 → headless → 兜底 → 渲染 |
| `register-dsh-daily-task.ps1` | 计划任务 / 登录自启的安装、状态、卸载 |

## 各期索引

| 日期 | 生成方式 | 要点 |
| --- | --- | --- |
| [2026-09-10](./2026-09-10.md) | 手动（首期基线） | 钉死基线：DSH `0.1.5-rc.1`、模型 `deepseek-flash`、worktable 0.3.0→0.3.3 有更新 |
| [2026-09-11](./2026-09-11.md) | 自动（headless） | 上游补发 `v0.1.5-rc.2`；并发现日报工具链输出路径 bug（已修） |

## 设计要点

- **硬事实与联网内容分离**：版本/模型/环境由采集器确定性产出，断网也出报告；联网检索只负责「动态」和「怎么用」。
- **零密钥**：只报凭据「是否存在」的布尔值，永不读写密钥内容。
- **幂等**：当天报告已存在则直接跳过，重复触发安全。
- **兜底三级**：headless 写出正文 → 用 headless stdout 落盘 → 仅硬事实报告。
- **报告只写仓库内路径**：无人值守时 `workspace-write` 沙箱才放行。

## 已知事项

- 本期工具链的提示词输出路径曾误指 `_data/<日期>.prompt.md`，2026-09-11 已修复为 `reports/dsh-daily/<日期>.md`。
- `headless` profile 目前只在本机 `~/.dsh/profiles/` 存在；若要让**换机器后也能自动出日报**，需要把它补进 `造化仪表盘/tools/dsh-harness/profiles/`。
- 日报**不会自动执行任何升级**，只报告并给命令，由人决定。
