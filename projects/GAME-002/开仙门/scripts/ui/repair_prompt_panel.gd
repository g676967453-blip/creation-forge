extends Control
## 山峰详情、修复与升级面板

signal repair_requested
signal upgrade_requested

var _state: Dictionary = {}
var _can_repair: bool = false
var _panel_container: PanelContainer
var _title_label: Label
var _school_label: Label
var _technique_title: Label
var _technique_stats: Label
var _ultimate_label: Label
var _desc_label: Label
var _status_label: Label
var _repair_btn: Button
var _upgrade_btn: Button
var _close_btn: Button


func _ready() -> void:
	visible = false
	_build_ui()


func _build_overlay() -> ColorRect:
	var overlay := ColorRect.new()
	overlay.anchors_preset = Control.PRESET_FULL_RECT
	overlay.color = Color(0, 0, 0, 0.45)
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return overlay


func _build_panel_container() -> PanelContainer:
	var pc := PanelContainer.new()
	pc.mouse_filter = Control.MOUSE_FILTER_STOP
	pc.anchor_left = 0.5
	pc.anchor_top = 0.5
	pc.anchor_right = 0.5
	pc.anchor_bottom = 0.5
	pc.offset_left = -200
	pc.offset_top = -230
	pc.offset_right = 200
	pc.offset_bottom = 230
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.06, 0.06, 0.12, 0.97)
	style.set_corner_radius_all(10)
	style.content_margin_left = 18
	style.content_margin_right = 18
	style.content_margin_top = 14
	style.content_margin_bottom = 14
	pc.add_theme_stylebox_override("panel", style)
	return pc


func _build_info_section(parent: VBoxContainer) -> void:
	var title_row := HBoxContainer.new()
	parent.add_child(title_row)

	_title_label = Label.new()
	_title_label.add_theme_font_size_override("font_size", 20)
	_title_label.add_theme_color_override("font_color", Color(0.95, 0.88, 0.62))
	_title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_row.add_child(_title_label)

	_close_btn = Button.new()
	_close_btn.text = "✕"
	_close_btn.custom_minimum_size = Vector2(28, 28)
	_close_btn.add_theme_font_size_override("font_size", 14)
	_close_btn.pressed.connect(_on_close_pressed)
	title_row.add_child(_close_btn)

	_school_label = Label.new()
	_school_label.add_theme_font_size_override("font_size", 13)
	_school_label.add_theme_color_override("font_color", Color(0.65, 0.70, 0.85))
	parent.add_child(_school_label)

	parent.add_child(HSeparator.new())

	_technique_title = Label.new()
	_technique_title.add_theme_font_size_override("font_size", 16)
	_technique_title.add_theme_color_override("font_color", Color(0.95, 0.90, 0.70))
	parent.add_child(_technique_title)

	_technique_stats = Label.new()
	_technique_stats.add_theme_font_size_override("font_size", 13)
	_technique_stats.add_theme_color_override("font_color", Color(0.78, 0.82, 0.90))
	parent.add_child(_technique_stats)

	_ultimate_label = Label.new()
	_ultimate_label.add_theme_font_size_override("font_size", 12)
	_ultimate_label.add_theme_color_override("font_color", Color(1.0, 0.75, 0.40))
	parent.add_child(_ultimate_label)

	parent.add_child(HSeparator.new())

	_desc_label = Label.new()
	_desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_desc_label.add_theme_font_size_override("font_size", 12)
	_desc_label.add_theme_color_override("font_color", Color(0.72, 0.76, 0.84))
	parent.add_child(_desc_label)

	_status_label = Label.new()
	_status_label.add_theme_font_size_override("font_size", 13)
	parent.add_child(_status_label)


func _build_action_buttons(parent: VBoxContainer) -> void:
	_repair_btn = Button.new()
	_repair_btn.text = "修复 (20灵气)"
	_repair_btn.custom_minimum_size = Vector2(0, 38)
	_repair_btn.add_theme_font_size_override("font_size", 14)
	_repair_btn.pressed.connect(_on_repair_pressed)
	parent.add_child(_repair_btn)

	_upgrade_btn = Button.new()
	_upgrade_btn.text = "升级"
	_upgrade_btn.custom_minimum_size = Vector2(0, 38)
	_upgrade_btn.add_theme_font_size_override("font_size", 14)
	_upgrade_btn.pressed.connect(_on_upgrade_pressed)
	parent.add_child(_upgrade_btn)


func _build_ui() -> void:
	anchors_preset = Control.PRESET_FULL_RECT
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	add_child(_build_overlay())
	_panel_container = _build_panel_container()
	add_child(_panel_container)

	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 6)
	_panel_container.add_child(outer)

	_build_info_section(outer)
	_build_action_buttons(outer)


func show_prompt(state: Dictionary, can_repair: bool) -> void:
	_state = state
	_can_repair = can_repair
	visible = true
	_refresh()


func update_prompt(state: Dictionary) -> void:
	if visible:
		_state = state
		_refresh()


func _refresh_technique_info(form, repaired: bool, level: int, max_level: int) -> void:
	if form != null:
		if _technique_title:
			var status_prefix := "当前功法：" if repaired else "入门功法："
			_technique_title.text = status_prefix + form.form_name
			_technique_title.visible = true

		if _technique_stats:
			_technique_stats.text = _format_stats(form, level, max_level)
			_technique_stats.visible = true

		if _ultimate_label:
			_ultimate_label.text = "大招：%s" % form.ultimate_name
			_ultimate_label.visible = true
	else:
		if _technique_title:
			_technique_title.visible = false
		if _technique_stats:
			_technique_stats.visible = false
		if _ultimate_label:
			_ultimate_label.visible = false


func _refresh_status(repaired: bool, can_upgrade: bool, level: int, max_level: int) -> void:
	if not _status_label:
		return
	if repaired:
		if can_upgrade:
			_status_label.text = "已激活  Lv.%d / %d" % [level, max_level]
		else:
			_status_label.text = "已激活  Lv.%d / %d（满级）" % [level, max_level]
		_status_label.add_theme_color_override("font_color", Color(0.40, 0.85, 0.50))
	else:
		_status_label.text = "状态：未修复"
		_status_label.add_theme_color_override("font_color", Color(0.85, 0.45, 0.40))


func _refresh_buttons(repaired: bool, can_repair: bool, repair_cost: int, can_upgrade: bool, upgrade_cost: int) -> void:
	if repaired:
		_repair_btn.visible = false
		_upgrade_btn.visible = true
		if can_upgrade:
			_upgrade_btn.disabled = false
			_upgrade_btn.text = "升级（%d灵气）" % upgrade_cost
		else:
			_upgrade_btn.disabled = true
			_upgrade_btn.text = "已满级"
	else:
		_repair_btn.visible = true
		_upgrade_btn.visible = false
		_repair_btn.disabled = not can_repair
	_repair_btn.text = ("修复 (%d灵气)" % repair_cost) if can_repair else ("灵气不足 (%d)" % repair_cost)


func _refresh() -> void:
	var repaired: bool = bool(_state.get("repaired", false))
	var form: Resource = _state.get("form", null)
	var peak_name: String = str(_state.get("display_name", ""))
	var school_name: String = str(_state.get("school_name", ""))
	var school_tag: String = str(_state.get("school_tag", ""))
	var school_desc: String = str(_state.get("school_desc", ""))
	var level: int = int(_state.get("level", 1))
	var max_level: int = int(_state.get("max_level", 10))
	var upgrade_cost: int = int(_state.get("upgrade_cost", 0))
	var can_upgrade: bool = bool(_state.get("can_upgrade", false))
	var repair_cost: int = int(_state.get("repair_cost", 20))

	if _title_label:
		_title_label.text = peak_name

	if _school_label:
		_school_label.text = "%s · %s" % [school_name, school_tag] if school_name else ""

	if _desc_label:
		_desc_label.text = school_desc

	_refresh_technique_info(form, repaired, level, max_level)
	_refresh_status(repaired, can_upgrade, level, max_level)
	_refresh_buttons(repaired, _can_repair, repair_cost, can_upgrade, upgrade_cost)


func _format_stats(form, level: int, max_level: int) -> String:
	var parts: Array[String] = []
	parts.append("品质：%s   上限：Lv%d" % [form.quality, max_level])
	var scaled_dmg: int = int(form.damage * (1.0 + (level - 1) * 0.1))
	parts.append("伤害：%d   方式：%s" % [scaled_dmg, form.atk_type_label])
	match form.attack_type:
		"projectile":
			parts.append("弹道数：%d   冷却：%.1fs   射程：%.0f" % [form.projectile_count, form.attack_interval, form.range])
		"sector":
			parts.append("范围：%.0f   冷却：%.1fs" % [form.range, form.attack_interval])
		"summon":
			parts.append("冷却：%.1fs   范围：%.0f" % [form.attack_interval, form.range])
	return "\n".join(parts)


func _on_close_pressed() -> void:
	visible = false


func _on_repair_pressed() -> void:
	repair_requested.emit()


func _on_upgrade_pressed() -> void:
	upgrade_requested.emit()
