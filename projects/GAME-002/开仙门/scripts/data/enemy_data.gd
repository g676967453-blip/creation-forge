extends Resource
class_name EnemyData

@export var id: String = ""               # 唯一标识
@export var display_name: String = ""     # 显示名称
@export var hp: float = 50.0              # 生命值
@export var speed: float = 100.0          # 移动速度
@export var damage: float = 10.0          # 对器灵/山峰的伤害
@export var enemy_type: String = "ground"  # ground, flying, elite, boss
@export var path_type: String = "straight"  # straight, left_flank, right_flank
@export var color: Color = Color.RED      # 临时颜色
@export var size: float = 1.0             # 大小倍率

@export var siege_attack_interval: float = 1.0
@export var exp_reward: int = 10
@export var armor: int = 0
@export var march_style: String = "quick"
@export var attack_range: float = 0.0
