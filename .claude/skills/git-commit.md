---
description: Git 提交并推送到 GitHub：检查变更 → 生成约定式提交 message → 等待确认 → commit → push。当用户说"提交代码""推到 GitHub""commit"时使用。
---

# /git-commit — Git 提交并推送到 GitHub

## 触发
用户说 `/git-commit` 或 "提交代码" 或 "提交并推送" 或 "推到 GitHub"

## 执行步骤

### 1. 检查
- 执行 `git status`
- 用人话解读：改了哪些文件、新增/删除/修改各多少
- 标注异常情况（如大文件、敏感文件）

### 2. 确认
- 展示变更摘要，等待用户确认
- 用户可指定排除某些文件

### 3. 提交
- 按约定式提交格式生成 commit message（中文描述），**必须带身份标签前缀**：
  ```
  [claude] feat: 做了什么
  [claude] fix: 修复了什么
  [claude] docs: 文档更新
  [claude] refactor: 重构
  [claude] chore: 杂项
  ```
- 尾部附加 `Co-Authored-By: Claude <noreply@anthropic.com>`
- 执行 `git add -A && git commit -m "..."`
- 提交前自查：commit message 首字符必须是 `[`（身份标签），缺少则补上再提交

### 4. 推送（可选）
- 用户说"推"后执行 `git push`
- 如远程有新提交：`git pull --rebase` → 重试 `git push`
- 如认证失败：提醒用户检查 Token/SSH Key

## 约束
- AI 不主动 commit，必须用户确认
- 不提交 `.gitignore` 中的文件
- 不提交 Token/API Key/密码

> 完整流程见 [docs/workflows/Git-提交推送.md](../docs/workflows/Git-提交推送.md)
