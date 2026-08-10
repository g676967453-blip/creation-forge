---
date: 2026-08-06
ai: codex
type: 设计
status: 完成
tags: [interaction-spec-system, resource-export, background]
---

# [2026-08-06] 补充全屏背景资源出图规则

---

## 📋 问题解决日志

### 遇到了什么

资源出图规范已定义图标安全区，但缺少全屏背景的固定画布、适配基准、核心内容安全区，以及避免程序压缩的专用命名后缀。

### AI 怎么协作的

用户提供全屏背景出图和命名示意图，明确 `1334 x 1750` 输出尺寸、中心点适配、居中 `1334 x 750` 核心内容区，以及 `_ignore` 防压缩后缀。Codex 将其整理为可执行的工程交付规则，并同步到设计系统总则。

### 产出结果

- 在 [工程资源命名与导出规范](../projects/interaction-spec-system/docs/engineering/export-and-naming.md) 新增全屏背景出图章节。
- 在 [设计系统总则](../projects/interaction-spec-system/docs/design-system.md) 补充摘要规则。
- 明确背景主体与关键视觉信息必须处于居中核心区，延展区仅放置可裁切的弱装饰。
- 新增 `sp_` 资源包命名表，全屏背景强制使用 `sp_base_<功能>_ignore`。
- 补充通用资源、按钮用途代号、按钮尺寸后缀和资源类型词典。
- 补充多语言资源后缀：微信、意大利、葡萄牙、西班牙、英语、法语、德语与按需添加的中文后缀。
- 将全部截图规则完整汇总到 `design-system.md` 的“06 资源管理”章节，作为设计系统内的直接查阅入口。
- 将资源管理内容同步到 `design-system-preview.html`，拆分为出图安全区、全屏背景、资源包命名、按钮命名、多语言和交付变更六个预览页。

### 关联项目

support / interaction-spec-system
