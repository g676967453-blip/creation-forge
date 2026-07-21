extends Control
## 战斗 HUD - 由 battle_hud.tscn 承载

@onready var _wave_label: Label = $TopBar/Row/WaveLabel
@onready var _enemy_count_label: Label = $TopBar/Row/EnemyCountLabel
@onready var _spirit_label: Label = $TopBar/Row/SpiritLabel
@onready var _level_label: Label = $TopBar/Row/LevelInfo/LevelLabel
@onready var _exp_bar: ProgressBar = $TopBar/Row/LevelInfo/ExpBar
@onready var _hp_label: Label = $TopBar/Row/HpInfo/HpLabel
@onready var _hp_bar: ProgressBar = $TopBar/Row/HpInfo/HpBar
@onready var _timer_label: Label = $TopBar/Row/TimerLabel

var _energy_container: HBoxContainer
var _energy_label: Label
var _energy_bar: ProgressBar

var _invincible_btn: Button
var _invincible_active: bool = false
var _main_peak_ref: Node2D = null


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	visible = false
	_build_energy_bar()
	_build_invincible_btn()
	set_battle_active(false)


func setup_main_peak(main_peak: Node2D) -> void:
	_main_peak_ref = main_peak


func _build_invincible_btn() -> void:
	_invincible_btn = Button.new()
	_invincible_btn.name = "InvincibleBtn"
	_invincible_btn.text = "无敌: 关"
	_invincible_btn.custom_minimum_size = Vector2(80, 28)
	_invincible_btn.add_theme_font_size_override("font_size", 11)
	_invincible_btn.pressed.connect(_on_invincible_toggled)
	# Position at top-right
	_invincible_btn.position = Vector2(1100, 8)
	add_child(_invincible_btn)


func _on_invincible_toggled() -> void:
	_invincible_active = not _invincible_active
	if _main_peak_ref and _main_peak_ref.has_method("set_invincible"):
		_main_peak_ref.set_invincible(_invincible_active)
	_invincible_btn.text = "无敌: 开" if _invincible_active else "无敌: 关"
	_invincible_btn.modulate = Color(1.0, 0.3, 0.3) if _invincible_active else Color.WHITE


func _build_energy_bar() -> void:
	var row := get_node_or_null("TopBar/Row")
	if row == null:
		return

	_energy_container = HBoxContainer.new()
	_energy_container.name = "EnergyInfo"
	_energy_container.add_theme_constant_override("separation", 4)
	row.add_child(_energy_container)

	_energy_label = Label.new()
	_energy_label.name = "EnergyLabel"
	_energy_label.add_theme_font_size_override("font_size", 12)
	_energy_label.add_theme_color_override("font_color", Color(1.0, 0.75, 0.40))
	_energy_container.add_child(_energy_label)

	_energy_bar = ProgressBar.new()
	_energy_bar.name = "EnergyBar"
	_energy_bar.custom_minimum_size = Vector2(100, 14)
	_energy_bar.max_value = 100
	_energy_bar.value = 0
	_energy_container.add_child(_energy_bar)


func set_battle_active(active: bool) -> void:
	if _timer_label:
		_timer_label.visible = active
	if _wave_label:
		_wave_label.visible = active
	if _enemy_count_label:
		_enemy_count_label.visible = active
	if _energy_container:
		_energy_container.visible = active


func set_wave_info(wave_idx: int, total: int) -> void:
	_wave_label.text = "波次 %d / %d" % [wave_idx, total]


func update_enemy_count(count: int) -> void:
	_enemy_count_label.text = "剩余怪物：%d" % count


func update_spirit(value: int) -> void:
	_spirit_label.text = "灵气：%d" % value


func update_level(level: int, current_exp: int, exp_to_next: int) -> void:
	_level_label.text = "主殿等级 %d" % level
	_exp_bar.max_value = float(max(1, exp_to_next))
	_exp_bar.value = float(current_exp)


func update_hp(current_hp: float, max_hp: float) -> void:
	_hp_label.text = "%.0f / %.0f" % [current_hp, max_hp]
	_hp_bar.max_value = max_hp
	_hp_bar.value = current_hp
	if max_hp > 0 and current_hp / max_hp <= 0.3:
		_hp_bar.modulate = Color(1.0, 0.35, 0.35)
	else:
		_hp_bar.modulate = Color.WHITE


func update_battle_timer(seconds: float) -> void:
	if _timer_label == null:
		return
	var total := int(seconds)
	var m := int(total / 60.0)
	var s := total % 60
	_timer_label.text = "%02d:%02d" % [m, s]


func update_energy(value: float, max_value: float, ultimate_name: String) -> void:
	if _energy_label == null or _energy_bar == null:
		return
	_energy_label.text = "%s" % ultimate_name if not ultimate_name.is_empty() else "能量"
	_energy_bar.max_value = max_value
	_energy_bar.value = value
