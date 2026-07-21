extends Area2D
class_name MainPeak

signal main_peak_destroyed
signal clicked(screen_position: Vector2)

# --- Preloads ---
const PROJECTILE_SCENE: PackedScene = preload("res://scenes/projectiles/projectile.tscn")
const SUMMON_FOX_SCRIPT = preload("summon_fox.gd")
const SUMMON_ARTIFACT_SWORD_SCRIPT = preload("summon_artifact_sword.gd")
const SECTOR_EFFECT_SCRIPT = preload("effects/sector_effect.gd")
const NODE_BATTLEFIELD := "Battlefield"
const NODE_PROJECTILES := "Projectiles"
const NODE_MAIN_PEAK := "Battlefield/MainPeak"
const NODE_MANAGERS := "Managers"

# --- Core HP ---
var max_hp: float = 500.0
var current_hp: float = 500.0
var _base_max_hp: float = 500.0
var _hp_multiplier: float = 1.0
var _invincible: bool = false

# --- Defense state ---
var _shield_hp: float = 0.0
var _shield_max: float = 0.0
var _shield_timer: float = 0.0
var _shield_cd: float = 15.0
var _spirit_hp_bonus: float = 0.0
var _spirit_def_bonus: float = 0.0
var _spirit_regen: float = 0.0
var _spirit_armor: int = 0
var _spirit_regen_timer: float = 0.0

# --- Spirit growth ---
var _spirit_repair_count: int = 0
var _spirit_slot_count: int = 1
var _spirit_spirit_bonus: float = 0.2
var _spirit_exp_bonus: float = 0.1

# --- Visual + input ---
var _form_sprite: Sprite2D
@onready var _click_shape: CollisionShape2D = $CollisionShape2D

# --- Battle state ---
var battle_active: bool = false
var _attack_channels: Array = []
var projectile_speed: float = 520.0

# --- Summon tracking ---
var _summoned_beasts: Array = []
var _summoned_artifacts: Array = []

# --- Helper instances ---
var _channels_helper: MainPeakChannels
var _upgrades_helper: MainPeakUpgrades
var _combat_helper: MainPeakCombat
var _summons_helper: MainPeakSummons
var _ultimates_helper: MainPeakUltimates
var _defense_helper: MainPeakDefense


func _ready() -> void:
	# Init helpers
	_channels_helper = MainPeakChannels.new()
	_channels_helper.setup(self)
	_upgrades_helper = MainPeakUpgrades.new()
	_upgrades_helper.setup(self)
	_combat_helper = MainPeakCombat.new()
	_combat_helper.setup(self)
	_summons_helper = MainPeakSummons.new()
	_summons_helper.setup(self)
	_ultimates_helper = MainPeakUltimates.new()
	_ultimates_helper.setup(self)
	_defense_helper = MainPeakDefense.new()
	_defense_helper.setup(self)

	# Load config
	var cfg = DataManager.main_peak_config
	if cfg:
		_base_max_hp = cfg.max_hp
		max_hp = cfg.max_hp
		projectile_speed = cfg.projectile_speed
	current_hp = max_hp
	collision_layer = 1
	collision_mask = 4
	input_pickable = true
	add_to_group("main_peak")
	_sync_click_shape()


# --- Public API (delegated) ---

func set_attack_channels(form_ids: Array, levels: Dictionary = {}) -> void:
	_attack_channels = _channels_helper.set_attack_channels(form_ids, levels)
	_recalc_spirit_bonuses()


func apply_upgrade(form_id: String, effect_type: String, effect_value: float) -> void:
	_upgrades_helper.apply_upgrade(_attack_channels, form_id, effect_type, effect_value)


func set_battle_active(active: bool) -> void:
	battle_active = active
	if active:
		_recalc_spirit_bonuses()
		_shield_hp = _shield_max
		_shield_timer = _shield_cd
		_spirit_regen_timer = 0.0
		for channel in _attack_channels:
			channel["timer"] = 0.0
			channel["energy"] = 0.0
			var cfg: FormConfig = channel["config"] as FormConfig
			if cfg.special_mechanic == "sword_intent" and channel["level"] >= 3:
				var up: Dictionary = cfg.get_special_params()
				var base_cd: float = float(up.get("ultimate_cd", 25.0))
				var cd_per_lv: float = float(up.get("ultimate_cd_per_level", 0.5))
				channel["ultimate_cd"] = base_cd - (channel["level"] - 3) * cd_per_lv
	else:
		_summons_helper.cleanup_summons()


func apply_damage_bonus(bonus: float) -> void:
	_defense_helper.apply_damage_bonus(bonus)


func take_damage(amount: float) -> void:
	_defense_helper.take_damage(amount)


func apply_lifesteal(damage_dealt: float) -> void:
	_defense_helper.apply_lifesteal(damage_dealt)


func get_ultimate_info() -> Dictionary:
	if _attack_channels.is_empty():
		return {"energy": 0, "max_energy": 100, "cd": 0, "max_cd": 0, "ultimate_name": ""}
	var channel: Dictionary = _attack_channels[0]
	var config: FormConfig = channel["config"] as FormConfig
	var is_cd := config.special_mechanic == "sword_intent"
	if is_cd:
		var up: Dictionary = config.get_special_params()
		var max_cd: float = float(up.get("ultimate_cd", 25.0))
		return {"energy": 0, "max_energy": 100, "cd": channel.get("ultimate_cd", 0.0), "max_cd": max_cd, "ultimate_name": config.ultimate_name}
	return {
		"energy": channel.get("energy", 0.0),
		"max_energy": 100,
		"cd": 0,
		"max_cd": 0,
		"ultimate_name": config.ultimate_name,
	}


func set_invincible(val: bool) -> void:
	_invincible = val


func heal(amount: float) -> void:
	current_hp = min(current_hp + amount, max_hp)
	queue_redraw()


func apply_spirit_growth(repair_count: int, growth: Dictionary) -> void:
	_spirit_repair_count = repair_count
	var new_hp: float = float(growth.get("max_hp", max_hp))
	max_hp = new_hp
	current_hp = min(current_hp, max_hp)
	_spirit_slot_count = int(growth.get("slot_count", _spirit_slot_count))
	_spirit_spirit_bonus = float(growth.get("spirit_bonus", _spirit_spirit_bonus))
	_spirit_exp_bonus = float(growth.get("exp_bonus", _spirit_exp_bonus))
	queue_redraw()


func set_form(texture_path: String) -> void:
	if _form_sprite == null or not is_instance_valid(_form_sprite):
		_form_sprite = Sprite2D.new()
		_form_sprite.name = "FormSprite"
		_form_sprite.z_index = 1
		add_child(_form_sprite)
	if texture_path.is_empty():
		_form_sprite.texture = null
		queue_redraw()
		return
	var tex: Texture2D = load(texture_path)
	if tex:
		_form_sprite.texture = tex
		_sync_click_shape(tex)
		queue_redraw()


# --- Process ---

func _process(delta: float) -> void:
	if current_hp <= 0.0:
		return
	if not battle_active:
		_defense_helper.process_regen(delta)
		return
	_combat_helper.process_channels(delta, _attack_channels)


# --- Input ---

func _input_event(_viewport: Viewport, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		clicked.emit(event.position)


# --- Internal helpers (called by sub-helpers) ---

func _manage_summons(channel: Dictionary) -> void:
	_summons_helper.manage_summons(channel)


func _add_energy(channel: Dictionary, amount: float) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	if config.special_mechanic == "sword_intent":
		return
	if channel["energy"] >= 100:
		return
	channel["energy"] = min(100, channel["energy"] + amount)
	if channel["energy"] >= 100:
		_trigger_ultimate(channel)


func _trigger_ultimate_cd(channel: Dictionary) -> void:
	_ultimates_helper.ultimate_sword_cd(channel)


func _trigger_ultimate(channel: Dictionary) -> void:
	_ultimates_helper.trigger_ultimate(channel)


func _recalc_spirit_bonuses() -> void:
	_defense_helper.recalc_spirit_bonuses()


func _cleanup_summons() -> void:
	_summons_helper.cleanup_summons()


func _add_to_battlefield(child: Node) -> void:
	var battlefield = get_tree().current_scene.get_node_or_null(NODE_BATTLEFIELD)
	if not battlefield:
		return
	if battlefield.has_node("Projectiles"):
		battlefield.get_node(NODE_PROJECTILES).add_child(child)
	else:
		battlefield.add_child(child)


func _spawn_sector_visual(config: FormConfig, channel: Dictionary) -> void:
	var effect := Node2D.new()
	effect.script = SECTOR_EFFECT_SCRIPT
	effect.global_position = global_position
	effect.z_index = 50
	effect.angle = 90.0 + float(channel.get("angle_bonus", 0.0))
	effect.radius = config.range
	effect.color = Color(1.0, 0.84, 0.0, 0.45)
	effect.duration = 0.28
	var battlefield := get_tree().current_scene.get_node_or_null(NODE_BATTLEFIELD)
	if battlefield:
		battlefield.add_child(effect)
	else:
		add_child(effect)


func _find_target_enemy(max_range: float) -> Node2D:
	var enemies := get_tree().get_nodes_in_group("enemies")
	var candidates: Array = []
	for enemy in enemies:
		if not is_instance_valid(enemy):
			continue
		var dist := global_position.distance_to(enemy.global_position)
		if dist > max_range:
			continue
		var priority := _get_target_priority(enemy)
		candidates.append({"enemy": enemy, "dist": dist, "priority": priority})
	if candidates.is_empty():
		return null
	candidates.sort_custom(func(a, b):
		if a["priority"] != b["priority"]:
			return a["priority"] < b["priority"]
		return a["dist"] < b["dist"]
	)
	return candidates[0]["enemy"]


func _get_target_priority(enemy: Node2D) -> int:
	if not is_instance_valid(enemy):
		return 99
	var etype: String = ""
	var edata = enemy.get("data")
	if edata != null:
		etype = edata.enemy_type
	match etype:
		"ranged": return 0
		"elite": return 1
		"boss": return 2
		_: return 3


func _build_trajectory_types(count: int) -> Array:
	var types: Array = []
	for i in range(count):
		types.append("arc" if i % 2 == 1 else "straight")
	types.shuffle()
	return types


# Async sword fire (must stay on MainPeak for await)
func _fire_swords_async(swords: Array, channel: Dictionary, config: FormConfig, up: Dictionary, interval: float) -> void:
	var targets := get_tree().get_nodes_in_group("enemies")
	var valid_targets: Array = []
	for t in targets:
		if is_instance_valid(t):
			var d := global_position.distance_to(t.global_position)
			if d <= channel.get("level_range", config.range) * channel.get("range_multiplier", 1.0):
				valid_targets.append(t)
	for i in range(swords.size()):
		var s = swords[i]
		var raw = s["proj"]
		if not is_instance_valid(raw):
			continue
		var proj: Projectile = raw as Projectile
		# Refresh valid targets
		var fresh: Array = []
		for vt in valid_targets:
			if is_instance_valid(vt):
				fresh.append(vt)
		valid_targets = fresh
		if valid_targets.size() > 0:
			var t_idx := i % valid_targets.size()
			var sword_target = valid_targets[t_idx]
			if is_instance_valid(sword_target):
				proj.set_target(sword_target.global_position)
			else:
				proj.direction = Vector2(randf_range(-0.5, 0.5), -1.0).normalized()
			proj.speed = projectile_speed
			proj.set_deferred("monitoring", true)
			proj.set_deferred("monitorable", true)
		else:
			proj.direction = Vector2(randf_range(-0.5, 0.5), -1.0).normalized()
			proj.speed = projectile_speed
			proj.set_deferred("monitoring", true)
			proj.set_deferred("monitorable", true)
		await get_tree().create_timer(interval).timeout

	# Reset CD
	var base_cd: float = float(up.get("ultimate_cd", 25.0))
	var cd_per_lv: float = float(up.get("ultimate_cd_per_level", 0.5))
	channel["ultimate_cd"] = base_cd - (channel["level"] - 3) * cd_per_lv


# --- Draw + Utility ---

func _draw() -> void:
	if has_node("FormSprite"):
		return
	var points := PackedVector2Array([
		Vector2(0, -40),
		Vector2(30, 20),
		Vector2(20, 30),
		Vector2(-20, 30),
		Vector2(-30, 20)
	])
	draw_colored_polygon(points, Color(0.15, 0.1, 0.2))
	var closed_points := PackedVector2Array(points)
	closed_points.append(points[0])
	draw_polyline(closed_points, Color(0.4, 0.3, 0.5), 1.5)


func _sync_click_shape(tex: Texture2D = null) -> void:
	if _click_shape == null:
		return
	var rect := _click_shape.shape as RectangleShape2D
	if rect == null:
		rect = RectangleShape2D.new()
		_click_shape.shape = rect
	if tex:
		var icon_size := tex.get_size()
		rect.size = Vector2(icon_size.x + 24.0, icon_size.y + 24.0)
	else:
		rect.size = Vector2(120.0, 120.0)


func contains_global_point(point: Vector2) -> bool:
	var rect := _click_shape.shape as RectangleShape2D
	var size := Vector2(120.0, 120.0)
	if rect != null:
		size = rect.size
	var half := size * 0.5
	return abs(point.x - global_position.x) <= half.x and abs(point.y - global_position.y) <= half.y
