---
date: 2026-08-06
ai: codex
type: 交付
status: 完成
tags: [interaction-spec-system, 资源出图, engineering]
---

# [2026-08-06] 补充资源出图规范

---

## 📋 问题解决日志

### 遇到了什么

用户提供了一张“输出规则”截图，要求把图标切图尺寸、安全区和主体摆放规则补充到 `interaction-spec-system` 的资源出图内容中。

### AI 怎么协作的

Codex 读取了 `design-system.md` 的资源管理章节和 v2.1 内容补完计划，将截图中的规则整理为工程可执行文档，同时把摘要回写到主设计系统文档。

### 产出结果

1. 新增 `projects/interaction-spec-system/docs/engineering/export-and-naming.md`。
2. 新增 `projects/interaction-spec-system/docs/engineering/README.md`。
3. 在 `projects/interaction-spec-system/docs/design-system.md` 的资源管理章节补充图标出图规则。
4. 更新 `PROGRESS.md`、`STATUS.md`、`project.json` 和 `docs/README.md` 的状态说明。

### 关联项目

造化坊 / interaction-spec-system

---

## 🎬 视频生产草案（三幕结构）

### 第一幕：遇到了什么问题

- 核心问题：设计系统里已有资源命名，但缺少真正可执行的出图尺寸和安全区规则。
- 为什么这是个问题：没有明确安全区时，同一批图标容易出现大小不一、贴边、主体偏移的问题。
- 如果没有 AI 会怎样：需要人工把截图规则转写成规范，还要同步到多个项目文档。

### 第二幕：AI 怎么协作解决的

- 我是这样问 AI 的：补充到资源出图。
- AI 给了什么方案：把截图规则整理为工程规范，并在主文档中加入摘要。
- 中间有什么调整/追问：不做测试，优先补内容。
- 最终方案是什么：资源出图规范独立成文，主文档保留可快速查阅的关键规则。

### 第三幕：效果展示

- 最终效果：图标出图明确为 `64 / 128 / 256` 三档，并补齐 `60 / 112 / 224` 安全区规则。
- 演示方式（截图/GIF/屏幕录制）：展示工程资源命名与导出规范。
- 学到的关键点：资源规范不只是命名，还要规定画布尺寸、安全区、倍率、状态图和交付清单。

### 一句话总结（金句候选）

> 好的 UI 资源规范，能让每一枚图标在进引擎前就站稳位置。

### 配图/视频素材清单

- [x] 用户提供的输出规则截图
- [ ] `export-and-naming.md` 文档截图
- [ ] `design-system.md` 资源管理章节截图

---

_模板版本：v1.0_
