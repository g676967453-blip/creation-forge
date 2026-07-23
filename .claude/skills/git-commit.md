# /提交 — Git 提交并推送到 GitHub

## 触发
用户说 "/提交" 或 "提交代码" 或 "提交并推送" 或 "推到 GitHub"

## 执行步骤

### 1. 检查
- 执行 `git status`
- 用人话解读：改了哪些文件、新增/删除/修改各多少
- 标注异常情况（如嵌套 Git 仓库、大文件）

### 2. 确认
- 展示变更摘要，等待用户确认
- 用户可指定排除某些文件

### 3. 提交
- 按约定式提交格式生成 commit message（中文描述）
  ```
  feat: 做了什么
  fix: 修复了什么
  docs: 文档更新
  refactor: 重构
  chore: 杂项
  ```
- 尾部附加 `Co-Authored-By: Claude <noreply@anthropic.com>`
- 执行 `git add -A && git commit -m "..."`

### 4. 推送（可选）
- 用户说"推"后执行 `git push`
- 如远程有新提交：`git pull --rebase` → 重试 `git push`
- 如认证失败：提醒用户检查 Token/SSH Key

## 约束
- AI 不主动 commit，必须用户确认
- 不提交 `.gitignore` 中的文件
- 不提交 Token/API Key/密码
- 推送前展示要推的内容

> 完整流程见 [docs/workflows/Git-提交推送.md](../docs/workflows/Git-提交推送.md)
