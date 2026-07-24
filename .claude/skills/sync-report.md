---
description: 同步汇报说明书 Excel：检查 generate-report.ts 数据一致性 → 更新过时数据 → 生成 Excel。当用户说"同步报告""更新 Excel""汇报说明书"时使用。
---

# /sync-report — 同步汇报说明书 Excel

## 触发
用户说 `/sync-report` 或 "同步汇报说明书" 或 "更新 Excel 报告"

## 执行步骤

### 1. 检查来源
Excel 按三层管理体系组织（6 Sheet）。检查 `tools/generate-report.ts` 中的数据：
- **系统总览**：基本信息、系统指标（SKILL/工作流/工具/日志数量）
- **项目状态**：每个项目的状态、进度、本周产出、阻塞项
- **工作流清单**：所有工作流的版本、SKILL、状态
- **近期动态**：works/ 日志自动提取（无需手动维护）
- **任务看板**：任务列表
- **资产地址**：三层路径索引

### 2. 更新脚本
- 发现过时数据 → 告知用户 → 修改 `generate-report.ts` 中对应该 Sheet 的硬编码数据

### 3. 生成
- 执行 `npx tsx tools/generate-dashboard.ts`
- 输出：`reports/造化坊仪表盘.html`（独立 HTML，浏览器直接打开）

### 4. 验证
- 生成成功后，提示用户打开 Excel 抽查关键 Sheet

## 约束
- Excel 文件打开时无法写入，必须先关闭
- Excel 是衍生文件，数据来源是 `generate-report.ts`
- works/ 描述自动从标题行提取，无需手动维护映射表

> 完整流程见 [docs/workflows/汇报说明书同步.md](../docs/workflows/汇报说明书同步.md)
