# Git 提交推送

> 版本：v1 | 最后更新：2026-07-21 | 对应 SKILL：`/git-commit`

## 触发条件

- 用户说 `/git-commit` 或 "提交代码" 或 "推到 GitHub"
- 一次会话结束前

## 人机分工

| 步骤 | 人 | AI |
|------|-----|-----|
| 1. 检查变更 | — | `git status` 列出所有改动 |
| 2. 确认 | 扫一眼改了什么，确认提交 | — |
| 3. 提交 | — | `git add -A` + 生成 commit message + `git commit` |
| 4. 推送 | 可选：说"推" | `git push` |

## 执行步骤

### 1. 检查变更

AI 执行 `git status`，以人话解读：改了哪些文件、新增了什么、删除了什么。

### 2. 确认

用户确认后继续。如有不想提交的文件，告诉 AI 排除。

### 3. 提交

AI 按 [约定式提交](https://www.conventionalcommits.org/zh-hans/) 生成 message：

```
feat: 做了什么
fix: 修复了什么
docs: 更新了什么
refactor: 重构了什么
```

生成后展示给用户，确认后执行 `git add -A && git commit -m "..."`。

### 4. 推送

用户说"推"后执行 `git push`。如果失败（远程有新提交），先 `git pull --rebase` 再推。

## 产出物

- Git commit（本地）
- 远程仓库同步（GitHub）

## 约束与规则

- **AI 不主动 commit**：除非用户说"提交"，AI 只检查不执行
- **commit message 中文描述**：`feat: 中文说明`
- **推送前确认**：AI 展示要推的内容，用户确认后执行
- **不提交敏感文件**：`.gitignore` 中的文件、Token、API Key
- **GAME-002 变更**：GAME-002 的文件也在同一仓库中，正常提交

## 关联

- 提交规范：[../zh-CN/06-git-conventions.md](../zh-CN/06-git-conventions.md)
- 工具知识：[../tool-guides/git/](../tool-guides/git/)
- 远程仓库：[github.com/g676967453-blip/creation-forge](https://github.com/g676967453-blip/creation-forge)
