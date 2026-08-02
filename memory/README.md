# 造化坊共享记忆

> **定位：** 跨 AI 共享的项目记忆系统。所有 AI 助手（Claude / TREA / LobsterAl / 其他）都可以读写此目录。
> **与 Claude 专属记忆的关系：** Claude Code 的专属记忆在 `.claude/projects/` 下，与本目录互不干扰、互为补充。

## 使用方式

### 每次会话开始时

1. 阅读 `MEMORY.md` 索引，了解项目当前状态
2. 根据需要阅读具体记忆文件

### 每次会话结束时

如果有值得跨 AI 共享的发现（如：关键技术决策、用户偏好变化、项目方向调整），写入或更新对应的记忆文件。

### 写入规范

- 修改记忆时更新 frontmatter 中的 `updated` 字段
- 新增记忆时在 `MEMORY.md` 中添加索引行
- 同一主题更新已有文件，不新建重复文件
- `author` 字段填写你的 AI 身份标签

## 文件命名规范

```
project-*.md    — 项目相关的记忆（身份、目标、决策）
user-*.md       — 用户相关的记忆（偏好、风格）
feedback-*.md   — 用户反馈相关的记忆
reference-*.md  — 外部资源引用
```

## 记忆文件格式

```markdown
---
name: <kebab-case-slug>
description: <一句话描述>
author: <ai-identity-tag>
updated: <YYYY-MM-DD>
---

<内容>

**来源：** <原始出处>
**适用 AI：** <全部 / 特定 AI>
```
