extends Control
## 战斗结算界面

signal return_requested

var _result_label: Label
var _data_label: Label


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build()
	visible = false


func _build() -> void:
	anchors_preset = Control.PRESET_FULL_RECT
	mouse_filter = Control.MOUSE_FILTER_STOP

	var overlay := ColorRect.new()
	overlay.anchors_preset = Control.PRESET_FULL_RECT
	overlay.color = Color(0, 0, 0, 0.7)
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(overlay)

	var panel := PanelContainer.new()
	panel.anchor_left = 0.5
	panel.anchor_top = 0.5
	panel.anchor_right = 0.5
	panel.anchor_bottom = 0.5
	panel.offset_left = -240
	panel.offset_top = -160
	panel.offset_right = 240
	panel.offset_bottom = 160
	var p_style := StyleBoxFlat.new()
	p_style.bg_color = Color(0.08, 0.06, 0.15, 0.95)
	p_style.set_corner_radius_all(10)
	p_style.content_margin_left = 20
	p_style.content_margin_right = 20
	p_style.content_margin_top = 20
	p_style.content_margin_bottom = 20
	panel.add_theme_stylebox_override("panel", p_style)
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 12)
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel.add_child(vbox)

	_result_label = Label.new()
	_result_label.name = "ResultLabel"
	_result_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_result_label.add_theme_font_size_override("font_size", 22)
	vbox.add_child(_result_label)

	_data_label = Label.new()
	_data_label.name = "DataLabel"
	_data_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_data_label.add_theme_font_size_override("font_size", 12)
	_data_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	vbox.add_child(_data_label)

	var spacer := Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(spacer)

	var restart_btn := Button.new()
	restart_btn.text = "返回经营"
	restart_btn.custom_minimum_size = Vector2(0, 36)
	restart_btn.pressed.connect(_on_restart)
	vbox.add_child(restart_btn)


func show_result(victory: bool) -> void:
	visible = true
	if _result_label:
		_result_label.text = "战斗胜利" if victory else "战斗失败"
		_result_label.add_theme_color_override("font_color", Color(0.6, 1.0, 0.6) if victory else Color(1.0, 0.4, 0.4))
	if _data_label:
		_data_label.text = "战斗结束，回到经营继续准备下一轮"


func _on_restart() -> void:
	return_requested.emit()
