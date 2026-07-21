extends Resource
class_name FormConfig

@export var form_id: String = ""
@export var form_name: String = ""
@export var peak_id: String = ""
@export var quality: String = ""
@export var max_level: int = 10
@export var attack_type: String = "projectile"
@export var atk_type_label: String = ""
@export var damage: float = 0.0
@export var projectile_count: int = 1
@export var attack_interval: float = 1.0
@export var range: float = 400
@export var damage_type: String = "physical"
@export var defense_type: String = "none"
@export var defense_value: float = 0.0
@export var spirit_hp_bonus: float = 0.0
@export var spirit_def_bonus: float = 0.0
@export var spirit_regen: float = 0.0
@export var spirit_armor: int = 0
@export var ultimate_name: String = ""
@export var ultimate_desc: String = ""
@export var energy_per_hit: float = 0.0
@export var special_mechanic: String = ""
@export var special_param: String = ""
@export var projectile_color: Color = Color.WHITE
@export var projectile_shape: String = "circle"


var _cached_params: Dictionary = {}
var _params_parsed: bool = false


func get_special_params() -> Dictionary:
	if _params_parsed:
		return _cached_params
	_params_parsed = true
	if special_param.is_empty():
		return _cached_params
	var json := JSON.new()
	var err := json.parse(special_param)
	if err == OK:
		var result = json.get_data()
		if result is Dictionary:
			_cached_params = result as Dictionary
	return _cached_params
