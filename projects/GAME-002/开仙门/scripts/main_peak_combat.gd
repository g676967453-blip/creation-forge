extends RefCounted
class_name MainPeakCombat
## 战斗攻击系统 — _process 攻击循环 + 弹道/扇形攻击执行
## 由 MainPeak 持有并委托调用

const PROJECTILE_SCENE: PackedScene = preload("res://scenes/projectiles/projectile.tscn")

var _peak: MainPeak

func setup(peak: MainPeak) -> void:
	_peak = peak


func process_channels(delta: float, channels: Array) -> void:
	if _peak.current_hp <= 0.0:
		return

	# Shield timer
	if _peak._shield_max > 0.0:
		_peak._shield_timer -= delta
		if _peak._shield_timer <= 0.0:
			_peak._shield_timer = _peak._shield_cd
			_peak._shield_hp = _peak._shield_max

	# Spirit regen during battle
	if _peak._spirit_regen > 0.0:
		_peak._spirit_regen_timer += delta
		while _peak._spirit_regen_timer >= 1.0:
			_peak._spirit_regen_timer -= 1.0
			_peak.heal(_peak._spirit_regen)

	for channel in channels:
		var cfg: FormConfig = channel["config"] as FormConfig
		# Sword intent CD-based ultimate
		if cfg.special_mechanic == "sword_intent" and channel["level"] >= 3 and channel.get("ultimate_cd", 0.0) > 0.0:
			channel["ultimate_cd"] -= delta
			if channel["ultimate_cd"] <= 0.0:
				channel["ultimate_cd"] = 0.0
				_peak._trigger_ultimate_cd(channel)
		channel["timer"] -= delta
		if channel["timer"] <= 0.0:
			var config: FormConfig = channel["config"] as FormConfig
			var base_interval: float = channel.get("level_attack_interval", config.attack_interval)
			var speed_mult: float = channel.get("attack_interval_multiplier", 1.0)
			if channel.get("attack_speed_unlock", 0.0) > 0.0:
				speed_mult *= 1.0 / (1.0 + channel["attack_speed_unlock"])
			channel["timer"] = base_interval * speed_mult
			match config.attack_type:
				"projectile":
					_perform_projectile_attack(channel)
				"sector":
					_perform_sector_attack(channel)
				"summon":
					_peak._manage_summons(channel)


func _perform_projectile_attack(channel: Dictionary) -> void:
	var config: FormConfig = channel["config"] as FormConfig
	var effective_range: float = channel.get("level_range", config.range) * channel.get("range_multiplier", 1.0)
	var target := _peak._find_target_enemy(effective_range)
	if target == null:
		return
	var total_count: int = config.projectile_count + channel["projectile_extra"]
	if channel.get("double_shot", false):
		total_count = 2 + channel["projectile_extra"]
	var is_cycle: bool = config.special_mechanic == "cycle"
	var base_target_time: float = 0.0
	var trajectory_types: Array = []
	if is_cycle:
		var dist := _peak.global_position.distance_to(target.global_position)
		base_target_time = dist / _peak.projectile_speed
		trajectory_types = _peak._build_trajectory_types(total_count)

	for i in range(total_count):
		var proj: Projectile = PROJECTILE_SCENE.instantiate() as Projectile
		var base_dmg: float = channel.get("level_attack", config.damage)
		var dmg_mult: float = channel["damage_multiplier"] * (1.0 + channel.get("final_damage_bonus", 0.0))
		var dmg: float = base_dmg * dmg_mult
		if channel.get("double_shot", false):
			dmg *= channel.get("double_shot_penalty", 1.0)
		proj.damage = dmg
		proj.speed = _peak.projectile_speed
		proj.pierce_count = channel["pierce_count"]
		proj.projectile_color = config.projectile_color
		proj.projectile_shape = config.projectile_shape
		proj.from_peak = _peak
		var offset_x: float = randf_range(-6.0, 6.0)
		if channel.get("double_shot", false):
			offset_x = -8.0 if i == 0 else 8.0
		proj.global_position = _peak.global_position + Vector2(offset_x, -20.0)

		if is_cycle:
			proj.damage *= channel["cycle_damage_multiplier"]
			var params := config.get_special_params()
			var cycle_count: int = int(params.get("cycle_count", 1)) + int(channel.get("cycle_count_bonus", 0))
			var cycle_distance: float = float(params.get("cycle_distance", 150.0))
			var arc_min: float = float(params.get("arc_offset_min", 40.0))
			var arc_max: float = float(params.get("arc_offset_max", 120.0))
			var turn_dur: float = float(params.get("turn_duration", 0.3))
			var spd_mult: float = 1.0 + float(channel.get("projectile_speed_multiplier", 0.0))
			var use_arc: bool = trajectory_types[i] == "arc"
			proj.setup_cycle(target, cycle_count, cycle_distance, arc_min, arc_max, turn_dur, spd_mult, base_target_time, use_arc)
		else:
			proj.set_target(target.global_position)

		_peak._add_to_battlefield(proj)
		proj.form_channel = channel
		proj.crit_rate = channel.get("crit_rate", 0.0)
		proj.crit_damage = channel.get("crit_damage", 1.5)

		if config.special_mechanic == "chain":
			var params := config.get_special_params()
			proj.bounces_remaining = int(params.get("bounces", 3)) + int(channel.get("bounce_max_bonus", 0))
			proj.bounce_range = float(params.get("bounce_range", 200.0)) + float(channel.get("bounce_range_bonus", 0.0))
			var decay: float = float(params.get("decay_pct", 0.25)) - float(channel.get("bounce_decay_reduction", 0.0))
			proj.bounce_decay_pct = clamp(decay, 0.0, 0.99)
			proj.bounce_stun_chance = float(channel.get("thunder_stun_chance", 0.0))

	_peak._add_energy(channel, config.energy_per_hit * total_count)


func _perform_sector_attack(channel: Dictionary) -> void:
	var enemies := _peak.get_tree().get_nodes_in_group("enemies")
	var config: FormConfig = channel["config"] as FormConfig
	var base_angle: float = 90.0 + channel["angle_bonus"]
	var half_angle := deg_to_rad(base_angle / 2.0)
	var radius: float = channel.get("level_range", config.range) * channel.get("range_multiplier", 1.0)
	var hit_count := 0

	for enemy in enemies:
		if not is_instance_valid(enemy):
			continue
		var dist := _peak.global_position.distance_to(enemy.global_position)
		if dist > radius:
			continue
		var dir: Vector2 = (enemy.global_position - _peak.global_position).normalized()
		var forward := Vector2(0, -1)
		var angle: float = forward.angle_to(dir)
		if abs(angle) <= half_angle:
			var dmg: float = channel.get("level_attack", config.damage) * float(channel["damage_multiplier"])
			dmg *= (1.0 + channel.get("final_damage_bonus", 0.0))
			if randf() < channel.get("crit_rate", 0.0):
				dmg *= channel.get("crit_damage", 1.5)
			enemy.take_damage(dmg)
			_peak.apply_lifesteal(dmg)

			var params := config.get_special_params()
			var stun_chance: float = params.get("chance", 0.12) + channel["stun_chance_bonus"]
			var stun_duration: float = params.get("duration", 0.5) + channel["stun_time_bonus"]
			if randf() < stun_chance:
				if enemy.has_method("apply_stun"):
					enemy.apply_stun(stun_duration)

			hit_count += 1

	if hit_count > 0:
		_peak._add_energy(channel, config.energy_per_hit * hit_count)

	_peak._spawn_sector_visual(config, channel)
