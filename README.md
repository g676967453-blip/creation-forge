# 造化坊 (Creation Forge)

**AI 时代的新学习思想**：定一个你想做的项目 → 遇到问题 → 学需要的知识 → 解决问题 → 完成。
独立游戏开发是「做中学」的实践场 —— 匠心造化，万物可成。

> 📖 理念宣言：[docs/zh-CN/manifesto.md](docs/zh-CN/manifesto.md) ｜ 协作与运转规则：[CLAUDE.md](CLAUDE.md)

## 单仓五板块 + 平台共享层（2026-09-04 起）

| 板块 | 路径 | 职责 | 入口 |
|------|------|------|------|
| 1 · 中枢 | [造化仪表盘/](造化仪表盘/) | 个人日程/任务/工作日志 + 仪表盘（五板块变动监控） | [造化仪表盘/README.md](造化仪表盘/README.md) |
| 2 · 项目库 | [projects/](projects/) | 所有独立游戏与工具项目 | [projects/README.md](projects/README.md) |
| 3 · 知识库 | [docs/](docs/) | 纯知识文档 | [docs/README.md](docs/README.md) |
| 4 · 美术制作 | [asset-pipeline/](asset-pipeline/) | AI 美术生产线 | [asset-pipeline/CLAUDE.md](asset-pipeline/CLAUDE.md) |
| 5 · 自媒体 | [xiaohongshu/](xiaohongshu/) | 小红书内容生产 | [xiaohongshu/CLAUDE.md](xiaohongshu/CLAUDE.md) |

平台共享层：`CLAUDE.md` · `AI_COLLABORATION.md` · `memory/`（跨 AI 记忆）· `.ai-locks/` · `.claude/` · `templates/` · `shared/` · `tools/`

## 仪表盘

📊 仪表盘为**本机模式**：GH Pages 在线站点已于 2026-09-06 下线（网页不再公开），部署 workflow `deploy-dashboard.yml` 已删除。查看方式：

- 主盘 + 板块盘静态页：`造化仪表盘/reports/`（file:// 双击即开）
- 本地服务：`npx tsx 造化仪表盘/tools/dashboard-server.ts` → http://127.0.0.1:3456（含任务完成/取消 API、`/board/` 板块盘）
