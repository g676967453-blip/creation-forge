extends RefCounted
class_name MainPeakDefense
## 防御系统 — 伤害结算链 + 灵气加成计算
## 由 MainPeak 持有并委托调用

var _peak: MainPeak

func setup(peak: MainPeak) -> void:
	_peak = peak


func take_damage(amount: float) -> void:
	if _peak._invincible:
		return
	if _peak.current_hp <= 0.0:
		return
	var final_damage: float = amount

	# Evasion check (one channel wins)
	for channel in _peak._attack_channels:
		var cfg: FormConfig = channel["config"] as FormConfig
		if cfg.defense_type == "evasion":
			if randf() < cfg.defense_value:
				_peak.queue_redraw()
				return

	# Block reduction (all channels stack)
	for channel in _peak._attack_channels:
		var cfg: FormConfig = channel["config"] as FormConfig
		if cfg.defense_type == "block":
			var block_amount: float = cfg.defense_value + float(channel.get("summon_block_extra", 0))
			final_damage = max(0.0, final_damage - block_amount)

	# Spirit armor
	final_damage = max(0.0, final_damage - float(_peak._spirit_armor))

	# Shield absorption (first shield channel wins)
	for channel in _peak._attack_channels:
		var cfg: FormConfig = channel["config"] as FormConfig
		if cfg.defense_type == "shield":
			var shield_boost: float = channel.get("shield_boost", 0.0) + channel.get("shield_hp_pct_bonus", 0.0)
			_peak._shield_max = cfg.defense_value * _peak.max_hp * (1.0 + shield_boost)
			if _peak._shield_hp > 0.0:
				var absorbed: float = minf(final_damage, _peak._shield_hp)
				_peak._shield_hp -= absorbed
				final_damage -= absorbed
				# Shield reflect: damage rebound to nearest enemy
				var reflect_pct: float = channel.get("shield_reflect", 0.0)
				if reflect_pct > 0.0:
					var reflect_target := _peak._find_target_enemy(400.0)
					if reflect_target and reflect_target.has_method("take_damage"):
						reflect_target.take_damage(absorbed * reflect_pct)

	# Spirit defense multiplier
	final_damage *= max(0.0, 1.0 - _peak._spirit_def_bonus)
	if final_damage <= 0.0:
		return

	_peak.current_hp -= final_damage
	_peak.queue_redraw()
	if _peak.current_hp <= 0:
		# 百世书 death prevention — 从 MainPeak meta 读取器灵类型
		var spirit_profile: String = _peak.get_meta(&"spirit_profile", &"")
		if spirit_profile == "spirit_book":
			_peak.current_hp = 1.0
			_peak.queue_redraw()
			print("[MainPeakDefense] 百世书免死触发 — HP 锁定为 1")
			return
		_peak.main_peak_destroyed.emit()


func apply_lifesteal(damage_dealt: float) -> void:
	for channel in _peak._attack_channels:
		var cfg: FormConfig = channel["config"] as FormConfig
		if cfg.defense_type == "lifesteal":
			var lifesteal_rate: float = cfg.defense_value + float(channel.get("lifesteal_bonus", 0.0))
			if lifesteal_rate > 0.0:
				_peak.heal(damage_dealt * lifesteal_rate)


func process_regen(delta: float) -> void:
	# HP natural recovery during management phase
	if not _peak.battle_active:
		_peak._spirit_regen_timer += delta
		var regen_interval: float = 1.0
		var regen_pct: float = 0.02  # 2%/s
		while _peak._spirit_regen_timer >= regen_interval:
			_peak._spirit_regen_timer -= regen_interval
			_peak.heal(_peak.max_hp * regen_pct)


func apply_damage_bonus(bonus: float) -> void:
	for channel in _peak._attack_channels:
		channel["damage_multiplier"] = float(channel["damage_multiplier"]) * (1.0 + bonus)


func recalc_spirit_bonuses() -> void:
	_peak._spirit_hp_bonus = 0.0
	_peak._spirit_def_bonus = 0.0
	_peak._spirit_regen = 0.0
	_peak._spirit_armor = 0
	for channel in _peak._attack_channels:
		var cfg: FormConfig = channel["config"] as FormConfig
		_peak._spirit_hp_bonus += cfg.spirit_hp_bonus
		_peak._spirit_def_bonus += cfg.spirit_def_bonus
		_peak._spirit_regen += cfg.spirit_regen
		_peak._spirit_armor += cfg.spirit_armor
	_peak.max_hp = _peak._base_max_hp * _peak._hp_multiplier + _peak._spirit_hp_bonus
	_peak.current_hp = min(_peak.current_hp, _peak.max_hp)
	_peak._shield_max = 0.0
	_peak._shield_cd = 15.0
	for channel in _peak._attack_channels:
		var cfg: FormConfig = channel["config"] as FormConfig
		if cfg.defense_type == "shield":
			var shield_boost: float = channel.get("shield_boost", 0.0) + channel.get("shield_hp_pct_bonus", 0.0)
			_peak._shield_max = cfg.defense_value * _peak.max_hp * (1.0 + shield_boost)
			var params := cfg.get_special_params()
			_peak._shield_cd = float(params.get("shield_cd", 15.0))
			break
	_peak._shield_hp = _peak._shield_max
	_peak._shield_timer = _peak._shield_cd
