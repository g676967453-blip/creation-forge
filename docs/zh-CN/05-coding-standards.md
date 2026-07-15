# 05 — 编码规范

## TypeScript

### 严格模式

所有项目必须启用 TypeScript strict mode：

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 命名规范

| 类型               | 风格             | 示例                                 |
| ------------------ | ---------------- | ------------------------------------ |
| 类 / 组件          | PascalCase       | `PlayerSprite`, `GameScene`          |
| 接口               | PascalCase       | `PlayerConfig`, `GameState`          |
| 类型别名           | PascalCase       | `PowerUpType`                        |
| 函数 / 方法        | camelCase        | `calculateDamage()`, `handleInput()` |
| 变量 / 常量        | camelCase        | `playerSpeed`, `maxHealth`           |
| 枚举               | PascalCase       | `GamePhase`                          |
| 枚举成员           | UPPER_SNAKE_CASE | `GamePhase.LOADING`                  |
| 文件名（组件/类）  | PascalCase       | `BootScene.ts`                       |
| 文件名（工具函数） | camelCase        | `math.ts`, `input.ts`                |
| 文件名（配置）     | kebab-case       | `vite.config.ts`                     |

### Interface vs Type

```typescript
// ✅ 优先使用 interface — 可扩展、有更好的错误提示
interface PlayerConfig {
  speed: number;
  jumpHeight: number;
  spriteKey: string;
}

// ✅ 需要 union/intersection 时用 type
type PowerUpType = 'speed' | 'shield' | 'double-jump';

// ✅ 组合类型
type GameObject = Player | Enemy | Collectible;
```

### 函数参数

```typescript
// ❌ 太多位置参数
function createPlayer(
  x: number,
  y: number,
  speed: number,
  jumpHeight: number,
  sprite: string,
  hp: number,
) {}

// ✅ 使用对象参数
interface CreatePlayerOptions {
  position: { x: number; y: number };
  speed: number;
  jumpHeight: number;
  spriteKey: string;
  hp?: number; // 可选参数有默认值
}

function createPlayer(options: CreatePlayerOptions) {
  const { position, speed, jumpHeight, spriteKey, hp = 100 } = options;
  // ...
}
```

### 避免 any

```typescript
// ❌
function process(data: any): any {
  return data.value;
}

// ✅
function process(data: unknown): unknown {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: unknown }).value;
  }
  throw new Error('Invalid data');
}
```

### 命名导出优先

```typescript
// ✅ 命名导出 — 利于 tree-shaking，import 时有智能提示
export class Player {}
export function lerp(a: number, b: number, t: number): number {}

// ⚠️ 默认导出 — 仅用于单一主要导出的模块（如场景文件）
export default class BootScene extends Phaser.Scene {}
```

### 注释

```typescript
// 注释用中文，解释「为什么」而非「是什么」

// ✅ 解释意图
// 使用 arcade 物理而非 matter.js，因为本游戏不需要复杂物理模拟
physics: {
  default: 'arcade',
}

// ❌ 复述代码
// 设置物理引擎为 arcade
physics: {
  default: 'arcade',
}
```

---

## Phaser

### 场景组织

每个场景一个文件：

```
src/scenes/
├── BootScene.ts      # 启动和资源预加载
├── MenuScene.ts      # 主菜单
├── PlayScene.ts      # 核心玩法
└── GameOverScene.ts  # 游戏结束
```

### 场景通信

```typescript
// ✅ 使用 scene.start 传递数据
this.scene.start('PlayScene', {
  level: 2,
  playerName: '小火',
});

// 在目标场景中接收
init(data: { level: number; playerName: string }): void {
  this.currentLevel = data.level;
  this.playerName = data.playerName;
}
```

### 避免 DOM 操作

```typescript
// ❌ 在 Phaser 场景中直接操作 DOM
document.getElementById('score')!.textContent = '100';

// ✅ 使用 Phaser 的 Text/UI 系统
this.scoreText = this.add.text(16, 16, '分数: 0', {
  fontSize: '32px',
  color: '#ffffff',
});
```

### update() 只放逻辑

```typescript
// ✅ update 中放游戏逻辑，渲染交给 Phaser
update(time: number, delta: number): void {
  this.player.update(delta);
  this.enemyManager.update(time);
  this.checkCollisions();
}

// ❌ 不要在 update 中手动调用渲染方法
```

---

## 通用

### 文件头注释（可选）

对于重要的文件：

```typescript
/**
 * BootScene.ts
 * 游戏启动场景 — 负责资源预加载和显示加载进度
 *
 * 创建日期: 2026-07-15
 * AI 协作: Claude 协助设计了资源加载的错误处理
 */
```

### 提交前检查

```bash
npm run format        # 格式化代码
npm run format:check  # 检查格式
npm run lint          # 代码质量检查
```

### 项目 README 模板

每个游戏项目必须包含 README.md：

```markdown
# 游戏名称

## 玩法概述

[一句话描述这个游戏]

## 操作方式

- 方向键: 移动
- 空格: 跳跃

## 学习目标

- [ ] Phaser 场景管理
- [ ] Arcade 物理引擎
- [ ] 精灵动画

## 开发笔记

[关键的技术决策和收获]

## AI 协作记录

[本次项目中 AI 如何协助了开发]
```
