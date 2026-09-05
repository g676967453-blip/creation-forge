---
name: project-板块盘体系
description: 板块2-5 独立生成式仪表盘体系（2026-09-05 落地）：collect-data.ts 导出签名被板块盘只读复用，改动前必须兼容
metadata:
  type: project
---

板块2-5 各有独立仪表盘（2026-09-05 落地，A-G 七批提交 84bb7e6→a11699f）。

- 产物：`造化仪表盘/reports/板块{2,3,4,5}-*.html`（自包含单文件，file:// 直开；dashboard-server `/board/` 亦可看，主盘侧栏有「本机模式」入口条）
- 刷新：仓库根 `npx tsx 造化仪表盘/tools/generate-board-dashboards.ts`（可带 b2|b3|b4|b5 单盘）
- 生成器：`造化仪表盘/tools/board-dashboard-lib.ts` + `board{2,3,4,5}-dashboard.ts`
- 唯一人工数据源：`asset-pipeline/dashboard-data.json`（b4 盘消费，改后刷 b4）；其余数据全部生成时实时采集各板块权威文件

**Why:** 主盘 CI 每小时跑 collect-data/generate-dashboard，板块盘只读 import 其导出函数（loadProjectProgress/loadWorkflowsFromDocs 等）——改 collect-data 时动导出签名会让板块盘崩。
**How to apply:** 改 `造化仪表盘/tools/collect-data.ts` 前仍按锁协议；改后跑一次 `npx tsx 造化仪表盘/tools/generate-board-dashboards.ts` 确认 4 盘仍生成成功。相关：[[project-项目结构]]
