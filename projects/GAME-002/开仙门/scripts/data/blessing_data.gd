extends Resource
class_name BlessingData
## V0.1 祝福数据 — 替换旧的 CardData

@export var blessing_id: String = ""
@export var blessing_name: String = ""
@export var category: String = ""        ## disciple / technique / buff
@export var tier: String = "common"      ## common / rare / epic / legend
@export var description: String = ""
@export var effect_type: String = ""     ## atk_up / hp_up / speed_up / cd_reduce / range_up / new_skill 等
@export var effect_value: float = 0.0
@export var disciple_filter: String = "" ## 限定弟子 ID（空=全体）
@export var peak_filter: String = ""     ## 限定山峰 ID（空=全体）
