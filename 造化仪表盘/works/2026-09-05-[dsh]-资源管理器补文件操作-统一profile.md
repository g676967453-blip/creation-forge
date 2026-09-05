---
date: 2026-09-05
ai: dsh
type: 功能修复
status: 完成
tags: [dsh-worktable, 资源管理器, 文件操作, profile 统一, DSH]
---

# [2026-09-05] 工作台资源管理器：补齐全套文件操作（统一到本地优化版）

> 📌 本文件存放于 `造化仪表盘/works/`；文件名 = `YYYY-MM-DD-[dsh]-简述.md`。

---

## 📋 问题解决日志

### 遇到了什么

用户反馈工作台里资源管理器"无法操作文件"，要求补基础操作（新建/重命名/删除/复制/粘贴/复制路径/打开系统目录等）。

排查结论：机器上存在**两套 dsh-worktable**，而运行 GUI 加载的是缺功能的那套：

| 副本 | 位置 | 版本 | 资源管理器能力 |
|------|------|------|----------------|
| 官方残缺版（原运行实例） | `~/.dsh/profiles/web/node_modules/dsh-worktable` | GitHub 0.3.1 | 只读目录树，无文件操作 |
| 本地优化完整版（另两份在用） | `~/.dsh/plugins-cache/dsh-worktable` + repo + desktop junction | 0.3.0 本地优化 | 右键新建/重命名/删除/复制/粘贴/复制路径/打开系统目录 + 可编辑地址栏 + 服务端 `rm/rename/copy/open-path` |

desktop profile 的 node_modules 本就是 junction → plugins-cache（完整版），唯独 web profile 装的是 GitHub 官方 0.3.1（残缺），而运行 GUI 恰好从 web profile 加载 → 表现为"没有文件操作"。

### AI 怎么协作的

1. 抓运行实例 `/plugins/dsh-worktable/client.js` 与各磁盘副本逐字节 SHA1 比对，确认加载源 = web profile 的 0.3.1。
2. 对比两套 client/server 能力：残缺版服务端只有 `fs/mkdir/write/git/...`，完整版另有 `rm/rename/copy/open-path/workspaces` 路由与右键菜单 UI。
3. 修复：把 web profile 的 `node_modules/dsh-worktable` 目录替换为 **junction → `plugins-cache/dsh-worktable`**（与 desktop 一致），备份官方 0.3.1 到 `~/.dsh/worktable-backup-v031` 供回滚。
4. 校验：语法通过；运行 GUI 提供的 bundle == plugins-cache（SHA1 B488… 一致）；repo 权威副本与 plugins-cache 逐字节一致（此前补丁随附）。

### 产出结果

- `~/.dsh/profiles/web/node_modules/dsh-worktable` → junction → `plugins-cache/dsh-worktable`（本地优化完整版，含全套文件操作 + 可编辑地址栏 + 目录记忆 + pickFolder 兜底）
- `~/.dsh/worktable-backup-v031`：官方 0.3.1 备份（如需回滚）
- 生效方式：完全退出 DSH Desktop（含托盘）重开（服务端新路由 `rm/rename/copy/open-path` 需重启才注册）

### 关联项目

- 平台层 dsh-harness（dsh-worktable 本地优化版）

---

## 🎬 视频生产草案（三幕结构）

### 第一幕：遇到了什么问题

- 核心问题：资源管理器只能看不能操作文件
- 表面认知：功能缺失 → 实际是机器上跑着新旧两套插件，运行 GUI 加载了残缺的官方版
- 为什么难发现：两套插件目录名相同、看起来都对，只有 SHA1 能区分

### 第二幕：AI 怎么协作解决的

- 用 SHA1 逐字节定位运行实例真正加载的 bundle（web profile 0.3.1 官方残缺版）
- 对比两套 client/server 路由与 UI 能力
- 把 web profile 统一为 junction → plugins-cache 完整版，备份旧版可回滚

### 第三幕：效果展示

- 最终效果：资源管理器右键即可 新建/重命名/删除/复制/粘贴/复制路径/打开系统目录，地址栏可编辑且记住上次目录
- 学到的关键点：同一插件多份副本时，先 SHA1 锁定运行实例加载的是哪一份再改

### 一句话总结（金句候选）

> 文件操作没失效，是 GUI 加载了'残缺版'——多副本环境先按哈希认亲。

### 配图/视频素材清单

- [ ] 资源管理器右键菜单（新建/重命名/删除/复制…）截图
- [ ] web/desktop/plugins-cache 三副本 SHA1 比对表

---

_日志日期：2026-09-05 | AI：dsh（DeepSeek Harness）_
