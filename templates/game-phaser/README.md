# Phaser 游戏模板

这是造化坊的 Phaser.js 游戏项目模板。复制此目录即可快速开始一个新游戏项目。

## 包含内容

- ✅ Phaser 3 游戏配置（Arcade 物理引擎）
- ✅ BootScene 启动场景
- ✅ Vite 开发服务器（HMR 热更新）
- ✅ TypeScript 严格模式
- ✅ Vitest 测试框架
- ✅ 全局配置文件 (config.ts)

## 使用方式

```bash
# 复制模板
cp -r templates/game-phaser projects/originals/01-my-game

# 安装依赖
cd projects/originals/01-my-game
npm install

# 启动开发
npm run dev
```

## 目录结构

```
src/
├── main.ts          # 入口：Phaser Game 创建和配置
├── config.ts        # 游戏常量（宽高、重力等）
└── scenes/          # 游戏场景
    └── BootScene.ts # 启动场景（从这里开始写代码）
```

## 下一步

1. 在 `scenes/` 下创建新场景（如 MenuScene.ts, PlayScene.ts）
2. 在 `main.ts` 中注册新场景
3. 从 BootScene 跳转到你的第一个场景
