# Git — 常用操作

## 基本工作流

```bash
# 1. 看看改了什么
git status

# 2. 把所有改动加入暂存区
git add -A

# 3. 提交，写好描述
git commit -m "feat: 添加了什么功能"

# 4. 推送到远程（GitHub）
git push
```

## 日常操作速查

### 查看

```bash
git status              # 当前有哪些文件改动了
git diff                # 具体改了什么内容
git log --oneline       # 提交历史（精简版）
```

### 分支

```bash
git branch              # 列出本地分支
git branch <name>       # 新建分支
git checkout <name>     # 切换到某分支
git merge <name>        # 把某分支合并到当前分支
```

### 撤销

```bash
git checkout -- <file>  # 撤销单个文件的修改（未 add）
git reset HEAD <file>   # 取消暂存
git reset --soft HEAD~1 # 撤销最近一次 commit（保留修改）
```

### 远程

```bash
git remote -v           # 查看远程仓库地址
git remote add origin <url>  # 添加远程仓库
git push -u origin main      # 首次推送并建立跟踪
git pull                # 拉取远程更新
```

## 提交规范

本项目使用 [约定式提交](https://www.conventionalcommits.org/zh-hans/)：

```
feat: 添加玩家跳跃功能
fix: 修复碰撞检测偏移
docs: 更新 README
refactor: 重构输入系统
chore: 更新依赖
```

> 详细规范见 `docs/zh-CN/06-git-conventions.md`
