extends RefCounted
class_name MainPeakUpgrades
## 卡牌升级系统 — apply_upgrade() 的 35+ match/case 分支
## 由 MainPeak 持有并委托调用

var _peak: MainPeak

func setup(peak: MainPeak) -> void:
	_peak = peak


func apply_upgrade(channels: Array, form_id: String, effect_type: String, effect_value: float) -> void:
	for channel in channels:
		if channel["form_id"] != form_id:
			continue
		match effect_type:
			"damage_up":
				channel["damage_multiplier"] += effect_value
			"speed_up":
				channel["attack_interval_multiplier"] = channel.get("attack_interval_multiplier", 1.0) * (1.0 - effect_value)
			"range_up":
				channel["range_multiplier"] = channel.get("range_multiplier", 1.0) * (1.0 + effect_value)
			"hp_up":
				_peak._hp_multiplier *= (1.0 + effect_value)
				_peak.max_hp = _peak._base_max_hp * _peak._hp_multiplier
				_peak.current_hp = min(_peak.current_hp, _peak.max_hp)
			"cycle_count":
				channel["cycle_count_bonus"] += int(effect_value)
			"cycle_damage":
				channel["cycle_damage_multiplier"] += effect_value
			"projectile_extra":
				channel["projectile_extra"] += int(effect_value)
			"projectile_speed":
				channel["projectile_speed_multiplier"] += effect_value
			"angle_up":
				channel["angle_bonus"] += effect_value
			"stun_chance":
				channel["stun_chance_bonus"] += effect_value
			"stun_time":
				channel["stun_time_bonus"] += effect_value
			"shield_boost":
				channel["shield_boost"] += effect_value
			"soul_mark_boost":
				channel["soul_mark_boost"] += effect_value
			"soul_blast_dmg":
				channel["soul_blast_boost"] += effect_value
			"lifesteal":
				channel["lifesteal_bonus"] += effect_value
			"summon_dmg":
				channel["summon_dmg_bonus"] += effect_value
			"summon_hp":
				channel["summon_hp_bonus"] += effect_value
			"summon_revive":
				channel["summon_revive_bonus"] += int(effect_value)
			"summon_reflect":
				channel["summon_reflect"] += effect_value
			"summon_block":
				channel["summon_block_extra"] += int(effect_value)
			"summon_extra":
				channel["summon_count_bonus"] += int(effect_value)
			"summon_speed":
				channel["summon_speed_bonus"] += effect_value
			"bounce_up":
				channel["bounce_max_bonus"] += int(effect_value)
			"decay_down":
				channel["bounce_decay_reduction"] += effect_value
			"thunder_range_up":
				channel["bounce_range_bonus"] += effect_value
			"thunder_stun":
				channel["thunder_stun_chance"] += effect_value
			"crit_rate_up":
				channel["crit_rate"] += effect_value
			"crit_dmg_up":
				channel["crit_damage"] += effect_value
			"volley":
				channel["projectile_extra"] += 1
				channel["damage_multiplier"] -= 0.10
			"pierce_penalty":
				channel["pierce_count"] += 1
				channel["damage_multiplier"] -= 0.20
			# --- volley tier ---
			"volley_t2":
				channel["damage_multiplier"] += 0.10
			"volley_t3":
				channel["projectile_extra"] += 1
			# --- pierce_penalty tier ---
			"pierce_penalty_t2":
				channel["damage_multiplier"] += 0.20
			"pierce_penalty_t3":
				channel["pierce_double_dmg"] = true
			# --- damage_up tier (form-specific) ---
			"damage_up_t2":
				_apply_damage_up_t2(channel, form_id)
			"damage_up_t3":
				_apply_damage_up_t3(channel, form_id)
			# --- speed_up tier (form-specific) ---
			"speed_up_t2":
				_apply_speed_up_t2(channel, form_id)
			"speed_up_t3":
				_apply_speed_up_t3(channel, form_id)
			# --- shield_boost tier ---
			"shield_boost_t2":
				_peak._shield_cd = maxf(3.0, _peak._shield_cd - 3.0)
			"shield_boost_t3":
				channel["shield_reflect"] = 0.20
			# --- stun_chance tier ---
			"stun_chance_t2":
				channel["stun_time_bonus"] += 0.4
			"stun_chance_t3":
				channel["angle_bonus"] += 30.0
			# --- soul_mark_boost tier ---
			"soul_mark_boost_t2":
				channel["soul_mark_max_bonus"] = channel.get("soul_mark_max_bonus", 0) + 1
			"soul_mark_boost_t3":
				channel["soul_blast_boost"] += 0.60
			# --- soul_blast_dmg tier ---
			"soul_blast_dmg_t2":
				channel["soul_mark_stack_bonus"] = channel.get("soul_mark_stack_bonus", 0) + 1
			"soul_blast_dmg_t3":
				channel["soul_blast_stun"] = 0.5
			# --- lifesteal tier ---
			"lifesteal_t2":
				channel["lifesteal_bonus"] += 0.05
			"lifesteal_t3":
				channel["lifesteal_bonus"] += 0.10
			# --- summon_dmg tier ---
			"summon_dmg_t2":
				channel["summon_speed_bonus"] += 0.20
			"summon_dmg_t3":
				channel["summon_dmg_bonus"] += 0.40
			# --- summon_hp tier ---
			"summon_hp_t2":
				channel["summon_revive_bonus"] -= 2
			"summon_hp_t3":
				channel["summon_taunt"] = true
			# --- summon_speed tier (form-specific) ---
			"summon_speed_t2":
				_apply_summon_speed_t2(channel, form_id)
			"summon_speed_t3":
				channel["summon_dmg_bonus"] += 0.30
			# --- summon_reflect tier ---
			"summon_reflect_t2":
				channel["summon_block_extra"] += 1
			"summon_reflect_t3":
				channel["summon_lifesteal"] = 0.05
			# --- thunder_stun tier ---
			"thunder_stun_t2":
				channel["thunder_stun_time"] = channel.get("thunder_stun_time", 0.0) + 0.3
			"thunder_stun_t3":
				channel["thunder_stun_guaranteed"] = true
		_peak._recalc_spirit_bonuses()
		break


# --- Form-specific tier helpers ---

func _apply_damage_up_t2(channel: Dictionary, form_id: String) -> void:
	match form_id:
		"form_sword_01":   channel["crit_damage"] += 0.50
		"form_buddha_01":  channel["angle_bonus"] += 15.0
		"form_demon_01":   channel["soul_mark_boost"] += 0.03
		"form_thunder_01": channel["bounce_max_bonus"] += 1


func _apply_damage_up_t3(channel: Dictionary, form_id: String) -> void:
	match form_id:
		"form_sword_01":   channel["crit_ignore_armor"] = true
		"form_buddha_01":  channel["damage_multiplier"] += 0.40
		"form_demon_01":   channel["crit_damage"] += 0.50
		"form_thunder_01": channel["crit_damage"] += 0.50


func _apply_speed_up_t2(channel: Dictionary, form_id: String) -> void:
	match form_id:
		"form_sword_01": channel["projectile_speed_multiplier"] += 0.50
		"form_buddha_01": channel["stun_time_bonus"] += 0.3
		"form_demon_01": channel["projectile_speed_multiplier"] += 0.50


func _apply_speed_up_t3(channel: Dictionary, form_id: String) -> void:
	match form_id:
		"form_sword_01": channel["hit_reduce_cd"] = 0.1
		"form_buddha_01": channel["attack_interval_multiplier"] = channel.get("attack_interval_multiplier", 1.0) * 0.8
		"form_demon_01": channel["attack_interval_multiplier"] = channel.get("attack_interval_multiplier", 1.0) * 0.8


func _apply_summon_speed_t2(channel: Dictionary, form_id: String) -> void:
	match form_id:
		"form_beast_01":    channel["summon_move_speed_bonus"] = channel.get("summon_move_speed_bonus", 0.0) + 0.25
		"form_artifact_01": channel["summon_orbit_speed_bonus"] = channel.get("summon_orbit_speed_bonus", 0.0) + 0.50
