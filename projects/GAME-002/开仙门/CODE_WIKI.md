# 开仙门 - Code Wiki

> 180 度扇面防御 × 肉鸽塔防 × 修仙题材的 Godot 4.6 独立游戏
>
> 本文档基于源码静态分析生成，覆盖项目整体架构、模块职责、关键类与函数、依赖关系与运行方式。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈与运行环境](#2-技术栈与运行环境)
3. [项目目录结构](#3-项目目录结构)
4. [整体架构设计](#4-整体架构设计)
5. [核心模块职责](#5-核心模块职责)
6. [关键类与函数说明](#6-关键类与函数说明)
7. [数据流与配置系统](#7-数据流与配置系统)
8. [依赖关系](#8-依赖关系)
9. [项目运行方式](#9-项目运行方式)
10. [关键约束与编码规范](#10-关键约束与编码规范)

---

## 1. 项目概述

**开仙门** 是一款以修仙为题材的塔防肉鸽游戏。玩家扮演宗门掌门，通过修复 6 座山峰、激活 6 种功法、选择器灵开局，在 180 度扇面战场上抵御 15 波怪物进攻。

核心玩法循环：
- **经营阶段**：点击主殿（器灵）获取灵气 → 修复/升级山峰 → 激活功法
- **战斗阶段**：3 秒倒计时 → 15 波怪物从扇面外缘推进 → 主殿（器灵）自动攻击防御
- **肉鸽成长**：战斗中升级触发三选一卡牌（天赋树系统），最多 3 档叠加

---

## 2. 技术栈与运行环境

| 项 | 说明 |
|----|------|
| 游戏引擎 | Godot 4.6（`config/features=PackedStringArray("4.6")`） |
| 编程语言 | GDScript 2.x |
| 渲染管线 | `gl_compatibility`（兼容性渲染，启用 GPU 像素对齐） |
| 分辨率 | 1280 × 720，不可缩放，始终置顶 |
| 第三方插件 | `addons/auto_reload`（编辑器热重载，仅 MCP 协作流程用） |
| 数据格式 | CSV（运行时唯一数据来源，禁止 .tres） |
| 外部依赖 | 无（零第三方运行时依赖） |

---

## 3. 项目目录结构

```
开仙门/                          ← Godot 项目根（project.godot 所在）
├── project.godot                ← 引擎配置：主场景、Autoload、窗口、渲染
├── CLAUDE.md                    ← AI 协作规范（项目结构/数据流/约束）
├── icon.svg                     ← 项目图标
├── .gitignore                   ← 忽略 .godot/、*.import、*.uid
│
├── autoload/                    ← 全局单例（Autoload）
│   ├── csv_loader.gd            ← 通用 CSV 解析器
│   └── data_manager.gd          ← 全局数据管理器（统一配置入口）
│
├── scripts/                     ← 所有 GDScript
│   ├── managers/                ← 管理层（7 个 Manager）
│   ├── ui/                      ← UI 面板逻辑 + floating_text
│   ├── data/                    ← 数据资源类（Resource，全有 class_name）
│   ├── effects/                 ← 纯视觉特效
│   ├── _unused/                 ← 废弃脚本归档
│   ├── main_peak.gd             ← 主殿/器灵（核心战斗对象）
│   ├── enemy_base.gd            ← 敌人基类
│   ├── projectile.gd            ← 投射物（弹道/链式/循环剑）
│   ├── projectile_visual.gd     ← 投射物视觉绘制
│   ├── summon_fox.gd            ← 召唤物：灵狐
│   └── summon_artifact_sword.gd ← 召唤物：环绕法器剑
│
├── scenes/                      ← 所有 .tscn 场景
│   ├── main.tscn                ← 主入口（场景树根）
│   ├── ui/                      ← battle_hud / floating_text / repair_prompt_panel
│   ├── enemies/                 ← enemy_base
│   ├── peaks/                   ← mountain_click_area
│   ├── projectiles/             ← projectile
│   ├── effects/                 ← lightning_bolt
│   └── debug/                   ← psd_layers（PSD 图层合成的战场背景）
│
├── data/                        ← 运行时 CSV 配置（唯一数据来源）
│   ├── main_peak_config.csv     ← 器灵全局参数
│   ├── form_config.csv          ← 6 种功法
│   ├── form_level_config.csv    ← 功法逐级数值
│   ├── enemy_config.csv         ← 9 种敌人
│   ├── enemy_sprite_config.csv  ← 敌人精灵表
│   ├── card_config.csv          ← 28 张卡牌（分布4/5/5/5/5/4）
│   ├── peak_config.csv          ← 6 座山峰
│   ├── wave_config.csv          ← 15 波次配置
│   ├── spirit_profile_config.csv← 1 种器灵档案（百世书）
│   ├── mountain_sprite_map.csv  ← 山峰 PSD 图层名 → peak_id 映射
│   └── _unused_tres/            ← 废弃 .tres（不要新增）
│
├── assets/                      ← 美术资源
│   ├── _exported/               ← PSD 导出中间产物（含山峰/主殿/云朵图层）
│   └── runtime/                 ← 正式游戏资源
│       ├── enemies/             ← 敌人精灵表（.png）
│       └── projectiles/         ← 投射物贴图
│
└── addons/
    └── auto_reload/             ← 编辑器插件：外部修改热重载
```

> **工程外目录**（位于项目仓库根 `GAME-002/`）：
> `策划文档/`（GDD/需求/规划）、`程序规则/`（架构规范）、`总指挥-协作原则/`（SOP）、`美术制作/`、`开发日志/`。这些是设计与协作文档，不参与编译。

---

## 4. 整体架构设计

项目遵循**三层架构**（表现层 / 逻辑层 / 数据层），通过**信号（Signal）**解耦模块，以**有限状态机**驱动游戏流程。

### 4.1 三层架构

```
┌─────────────────────────────────────────────────────┐
│  表现层 (Presentation)                                │
│  scenes/*.tscn + scripts/ui/* + scripts/effects/*    │
│  负责：节点树、视觉绘制、输入交互、特效               │
├─────────────────────────────────────────────────────┤
│  逻辑层 (Logic)                                       │
│  scripts/managers/* + main_peak/enemy/projectile     │
│  负责：游戏状态机、经济、波次、卡牌、战斗循环         │
├─────────────────────────────────────────────────────┤
│  数据层 (Data)                                        │
│  autoload/* + scripts/data/* + data/*.csv            │
│  负责：CSV 加载、配置对象化、全局查询接口             │
└─────────────────────────────────────────────────────┘
```

### 4.2 场景树结构（main.tscn）

```
Main (Node2D)                         ← 场景根
├── Battlefield (Node2D)              ← 战场容器
│   ├── Background (ParallaxBackground)
│   │   ├── FarClouds / NearClouds    ← 视差云层
│   ├── PSD_Sprites (Node2D)          ← PSD 图层合成的山峰/背景（psd_layers.tscn 实例）
│   ├── MainPeak (Area2D)             ← 主殿/器灵（核心防御目标，position=640,650）
│   ├── Enemies (Node2D)              ← 敌人动态挂载点
│   └── Projectiles (Node2D)          ← 投射物动态挂载点
├── UI (CanvasLayer)                  ← 全部 UI
│   ├── MainPeakSelectPanel           ← 开局器灵选择
│   ├── RepairPromptPanel             ← 山峰修复/升级面板
│   ├── BattleHUD                     ← 战斗 HUD（波次/灵气/血量/能量）
│   ├── CardSelectionPanel            ← 战斗中三选一卡牌
│   ├── BattleStartButton             ← 开战按钮（右下）
│   ├── CountdownLabel                ← 倒计时文字
│   ├── SettingsButton                ← 设置按钮（左下，回到器灵选择）
│   └── ResultPanel                   ← 战斗结算
└── Managers (Node)                   ← 管理器容器
    ├── GameManager                   ← 总控（状态机入口，子管理器挂其下）
    │   ├── WaveManager
    │   ├── CardManager
    │   ├── EconomyManager
    │   │   ├── AutoSpiritTimer       ← 灵气自动产出定时器
    │   │   └── AutoDisplayTimer      ← 灵气飘字聚合定时器
    │   ├── BattleFlowController
    │   └── UIStateCoordinator
    └── MountainManager               ← 山峰管理（独立挂在 Managers 下）
```

### 4.3 游戏状态机（6 状态）

定义于 [game_manager.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/managers/game_manager.gd) `GameState` 枚举，由 [ui_state_coordinator.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/managers/ui_state_coordinator.gd) `set_state()` 驱动 10 个面板显隐：

```
INTRO  →  MAIN_PEAK_SELECT  →  PREPARATION  →  BATTLE  →  CARD_SELECTION  →  BATTLE  ...  →  GAME_OVER
(开场黑幕)    (选器灵)          (经营修复)      (战斗)     (升级三选一)        (继续战斗)      (结算)
                 ↑                                                                │
                 └────────────── return_to_preparation / restart_game ───────────┘
```

| 状态 | 可见面板 | 经济活跃 | 说明 |
|------|---------|---------|------|
| `INTRO` | IntroScreen | 否 | 开场黑幕世界观简介，点击/按键跳过 |
| `MAIN_PEAK_SELECT` | MainPeakSelectPanel | 否 | 开局选择器灵（当前 CSV 仅 1 种：百世书） |
| `PREPARATION` | BattleHUD, BattleStartButton, SettingsButton | 是 | 点击赚灵气、修复/升级山峰 |
| `BATTLE` | BattleHUD, SettingsButton | 否 | 3 秒倒计时后开战，15 波防守 |
| `CARD_SELECTION` | CardSelectionPanel（暂停游戏） | 否 | 战斗中升级三选一 |
| `GAME_OVER` | ResultPanel | 否 | 胜利/失败结算 |

---

## 5. 核心模块职责

### 5.1 数据层（Autoload 单例）

#### CsvLoader — [autoload/csv_loader.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/autoload/csv_loader.gd)
通用 CSV 解析器，单方法 `load_csv(path) -> Array[Dictionary]`。处理 BOM 头、空行、表头对齐。

#### DataManager — [autoload/data_manager.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/autoload/data_manager.gd)
**全局配置唯一入口**。`_ready()` 时加载全部 9 张 CSV 到内存字典/数组，提供 `get_*()` 查询接口。

| 字典字段 | 数据来源 | 元素类型 | 说明 |
|---------|---------|---------|------|
| `main_peak_config` | main_peak_config.csv | MainPeakConfig | 器灵全局参数（单例） |
| `peak_config_database` | peak_config.csv | PeakConfig | 6 座山峰 |
| `enemy_database` | enemy_config.csv | EnemyData | 9 种敌人 |
| `form_database` | form_config.csv | FormConfig | 6 种功法 |
| `form_level_database` | form_level_config.csv | Dictionary | 功法逐级数值（key=`form_id_level`） |
| `card_database` | card_config.csv | CardData | 卡牌天赋 |
| `spirit_profile_database` | spirit_profile_config.csv | SpiritProfileConfig | 1 种器灵档案（百世书） |
| `enemy_sprite_database` | enemy_sprite_config.csv | Dictionary | 敌人精灵表配置 |
| `wave_database` | wave_config.csv | WaveData | 15 波次（按 wave_index 聚合） |

### 5.2 逻辑层（Managers）

所有 Manager 挂在 `Managers/GameManager` 下（MountainManager 除外，挂 `Managers`）。GameManager 在 `_ready()` 中完成**全部信号接线**，是系统总装点。

#### GameManager — [scripts/managers/game_manager.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/managers/game_manager.gd)
- 定义 `GameState` 枚举、`spirit_changed` / `state_changed` 信号
- `_ready()`：取节点引用 → `setup()` 各子管理器 → 接线所有信号 → 初始化卡池/波次 → 进入 `INTRO`（开场黑幕，结束后转 `MAIN_PEAK_SELECT`）
- `_on_start_game_requested(profile_id)`：开局选器灵后应用加成（灵气/伤害/经验/HP/外观/等级）
- `_input()`：处理点击主殿赚灵气、点击山峰选中、ESC 重开（`INTRO` 下 ESC 留给开场黑幕作跳过）；F1 加速 / F2 无敌 / F3 触发升级（仅 debug）

#### WaveManager — [scripts/managers/wave_manager.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/managers/wave_manager.gd)
波次生成与生命周期。信号：`wave_changed` / `all_waves_completed` / `enemy_killed` 等。
- `start_battle()` → `start_next_wave()` → `_build_spawn_queue()`（打乱） → `_spawn_next_from_queue()`
- `_get_spawn_position(path_type)`：以 (640,380) 为圆心、半径 540，按 `straight/left_flank/right_flank` 在 160° 扇面随机生成
- 敌人到达主殿转 siege 模式；最后波 Boss 必须被击杀（不能仅到达）

#### CardManager — [scripts/managers/card_manager.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/managers/card_manager.gd)
卡牌池与天赋树。`draw_three_cards(active_form_ids)` 优先每功法各抽 1 张；`apply_card()` 累计天赋层数（最多 3 层），生成 `_t2`/`_t3` 后缀的 `effect_type`。

#### EconomyManager — [scripts/managers/economy_manager.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/managers/economy_manager.gd)
灵气经济 + 经验升级 + 卡牌选择流程。
- 灵气来源：点击主殿（`spirit_click_base`）、自动产出（`AutoSpiritTimer`，`spirit_auto_base`）
- `add_exp()`：累计经验 → 升级 → `_trigger_battle_upgrade()`（暂停游戏 + 抽 3 卡）
- `on_card_selected()`：应用卡牌，若多级升级未处理完则继续抽卡
- 修复/升级山峰的灵气扣费代理（调用 MountainManager）

#### BattleFlowController — [scripts/managers/battle_flow_controller.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/managers/battle_flow_controller.gd)
战斗生命周期：倒计时 → 波次 → 结算 → 返回经营。
- `start_battle()`：注入功法通道 `main_peak.set_attack_channels(form_ids, levels)`，应用伤害加成，3-2-1 倒计时
- `_process()`：战斗中每帧更新 HUD（敌数/血量/计时器/大招能量）
- `return_to_preparation()`：清场、重置波次、回血、重置进度
- `restart_game()`：`reload_current_scene()`

#### MountainManager — [scripts/managers/mountain_manager.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/managers/mountain_manager.gd)
山峰状态管理。通过 `mountain_sprite_map.csv` 将 `PSD_Sprites` 下的 `Sprite2D`（山峰01~06）绑定到 peak_id，并为每个山峰挂载 `CLICK_AREA` 点击区。
- 状态字典：`{sprite, area, repaired, form_id, level}`
- `repair_selected()`：修复 → 激活 `entry_form_id` → 视觉变亮
- `upgrade_selected()`：升级 level+1（受 `form.max_level` 限制）
- `get_all_activated_form_ids()`：战斗开战时收集所有已激活功法

#### UIStateCoordinator — [scripts/managers/ui_state_coordinator.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/managers/ui_state_coordinator.gd)
UI 状态机。`set_state(new_state)` 按 6 状态切换 10 个面板的 `visible`，并联动 `economy_manager.set_active()`、`battle_start_button.set_enabled()`。

### 5.3 运行时对象（表现层 + 逻辑混合）

#### MainPeak — [scripts/main_peak.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/main_peak.gd)
**最核心对象**。继承 `Area2D`，position=(640,650)，是玩家防御目标。
- `_attack_channels: Array[Dictionary]`：每通道 = 一个激活功法的完整运行时状态（含 40+ 字段：伤害/暴击/弹道/各类加成/天赋开关）
- `set_attack_channels(form_ids, levels)`：开战时构建通道，从 `form_level_config` 注入逐级数值与解锁效果（`double_shot`/`final_damage`/`attack_speed` 等）
- `_process()`：每通道计时器到期 → 按 `attack_type` 分派 `projectile` / `sector` / `summon` 攻击
- 大招系统：能量满 100 或剑意 CD 到 → `_trigger_ultimate()` 按 `special_mechanic` 分派 6 种大招
- 防御系统：`take_damage()` 处理闪避/格挡/护甲/护盾/灵气防御
- 召唤物：`_create_fox()` / `_create_sword_artifact()` 动态创建并 `set_script()` 注入行为

#### EnemyBase — [scripts/enemy_base.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/enemy_base.gd)
敌人基类，继承 `Area2D`，加入 `enemies` 组。
- `initialize(enemy_data)`：从 EnemyData 注入属性，`_setup_sprite()` 从精灵表构建 `AnimatedSprite2D`
- `_physics_process()`：按 `march_style`（quick/sneak/tank/ranged）移动；ranged 类型进入射程后停止并射击主殿
- 状态系统：frozen（冰冻）/ stunned（眩晕）/ slow（减速）/ knockback（击退）/ siege（攻城）
- DOT 系统：`_soul_marks`（魂印）、`_sword_intent_stacks`（剑意层数）

#### Projectile — [scripts/projectile.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/projectile.gd)
投射物，继承 `Area2D`。支持 3 种弹道：
- **直线弹道**：`set_target()` 后匀速直线，超 `projectile_max_distance` 销毁
- **链式（chain）**：命中后 `_find_chain_target()` 跳跃，伤害按 `bounce_decay_pct` 衰减，可触发闪电视觉
- **循环剑（cycle）**：`setup_cycle()` 三态状态机 `APPROACHING → OVERSHOOTING → RETURNING`，支持贝塞尔弧线轨迹
- 命中处理：暴击、剑意加成、吸血回传、`_apply_form_effects()`（魂印/链弹/剑意叠加）、穿透/弹跳/销毁

#### 召唤物
- [summon_fox.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/summon_fox.gd)：灵狐，追击最近敌人，定时攻击
- [summon_artifact_sword.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/summon_artifact_sword.gd)：环绕法器剑，绕主殿轨道运动，范围内攻击

### 5.4 数据资源类（scripts/data/）

全部继承 `Resource`，带 `class_name`，字段用 `@export`。

| 类 | 文件 | 说明 |
|----|------|------|
| `MainPeakConfig` | main_peak_config.gd | 器灵全局参数（HP/伤害/灵气产出/经验增长等） |
| `PeakConfig` | peak_config.gd | 山峰（门派/修复成本/升级成本/入门功法） |
| `FormConfig` | form_config.gd | 功法（攻击类型/伤害/特殊机制/`special_param` JSON） |
| `EnemyData` | enemy_data.gd | 敌人（HP/速度/类型/护甲/行进风格） |
| `CardData` | card_data.gd | 卡牌（效果类型/数值/可叠加） |
| `WaveData` | wave_data.gd | 波次（含 `WaveEnemyGroup` 数组） |
| `WaveEnemyGroup` | wave_enemy_group.gd | 波次内敌人组（id/数量/间隔/路径） |
| `SpiritProfileConfig` | spirit_profile_config.gd | 器灵档案（开局加成） |

> `FormConfig.get_special_params()`：惰性解析 `special_param` 字段的 JSON 字符串并缓存，是功法特殊机制参数的标准取值入口。

### 5.5 UI 层（scripts/ui/）

| 脚本 | 职责 | 信号 |
|------|------|------|
| battle_hud.gd | 战斗 HUD（波次/敌数/灵气/等级经验/血量/计时/能量条/无敌按钮） | — |
| card_selection_panel.gd | 三选一面板（代码构建 UI，3 个卡槽） | `card_selected` |
| intro_screen.gd | 开场黑幕世界观简介（代码构建 UI，按 Pixso 设计，普惠体，点击/按键跳过） | `intro_finished` |
| repair_prompt_panel.gd | 山峰详情/修复/升级面板 | `repair_requested` / `upgrade_requested` |
| main_peak_select_panel.gd | 开局器灵选择（3 张卡片） | `start_game_requested` |
| result_panel.gd | 战斗结算 | `return_requested` |
| battle_start_button.gd | 右下开战按钮 | `pressed` |
| settings_button.gd | 左下设置按钮（回器灵选择） | `pressed` |
| floating_text.gd | 飘字模板（上浮渐隐） | — |

> UI 面板多采用**代码构建**（`_build_ui()`）而非 .tscn 拖拽，便于 MCP 协作迭代。

### 5.6 特效层（scripts/effects/）

纯视觉，不参与逻辑。

| 脚本 | 职责 |
|------|------|
| sector_effect.gd | 扇形攻击区域（渐隐+放大 tween） |
| lightning_bolt.gd | 闪电链（AnimatedSprite2D 拉伸 + 命中爆点） |
| chain_bounce_effect.gd | 链式跳跃命中闪光 |
| stun_star.gd | 眩晕星星标记 |
| projectile_visual.gd | 投射物自绘形状（sword/fist/crystal/circle） |

---

## 6. 关键类与函数说明

### 6.1 GameManager（总控）

```gdscript
enum GameState { MAIN_PEAK_SELECT, PREPARATION, BATTLE, CARD_SELECTION, GAME_OVER, INTRO }

func _ready() -> void                       # 系统总装：取节点→setup→信号接线→初始化→进初始状态
func _on_intro_finished()                   # 开场黑幕结束 → 器灵选择
func _on_start_game_requested(profile_id)   # 应用器灵加成，进入经营阶段
func _on_card_applied_relay(form_id, effect_type, effect_value)  # 卡牌效果转发给主殿
func _input(event)                          # 点击赚灵气/选山峰；ESC重开；F1/F2/F3 debug
```

### 6.2 MainPeak（核心战斗对象）

```gdscript
func set_attack_channels(form_ids: Array, levels: Dictionary)  # 开战注入功法通道
func _apply_level_unlocks(channel, level_data)                  # 应用逐级解锁（double_shot 等）
func set_battle_active(active: bool)                            # 开关战斗（含剑意CD初始化）
func apply_upgrade(form_id, effect_type, effect_value)          # 卡牌升级（30+ 种 effect_type 分支）
func apply_damage_bonus(bonus)                                  # 器灵伤害加成
func _process(delta)                                            # 通道计时→分派攻击→剑意CD
func _perform_projectile_attack(channel)                        # 弹道攻击（含循环剑轨迹）
func _perform_sector_attack(channel)                            # 扇形范围攻击（含眩晕）
func _manage_summons(channel)                                   # 召唤物维护（灵狐/法器剑）
func _trigger_ultimate(channel)                                 # 大招分派（6 种 special_mechanic（cycle为死代码））
func _ultimate_sword_cd(channel)                                # 御剑诀大招：50 剑扇形依次射出
func take_damage(amount)                                        # 防御结算（闪避/格挡/护甲/护盾）
func _recalc_spirit_bonuses()                                   # 重算功法器灵加成（HP/防御/回血/护甲）
func get_ultimate_info() -> Dictionary                          # HUD 能量条数据源
```

### 6.3 Projectile（投射物）

```gdscript
func set_target(target_position: Vector2)            # 直线弹道
func setup_cycle(target, cycle_count, ...)           # 循环剑弹道（三态状态机）
func _hit(target)                                    # 命中结算（暴击/剑意/吸血/穿透/弹跳）
func _apply_form_effects(target)                     # 功法附加效果（魂印/链弹/剑意）
func _find_chain_target() -> Node2D                  # 链式寻找下一目标
func _process_cycle(delta)                           # 循环剑运动（贝塞尔弧线）
func _bezier_point / _bezier_tangent / _bezier_length  # 二阶贝塞尔曲线工具
```

### 6.4 DataManager（数据入口）

```gdscript
func get_peak_config(id) -> PeakConfig
func get_all_peak_configs() -> Array
func get_enemy_data(id) -> EnemyData
func get_form_config(form_id) -> FormConfig
func get_form_config_by_peak(peak_id) -> FormConfig
func get_form_level_data(form_id, level) -> Dictionary
func get_card_data(id) -> CardData
func get_all_cards() / get_all_forms() -> Array
func get_spirit_profile(id) / get_all_spirit_profiles()
func get_enemy_sprite_config(enemy_id) -> Dictionary
func get_waves() -> Array[WaveData]
```

### 6.5 EconomyManager（经济与升级）

```gdscript
func handle_main_peak_clicked(screen_position)   # 点击赚灵气 + 飘字
func add_exp(amount)                             # 经验累计→升级→触发三选一
func _trigger_battle_upgrade()                   # 暂停游戏 + 抽卡 + 显示面板
func on_card_selected(card)                      # 应用卡牌，多级升级循环
func repair_selected_mountain() / upgrade_selected_mountain()  # 山峰操作代理
```

### 6.6 WaveManager（波次）

```gdscript
func load_waves(waves)                  # 注入 WaveData 数组
func start_battle()                     # 重置并开始第 1 波
func start_next_wave()                  # 推进下一波，末波触发 all_waves_completed
func _build_spawn_queue(config)         # 展开敌人组并打乱
func _get_spawn_position(path_type)     # 扇面生成位置
```

---

## 7. 数据流与配置系统

### 7.1 启动加载流

```
Godot 启动
  └─ Autoload 实例化 CsvLoader、DataManager
       └─ DataManager._ready()
            ├─ CsvLoader.load_csv("res://data/*.csv")  ← 9 张表
            ├─ 实例化 Resource 子类填充字段
            └─ print 加载统计
  └─ 加载 main.tscn
       └─ GameManager._ready()
            ├─ 取节点引用（@onready / get_node）
            ├─ 各 Manager.setup(...)
            ├─ 信号接线（20+ connect）
            ├─ CardManager.initialize(get_all_cards())
            ├─ WaveManager.load_waves(get_waves())
            └─ UIStateCoordinator.set_state(MAIN_PEAK_SELECT)
```

### 7.2 战斗数据流

```
经营阶段点击山峰 → MountainManager.repair_selected() → 激活 form_id
   ↓
点击开战 → BattleFlowController.start_battle()
   ├─ MountainManager.get_all_activated_form_ids()  → [form_sword_01, form_buddha_01, ...]
   ├─ MainPeak.set_attack_channels(form_ids, levels)  → 构建 _attack_channels
   └─ WaveManager.start_battle() → 生成敌人 → 加入 enemies 组
       ↓
MainPeak._process() 每帧：
   ├─ 每通道计时到期 → _perform_projectile/sector/summon 攻击
   ├─ Projectile 命中 enemy → enemy.take_damage() → enemy_destroyed 信号
   └─ WaveManager._on_enemy_removed() → enemy_killed 信号 → EconomyManager.add_exp()
       ↓
升级触发 → _trigger_battle_upgrade() → 暂停 → CardManager.draw_three_cards()
   → CardSelectionPanel.show_cards() → 玩家选卡 → apply_card()
   → MainPeak.apply_upgrade(form_id, effect_type, effect_value)  → 修改 channel 字段
```

### 7.3 功法特殊机制（special_mechanic）

6 种功法对应 6 种机制，定义于 `form_config.csv`，参数存于 `special_param`（JSON）：

| form_id | 功法 | attack_type | special_mechanic | 大招 |
|---------|------|-------------|------------------|------|
| form_sword_01 | 御剑诀 | projectile | sword_intent | 万剑归宗（CD 制，50 剑扇形） |
| form_buddha_01 | 金刚咒 | sector | stun | 金刚怒目（全屏眩晕+护盾） |
| form_demon_01 | 炼魂诀 | projectile | soul_mark | 魂蛊双噬（魂印引爆） |
| form_beast_01 | 灵狐契 | summon | summon_beast | 万灵朝宗（灵兽强化） |
| form_artifact_01 | 御器诀 | summon | summon_artifact | 万器共鸣（法器强化） |
| form_thunder_01 | 雷霆诀 | projectile | chain | 九天神雷（全屏雷击） |

---

## 8. 依赖关系

### 8.1 模块依赖图

```
                    ┌─────────────┐
                    │  DataManager │ ← Autoload，全局可访问
                    │  CsvLoader   │
                    └──────┬───────┘
                           │ 被查询
            ┌──────────────┼──────────────┐
            ↓              ↓              ↓
      GameManager     MainPeak      EnemyBase    ← 运行时对象
            │              │              │
            │ setup()      │ 攻击         │ 命中
            ↓              ↓              ↓
    ┌───────┴────────┐  Projectile   take_damage
    │                │
WaveManager    EconomyManager ──→ CardManager
    │                │                  │
    │ 生成敌人        │ 升级触发          │ 抽卡
    ↓                ↓                  ↓
EnemyBase    CardSelectionPanel ←── show_cards
    │
    │ reached_main_peak
    ↓
MainPeak.take_damage()
```

### 8.2 信号接线总览（GameManager._ready 中完成）

| 源信号 | → 目标 | 作用 |
|--------|--------|------|
| `main_peak.clicked` | `economy.handle_main_peak_clicked` | 点击赚灵气 |
| `main_peak.main_peak_destroyed` | `battle_flow.on_defeat` | 失败 |
| `battle_start_button.pressed` | `ui_coordinator._on_battle_start_button_pressed` | 开战 |
| `settings_button.pressed` | `battle_flow.restart_game` | 回器灵选择 |
| `card_selection.card_selected` | `economy.on_card_selected` | 选卡 |
| `result.return_requested` | `battle_flow.return_to_preparation` | 返回经营 |
| `mountain.mountain_state_changed` | `ui_coordinator._on_mountain_state_changed` | 刷新 UI |
| `mountain.repair_prompt_requested` | `ui_coordinator._on_repair_prompt_requested` | 弹修复面板 |
| `repair_prompt.repair_requested` | `economy.repair_selected_mountain` | 修复 |
| `repair_prompt.upgrade_requested` | `economy.upgrade_selected_mountain` | 升级 |
| `main_peak_select.start_game_requested` | `game_manager._on_start_game_requested` | 开局 |
| `wave.all_waves_completed` | `battle_flow._on_victory` | 胜利 |
| `wave.wave_changed` | `battle_flow._on_wave_changed` | 换波 |
| `wave.enemy_killed` | `economy.add_exp` | 加经验 |
| `card_manager.card_applied` | `economy._on_card_applied` | 卡牌生效中转 |
| `economy.upgrade_triggered` | `ui_coordinator.set_state(CARD_SELECTION)` | 进选卡 |
| `economy.card_resolved` | `ui_coordinator.set_state(BATTLE)` | 回战斗 |
| `economy.card_applied` | `game_manager._on_card_applied_relay` | 转主殿 |
| `ui_coordinator.battle_start_button_pressed` | `battle_flow.start_battle` | 开战 |
| `ui_coordinator.state_changed` | `game_manager.state_changed` | 状态转发 |

### 8.3 运行时依赖

- **零第三方运行时依赖**：仅依赖 Godot 引擎内置类
- **节点路径常量集中管理**：各文件顶部 `const NODE_XXX := ^"..."`，避免裸写 `get_node()`
- **场景预加载**：`const PROJECTILE_SCENE := preload(...)`、`const FLOATING_TEXT_SCENE := preload(...)`

---

## 9. 项目运行方式

### 9.1 环境准备

1. 安装 **Godot 4.6**（需 4.6+，因 `config/features=PackedStringArray("4.6")`）
2. 用 Godot 启动器打开 `开仙门/project.godot`

### 9.2 编辑器运行

- 打开项目后，按 **F5**（运行主场景）或点击右上角 ▶
- 主场景已配置为 `res://scenes/main.tscn`

### 9.3 命令行运行

```bash
# Windows（PowerShell）
& "C:\path\to\Godot_v4.6-stable_win64.exe" --path "c:\Users\Administrator\lobsterai\project\GAME-002\开仙门"

# 直接运行主场景
& "Godot.exe" --path ".\开仙门" res://scenes/main.tscn
```

### 9.4 导出发布

需在 Godot 编辑器中配置导出预设（项目当前未含 `export_presets.cfg`），导出为 Windows 桌面应用。

### 9.5 调试快捷键（仅 debug build）

| 按键 | 功能 |
|------|------|
| `F1` | 切换 3 倍速 / 正常速 |
| `F2` | 主殿无敌开关 |
| `F3` | 战斗中强制触发升级三选一 |
| `ESC` | 重开（reload_current_scene） |

### 9.6 MCP 协作热重载

`addons/auto_reload` 插件每秒轮询 `.tscn/.gd/.tres/.res` 文件修改时间，外部改动自动重载场景/脚本，配合 MCP 工作流（非运行时功能）。

---

## 10. 关键约束与编码规范

> 摘自 [CLAUDE.md](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/CLAUDE.md) 与 `程序规则/`

### 10.1 数据约束
1. **数据不在代码里写死** — 数值/配置走 CSV，DataManager 加载
2. **不要新增 .tres** — 数据来源统一为 CSV（`_unused_tres/` 是废弃归档）
3. **文档×数据交叉验证** — 读策划文档时自动对比 CSV，以 CSV 为准

### 10.2 结构约束
4. **场景按类型归位** — 新 .tscn 必须放入 `scenes/` 对应子目录
5. **节点路径集中管理** — 文件顶部 `const` 常量管理路径，禁止裸写 `get_node("路径/XXX")`
6. **PSD 导出用 `_exported/`** — 非 `runtime/`，后续应迁移
7. **不要引入新 addon** — 除非明确要求

### 10.3 三层归属判定
修改代码前先判断属于哪一层：
- **表现层**：节点树、视觉、输入、特效
- **逻辑层**：状态机、经济、波次、卡牌、战斗循环
- **数据层**：CSV 加载、配置对象化、查询接口

### 10.4 修改前检查清单
- 涉及哪些 .gd / .tscn 文件？
- 有硬编码路径需要同步更新吗？
- 需要更新 CSV 配置吗？
- 新代码属于三层模型的哪一层？

---

## 附录：关键文件速查表

| 用途 | 文件 |
|------|------|
| 引擎配置 | [project.godot](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/project.godot) |
| 协作规范 | [CLAUDE.md](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/CLAUDE.md) |
| 主场景 | [scenes/main.tscn](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scenes/main.tscn) |
| 总控 | [scripts/managers/game_manager.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/managers/game_manager.gd) |
| 数据入口 | [autoload/data_manager.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/autoload/data_manager.gd) |
| 核心战斗对象 | [scripts/main_peak.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/main_peak.gd) |
| 敌人 | [scripts/enemy_base.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/enemy_base.gd) |
| 投射物 | [scripts/projectile.gd](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/scripts/projectile.gd) |
| 功法配置 | [data/form_config.csv](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/data/form_config.csv) |
| 波次配置 | [data/wave_config.csv](file:///c:/Users/Administrator/lobsterai/project/GAME-002/开仙门/data/wave_config.csv) |
