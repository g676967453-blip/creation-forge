extends Resource
class_name DiscipleData
## V0.1 弟子数据 — 每个可招募的弟子

@export var disciple_id: String = ""
@export var disciple_name: String = ""
@export var peak_id: String = ""         ## 所属山峰（决定战斗风格和祝福池）
@export var hp: float = 100.0
@export var attack: float = 10.0
@export var defense: float = 0.0
@export var attack_speed: float = 1.0   ## 攻击间隔（秒）
@export var move_speed: float = 200.0   ## 移动速度（像素/秒）
@export var attack_range: float = 150.0  ## 攻击范围（像素）
@export var skill_id: String = ""        ## 主动技能 ID（V0.1 可留空）
@export var cost: int = 100              ## 招募灵气消耗
