# /同步报告 — 同步汇报说明书 Excel

## 触发
用户说 "/同步报告" 或 "同步汇报说明书" 或 "更新 Excel 报告"

## 执行步骤

### 1. 检查来源
- 读取 `tools/generate-report.ts`
- 检查以下硬编码段是否与当前状态一致：
  - 简介 Sheet：项目描述、版本号
  - 近期动态 Sheet：`workDescs` 映射表（works/ 文件是否有新增但无描述？）
  - 任务看板：任务列表
  - 架构层：项目结构描述
  - 项目地址 Sheet：路径列表

### 2. 更新脚本
- 发现过时数据 → 告知用户 → 修改 `generate-report.ts`
- works/ 新增了文件但 `workDescs` 缺少 → 自动补充描述
- 项目结构有变动 → 同步更新架构层描述

### 3. 生成
- 提示用户关闭 Excel 文件
- 执行 `npx tsx tools/generate-report.ts`
- 如果 EBUSY 报错，提醒用户关闭 Excel 后重试

### 4. 验证
- 生成成功后，提示用户打开 Excel 抽查关键 Sheet

## 约束
- Excel 文件打开时无法写入，必须先关闭
- Excel 是衍生文件，数据来源是 `generate-report.ts`
- works/ 新增日志 → 必须同步更新 `workDescs` 映射表

> 完整流程见 [docs/workflows/汇报说明书同步.md](../docs/workflows/汇报说明书同步.md)
