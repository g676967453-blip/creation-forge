---
date: 2026-09-04
ai: claude
model: grok-4.5
type: 工作记录
status: 完成
tags: [docs, 知识库, 信息架构, 导航]
---

# [2026-09-04] docs 知识库结构分析与优化落地

---

## 📋 问题解决日志

### 遇到了什么

`docs/` 分区在、但发现性差：无总入口、zh-CN 混宪法与领域长文、workflows README 漏登、Pixso 断链、建项路径过时、认知点无索引。

### AI 怎么协作的

1. 盘点 docs 体量与交叉主题  
2. 计划模式输出分析 + 分阶段方案并获批  
3. 按阶段 A + 索引制 B 落地（不物理大迁 IAA 正文）

### 产出结果

- `docs/README.md` — 总导航（30 秒选桶 + 主从表）  
- `docs/zh-CN/README.md` · `docs/knowledge/README.md` · `docs/specs/README.md`  
- `docs/personal-work-records/00-认知点索引.md`  
- `docs/workflows/README.md` — 六域全量索引  
- 修复：`tool-guides/README` Pixso、`zh-CN/03-workflow` 扁平 projects、`06-git` 权威声明、`en` 非双语、`index.html` 页签文案  

### 关联项目

造化坊基础设施 · 文档治理

---

## 🎬 视频生产草案（三幕结构）

### 第一幕：遇到了什么问题

- 核心问题：知识在，但找不到、对不上、链是断的。  
- 如果没有 AI 会怎样：靠记忆翻目录，多 AI 会话重复踩坑。

### 第二幕：AI 怎么协作解决的

- 先地图与严重度，再「索引优先、少搬家」。  
- 总 README + knowledge 注册表 + 认知点索引 + 工作流全量表。

### 第三幕：效果展示

- 打开 `docs/README.md` 30 秒到正确桶。  
- workflows 文件数与表一致；Pixso/建项路径已修。

### 一句话总结（金句候选）

> 知识库的第一问题不是少写，是少入口。

### 配图/视频素材清单

- [ ] docs 目录树前后对比  
- [ ] 总导航「30 秒选桶」表截图  
- [ ] workflows 六域分组截图  
