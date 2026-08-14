extends Node
## 全局数据管理器(Autoload) - 通过 CSV 载入配置

var peak_config_database: Dictionary = {}
var enemy_database: Dictionary = {}
## V0.0 card_database — 已废弃（V0.1 用 blessing_database 替代）
var form_database: Dictionary = {}
var spirit_profile_database: Dictionary = {}
var main_peak_config
var wave_database: Array = []
var enemy_sprite_database: Dictionary = {}
var form_level_database: Dictionary = {}
var spirit_growth_database: Dictionary = {}
## V0.1 新数据库
var disciple_database: Dictionary = {}
var blessing_database: Dictionary = {}
var artifact_database: Dictionary = {}


func _ready() -> void:
	_load_main_peak()
	_load_peak_configs()
	_load_enemies()
	_load_forms()
	_load_spirit_profiles()
	_load_spirit_growth()
	_load_enemy_sprites()
	_load_form_levels()
	_init_waves()
	_load_disciples()
	_load_blessings()
	_load_artifacts()
	print("[DataManager] loaded: peaks=%d enemies=%d forms=%d profiles=%d sprites=%d levels=%d waves=%d disciples=%d blessings=%d artifacts=%d" % [
		peak_config_database.size(), enemy_database.size(), form_database.size(), spirit_profile_database.size(), enemy_sprite_database.size(), form_level_database.size(), wave_database.size(), disciple_database.size(), blessing_database.size(), artifact_database.size()
	])


func _load_main_peak() -> void:
	var rows := CsvLoader.load_csv("res://data/main_peak_config.csv")
	if rows.is_empty():
		main_peak_config = preload("res://scripts/data/main_peak_config.gd").new()
		return
	var r: Dictionary = rows[0]
	main_peak_config = preload("res://scripts/data/main_peak_config.gd").new()
	main_peak_config.max_hp = float(r.get("max_hp", "500"))
	main_peak_config.base_damage = float(r.get("base_damage", "18"))
	main_peak_config.attack_interval = float(r.get("attack_interval", "0.85"))
	main_peak_config.projectile_speed = float(r.get("projectile_speed", "520"))
	main_peak_config.split_count = int(r.get("split_count", "0"))
	main_peak_config.pierce_count = int(r.get("pierce_count", "0"))
	main_peak_config.damage_multiplier = float(r.get("damage_multiplier", "1.0"))
	main_peak_config.spirit_click_base = int(r.get("spirit_click_base", "10"))
	main_peak_config.spirit_auto_base = int(r.get("spirit_auto_base", "5"))
	main_peak_config.spirit_auto_interval = float(r.get("spirit_auto_interval", "0.2"))
	main_peak_config.spirit_display_interval = float(r.get("spirit_display_interval", "1.0"))
	main_peak_config.projectile_max_distance = float(r.get("projectile_max_distance", "1800"))
	main_peak_config.exp_per_level_increase = int(r.get("exp_per_level_increase", "25"))
	main_peak_config.soul_mark_weaken_per_stack = float(r.get("soul_mark_weaken_per_stack", "0.08"))
	main_peak_config.soul_mark_base_damage = float(r.get("soul_mark_base_damage", "20.0"))


func _load_peak_configs() -> void:
	peak_config_database.clear()
	var rows := CsvLoader.load_csv("res://data/peak_config.csv")
	for r in rows:
		var d = preload("res://scripts/data/peak_config.gd").new()
		d.peak_id = str(r.get("peak_id", ""))
		d.peak_name = str(r.get("peak_name", ""))
		d.school_name = str(r.get("school_name", ""))
		d.school_tag = str(r.get("school_tag", ""))
		d.school_desc = str(r.get("school_desc", ""))
		d.entry_form_id = str(r.get("entry_form_id", ""))
		d.icon_path = str(r.get("icon_path", ""))
		d.repair_cost = int(r.get("repair_cost", "20"))
		d.upgrade_cost_base = int(r.get("upgrade_cost_base", "30"))
		d.upgrade_cost_per_level = int(r.get("upgrade_cost_per_level", "15"))
		peak_config_database[d.peak_id] = d


func _load_enemies() -> void:
	enemy_database.clear()
	var rows := CsvLoader.load_csv("res://data/enemy_config.csv")
	for r in rows:
		var d = EnemyData.new()
		d.id = str(r.get("id", ""))
		d.display_name = str(r.get("display_name", ""))
		d.hp = float(r.get("hp", "50"))
		d.speed = float(r.get("speed", "120"))
		d.damage = float(r.get("damage", "10"))
		d.enemy_type = str(r.get("enemy_type", "ground"))
		d.path_type = str(r.get("path_type", "straight"))
		d.size = float(r.get("size", "1.0"))
		d.color = Color(
			float(r.get("color_r", "1.0")),
			float(r.get("color_g", "1.0")),
			float(r.get("color_b", "1.0"))
		)
		d.exp_reward = int(r.get("exp_reward", "10"))
		d.siege_attack_interval = float(r.get("siege_attack_interval", "1.0"))
		d.armor = int(r.get("armor", "0"))
		d.march_style = str(r.get("march_style", "quick"))
		d.attack_range = float(r.get("attack_range", "0"))
		enemy_database[d.id] = d


func _load_forms() -> void:
	form_database.clear()
	var rows := CsvLoader.load_csv("res://data/form_config.csv")
	for r in rows:
		var f = preload("res://scripts/data/form_config.gd").new()
		f.form_id = str(r.get("form_id", ""))
		f.form_name = str(r.get("form_name", ""))
		f.peak_id = str(r.get("peak_id", ""))
		f.quality = str(r.get("quality", ""))
		f.max_level = int(r.get("max_level", "10"))
		f.attack_type = str(r.get("attack_type", "projectile"))
		f.atk_type_label = str(r.get("atk_type_label", ""))
		f.damage = float(r.get("damage", "0"))
		f.projectile_count = int(r.get("projectile_count", "1"))
		f.attack_interval = float(r.get("attack_interval", "1.0"))
		f.range = float(r.get("range", "400"))
		f.damage_type = str(r.get("damage_type", "physical"))
		f.defense_type = str(r.get("defense_type", "none"))
		f.defense_value = float(r.get("defense_value", "0"))
		f.ultimate_name = str(r.get("ultimate_name", ""))
		f.ultimate_desc = str(r.get("ultimate_desc", ""))
		f.energy_per_hit = float(r.get("energy_per_hit", "0"))
		f.special_mechanic = str(r.get("special_mechanic", ""))
		f.special_param = str(r.get("special_param", ""))
		f.projectile_color = Color(
			float(r.get("projectile_color_r", "1.0")),
			float(r.get("projectile_color_g", "1.0")),
			float(r.get("projectile_color_b", "1.0"))
		)
		f.projectile_shape = str(r.get("projectile_shape", "circle"))
		f.spirit_hp_bonus = float(r.get("spirit_hp_bonus", "0"))
		f.spirit_def_bonus = float(r.get("spirit_def_bonus", "0"))
		f.spirit_regen = float(r.get("spirit_regen", "0"))
		f.spirit_armor = int(r.get("spirit_armor", "0"))
		form_database[f.form_id] = f


func _load_spirit_profiles() -> void:
	spirit_profile_database.clear()
	var rows := CsvLoader.load_csv("res://data/spirit_profile_config.csv")
	for r in rows:
		var p: SpiritProfileConfig = preload("res://scripts/data/spirit_profile_config.gd").new()
		p.profile_id = str(r.get("profile_id", ""))
		p.profile_name = str(r.get("profile_name", ""))
		p.desc = str(r.get("desc", ""))
		p.icon_path = str(r.get("icon_path", ""))
		p.special_ability = str(r.get("special_ability", ""))
		spirit_profile_database[p.profile_id] = p


func get_spirit_profile(id: String):
	return spirit_profile_database.get(id)


func get_all_spirit_profiles() -> Array:
	var profiles: Array = []
	profiles.assign(spirit_profile_database.values())
	return profiles


func _load_spirit_growth() -> void:
	spirit_growth_database.clear()
	var rows := CsvLoader.load_csv("res://data/spirit_growth.csv")
	for row in rows:
		var rc: int = int(row["repair_count"])
		spirit_growth_database[rc] = row


func get_spirit_growth(repair_count: int) -> Dictionary:
	return spirit_growth_database.get(repair_count, {})


func _load_enemy_sprites() -> void:
	enemy_sprite_database.clear()
	var rows := CsvLoader.load_csv("res://data/enemy_sprite_config.csv")
	for r in rows:
		var sid: String = str(r.get("enemy_id", ""))
		enemy_sprite_database[sid] = {
			"sheet": str(r.get("sheet_path", "")),
			"frames": int(r.get("frames", "1")),
			"frame_w": int(r.get("frame_w", "32")),
			"frame_h": int(r.get("frame_h", "32")),
			"fps": float(r.get("fps", "6.0")),
		}


func get_enemy_sprite_config(enemy_id: String) -> Dictionary:
	return enemy_sprite_database.get(enemy_id, {})


func _load_form_levels() -> void:
	form_level_database.clear()
	var rows := CsvLoader.load_csv("res://data/form_level_config.csv")
	for r in rows:
		var form_id: String = str(r.get("form_id", ""))
		var level: int = int(r.get("level", "1"))
		var key := "%s_%d" % [form_id, level]
		form_level_database[key] = {
			"form_id": form_id,
			"level": level,
			"attack": float(r.get("attack", "10")),
			"attack_interval": float(r.get("attack_interval", "1.0")),
			"crit_rate": float(r.get("crit_rate", "0.0")),
			"crit_damage": float(r.get("crit_damage", "1.5")),
			"range": float(r.get("range", "300")),
			"spirit_hp": float(r.get("spirit_hp", "0")),
			"spirit_def": float(r.get("spirit_def", "0")),
			"spirit_regen": float(r.get("spirit_regen", "0")),
			"spirit_armor": int(r.get("spirit_armor", "0")),
			"unlock_effect": str(r.get("unlock_effect", "")),
			"unlock_value": float(r.get("unlock_value", "0")),
		}


func get_form_level_data(form_id: String, level: int) -> Dictionary:
	var key := "%s_%d" % [form_id, level]
	return form_level_database.get(key, {})


func _init_waves() -> void:
	wave_database.clear()
	var rows := CsvLoader.load_csv("res://data/wave_config.csv")
	if rows.is_empty():
		return
	# Group rows by wave_index
	var wave_map: Dictionary = {}
	for r in rows:
		var idx: int = int(r.get("wave_index", "1"))
		if not wave_map.has(idx):
			wave_map[idx] = []
		wave_map[idx].append(r)
	for wave_idx in wave_map:
		var w = WaveData.new()
		w.wave_index = wave_idx
		for row in wave_map[wave_idx]:
			var eg = WaveEnemyGroup.new()
			eg.enemy_id = str(row.get("enemy_id", ""))
			eg.count = int(row.get("count", "0"))
			eg.spawn_interval = float(row.get("spawn_interval", "1.0"))
			eg.path_type = str(row.get("path_type", "straight"))
			w.enemy_groups.append(eg)
		wave_database.append(w)
	wave_database.sort_custom(func(a, b): return a.wave_index < b.wave_index)


func get_peak_config(id: String):
	return peak_config_database.get(id)


func get_all_peak_configs() -> Array:
	var configs: Array = []
	configs.assign(peak_config_database.values())
	return configs


func get_enemy_data(id: String):
	return enemy_database.get(id)


func get_form_config(form_id: String):
	return form_database.get(form_id)


func get_form_config_by_peak(peak_id: String):
	for f in form_database.values():
		if f.peak_id == peak_id:
			return f
	return null


func get_all_forms() -> Array:
	var forms: Array = []
	forms.assign(form_database.values())
	return forms


func get_waves() -> Array:
	return wave_database


# ── V0.1 新数据加载 ──

func _load_disciples() -> void:
	disciple_database.clear()
	var rows := CsvLoader.load_csv("res://data/disciple_config.csv")
	for r in rows:
		var d := DiscipleData.new()
		d.disciple_id = str(r.get("id", ""))
		if d.disciple_id.is_empty() or d.disciple_id.begins_with("#"):
			continue
		d.disciple_name = str(r.get("name", ""))
		d.peak_id = str(r.get("peak_id", ""))
		d.hp = float(r.get("hp", "100"))
		d.attack = float(r.get("attack", "10"))
		d.defense = float(r.get("defense", "0"))
		d.attack_speed = float(r.get("attack_speed", "1.0"))
		d.move_speed = float(r.get("move_speed", "200"))
		d.attack_range = float(r.get("attack_range", "150"))
		d.skill_id = str(r.get("skill_id", ""))
		d.cost = int(r.get("cost", "100"))
		disciple_database[d.disciple_id] = d


func _load_blessings() -> void:
	blessing_database.clear()
	var rows := CsvLoader.load_csv("res://data/blessing_config.csv")
	for r in rows:
		var b := BlessingData.new()
		b.blessing_id = str(r.get("blessing_id", ""))
		if b.blessing_id.is_empty() or b.blessing_id.begins_with("#"):
			continue
		b.blessing_line = str(r.get("blessing_line", ""))
		b.tier = int(r.get("tier", "1"))
		b.blessing_type = str(r.get("type", ""))
		b.display_name = str(r.get("display_name", ""))
		b.description = str(r.get("description", ""))
		b.effect_key = str(r.get("effect_key", ""))
		b.effect_value = float(r.get("effect_value", "0"))
		b.effect_value_2 = float(r.get("effect_value_2", "0"))
		b.required_peak = str(r.get("required_peak", ""))
		b.rarity = str(r.get("rarity", "common"))
		b.weight = int(r.get("weight", "10"))
		blessing_database[b.blessing_id] = b


func _load_artifacts() -> void:
	artifact_database.clear()
	var rows := CsvLoader.load_csv("res://data/artifact_config.csv")
	for r in rows:
		var a := ArtifactData.new()
		a.artifact_id = str(r.get("id", ""))
		if a.artifact_id.is_empty() or a.artifact_id.begins_with("#"):
			continue
		a.artifact_name = str(r.get("name", ""))
		a.slot = str(r.get("slot", ""))
		a.rarity = str(r.get("rarity", "common"))
		a.description = str(r.get("description", ""))
		a.effect_type = str(r.get("effect_type", ""))
		a.effect_value = float(r.get("effect_value", "0"))
		artifact_database[a.artifact_id] = a


func get_disciple(id: String) -> DiscipleData:
	return disciple_database.get(id)


func get_all_disciples() -> Array[DiscipleData]:
	var arr: Array[DiscipleData] = []
	arr.assign(disciple_database.values())
	return arr


func get_blessing(id: String) -> BlessingData:
	return blessing_database.get(id)


func get_all_blessings() -> Array[BlessingData]:
	var arr: Array[BlessingData] = []
	arr.assign(blessing_database.values())
	return arr


func get_artifact(id: String) -> ArtifactData:
	return artifact_database.get(id)


func get_all_artifacts() -> Array[ArtifactData]:
	var arr: Array[ArtifactData] = []
	arr.assign(artifact_database.values())
	return arr
