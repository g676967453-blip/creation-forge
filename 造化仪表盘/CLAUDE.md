# CLAUDE.md - 板块1 · 造化仪表盘（中枢）

> 五板块架构的一部分。平台规则见根 [CLAUDE.md](../CLAUDE.md) 与 [AI_COLLABORATION.md](../AI_COLLABORATION.md)。本文件只定义板块1 的操作方式。

## 板块职责

**个人日程/任务管理 + 检测各板块工作变动 → 工作日志 + Git 管理。**

- 全仓**唯一**的工作日志区、个人待办区、目标规划区、仪表盘数据区
- 仪表盘从 git 层监控各板块目录变动（见 [tools/collect-data.ts](tools/collect-data.ts) 的 BOARDS 注册表）
- 目标/待办/日志的「权威数据」都是 Markdown / JSON 文件，仪表盘 HTML 只是视图

## 板块内权威数据

| 文件 | 内容 | 写权限 |
|------|------|--------|
| [目标规划.md](目标规划.md) | 长期目标（AI原生五维）+ 季度项目（PNAS） | 需锁（多 AI） |
| [个人待办.md](个人待办.md) | 六类待办活跃区 + 周度归档 | 需锁（多 AI） |
| [works/](works/) | 工作日志（一事一记 + 视频草案），命名 `YYYY-MM-DD-[ai标签]-简述.md` | 各 AI 写自己的 |
| [reports/](reports/) | 仪表盘 HTML（`造化坊仪表盘.html`）等生成物 | 工具生成 |
| [data/](data/) | 仪表盘数据文件：goals-issues / goals-ai / assets / external（*.json） | 需锁（collect-data 数据源） |
| [tools/](tools/) | 仪表盘工具链（collect-data / generate-dashboard / dashboard-server / todo-file / new-journal + dsh-harness/） | collect-data.ts 需锁 |

## 日常操作（中枢循环）

1. **检测变动** — 打开仪表盘「🧭 板块」总览页，或问 AI「各板块有什么变动」；`/api/activity` 返回各板块最近提交/未提交数
2. **写日志** — 每次解决问题/完成交付，一事一记写入 [works/](works/)（模板见 [works/_template.md](works/_template.md)）
3. **登记待办/目标** — 发现要做的事先落 [个人待办.md](个人待办.md)，季度级进 [目标规划.md](目标规划.md)
4. **Git 提交纪律** — 完成一块即提交（中文 conventional commit）；移动/改名用物理 `mv` + `git add -A`（勿用 `git mv`，会漏被忽略文件）；提交 footer 带各自 AI 签名

## 仪表盘工具链

| 命令 | 作用 |
|------|------|
| `npx tsx 造化仪表盘/tools/generate-dashboard.ts` | 生成 `reports/造化坊仪表盘.html`（静态页） |
| `npx tsx 造化仪表盘/tools/dashboard-server.ts` | 本地服务 http://127.0.0.1:3456（任务完成/取消 + `/api/activity`） |
| `/update-dashboard` | SKILL：检查数据源 → 更新脚本 → 重新生成 |

- **依赖**：本板块无独立 package.json；tsx 解析自仓库根 node_modules —— **禁止在本板块 `npm i`**
- **CI**：`.github/workflows/deploy-dashboard.yml` 每小时（cron）+ push 触发，用 `npx --yes tsx` 自包含生成并部署 GH Pages
- **新增/改名板块**必须同步登记 [collect-data.ts](tools/collect-data.ts) 的 `BOARDS` 注册表（`dir` + `legacyPaths` 历史回溯别名）—— git rename 不回溯历史，漏登记会让板块统计失真（见 data/goals-issues.json I13）

## 边界与依赖

- **数据单向下沉**：板块2–5 引用板块1 的日志等只能读；板块1 引用其它板块内容（项目 PROGRESS、docs 工作流文档等）也按只读处理
- **跨板块引用**一律显式相对链接；历史日志（B2 迁移前提交）中的旧路径链接不逐条回改——它们指向的历史位置已不存，但提交历史不可改写
- 修改本板块共享文件（目标规划/个人待办/collect-data.ts/data/*.json）前先查 [.ai-locks/](../.ai-locks/) 并按 AI_COLLABORATION 锁协议执行
