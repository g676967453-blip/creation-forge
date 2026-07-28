# 03 — 开发工作流

## 日常开发循环

```
   ┌──────────────────────────────┐
   │  1. 写代码 (或让AI写)         │
   │  2. 浏览器自动刷新看效果      │
   │  3. 不满意 → 回到1            │
   │  4. 满意 → git commit         │
   └──────────────────────────────┘
```

---

## 创建新游戏项目

### 方式一：手动复制模板

```bash
# 1. 确定项目位置

#    original  → projects/originals/<名称>
#    sandbox   → projects/sandbox/<名称>
#    独立游戏  → projects/GAME-XXX/<名称>（如 GAME-002/开仙门）

# 2. 复制模板（以 Phaser 为例）
cp -r templates/game-phaser projects/<项目路径>

# 3. 修改 package.json
#    把 "name" 改成 "@creation-forge/<项目名>"
#    更新 "description"

# 4. 安装依赖
cd projects/<项目路径>
npm install

# 5. 启动开发
npm run dev
```

### 方式二：使用脚手架脚本

```bash
npm run scaffold
```

按提示选择项目类型、输入名称即可。

---

## Git 工作流

### 分支策略

```
main ← 始终稳定可运行
  ├── feature/<描述>  ← 新功能
  ├── learn/<主题>    ← 学习项目
  ├── fix/<描述>      ← Bug修复
  └── jam/<名称>      ← 快速原型
```

### 分支示例

```bash
# 开始一个新功能
git checkout -b feature/player-double-jump

# 开始一个学习项目
git checkout -b learn/phaser-physics

# 修复一个 bug
git checkout -b fix/collision-offset

# 48小时 Game Jam
git checkout -b jam/weekend-roguelike
```

### 提交规范

遵循约定式提交 (Conventional Commits)，使用中文描述：

```
<type>: <简短描述>

[可选的详细说明]

[可选引用]
```

**类型 (type)：**

| Type       | 用途     | 示例                           |
| ---------- | -------- | ------------------------------ |
| `feat`     | 新功能   | `feat: 添加玩家双跳能力`       |
| `fix`      | Bug修复  | `fix: 修复碰撞检测偏移`        |
| `docs`     | 文档     | `docs: 更新Phaser配置说明`     |
| `refactor` | 重构     | `refactor: 提取输入管理模块`   |
| `test`     | 测试     | `test: 添加玩家移动单元测试`   |
| `chore`    | 杂项     | `chore: 升级Phaser到3.85`      |
| `learn`    | 学习笔记 | `learn: 完成Arcade物理学习`    |
| `journal`  | 学习日志 | `journal: 添加7月15日学习日志` |
| `assets`   | 资源     | `assets: 添加主角精灵图`       |

### 提交示例

```
feat: 实现玩家二段跳功能

添加空中状态检测和跳跃次数限制。
使用 Phaser 键盘事件系统实现。

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 代码审查清单

每次提交或合并前自查：

- [ ] 代码能跑（`npm run dev` 无报错）
- [ ] 格式化通过（`npm run format:check`）
- [ ] Lint 通过（`npm run lint`）
- [ ] 测试通过（`npm test`，如果有测试的话）
- [ ] 新功能有注释说明
- [ ] 项目 README 已更新（如果加了新功能）
- [ ] 学习日志已写（如果是学习项目）

---

## AI 协作节奏

### 开始一个新任务时

1. 先跟 AI 讨论方案（协作者模式）
2. 确定方案后让 AI 快速出代码（加速器模式）
3. 遇到不懂的让 AI 解释（导师模式）
4. 完成后简单复盘

### 遇到困难时

1. 先描述你期望的行为和实际的行为
2. 提供错误信息（控制台输出、截图）
3. 让 AI 先用导师模式解释可能的原因
4. 自己尝试修复
5. 实在不行再让 AI 直接修复

### 会话结束时

- 让 AI 更新 CLAUDE.md 中的「当前任务上下文」
- 写学习日志（哪怕只写 5 分钟）
- Commit 所有变更
