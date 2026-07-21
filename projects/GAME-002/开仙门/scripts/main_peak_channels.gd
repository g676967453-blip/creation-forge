extends RefCounted
class_name MainPeakChannels
## 功法通道构建器 — 从 form_ids + levels 构建 _attack_channels 数组
## 由 MainPeak 持有并委托调用

var _peak: MainPeak

func setup(peak: MainPeak) -> void:
	_peak = peak


func set_attack_channels(form_ids: Array, levels: Dictionary = {}) -> Array:
	var channels: Array = []
	print("[MainPeak] set_attack_channels form_ids=%s levels=%s" % [str(form_ids), str(levels)])
	for form_id in form_ids:
		var config = DataManager.get_form_config(form_id)
		if config == null:
			print("[MainPeak] missing form config form_id=%s" % str(form_id))
			continue
		print("[MainPeak] bind form form_id=%s attack_type=%s projectile_shape=%s special=%s" % [
			config.form_id,
			config.attack_type,
			config.projectile_shape,
			config.special_mechanic,
		])
		var level: int = int(levels.get(form_id, 1))
		var level_data := DataManager.get_form_level_data(form_id, level)
		var channel: Dictionary = _init_channel_fields(config, level, level_data)
		_apply_level_unlocks(channel, level_data)
		channels.append(channel)
	return channels


func _init_channel_fields(config: FormConfig, level: int, level_data: Dictionary) -> Dictionary:
	return {
		"form_id": config.form_id,
		"config": config,
		"level": level,
		"timer": 0.0,
		"energy": 0.0,
		"ultimate_cd": 0.0,
		"pierce_count": 0,
		"damage_multiplier": 1.0,
		"attack_interval_multiplier": 1.0,
		"projectile_extra": 0,
		"angle_bonus": 0,
		"cycle_count_bonus": 0,
		"cycle_damage_multiplier": 1.0,
		"projectile_speed_multiplier": 1.0,
		"stun_chance_bonus": 0.0,
		"stun_time_bonus": 0.0,
		"shield_boost": 0.0,
		"soul_mark_boost": 0.0,
		"soul_blast_boost": 0.0,
		"lifesteal_bonus": 0.0,
		"summon_dmg_bonus": 0.0,
		"summon_hp_bonus": 0.0,
		"summon_revive_bonus": 0,
		"summon_reflect": 0.0,
		"summon_block_extra": 0,
		"summon_count_bonus": 0,
		"summon_speed_bonus": 0.0,
		"bounce_max_bonus": 0,
		"bounce_decay_reduction": 0.0,
		"bounce_range_bonus": 0.0,
		"thunder_stun_chance": 0.0,
		"range_multiplier": 1.0,
		# Per-level stats
		"level_attack": level_data.get("attack", config.damage),
		"level_attack_interval": level_data.get("attack_interval", config.attack_interval),
		"level_range": level_data.get("range", config.range),
		"crit_rate": level_data.get("crit_rate", 0.0),
		"crit_damage": level_data.get("crit_damage", 1.5),
		# Unlock flags
		"double_shot": false,
		"double_shot_penalty": 1.0,
		"final_damage_bonus": 0.0,
		"attack_speed_unlock": 0.0,
		"shield_hp_pct_bonus": 0.0,
		"soul_mark_weaken_bonus": 0.0,
		"soul_mark_max_stacks_bonus": 0,
		"summon_stats_bonus": 0.0,
		"summon_orbit_radius_bonus": 0.0,
		# Talent flags
		"crit_ignore_armor": false,
		"pierce_double_dmg": false,
		"hit_reduce_cd": 0.0,
	}


func _apply_level_unlocks(channel: Dictionary, _level_data: Dictionary) -> void:
	var form_id: String = channel["form_id"]
	var current_level: int = channel["level"]
	for lv in range(1, current_level + 1):
		var ld := DataManager.get_form_level_data(form_id, lv)
		var effect: String = ld.get("unlock_effect", "")
		if effect.is_empty():
			continue
		match effect:
			"ultimate_unlock":
				pass
			"final_damage":
				channel["final_damage_bonus"] = ld.get("unlock_value", 0.0)
			"double_shot":
				channel["double_shot"] = true
				channel["double_shot_penalty"] = 0.8
			"double_shot_no_penalty":
				channel["double_shot"] = true
				channel["double_shot_penalty"] = 1.0
			"attack_speed":
				channel["attack_speed_unlock"] = ld.get("unlock_value", 0.0)
			"shield_hp_pct":
				channel["shield_hp_pct_bonus"] += ld.get("unlock_value", 0.0)
			"stun_chance":
				channel["stun_chance_bonus"] += ld.get("unlock_value", 0.0)
			"angle_bonus":
				channel["angle_bonus"] += ld.get("unlock_value", 0.0)
			"soul_mark_weaken":
				channel["soul_mark_weaken_bonus"] += ld.get("unlock_value", 0.0)
			"soul_mark_max_stacks":
				channel["soul_mark_max_stacks_bonus"] += int(ld.get("unlock_value", 0))
			"soul_blast_dmg":
				channel["soul_blast_boost"] += ld.get("unlock_value", 0.0)
			"summon_count":
				channel["summon_count_bonus"] += int(ld.get("unlock_value", 0))
			"summon_stats":
				channel["summon_stats_bonus"] += ld.get("unlock_value", 0.0)
			"summon_orbit_radius":
				channel["summon_orbit_radius_bonus"] += ld.get("unlock_value", 0.0)
			"bounce_count":
				channel["bounce_max_bonus"] += int(ld.get("unlock_value", 0))
			"bounce_range":
				channel["bounce_range_bonus"] += ld.get("unlock_value", 0.0)
			"bounce_decay_reduction":
				channel["bounce_decay_reduction"] += ld.get("unlock_value", 0.0)
