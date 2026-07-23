# Git — 人机协作

## AI 能帮你做什么

| 场景 | 人的操作 | AI 的操作 |
|------|---------|----------|
| 提交代码 | 告诉 AI "提交" | 自动 `git add -A` + 生成规范的 commit message + `git commit` |
| 查看历史 | 问 AI "最近改了什么" | 执行 `git status` / `git diff` / `git log`，用人话解读 |
| 撤销修改 | 说 "撤销刚才那个改动" | 根据情况执行 `git checkout` / `git reset` |
| 创建分支 | 说 "开个新分支做 XXX" | `git checkout -b feature/xxx` |
| 推送 | 说 "推到 GitHub" | `git push`，遇到冲突会提示你解决 |
| 解决冲突 | 判断保留哪边的修改 | AI 展示冲突内容，你决定后 AI 执行合并 |

## 协作原则

1. **AI 不主动 commit** — 除非你说"提交"。AI 改完代码后会提醒你检查，不会偷偷帮你交
2. **commit message 由 AI 生成，由人确认** — AI 按约定式提交格式自动写 message，你扫一眼对不对
3. **push 前先确认** — 推送到远程意味着公开，AI 会先展示要推的内容
4. **出了问题不要慌** — Git 几乎不会真正丢失数据。告诉 AI 发生了什么，它帮你排查

## 典型协作对话

```
你：帮我把今天的改动提交了
AI：(检查 git status) 今天改了 A、B、C 三个文件，我生成的 commit message 是：
    "feat: 小红书项目4库结构重组 + GAME-002接入"
    确认提交吗？

你：确认
AI：(执行 git add -A && git commit -m "...") 已提交。要推送到 GitHub 吗？

你：推
AI：(执行 git push) 推送成功 ✅
```

## 注意事项

- `.gitignore` 里的文件不会被 Git 跟踪。AI 不会动它们
- 如果 AI 执行 Git 命令报错，它会解释错误原因并给出修复方案
- 大文件（>100MB）不适合放 Git，用 Git LFS 或放别处
