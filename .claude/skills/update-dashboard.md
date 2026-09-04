---
description: 仪表盘更新：检查 造化仪表盘/tools/collect-data.ts 数据一致性 → 更新过时数据 → 生成 HTML 仪表盘（侧栏导航 · 默认任务页）。当用户说"仪表盘更新""更新仪表盘""更新数据"时使用。
---

# /update-dashboard — 仪表盘更新

## 触发
用户说 `/update-dashboard` 或 "仪表盘更新" 或 "更新仪表盘"

## 执行步骤

### 1. 检查来源
仪表盘页签（侧栏，**无总览**；默认打开 **任务**）：
- **任务（默认）**：个人待办 6 分类 + 周度归档 + 顶部 mini-stats（原总览数字）
- **目标**：活跃目标 + 已归档 + 系统问题 + AI 建议
- **项目**：projects/*/project.json + PROGRESS
- **工作流**：workflows + SKILL 仓库
- **知识库**：工具指南
- **资产地址**：内部路径 + 外部平台

数据：`造化仪表盘/个人待办.md`、`造化仪表盘/目标规划.md` 等动态解析；硬编码仅 goalsIssues/goalsAI 等需人工校对。

### 2. 更新脚本
- 发现过时硬编码 → 告知用户 → 修改 `造化仪表盘/tools/collect-data.ts`
- 动态数据（SKILL/造化仪表盘/works/Git）自动采集

### 3. 生成
```bash
npx tsx 造化仪表盘/tools/generate-dashboard.ts
# 输出 造化仪表盘/reports/造化坊仪表盘.html
```

### 4. 本地发布（唯一推荐；不经 GitHub 写网页）
```bash
npx tsx 造化仪表盘/tools/dashboard-server.ts
# http://127.0.0.1:3456
# POST /api/tasks/complete|cancel|archive  → 直接写本地 造化仪表盘/个人待办.md
```
- **不要**再用浏览器 GitHub Token / Contents API 改待办或「发布」仪表盘。
- 静态打开 `造化仪表盘/reports/造化坊仪表盘.html` 仅只读浏览；完成/取消/归档需本地服务。

### 5. 验证
打开本地服务：默认 **任务** 页；侧栏导航；无「操作说明」按钮行。

## 与 /todo 联动
- **记录/完成/取消/归档任务后**，`/todo` **默认**执行本生成步骤（用户可说「跳过仪表盘」关闭）。
- 无需每次手动说「更新仪表盘」，除非只改了目标/项目等非待办数据。

## 约束
- HTML 是衍生文件；权威源是 MD + collect-data
- 布局与交互改动在 `造化仪表盘/tools/generate-dashboard.ts`；任务写文件在 `造化仪表盘/tools/todo-file.ts`
- 网页端任务操作 **仅本地 API**，不经 Git

> 完整流程见 [docs/workflows/仪表盘更新.md](../../docs/workflows/仪表盘更新.md)
