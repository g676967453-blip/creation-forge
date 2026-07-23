# GitHub — 常用操作

## 创建仓库

1. 打开 [github.com/new](https://github.com/new)
2. 填 Repository name（如 `creation-forge`）
3. **不要**勾选 "Add a README"（本地已有时）
4. 点 Create repository
5. 复制页面上的远程地址（`https://github.com/用户名/仓库名.git`）

## 连接本地仓库

```bash
# 添加远程
git remote add origin https://github.com/用户名/仓库名.git

# 首次推送
git push -u origin main
```

## 克隆仓库

```bash
# 把远程仓库下载到本地
git clone https://github.com/用户名/仓库名.git
cd 仓库名
```

## 日常同步

```bash
git pull    # 拉取远程更新（开始工作前）
git push    # 推送本地修改（完成工作后）
```

## 查看仓库

- 代码：`github.com/用户名/仓库名`
- Issue：`github.com/用户名/仓库名/issues`
- 提交历史：`github.com/用户名/仓库名/commits/main`

## 常见问题

### push 被拒绝？

通常是远程有新提交你没拉取：
```bash
git pull --rebase
git push
```

### 认证失败？

GitHub 不再支持密码登录，需要用：
- **Personal Access Token**（Settings → Developer settings → Tokens）
- 或 **SSH Key**（推荐，配一次永久用）
