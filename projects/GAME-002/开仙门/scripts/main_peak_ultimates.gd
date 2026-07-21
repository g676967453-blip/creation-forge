extends RefCounted
class_name MainPeakUltimates
## 大招系统 — 6 种功法的终极技能
## 由 MainPeak 持有并委托调用

const PROJECTILE_SCENE: PackedScene = preload("res://scenes/projectiles/projectile.tscn")

var _peak: MainPeak

func setup(peak: MainPeak) -> void:
	_peak = peak


func trigger_ultimate(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	channel["energy"] = 0
	match config.special_mechanic:
		"cycle":
			_ultimate_sword(channel)
		"stun":
			_ultimate_buddha(channel)
		"soul_mark":
			_ultimate_demon(channel)
		"summon_beast":
			_ultimate_beast(channel)
		"summon_artifact":
			_ultimate_artifact(channel)
		"chain":
			_ultimate_thunder(channel)


func ultimate_sword_cd(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	var up: Dictionary = config.get_special_params()
	var ult_count: int = int(up.get("ultimate_count", 50))
	var ult_radius: float = float(up.get("ultimate_radius", 230.0))
	var ult_arc: float = float(up.get("ultimate_arc", 180.0))
	var dmg_mult: float = float(up.get("ultimate_dmg_mult", 2.0))
	var interval: float = float(up.get("ultimate_interval", 0.04))
	var dmg: float = channel.get("level_attack", config.damage) * channel.get("damage_multiplier", 1.0) * (1.0 + channel.get("final_damage_bonus", 0.0)) * dmg_mult

	# Lock CD during firing to prevent re-trigger
	channel["ultimate_cd"] = 999.0

	# Phase 1: Spawn all swords in fan formation (hovering)
	var swords: Array = []
	var half_arc := deg_to_rad(ult_arc / 2.0)
	for i in range(ult_count):
		var proj: Projectile = PROJECTILE_SCENE.instantiate() as Projectile
		proj.damage = dmg
		proj.speed = _peak.projectile_speed
		proj.projectile_color = config.projectile_color
		proj.projectile_shape = config.projectile_shape
		proj.from_peak = _peak
		proj.crit_rate = channel.get("crit_rate", 0.0)
		proj.crit_damage = channel.get("crit_damage", 1.5)
		proj.form_channel = channel
		var angle: float = -half_arc + deg_to_rad(ult_arc) * float(i) / float(max(ult_count - 1, 1))
		var dir := Vector2(sin(angle), -cos(angle))
		proj.global_position = _peak.global_position + dir * ult_radius
		proj.direction = dir
		proj.speed = 0.0
		proj.monitoring = false
		proj.monitorable = false
		_peak._add_to_battlefield(proj)
		swords.append({"proj": proj, "dir": dir})

	# Phase 2: Fire sequentially
	_fire_swords_sequential(swords, channel, config, up, interval)


func _fire_swords_sequential(swords: Array, channel: Dictionary, config: FormConfig, up: Dictionary, interval: float) -> void:
	_peak._fire_swords_async(swords, channel, config, up, interval)


# --- Individual ultimate methods ---

func _ultimate_sword(_channel: Dictionary) -> void:
	pass  # cycle ultimate preserved for non-sword_intent forms


func _ultimate_buddha(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	var up := config.get_special_params()
	var enemies := _peak.get_tree().get_nodes_in_group("enemies")
	var base_dmg: float = channel.get("level_attack", config.damage)
	var dmg: float = base_dmg * float(channel["damage_multiplier"]) * (1.0 + channel.get("final_damage_bonus", 0.0)) * up.get("ultimate_dmg_mult", 2.0)
	for enemy in enemies:
		if not is_instance_valid(enemy):
			continue
		enemy.take_damage(dmg)
		_peak.apply_lifesteal(dmg)
		if enemy.has_method("apply_stun"):
			enemy.apply_stun(up.get("ultimate_stun_duration", 1.2))
	_peak._shield_hp = _peak._shield_max
	_peak._spawn_sector_visual(config, channel)


func _ultimate_thunder(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	var up := config.get_special_params()
	var enemies := _peak.get_tree().get_nodes_in_group("enemies")
	var base_dmg: float = channel.get("level_attack", config.damage)
	var dmg: float = base_dmg * float(channel["damage_multiplier"]) * (1.0 + channel.get("final_damage_bonus", 0.0)) * up.get("ultimate_dmg_mult", 3.0)
	for enemy in enemies:
		if not is_instance_valid(enemy):
			continue
		enemy.take_damage(dmg)
		_peak.apply_lifesteal(dmg)
		if enemy.has_method("apply_stun"):
			var stun_chance: float = channel.get("thunder_stun_chance", 0.0)
			if stun_chance > 0.0 and randf() < stun_chance:
				enemy.apply_stun(up.get("ultimate_stun_duration", 1.0))


func _ultimate_demon(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	var up := config.get_special_params()
	var base_weaken: float = float(up.get("soul_mark_weaken", 0.08))
	var max_stacks: int = int(up.get("soul_mark_max", 4)) + int(channel.get("soul_mark_max_stacks_bonus", 0)) + int(channel.get("soul_mark_max_bonus", 0))
	var weaken: float = base_weaken + float(channel.get("soul_mark_weaken_bonus", 0.0))
	var enemies := _peak.get_tree().get_nodes_in_group("enemies")
	for enemy in enemies:
		if not is_instance_valid(enemy) or not enemy.has_method("apply_soul_mark"):
			continue
		enemy.apply_soul_mark(int(up.get("ultimate_soul_marks", 3)), max_stacks, weaken)
		if enemy.has_method("detonate_soul_mark"):
			enemy.detonate_soul_mark(channel["soul_blast_boost"], int(channel.get("soul_mark_stack_bonus", 0)), float(channel.get("soul_blast_stun", 0.0)))


func _ultimate_beast(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	var up := config.get_special_params()
	for b in _peak._summoned_beasts:
		if is_instance_valid(b):
			b.set_meta("atk", b.get_meta("atk", 8) * up.get("ultimate_atk_mult", 2.0))
			b.set_meta("invincible", true)
	await _peak.get_tree().create_timer(up.get("ultimate_duration", 8.0)).timeout
	for b in _peak._summoned_beasts:
		if is_instance_valid(b):
			b.set_meta("atk", b.get_meta("atk", 8) / up.get("ultimate_atk_mult", 2.0))
			b.set_meta("invincible", false)


func _ultimate_artifact(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	var up := config.get_special_params()
	for a in _peak._summoned_artifacts:
		if is_instance_valid(a):
			a.set_meta("atk", a.get_meta("atk", 10) * up.get("ultimate_atk_mult", 2.0))
			a.set_meta("orbit_speed", a.get_meta("orbit_speed", 2.5) * up.get("ultimate_speed_mult", 2.0))
	await _peak.get_tree().create_timer(up.get("ultimate_duration", 8.0)).timeout
	for a in _peak._summoned_artifacts:
		if is_instance_valid(a):
			a.set_meta("atk", a.get_meta("atk", 10) / up.get("ultimate_atk_mult", 2.0))
			a.set_meta("orbit_speed", a.get_meta("orbit_speed", 2.5) / up.get("ultimate_speed_mult", 2.0))
