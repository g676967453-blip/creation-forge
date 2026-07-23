---
description: 同步汇报说明书 Excel：检查 generate-report.ts 数据一致性 → 更新过时数据 → 生成 Excel。当用户说"同步报告""更新 Excel""汇报说明书"时使用。
---

# /sync-report — 同步汇报说明书 Excel

## 触发
用户说 `/sync-report` 或 "同步汇报说明书" 或 "更新 Excel 报告"

## 执行步骤

### 1. 检查来源
- 读取 `tools/generate-report.ts`
- 检查以下硬编码段是否与当前状态一致：
  - 简介 Sheet：项目描述、版本号
  - 近期动态 Sheet：works/ 文件是否都有描述（自动提取，通常无需维护）
  - 任务看板：任务列表
  - 架构层：项目结构描述
  - 项目地址 Sheet：路径列表

### 2. 更新脚本
- 发现过时数据 → 告知用户 → 修改 `generate-report.ts`

### 3. 生成
- **检查锁文件**：检测 `reports/~$*.xlsx`（Windows Excel 临时文件）
  - 存在 → 提示 "Excel 仍打开中，请关闭后重试"，**停止**
  - 不存在 → 继续
- 执行 `npx tsx tools/generate-report.ts`

### 4. 验证
- 生成成功后，提示用户打开 Excel 抽查关键 Sheet

## 约束
- Excel 文件打开时无法写入，必须先关闭
- Excel 是衍生文件，数据来源是 `generate-report.ts`
- works/ 描述自动从标题行提取，无需手动维护映射表

> 完整流程见 [docs/workflows/汇报说明书同步.md](../docs/workflows/汇报说明书同步.md)
