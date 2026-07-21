# Godot 架构规范与模块化标准

> 用途：定义「开仙门」项目的 Godot 引擎架构规则、模块化标准、GDScript 编码规范。AI 协作时必须遵守本文档中的每一条规则。
> 
> 本文档是程序规则的**核心文件**——它定义了"什么是好架构"、"模块怎么拆"、"代码怎么写"。
> 其他文件是本文档的补充：架构审查提示词管"怎么审"，日常协作规则管"日常怎么执行"。

---

## 一、Godot 4.x 架构核心原则

### 原则 1：场景即模块（Scene as Module）

```
Godot 的基本组织单元是场景（.tscn）。
一个场景 = 一个可独立运行的功能单元。

这意味着：
- 每个 .tscn 文件应该能脱离主场景单独运行（在编辑器中按 F6 直接测试）
- 场景的根节点就是该模块的"对外接口"
- 场景内部可以任意复杂，但对外只暴露信号和少数方法
```

**判断标准：** 如果一个 .tscn 放到空项目中按 F6 跑不起来，说明它依赖了外部硬编码假设，需要重构。

### 原则 2：节点树即依赖图（Scene Tree = Dependency Graph）

```
场景树中的父子关系 = 生命周期依赖
- 父节点 free → 子节点自动 free（生命周期绑定）
- 兄弟节点之间 = 不应直接互相引用（用信号）
- 祖先节点 = 不应被子节点跨级调用（用信号向上冒泡）

场景树应该是单向依赖树，不允许出现：
- 子节点 get_parent().get_node("兄弟节点名")     ← 破坏封装
- 子节点 get_node("/root/全局路径/XX")           ← 绕过树结构
- 两个叶子节点互相引用                             ← 循环依赖
```

### 原则 3：信号优先（Signal-First Architecture）

```
Godot 的核心解耦机制是信号（Signal）。

规则：
- 模块 A 需要通知模块 B → 模块 A 发射信号 → 中间人（Manager/Scene Root）连接信号 → 调用模块 B
- 模块 A 需要读模块 B 的数据 → 模块 B 提供 getter 方法，中间人转发
- 模块 A 和 B 永远不互相持有引用

信号连接的责任在"组装层"（通常是场景根节点或 Manager），不在模块自身。
```

---

## 二、模块化拆分标准

### 什么是一个"模块"

在「开仙门」项目中，一个模块必须满足：

```
✅ 能用一句话说清职责（不超过 20 个字）
✅ 有明确的输入（数据/信号/配置）和输出（信号/状态）
✅ 删除它不会导致其他模块崩溃（可能功能缺失，但不报错）
✅ 可以独立创建实例测试
✅ 与其他模块只通过信号 + DataManager 通信
```

### 模块拆分决策矩阵

当需要把功能拆成模块时，按以下矩阵判断：

| 场景 | 拆？ | 理由 |
|------|------|------|
| 两个功能**总是**一起改 | ❌ 不拆 | 强行拆开增加同步成本 |
| 两个功能有不同的**生命周期** | ✅ 拆 | 比如 UI 和游戏逻辑 |
| 两个功能需要**独立测试** | ✅ 拆 | 方便单独跑单测/场景测试 |
| 一个功能**删除**时另一个仍有用 | ✅ 拆 | 独立可替换 |
| 两个功能共享**同一个数据源** | ❌ 不拆 | 共享数据是自然的模块边界 |
| 功能有独立的**配置需求** | ✅ 拆 | 有自己的 CSV 或参数集 |

### 模块的文件组织

```
每个模块跨越三个顶层目录：

模块 "山峰系统"（Peaks）：
├── scenes/peaks/peak_template.tscn    ← 场景模板
├── scripts/peak_base.gd               ← 运行时逻辑
├── scripts/managers/mountain_manager.gd ← 管理/编排层
├── scripts/data/peak_config.gd        ← 数据类（Resource）
├── scripts/data/peak_data.gd          ← 运行时实例数据
└── data/peak_config.csv               ← 策划可编辑的配置

模块的"大脑"在 manager，"身体"在 base script，"脸"在 scene，"记忆"在 data。
```

---

## 三、分层架构

### 三层模型

```
┌─────────────────────────────────┐
│  表现层（Presentation）          │
│  scenes/ui/*.tscn               │
│  scripts/ui/*.gd                │
│  职责：显示数据、接收玩家输入    │
│  通信：只读 GameState，发射事件  │
├─────────────────────────────────┤
│  逻辑层（Logic）                 │
│  scripts/managers/*.gd          │
│  autoload/*.gd                  │
│  职责：游戏规则、状态管理、编排  │
│  通信：连接表现层和数据层        │
├─────────────────────────────────┤
│  数据层（Data）                  │
│  scripts/data/*.gd              │
│  data/*.csv                     │
│  职责：定义数据结构、加载配置    │
│  通信：被逻辑层读取，不主动通知  │
└─────────────────────────────────┘

规则：
- 上层可以调用下层（表现层 → 逻辑层 → 数据层）
- 下层绝对不能调用上层（数据层不能直接更新 UI）
- 同层模块之间只能用信号通信
- 跨层数据流动方向：表现层 ← 信号 ← 逻辑层 ← 读取 ← 数据层
```

### 当前项目的层级归属

| 层级 | 文件 | 职责 |
|------|------|------|
| **表现层** | `scenes/ui/battle_hud.tscn` + `battle_hud.gd` | 战斗 HUD 显示 |
| | `scenes/ui/card_selection_panel` (动态生成) | 卡牌三选一 |
| | `scenes/ui/result_panel` | 结算弹窗 |
| | `scripts/ui/main_peak_select_panel.gd` | 开局器灵选择 |
| **逻辑层** | `scripts/managers/game_manager.gd` | 游戏主循环、状态机 |
| | `scripts/managers/wave_manager.gd` | 波次调度 |
| | `scripts/managers/card_manager.gd` | 卡牌池、抽取、应用 |
| | `scripts/managers/mountain_manager.gd` | 山峰状态管理 |
| | `scripts/main_peak.gd` | 器灵（核心战斗单位） |
| | `scripts/peak_base.gd` | 山峰基类 |
| | `scripts/enemy_base.gd` | 敌人基类 |
| | `scripts/projectile.gd` | 投射物 |
| **数据层** | `autoload/data_manager.gd` | 统一数据加载入口 |
| | `autoload/csv_loader.gd` | CSV 解析器 |
| | `scripts/data/*.gd` | 数据类定义（Resource） |
| | `data/*.csv` | 策划配置表 |

---

## 四、GDScript 编码规范

### 文件级规范

```gdscript
# 1. 文件头：extends 必须在第一行（Godot 强制）
extends Node
class_name MyModule  # 如果需要全局引用，必须加 class_name

# 2. 文件大小
# - 每个文件 ≤ 200 行（本项目上限，严格于通用建议的 150 行）
# - 函数 ≤ 25 行

# 3. 排放顺序（从上到下）：
#   ① extends / class_name
#   ② 信号声明
#   ③ 枚举
#   ④ 常量（preload / const）
#   ⑤ @export 变量
#   ⑥ @onready 变量
#   ⑦ 普通变量
#   ⑧ _ready() / _process() 等内置回调
#   ⑨ 公共方法
#   ⑩ 私有方法（以 _ 开头）
```

### 变量声明规范

```gdscript
# ✅ 正确：类型标注 + @export 暴露
@export var max_hp: float = 100.0
@export var attack_interval: float = 1.0

# ✅ 正确：@onready 延迟初始化场景树引用
@onready var sprite: Sprite2D = $Sprite2D
@onready var anim_player: AnimationPlayer = $AnimationPlayer

# ❌ 错误：无类型标注
var speed = 200  # 应该是 var speed: float = 200.0

# ❌ 错误：在 _ready() 里用字符串 get_node
func _ready():
    var hp_bar = get_node("UI/HPBar")  # 不用字符串

# ✅ 正确：用 @onready + $ 语法
@onready var hp_bar: ProgressBar = $UI/HPBar
```

### 信号规范

```gdscript
# 信号命名：名词_动词（过去式），描述"发生了什么"
signal spirit_changed(amount: int)
signal enemy_destroyed(enemy: EnemyBase)
signal wave_completed(wave_index: int)

# ✅ 正确：Manager 负责连线
# game_manager.gd _ready():
wave_manager.all_waves_completed.connect(_on_victory)
enemy.enemy_destroyed.connect(_on_enemy_removed)

# ❌ 错误：模块内部直接连到外部
# enemy_base.gd _ready():
get_tree().current_scene.get_node("Managers/GameManager").add_exp(10)
# ↑ 这违反了"模块不自找依赖"原则
```

### 方法规范

```gdscript
# ✅ 方法命名：动词_名词
func take_damage(amount: float) -> void:
func apply_burn_stack(dps: float, duration: float, max_stacks: int) -> void:

# ✅ 参数都有类型
# ✅ 返回值有类型标注（void / int / bool 等）

# ❌ 方法超过 25 行 → 拆子函数
# ❌ 方法有布尔参数控制行为 → 拆成两个方法
#     func attack(is_ranged: bool) → func attack_melee() / func attack_ranged()
```

### preload / load 规范

```gdscript
# ✅ 场景和脚本用 const + preload（编译时加载）
const PROJECTILE_SCENE: PackedScene = preload("res://scenes/projectiles/projectile.tscn")
const ENEMY_BASE_SCRIPT = preload("enemy_base.gd")  # 同目录可用相对路径

# ✅ 运行时纹理/数据用 load()
func set_form(texture_path: String) -> void:
    var tex: Texture2D = load(texture_path)

# ⚠️ preload 的路径如果是绝对路径（res://），移动文件时必须同步更新
# ⚠️ 相对路径 preload 依赖文件相对位置，移动 .gd 文件时必须同步检查
```

---

## 五、数据架构规范

### 数据来源唯一性原则

```
每种数据有且只有一个"权威来源"（Single Source of Truth）：

数据流：
  策划编辑 Excel ──导出──→ data/*.csv ──DataManager加载──→ Resource对象 ──→ 游戏逻辑

禁止：
  ❌ 代码里又写了一份和 CSV 相同的默认值数组
  ❌ .tres 和 .csv 同时定义同一份数据
  ❌ 同一份数据在多个 Manager 里各自维护一份
```

### CSV 规范

```csv
# 第一行 = 列名（英文，snake_case）
# 后续 = 数据行
# 空值和特殊值统一处理

# ✅ 正确的 CSV：
peak_id,peak_name,school_name,entry_form_id,icon_path
peak_sword,剑峰,剑修,form_sword_01,res://assets/_exported/器灵-书.png

# ❌ 错误的 CSV：
# - 列名带中文
# - 数据行有空行
# - 数值用中文（"三" 而不是 "3"）
```

### Resource 类规范

```gdscript
# scripts/data/form_config.gd
extends Resource
class_name FormConfig

# ✅ 所有字段用 @export，方便在编辑器中查看/调试
@export var form_id: String = ""
@export var damage: float = 0.0
@export var attack_interval: float = 1.0

# ✅ 提供工厂方法
static func from_csv_row(row: Dictionary) -> FormConfig:
    var f := FormConfig.new()
    f.form_id = str(row.get("form_id", ""))
    f.damage = float(row.get("damage", "0"))
    return f
```

---

## 六、项目模块地图

### 当前模块清单

```
开仙门 模块地图 v1.0
════════════════════════════════════

模块 1：器灵（MainPeak）
  职责：玩家控制的核心战斗单位
  脚本：scripts/main_peak.gd
  场景：内嵌在 main.tscn 中
  数据：data/main_peak_config.csv → MainPeakConfig
  对外信号：clicked, main_peak_destroyed
  依赖：DataManager（读配置）、EnemyBase（找目标）
  
模块 2：山峰系统（Peaks / Mountain）
  职责：副峰管理、功法激活、山峰修复/升级
  管理器：scripts/managers/mountain_manager.gd
  基类：scripts/peak_base.gd
  场景：scenes/peaks/peak_template.tscn
  数据：data/peak_config.csv → PeakConfig
  对外信号：mountain_state_changed, repair_prompt_requested

模块 3：敌人系统（Enemies）
  职责：敌人移动、血量、状态效果、伤害
  脚本：scripts/enemy_base.gd
  场景：scenes/enemies/enemy_base.tscn
  数据：data/enemy_config.csv → EnemyData
  对外信号：enemy_destroyed, reached_main_peak

模块 4：波次系统（Waves）
  职责：波次调度、敌人生成队列
  管理器：scripts/managers/wave_manager.gd
  数据：data/wave_config.csv → WaveData + WaveEnemyGroup
  对外信号：wave_completed, all_waves_completed, wave_changed

模块 5：卡牌系统（Cards）
  职责：卡牌池管理、三选一、效果应用
  管理器：scripts/managers/card_manager.gd
  数据：data/card_config.csv → CardData
  对外信号：card_selected（在 game_manager 层触发）

模块 6：功法系统（Forms）
  职责：功法属性定义、攻击类型、特殊机制
  数据：data/form_config.csv → FormConfig
  注意：当前无独立 Manager，通过 DataManager 读取

模块 7：投射物系统（Projectiles）
  职责：投射物飞行、碰撞、伤害结算
  脚本：scripts/projectile.gd
  场景：scenes/projectiles/projectile.tscn

模块 8：UI 系统
  职责：HUD、卡牌选择、结算、器灵选择、修复提示
  脚本：scripts/ui/*.gd
  场景：scenes/ui/*.tscn

模块 9：全局数据（Data）
  职责：所有 CSV 加载、数据字典维护
  脚本：autoload/data_manager.gd, autoload/csv_loader.gd
  注意：Autoload，全局可访问，但不主动通知
```

### 模块间通信契约

```
MainPeak ←──信号── GameManager ──信号──→ BattleHUD
  │                    │                      │
  │ 直接实例化         │ 直接调用             │ 读 DataManager
  ↓                    ↓                      ↓
Projectile          WaveManager            DataManager
  │                    │
  │ 碰撞检测           │ 直接实例化
  ↓                    ↓
EnemyBase ────信号──→ EnemyBase (通过 GameManager 转)

规则总结：
- GameManager 是唯一的"信号中枢" —— 所有模块间通信经过它
- DataManager 是唯一的"数据中心" —— 所有模块读配置经过它
- 叶子模块（Projectile, EnemyBase）不主动找 Manager，只发射信号
- Manager 负责在 _ready() 中连接所有信号线
```

---

## 七、常见反模式与纠正

### 反模式 1：上帝 Manager

```gdscript
# ❌ GameManager 做太多：
class GameManager:
    func spawn_enemy()      # 应该是 WaveManager
    func draw_card()        # 应该是 CardManager
    func heal_peak()        # 应该是 PeakBase 自身逻辑
    func play_animation()   # 应该是专门的动画模块
    func save_game()        # 应该是 SaveManager

# ✅ 纠正：Manager 只做编排（orchestration），不做执行（execution）
```

### 反模式 2：硬编码节点路径

```gdscript
# ❌ 散落在各处的裸路径
var hp = get_node("/root/Main/Battlefield/MainPeak").current_hp
var ui = get_tree().current_scene.get_node("UI/BattleHUD")

# ✅ 纠正：集中常量 + @export var
# 在模块顶部定义路径常量
const NODE_MAIN_PEAK := ^"Battlefield/MainPeak"
# 或者用 @export var 让编辑器赋值
@export var main_peak: MainPeak
```

### 反模式 3：逻辑与 UI 混在一起

```gdscript
# ❌ 在战斗逻辑里直接操作 UI
func take_damage(amount: float):
    current_hp -= amount
    $HPBar.value = current_hp         # 直接操作 UI
    $DamageLabel.text = str(amount)   # 直接操作 UI
    $FlashAnimation.play("hit")       # 直接操作动画

# ✅ 纠正：逻辑层只发射信号，UI 层自己响应
func take_damage(amount: float):
    current_hp -= amount
    hp_changed.emit(current_hp, max_hp)
    damage_taken.emit(amount)
    # UI 层监听 hp_changed → 更新进度条
    # UI 层监听 damage_taken → 播放伤害数字
```

### 反模式 4：数据双轨

```gdscript
# ❌ 同一份数据有两个来源
# data/wave_config.csv 存在
# 但 _init_waves() 里又写死了一份 wave_specs 数组
# 策划改 CSV 不生效 → 困惑 → 信任崩塌

# ✅ 纠正：删除硬编码，统一走 DataManager 加载 CSV
```

### 反模式 5：跨层直接引用

```gdscript
# ❌ 数据层直接更新 UI
# data_manager.gd:
func _load_enemies():
    # 加载完后直接操作 UI
    get_tree().current_scene.get_node("UI/LoadingLabel").text = "敌人加载完成"

# ✅ 纠正：数据层只管理数据，加载完成发射信号，由逻辑层决定是否更新 UI
```

---

## 八、开发前自检清单

AI 每次生成或修改代码前，必须过一遍：

```
架构层面：
□ 新代码属于三层模型中的哪一层？
□ 新代码是否跨层引用了不该引用的东西？
□ 新模块是否能用一句话说清职责？
□ 新模块能否独立测试？

代码层面：
□ 文件是否 ≤ 200 行？
□ 函数是否 ≤ 25 行？
□ 所有变量是否有类型标注？
□ 关键参数是否 @export？
□ 信号连接是否在 Manager 的 _ready() 中完成？
□ 有没有裸 get_node("硬编码路径")？

数据层面：
□ 数值是否来自 CSV，而非写死在代码里？
□ CSV 是否有对应的 Resource 类？
□ 有没有同一种数据在多个地方定义？

耦合层面：
□ 删除这个新模块，其他模块能正常编译运行吗？
□ 有没有循环信号（A 发信号 → B 响应 → B 发信号 → A 响应）？
□ 有没有 get_node("../兄弟节点") 这类跨兄弟引用？
```

---

## 九、文件关系速查

```
程序规则/ 三份文件的定位：

Godot架构规范与模块化标准.md  ← 本文档（核心）
  │
  │  定义了"什么是好的 Godot 架构"
  │  "模块怎么拆分" "代码怎么写"
  │
  ├── AI功能模块架构设计审查提示词.md
  │   │
  │   │  基于本文档的规则，定义了"怎么审查架构"
  │   │  提供结构化的审查输出格式
  │   │  用于新功能开发前的方案评审
  │
  └── Claude Code日常协作规则.md
      │
      │  基于本文档的规则，定义了"日常怎么执行"
      │  提供文件落位决策树、禁止事项、工作流
      │  用于每次改代码时的操作规范
      
开仙门/CLAUDE.md
  │
  │  项目地图 + 关键约束速查
  │  每次 Claude Code 启动自动加载
  │  指向程序规则/ 目录获取详细规则
```
