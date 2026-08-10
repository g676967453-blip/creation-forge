---
date: 2026-08-10
ai: claude
type: 问题修复
status: 完成
tags: [仪表盘, 归档, bug修复, 数据采集]
---

# [2026-08-10] 仪表盘归档bug修复

---

## 📋 问题解决日志

### 遇到了什么

仪表盘个人待办的周度归档功能存在 bug：已完成/已取消的任务归档后，原分类统计未正确刷新，导致「待办数」显示异常。

### AI 怎么协作的

1. 追踪 `collect-data.ts` 中 `loadPersonalTasks()` 和归档表解析逻辑
2. 确认根因：归档行解析时 `tableColumns` 判定依赖旧格式（6 列），新格式（8 列含 ABC+能量）导致列索引偏移，归档条目 `completedDate` 和 `hours` 字段为空
3. 修复方案：改为按 `cells.length` 动态判定格式（≥8 列 = 新格式），统一个人待办表格和归档表格的解析逻辑
4. 同时修复 `generate-dashboard.ts` 中工作流计数不一致问题（`countFiles()` 误将 README/变更日志/改进追踪计入）

### 产出结果

- [tools/collect-data.ts](tools/collect-data.ts) — `loadPersonalTasks()` 解析逻辑修复，`loadWorkflowsFromDocs()` 排除列表完善
- [tools/generate-dashboard.ts](tools/generate-dashboard.ts) — 工作流计数改为 `workflows.length` 而非 `countFiles()`
- [docs/index.html](docs/index.html) — 重新生成仪表盘

### 关联项目

造化坊系统层

---

_记录版本：v1.0 | 状态：完成_
