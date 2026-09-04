# 🧭 造化仪表盘（板块1 · 中枢）

造化坊五板块自治结构的**中枢**：个人日程/任务管理 + 检测各板块工作变动 → 工作日志 + Git 管理。平台规则见根 [CLAUDE.md](../CLAUDE.md)。

## 板块文件地图

| 路径 | 内容 |
|------|------|
| [目标规划.md](目标规划.md) | 长期目标（AI原生五维）+ 季度项目（PNAS）+ 已归档目标 |
| [个人待办.md](个人待办.md) | 主美/小红书/游戏/造化坊/日常等六类待办 + 周度归档 |
| [works/](works/) | 全仓工作日志（一事一记 + 视频草案）— 2026-09-04 起从根 `works/` 迁入 |
| [reports/](reports/) | 仪表盘 HTML 等生成物 |
| [data/](data/) | 仪表盘数据文件（goals-issues / goals-ai / assets / external JSON） |
| [tools/](tools/) | 仪表盘工具链 + dsh-harness 开发辅助 |

## 仪表盘（网页）

**站点**：https://g676967453-blip.github.io/creation-forge/（GitHub Pages，每小时自动更新）

**本地运行**：

```bash
# 生成静态 HTML（无需服务器即可查看 reports/造化坊仪表盘.html）
npx tsx 造化仪表盘/tools/generate-dashboard.ts

# 本地服务（支持网页里「完成/取消任务」秒级写盘 + /api/activity 变动监控）
npx tsx 造化仪表盘/tools/dashboard-server.ts   # → http://127.0.0.1:3456
```

页面结构：**🧭 板块总览**（五板块 git 变动卡片 + 近期工作日志，默认页）→ 📋 任务 / 🎯 目标 / 📌 项目 / ⚙️ 工作流 / 📚 知识库 / 🗂️ 资产地址。

## 给新 AI 的速记

- 日志写 [works/](works/)，命名 `YYYY-MM-DD-[ai标签]-简述.md`（模板 [_template.md](works/_template.md)）
- 数据源是 Markdown/JSON，HTML 只是视图 —— 改数据改源文件，改完 `/update-dashboard` 重新生成
- 多 AI 修改目标规划/个人待办/collect-data 前先在 [.ai-locks/](../.ai-locks/) 上锁
