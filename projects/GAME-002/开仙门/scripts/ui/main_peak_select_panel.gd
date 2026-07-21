extends Control
## 开局器灵选择面板

signal start_game_requested(profile_id: String)

var _profiles: Array = []
var _selected_profile_id: String = ""
var _start_btn: Button
var _option_cards: Array[Control] = []


func _ready() -> void:
	_build_ui()


func _build_overlay() -> ColorRect:
	var overlay := ColorRect.new()
	overlay.anchors_preset = Control.PRESET_FULL_RECT
	overlay.color = Color(0, 0, 0, 0.25)
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return overlay


func _build_option_card(option) -> PanelContainer:
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(190, 190)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.mouse_filter = Control.MOUSE_FILTER_STOP
	var card_style := StyleBoxFlat.new()
	card_style.bg_color = Color(0.12, 0.1, 0.22, 0.96)
	card_style.set_corner_radius_all(8)
	card_style.border_width_left = 1
	card_style.border_width_right = 1
	card_style.border_width_top = 1
	card_style.border_width_bottom = 1
	card_style.border_color = Color(0.4, 0.35, 0.5)
	card.add_theme_stylebox_override("panel", card_style)

	var inner := VBoxContainer.new()
	inner.add_theme_constant_override("separation", 6)
	card.add_child(inner)

	var texture := TextureRect.new()
	texture.name = "Icon"
	texture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	texture.custom_minimum_size = Vector2(0, 100)
	var tex: Texture2D = load(str(option.icon_path))
	if tex:
		texture.texture = tex
	inner.add_child(texture)

	var name_lbl := Label.new()
	name_lbl.name = "Name"
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_lbl.add_theme_font_size_override("font_size", 16)
	name_lbl.add_theme_color_override("font_color", Color(0.95, 0.9, 0.7))
	name_lbl.text = str(option.profile_name)
	inner.add_child(name_lbl)

	var desc_lbl := Label.new()
	desc_lbl.name = "Desc"
	desc_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_lbl.add_theme_font_size_override("font_size", 12)
	desc_lbl.add_theme_color_override("font_color", Color(0.78, 0.82, 0.88))
	desc_lbl.text = str(option.desc)
	inner.add_child(desc_lbl)

	var pick_btn := Button.new()
	pick_btn.name = "PickBtn"
	pick_btn.text = "选择"
	pick_btn.pressed.connect(_on_option_pressed.bind(str(option.profile_id)))
	inner.add_child(pick_btn)

	return card


func _build_start_button() -> Button:
	var btn := Button.new()
	btn.text = "开始游戏"
	btn.custom_minimum_size = Vector2(0, 42)
	btn.disabled = true
	btn.pressed.connect(_on_start_pressed)
	return btn


func _build_ui() -> void:
	anchors_preset = Control.PRESET_FULL_RECT
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	add_child(_build_overlay())

	var panel := PanelContainer.new()
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	panel.anchor_left = 0.5
	panel.anchor_top = 0.5
	panel.anchor_right = 0.5
	panel.anchor_bottom = 0.5
	panel.offset_left = -360
	panel.offset_top = -240
	panel.offset_right = 360
	panel.offset_bottom = 240
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.08, 0.08, 0.12, 0.97)
	style.set_corner_radius_all(8)
	style.content_margin_left = 20
	style.content_margin_right = 20
	style.content_margin_top = 18
	style.content_margin_bottom = 18
	panel.add_theme_stylebox_override("panel", style)
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 12)
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "选择器灵"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 24)
	title.add_theme_color_override("font_color", Color(0.95, 0.88, 0.62))
	vbox.add_child(title)

	var hint := Label.new()
	hint.text = "选好后点击开始游戏，进入运营阶段。"
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.add_theme_font_size_override("font_size", 13)
	hint.add_theme_color_override("font_color", Color(0.78, 0.82, 0.88))
	vbox.add_child(hint)

	var options_row := HBoxContainer.new()
	options_row.add_theme_constant_override("separation", 10)
	vbox.add_child(options_row)

	_profiles = DataManager.get_all_spirit_profiles()
	_option_cards.clear()
	for option in _profiles:
		var card := _build_option_card(option)
		options_row.add_child(card)
		_option_cards.append(card)

	_start_btn = _build_start_button()
	vbox.add_child(_start_btn)


func _on_option_pressed(profile_id: String) -> void:
	_update_selection(profile_id)


func _update_selection(profile_id: String) -> void:
	_selected_profile_id = profile_id
	for i in range(_option_cards.size()):
		var card := _option_cards[i]
		var option_id: String = str(_profiles[i].profile_id)
		var selected := option_id == _selected_profile_id
		card.modulate = Color(1.0, 0.96, 0.78) if selected else Color(1.0, 1.0, 1.0)
	if _start_btn:
		_start_btn.disabled = profile_id.is_empty()


func set_selected_profile(profile_id: String) -> void:
	_update_selection(profile_id)


func _on_start_pressed() -> void:
	if _selected_profile_id.is_empty():
		return
	start_game_requested.emit(_selected_profile_id)
