extends RefCounted
class_name MainPeakSummons
## 召唤物管理 — 灵狐 + 法器剑的创建、维护、清理
## 由 MainPeak 持有并委托调用

const SUMMON_FOX_SCRIPT = preload("res://scripts/summon_fox.gd")
const SUMMON_ARTIFACT_SWORD_SCRIPT = preload("res://scripts/summon_artifact_sword.gd")

var _peak: MainPeak

func setup(peak: MainPeak) -> void:
	_peak = peak


func manage_summons(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	var special: String = config.special_mechanic
	if special == "summon_beast":
		_ensure_beasts(channel)
	elif special == "summon_artifact":
		_ensure_artifacts(channel)


func _ensure_beasts(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	var alive := 0
	for b in _peak._summoned_beasts:
		if is_instance_valid(b) and b.has_method("is_alive") and b.is_alive():
			alive += 1
	var target_count: int = 1 + int(channel["summon_count_bonus"])
	if target_count < 1:
		target_count = 1
	while alive < target_count and _peak._summoned_beasts.size() < target_count + 2:
		var beast := _create_fox(channel)
		if beast:
			_peak._summoned_beasts.append(beast)
			alive += 1
	for b in _peak._summoned_beasts:
		if is_instance_valid(b):
			_peak._add_energy(channel, config.energy_per_hit * 0.1)


func _create_fox(channel: Dictionary) -> Node2D:
	var fox := Area2D.new()
	fox.name = "SummonFox"
	fox.add_to_group("summons")
	fox.collision_layer = 2
	fox.collision_mask = 4
	var shape := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 12
	shape.shape = circle
	fox.add_child(shape)
	var config: FormConfig = channel["config"] as FormConfig
	var params: Dictionary = config.get_special_params()
	var base_hp: float = params.get("fox_hp", 120.0)
	var base_atk: float = params.get("fox_atk", 8.0)
	var base_speed: float = params.get("fox_speed", 180.0)
	var stats_mult: float = 1.0 + channel.get("summon_stats_bonus", 0.0)
	fox.set_meta("hp", base_hp * (1.0 + channel["summon_hp_bonus"]) * stats_mult)
	fox.set_meta("max_hp", base_hp * (1.0 + channel["summon_hp_bonus"]) * stats_mult)
	fox.set_meta("atk", base_atk * (1.0 + channel["summon_dmg_bonus"]) * stats_mult)
	fox.set_meta("atk_interval", 0.9 / (1.0 + channel.get("summon_speed_bonus", 0.0)))
	fox.set_meta("atk_timer", 0.0)
	fox.set_meta("speed", base_speed * (1.0 + channel.get("summon_move_speed_bonus", 0.0)) * stats_mult)
	fox.set_meta("taunt", channel.get("summon_taunt", false))
	fox.global_position = _peak.global_position + Vector2(randf_range(-40, 40), randf_range(-30, 10))
	fox.add_to_group("summon_beasts")
	_peak._add_to_battlefield(fox)
	fox.set_script(SUMMON_FOX_SCRIPT)
	fox.energy_gained.connect(func(amt): _peak._add_energy(channel, amt))
	return fox


func _ensure_artifacts(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	var alive := 0
	for a in _peak._summoned_artifacts:
		if is_instance_valid(a):
			alive += 1
	var target_count: int = 1 + int(channel["summon_count_bonus"])
	if target_count < 1:
		target_count = 1
	while alive < target_count:
		var artifact := _create_sword_artifact(channel)
		if artifact:
			_peak._summoned_artifacts.append(artifact)
			alive += 1
	for a in _peak._summoned_artifacts:
		if is_instance_valid(a):
			_peak._add_energy(channel, config.energy_per_hit * 0.1)


func _create_sword_artifact(channel: Dictionary) -> Node2D:
	var sword := Area2D.new()
	sword.name = "ArtifactSword"
	sword.add_to_group("summons")
	sword.collision_layer = 2
	sword.collision_mask = 4
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(16, 6)
	shape.shape = rect
	sword.add_child(shape)
	var config: FormConfig = channel["config"] as FormConfig
	var params: Dictionary = config.get_special_params()
	var base_atk: float = params.get("sword_atk", 10.0)
	var orbit_radius: float = params.get("sword_orbit_radius", 80.0) + channel.get("summon_orbit_radius_bonus", 0.0)
	sword.set_meta("atk", base_atk * (1.0 + channel["summon_dmg_bonus"]))
	sword.set_meta("atk_interval", 0.9 / (1.0 + channel.get("summon_speed_bonus", 0.0)))
	sword.set_meta("atk_timer", 0.0)
	sword.set_meta("orbit_radius", orbit_radius)
	sword.set_meta("orbit_angle", randf() * TAU)
	sword.set_meta("orbit_speed", 2.5 * (1.0 + channel.get("summon_orbit_speed_bonus", 0.0)))
	sword.set_meta("reflect_pct", channel["summon_reflect"])
	sword.set_meta("lifesteal", channel.get("summon_lifesteal", 0.0))
	sword.set_meta("main_peak_ref", _peak)
	sword.global_position = _peak.global_position
	sword.add_to_group("summon_artifacts")
	_peak._add_to_battlefield(sword)
	sword.set_script(SUMMON_ARTIFACT_SWORD_SCRIPT)
	sword.energy_gained.connect(func(amt): _peak._add_energy(channel, amt))
	return sword


func cleanup_summons() -> void:
	for b in _peak._summoned_beasts:
		if is_instance_valid(b):
			b.queue_free()
	_peak._summoned_beasts.clear()
	for a in _peak._summoned_artifacts:
		if is_instance_valid(a):
			a.queue_free()
	_peak._summoned_artifacts.clear()
