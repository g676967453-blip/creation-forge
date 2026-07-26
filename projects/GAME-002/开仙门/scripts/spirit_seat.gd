extends Area2D
class_name SpiritSeat
## V0.1 器灵坐镇后方 — 轻量级实体，替换 main_peak.gd
## 职责：HP 管理 + 5 层防御链 + 受击结算 + 经营阶段点击产灵气
## 攻击逻辑已移至 DiscipleSquad；升级逻辑已移至 BlessingManager

signal clicked
signal hp_changed(current: float, maximum: float)
signal spirit_seat_destroyed

# ── 基础属性 ──
var max_hp: float = 2000.0
var current_hp: float = 2000.0
var spirit_armor: float = 0.0
var spirit_def_bonus: float = 0.0
var spirit_regen: float = 0.0

# ── 护盾 ──
var shield_hp: float = 0.0
var shield_max: float = 500.0
var shield_cd: float = 15.0
var shield_timer: float = 0.0
var shield_broken: bool = false

# ── 闪避 ──
var evasion_chance: float = 0.0

# ── 格挡 ──
var block_amount: float = 0.0

# ── 状态 ──
var battle_active: bool = false
var _invincible: bool = false
var _regen_timer: float = 0.0

# ── spirit_profile（百世书等） ──
var spirit_profile_id: String = ""


func _ready() -> void:
	current_hp = max_hp
	shield_hp = shield_max
	set_process(true)


func _process(delta: float) -> void:
	_process_shield(delta)
	if not battle_active:
		_process_regen(delta)


func _process_shield(delta: float) -> void:
	if shield_hp <= 0.0 and not shield_broken:
		shield_broken = true
		shield_timer = shield_cd
	if shield_broken:
		shield_timer -= delta
		if shield_timer <= 0.0:
			shield_broken = false
			shield_hp = shield_max


func _process_regen(delta: float) -> void:
	if current_hp >= max_hp:
		return
	_regen_timer += delta
	if _regen_timer >= 1.0:
		_regen_timer -= 1.0
		heal(max_hp * max(0.01, spirit_regen))


# ── 5 层防御链 ──

func take_damage(amount: float) -> float:
	## 返回实际掉血量（用于浮动文字等）
	if _invincible or current_hp <= 0.0:
		return 0.0
	var dmg: float = amount

	# Layer 1: Evasion
	if evasion_chance > 0.0 and randf() < evasion_chance:
		return 0.0

	# Layer 2: Block（固定减伤）
	dmg = max(0.0, dmg - block_amount)

	# Layer 3: Armor
	dmg = max(0.0, dmg - spirit_armor)

	# Layer 4: Shield
	if shield_hp > 0.0 and dmg > 0.0:
		var absorbed := minf(dmg, shield_hp)
		shield_hp -= absorbed
		dmg -= absorbed

	# Layer 5: Defense %
	dmg *= max(0.0, 1.0 - spirit_def_bonus)
	if dmg <= 0.0:
		return 0.0

	current_hp -= dmg
	hp_changed.emit(current_hp, max_hp)
	if current_hp <= 0.0:
		_handle_death()
	return dmg


func heal(amount: float) -> void:
	if current_hp <= 0.0:
		return
	current_hp = minf(current_hp + amount, max_hp)
	hp_changed.emit(current_hp, max_hp)


func _handle_death() -> void:
	# 百世书免死
	if spirit_profile_id == "spirit_book" and current_hp <= 0.0:
		current_hp = 1.0
		hp_changed.emit(current_hp, max_hp)
		return
	spirit_seat_destroyed.emit()


# ── 调试 / 配置 ──

func set_invincible(v: bool) -> void:
	_invincible = v


func apply_growth(growth: Dictionary) -> void:
	## 由 SpiritGrowthManager 调用，山峰修复时触发
	max_hp += growth.get("hp_bonus", 0.0)
	spirit_armor += growth.get("armor_bonus", 0.0)
	spirit_def_bonus += growth.get("def_bonus", 0.0)
	evasion_chance += growth.get("evasion_bonus", 0.0)
	block_amount += growth.get("block_bonus", 0.0)
	current_hp = min(current_hp, max_hp)
	hp_changed.emit(current_hp, max_hp)


func apply_blessing(effect_type: String, value: float) -> void:
	## 由 BlessingManager 调用
	match effect_type:
		"hp_up": max_hp += value; current_hp = min(current_hp + value, max_hp)
		"armor_up": spirit_armor += value
		"def_up": spirit_def_bonus += value
		"evasion_up": evasion_chance += value
		"block_up": block_amount += value
		"heal": heal(value)
	hp_changed.emit(current_hp, max_hp)


# ── 经营阶段点击交互 ──

func _input_event(_viewport: Viewport, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		clicked.emit()
