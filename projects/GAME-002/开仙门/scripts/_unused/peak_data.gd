extends Resource
class_name PeakData

@export var id: String = ""               # 唯一标识
@export var display_name: String = ""     # 显示名称
@export var description: String = ""      # 说明
@export var attack_type: String = "ranged"  # melee, ranged, aura
@export var base_damage: float = 10.0     # 基础攻击力
@export var base_range: float = 200.0     # 攻击/影响半径
@export var base_attack_speed: float = 1.0  # 攻击间隔（秒）
@export var max_hp: float = 100.0         # 最大生命值
@export var target_type: String = "nearest"  # nearest, highest_hp, flying_only
@export var color: Color = Color.WHITE    # 临时颜色
@export var special_mechanic: String = ""  # 核心机制标识
@export var special_param: float = 0.0    # 机制参数
