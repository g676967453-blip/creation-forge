extends Node
class_name MountainManager

const NODE_PSD_SPRITES := "Battlefield/PSD_Sprites"
const CLICK_AREA_SCENE: PackedScene = preload("res://scenes/peaks/mountain_click_area.tscn")

signal mountain_selected(peak_id: String)
signal mountain_state_changed(peak_id: String)
signal mountain_repaired(peak_id: String)
signal repair_prompt_requested(peak_id: String, can_repair: bool)
signal mountain_deselected
signal mountain_visual_changed(sprite: Sprite2D, color: Color)

var PEAK_IDS: Array[String] = []

var _sprites_root: Node2D
var _selected_peak_id: String = ""
var _mountains: Dictionary = {}


func _ready() -> void:
	_sprites_root = get_tree().current_scene.get_node_or_null(NODE_PSD_SPRITES)
	if _sprites_root:
		_populate_peak_ids()
		_bind_mountains()


func _get_peak_cost(peak_id: String, field: String, default_value: int) -> int:
	var cfg = DataManager.get_peak_config(peak_id)
	if cfg and cfg.get(field) != null:
		return int(cfg.get(field))
	return default_value


func get_repair_cost(peak_id: String) -> int:
	return _get_peak_cost(peak_id, "repair_cost_energy", 0)


func get_repair_cost_nuwa(peak_id: String) -> int:
	return _get_peak_cost(peak_id, "repair_cost_nuwa", 0)


func get_repair_treasure(peak_id: String) -> String:
	var cfg = DataManager.get_peak_config(peak_id)
	return str(cfg.repair_requires_treasure) if cfg else ""


func _get_upgrade_cost_base(peak_id: String) -> int:
	return _get_peak_cost(peak_id, "upgrade_cost_base", 30)


func _get_upgrade_cost_per_level(peak_id: String) -> int:
	return _get_peak_cost(peak_id, "upgrade_cost_per_level", 15)


func _populate_peak_ids() -> void:
	PEAK_IDS.clear()
	for cfg in DataManager.get_all_peak_configs():
		PEAK_IDS.append(cfg.peak_id)


func _load_sprite_map() -> Dictionary:
	var mapping: Dictionary = {}
	var rows := CsvLoader.load_csv("res://data/mountain_sprite_map.csv")
	for r in rows:
		var sprite_name: String = str(r.get("sprite_name", ""))
		var peak_id: String = str(r.get("peak_id", ""))
		if not sprite_name.is_empty() and not peak_id.is_empty():
			mapping[sprite_name] = peak_id
	return mapping


func _bind_mountains() -> void:
	var mapping := _load_sprite_map()

	for child in _sprites_root.get_children():
		if not (child is Sprite2D):
			continue
		if not mapping.has(child.name):
			continue

		var peak_id := str(mapping[child.name])
		if _mountains.has(peak_id):
			continue

		var sprite := child as Sprite2D
		var area := CLICK_AREA_SCENE.instantiate()
		area.name = "%s_ClickArea" % peak_id
		area.position = sprite.position

		var tex_size := Vector2(96, 72)
		if sprite.texture:
			tex_size = sprite.texture.get_size()

		var shape_node := area.get_node("CollisionShape2D")
		if shape_node and shape_node.shape is RectangleShape2D:
			(shape_node.shape as RectangleShape2D).size = tex_size * 0.9

		area.input_event.connect(_on_mountain_input_event.bind(peak_id))

		_sprites_root.add_child(area)
		_mountains[peak_id] = {
			"sprite": sprite,
			"area": area,
			"repaired": false,
			"form_id": "",
			"level": 1,
		}
		_set_visual_state(peak_id)

	if not mountain_visual_changed.is_connected(_apply_visual_state):
		mountain_visual_changed.connect(_apply_visual_state)


func _on_mountain_input_event(_viewport: Viewport, event: InputEvent, _shape_idx: int, peak_id: String) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		_select_peak(peak_id)


func _select_peak(peak_id: String) -> void:
	if not _mountains.has(peak_id):
		return
	_selected_peak_id = peak_id
	mountain_selected.emit(peak_id)
	repair_prompt_requested.emit(peak_id, can_repair_selected())
	_mountain_state_broadcast(peak_id)


func deselect() -> void:
	_selected_peak_id = ""
	mountain_deselected.emit()


func try_select_peak_at_point(point: Vector2) -> bool:
	for peak_id in PEAK_IDS:
		if not _mountains.has(peak_id):
			continue
		var sprite: Sprite2D = _mountains[peak_id]["sprite"]
		if not sprite or not sprite.texture:
			continue
		var tex_size := sprite.texture.get_size()
		var scale := Vector2(abs(sprite.global_scale.x), abs(sprite.global_scale.y))
		var size := tex_size * scale * 0.9
		var rect := Rect2(sprite.global_position - size * 0.5, size)
		if rect.has_point(point):
			_select_peak(peak_id)
			return true
	return false


func get_selected_peak_id() -> String:
	return _selected_peak_id


func get_selected_peak_display_name() -> String:
	var cfg = DataManager.get_peak_config(_selected_peak_id)
	if cfg:
		return str(cfg.peak_name)
	return "未选择山峰"


func get_selected_form_id() -> String:
	if not _mountains.has(_selected_peak_id):
		return ""
	return ""


func get_selected_form_label() -> String:
	var cfg = DataManager.get_peak_config(_selected_peak_id)
	return str(cfg.ability_id) if cfg else "未激活"


func get_first_activated_form_id() -> String:
	for peak_id in PEAK_IDS:
		if _mountains.has(peak_id) and bool(_mountains[peak_id]["repaired"]):
			return peak_id
	return ""


func get_all_activated_form_ids() -> Array[String]:
	return get_all_activated_peak_ids()


func get_all_activated_peak_ids() -> Array[String]:
	var result: Array[String] = []
	for peak_id in PEAK_IDS:
		if _mountains.has(peak_id) and bool(_mountains[peak_id]["repaired"]):
			result.append(peak_id)
	return result


func export_repaired_states() -> Dictionary:
	var result: Dictionary = {}
	for peak_id in PEAK_IDS:
		result[peak_id] = _mountains.has(peak_id) and bool(_mountains[peak_id]["repaired"])
	return result


func import_repaired_states(states: Dictionary) -> void:
	for peak_id in PEAK_IDS:
		if not _mountains.has(peak_id):
			continue
		_mountains[peak_id]["repaired"] = bool(states.get(peak_id, false))
		_set_visual_state(peak_id)
		_mountain_state_broadcast(peak_id)


func debug_dump_mountain_forms() -> void:
	print("[MountainManager] debug dump begin")
	for peak_id in PEAK_IDS:
		if not _mountains.has(peak_id):
			print("[MountainManager] peak_id=%s missing mountain state" % peak_id)
			continue
		var state = _mountains.get(peak_id, {})
		print("[MountainManager] peak_id=%s repaired=%s form_id=%s level=%s selected=%s" % [
			peak_id,
			str(state.get("repaired", false)),
			str(state.get("form_id", "")),
			str(state.get("level", 1)),
			str(peak_id == _selected_peak_id),
		])
	print("[MountainManager] activated_forms=%s" % str(get_all_activated_form_ids()))
	print("[MountainManager] debug dump end")


func can_repair_selected() -> bool:
	if not _mountains.has(_selected_peak_id) or bool(_mountains[_selected_peak_id]["repaired"]):
		return false
	var cfg = DataManager.get_peak_config(_selected_peak_id)
	if cfg and cfg.repair_order == "first":
		return get_all_activated_peak_ids().is_empty()
	return _mountains.has("peak_sword") and bool(_mountains["peak_sword"]["repaired"])


func has_any_mountain_activated() -> bool:
	return not get_all_activated_peak_ids().is_empty()


func repair_selected() -> bool:
	if not can_repair_selected():
		return false

	var peak_config = DataManager.get_peak_config(_selected_peak_id)
	_mountains[_selected_peak_id]["repaired"] = true
	_mountains[_selected_peak_id]["level"] = 1
	_set_visual_state(_selected_peak_id)
	repair_prompt_requested.emit(_selected_peak_id, false)
	mountain_repaired.emit(_selected_peak_id)
	_mountain_state_broadcast(_selected_peak_id)
	return true


func get_peak_level(peak_id: String) -> int:
	if not _mountains.has(peak_id):
		return 1
	return int(_mountains[peak_id]["level"])


func get_upgrade_cost(peak_id: String) -> int:
	if not _mountains.has(peak_id):
		return 0
	var level: int = int(_mountains[peak_id]["level"])
	return int(round(50.0 * pow(1.2, float(level - 1))))


func can_upgrade_selected() -> bool:
	return false


func upgrade_selected() -> bool:
	if not can_upgrade_selected():
		return false

	var level: int = int(_mountains[_selected_peak_id]["level"])
	_mountains[_selected_peak_id]["level"] = level + 1
	repair_prompt_requested.emit(_selected_peak_id, false)
	_mountain_state_broadcast(_selected_peak_id)
	return true


func _apply_visual_state(sprite: Sprite2D, color: Color) -> void:
	if sprite:
		sprite.modulate = color


func _set_visual_state(peak_id: String) -> void:
	if not _mountains.has(peak_id):
		return
	var sprite: Sprite2D = _mountains[peak_id]["sprite"]
	if not sprite:
		return
	var repaired := bool(_mountains[peak_id]["repaired"])
	var form_id := str(_mountains[peak_id]["form_id"])
	var color: Color
	if not repaired:
		color = Color(1, 1, 1, 0.45)
	elif form_id.is_empty():
		color = Color(1, 1, 1, 0.9)
	else:
		color = Color(1.0, 0.96, 0.78, 1.0)
	mountain_visual_changed.emit(sprite, color)


func _mountain_state_broadcast(peak_id: String) -> void:
	mountain_state_changed.emit(peak_id)


func get_selected_mountain_state() -> Dictionary:
	if not _mountains.has(_selected_peak_id):
		return {}

	var cfg = DataManager.get_peak_config(_selected_peak_id)
	var level: int = int(_mountains[_selected_peak_id]["level"])
	var repair_cost: int = get_repair_cost(_selected_peak_id)

	return {
		"peak_id": _selected_peak_id,
		"display_name": cfg.peak_name if cfg else _selected_peak_id,
		"school_name": "",
		"school_desc": "",
		"school_tag": "",
		"repaired": bool(_mountains[_selected_peak_id]["repaired"]),
		"form_id": "",
		"form_label": cfg.ability_id if cfg else "未激活",
		"form": null,
		"level": level,
		"max_level": 1,
		"repair_cost": repair_cost,
		"upgrade_cost": 0,
		"can_upgrade": false,
		"repair_cost_nuwa": get_repair_cost_nuwa(_selected_peak_id),
		"repair_requires_treasure": get_repair_treasure(_selected_peak_id),
	}
