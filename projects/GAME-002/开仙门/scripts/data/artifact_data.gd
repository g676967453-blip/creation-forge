extends Resource
class_name ArtifactData
## V0.1 挂件数据 — 战斗中掉落装备

@export var artifact_id: String = ""
@export var artifact_name: String = ""
@export var slot: String = ""            ## weapon / armor / accessory
@export var rarity: String = "common"    ## common / rare / epic
@export var description: String = ""
@export var effect_type: String = ""
@export var effect_value: float = 0.0
