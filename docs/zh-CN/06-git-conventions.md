# 06 — Git 提交规范

> **本页 = Git 分支命名与提交格式的权威约定。**  
> 工具教程：[../tool-guides/git/01-git-intro.md](../tool-guides/git/01-git-intro.md) · 提交推送流程：[../workflows/Git-提交推送.md](../workflows/Git-提交推送.md)

## 分支策略

```
main
├── feature/<描述>   # 新功能开发
├── learn/<主题>     # 学习项目
├── fix/<描述>       # Bug修复
└── jam/<名称>       # Game Jam / 快速原型
```

### 分支命名规则

- 使用小写字母和连字符 (`-`)
- 中文描述使用简短的关键词
- 示例：
  - `feature/player-combat-system`
  - `learn/phaser-physics-basics`
  - `fix/tilemap-collision`
  - `jam/48h-space-shooter`

---

## 提交规范

采用约定式提交 (Conventional Commits)，格式：

```
<type>: <简短中文描述>

[可选的详细说明 — 做了什么、为什么这么做]

[可选 — 引用相关 issue 或文档]
```

### 类型 (type)

| Type       | 用途               | 示例描述                           |
| ---------- | ------------------ | ---------------------------------- |
| `feat`     | 新功能（产品代码） | `feat: 实现玩家双跳能力`           |
| `fix`      | Bug 修复           | `fix: 修复碰撞检测Y轴偏移`         |
| `docs`     | 文档变更           | `docs: 添加Phaser配置参数说明`     |
| `refactor` | 重构（不改功能）   | `refactor: 提取输入管理到独立模块` |
| `test`     | 测试相关           | `test: 为玩家移动添加单元测试`     |
| `chore`    | 构建/依赖/工具     | `chore: 升级Phaser到3.85.0`        |
| `learn`    | 学习笔记           | `learn: 完成Arcade物理引擎学习`    |
| `journal`  | 学习日志           | `journal: 添加2026-07-15学习日志`  |
| `assets`   | 资源文件           | `assets: 添加主角跑动精灵图`       |
| `style`    | 格式调整           | `style: 统一场景文件缩进`          |

### 好的提交示例

```
feat: 实现玩家空中二段跳

- 添加 airJumps 状态追踪剩余跳跃次数
- 最大跳跃次数可在 PlayerConfig 中配置
- 落地时重置跳跃次数
- 添加跳跃音效播放
```

```
fix: 修复主角与平台碰撞时卡住的问题

原因: 碰撞体的 offset 在动画切换时没有同步更新
修复: 在 setTexture() 后重新调用 body.setSize()
```

```
learn: 完成Phaser Tilemap使用方式学习

笔记包含:
- 用 Tiled 编辑器创建地图
- 在 Phaser 中加载和渲染 tilemap
- 设置瓦片碰撞属性
- 动态修改瓦片（破坏、收集）

详见: 造化仪表盘/works/2026-07-16-xxx.md
```

### 不好的提交示例

```
❌ update
❌ fix bug
❌ WIP (work in progress)
❌ 改了一些东西
❌ 啊啊啊终于修好了
```

---

## AI 协作署名

当 Claude 参与大量代码编写时，在提交信息末尾加上：

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 合并策略

- 个人项目使用 `git merge`（保留完整历史）
- 学习项目可以 `squash merge`（保持 main 历史整洁）
- 永远不要 force push 到 main

---

## 提交频率建议

| 场景         | 频率                     |
| ------------ | ------------------------ |
| 活跃开发     | 每 30-60 分钟提交一次    |
| 实验/探索    | 随时提交，不要求代码完美 |
| 学习项目     | 每个学习点提交一次       |
| 完成一个功能 | 立即提交                 |
