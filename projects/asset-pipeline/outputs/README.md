# 资产产出目录

所有项目通过 Lovart 生成的 AI 美术资产集中存放在此。

## 目录结构

```
outputs/
└── {项目名}/
    ├── portraits/      ← 角色原画（胸像/半身像/全身像）
    ├── sprites/        ← 游戏内精灵表（敌人/角色/NPC）
    ├── icons/          ← 图标（技能/物品/建筑）
    ├── vfx/            ← 特效帧动画
    └── ui/             ← UI 元素
```

## 命名规范

```
{项目标识}_{资产类型}_{角色/物体}_{变体}.png

示例：
- GAME-002_portrait_sword-master_bust.png
- GAME-002_sprite_enemy-rush_sheet.png
- GAME-002_icon_form-sword.png
```

## 各游戏项目如何引用

```gdscript
# Godot 示例
var portrait = load("res://../../asset-pipeline/outputs/GAME-002/portraits/GAME-002_portrait_sword-master_bust.png")
```

或直接复制到游戏项目的 `assets/` 目录（推荐用于发布版本）。

## 已接入项目

| 项目 | 目录 | 状态 |
|------|------|------|
| GAME-002 开仙门 | `outputs/GAME-002/` | 🟢 活跃 |
