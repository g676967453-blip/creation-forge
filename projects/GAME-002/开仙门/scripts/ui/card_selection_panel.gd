extends Control
## 战斗中升级三选一面板 — 按 Pixso 设计稿实现
## 设计: 1280×720, 暗底遮罩, 三卡水平排列, 稀有度配色

signal card_selected(card)

## 稀有度配色常量（与 Pixso 设计一致）
const RARITY_COLORS := {
	"普通": {
		"border": Color("#338543"), "badge_bg": Color("#0D381A"),
		"badge_text": Color("#5CBF6B"), "btn": Color("#144726"),
		"card_bg": Color("#0F1229"), "name": Color("#F2F2FF"),
		"icon_bg": Color("#051A0D"),
	},
	"稀有": {
		"border": Color("#1F61D1"), "badge_bg": Color("#0F3880"),
		"badge_text": Color("#73CCFF"), "btn": Color("#1A4794"),
		"card_bg": Color("#0F1229"), "name": Color("#F2F2FF"),
		"icon_bg": Color("#081A3D"),
	},
	"史诗": {
		"border": Color("#852EE6"), "badge_bg": Color("#380F6B"),
		"badge_text": Color("#B366FF"), "btn": Color("#521A7A"),
		"card_bg": Color("#120D26"), "name": Color("#F2C2FF"),
		"icon_bg": Color("#140533"),
	},
}

## 设计色值
const COLOR_TITLE := Color("#F2D659")
const COLOR_SUBTITLE := Color("#808599")
const COLOR_DESC := Color("#7A859E")
const COLOR_TIPS := Color("#4D4D61")
const COLOR_OVERLAY := Color(0, 0, 0, 0.6)
const COLOR_BTN_TEXT := Color.WHITE
const COLOR_WHITE := Color("#F2F2FF")

var _card_slot_refs: Array[Dictionary] = []


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build()
	visible = false


func _build_overlay() -> ColorRect:
	var overlay := ColorRect.new()
	overlay.anchors_preset = Control.PRESET_FULL_RECT
	overlay.color = COLOR_OVERLAY
	overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return overlay


func _build_title() -> Label:
	var lbl := Label.new()
	lbl.text = "升级！选择一张卡牌"
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 38)
	lbl.add_theme_color_override("font_color", COLOR_TITLE)
	return lbl


func _build_subtitle() -> Label:
	var lbl := Label.new()
	lbl.text = "选择后立即生效，最多可叠加 3 层"
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 13)
	lbl.add_theme_color_override("font_color", COLOR_SUBTITLE)
	return lbl


func _build_tips() -> Label:
	var lbl := Label.new()
	lbl.text = "游戏已暂停 · 按 ESC 键可跳过本次选择"
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 12)
	lbl.add_theme_color_override("font_color", COLOR_TIPS)
	return lbl


func _build_badge(rarity: String) -> PanelContainer:
	var badge := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = RARITY_COLORS[rarity]["badge_bg"]
	style.set_corner_radius_all(12)
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 5
	style.content_margin_bottom = 5
	badge.add_theme_stylebox_override("panel", style)

	var lbl := Label.new()
	lbl.text = rarity
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 11)
	lbl.add_theme_color_override("font_color", RARITY_COLORS[rarity]["badge_text"])
	badge.add_child(lbl)

	return badge


func _build_icon_area(rarity: String) -> ColorRect:
	var icon := ColorRect.new()
	icon.custom_minimum_size = Vector2(130, 130)
	icon.color = RARITY_COLORS[rarity]["icon_bg"]
	# 圆角 — ColorRect 不直接支持, 用 shader 或 Shape 变通
	# 保持简洁: 纯色方块即可, 后续可替换为实际图标纹理
	return icon


func _build_card_name(text: String, rarity: String) -> Label:
	var lbl := Label.new()
	lbl.text = text
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 24)
	lbl.add_theme_color_override("font_color", RARITY_COLORS[rarity]["name"])
	return lbl


func _build_card_desc(text: String) -> Label:
	var lbl := Label.new()
	lbl.text = text
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 12)
	lbl.add_theme_color_override("font_color", COLOR_DESC)
	lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	lbl.custom_minimum_size = Vector2(200, 0)
	return lbl


func _build_pick_button(rarity: String) -> Button:
	var btn := Button.new()
	btn.text = "选择此卡"
	btn.custom_minimum_size = Vector2(180, 40)
	btn.add_theme_font_size_override("font_size", 14)
	btn.add_theme_color_override("font_color", COLOR_BTN_TEXT)

	var style := StyleBoxFlat.new()
	style.bg_color = RARITY_COLORS[rarity]["btn"]
	style.set_corner_radius_all(20)
	btn.add_theme_stylebox_override("normal", style)

	var hover := StyleBoxFlat.new()
	hover.bg_color = RARITY_COLORS[rarity]["btn"].lightened(0.15)
	hover.set_corner_radius_all(20)
	btn.add_theme_stylebox_override("hover", hover)

	var pressed := StyleBoxFlat.new()
	pressed.bg_color = RARITY_COLORS[rarity]["btn"].darkened(0.15)
	pressed.set_corner_radius_all(20)
	btn.add_theme_stylebox_override("pressed", pressed)

	btn.process_mode = Node.PROCESS_MODE_ALWAYS
	return btn


func _build_card_slot() -> Dictionary:
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(240, 0)
	card.size_flags_horizontal = Control.SIZE_SHRINK_CENTER

	var c_style := StyleBoxFlat.new()
	c_style.set_corner_radius_all(14)
	c_style.content_margin_left = 24
	c_style.content_margin_right = 24
	c_style.content_margin_top = 20
	c_style.content_margin_bottom = 24
	c_style.border_width_left = 2
	c_style.border_width_right = 2
	c_style.border_width_top = 2
	c_style.border_width_bottom = 2
	card.add_theme_stylebox_override("panel", c_style)

	var inner := VBoxContainer.new()
	inner.name = "CardInner"
	inner.add_theme_constant_override("separation", 14)
	inner.alignment = BoxContainer.ALIGNMENT_CENTER
	card.add_child(inner)

	# 稀有度标签
	var badge := _build_badge("普通")
	badge.name = "Badge"
	inner.add_child(badge)

	# 图标占位区
	var icon_area := _build_icon_area("普通")
	icon_area.name = "IconArea"
	inner.add_child(icon_area)

	# 卡牌名
	var name_lbl := _build_card_name("", "普通")
	name_lbl.name = "Name"
	inner.add_child(name_lbl)

	# 描述
	var desc_lbl := _build_card_desc("")
	desc_lbl.name = "Desc"
	inner.add_child(desc_lbl)

	# 选择按钮
	var pick_btn := _build_pick_button("普通")
	pick_btn.name = "PickBtn"
	inner.add_child(pick_btn)

	return {"panel": card, "badge": badge, "icon_area": icon_area,
		"name_lbl": name_lbl, "desc_lbl": desc_lbl, "pick_btn": pick_btn}


func _build() -> void:
	anchors_preset = Control.PRESET_FULL_RECT
	mouse_filter = Control.MOUSE_FILTER_STOP

	add_child(_build_overlay())

	# 主布局: 垂直居中
	var root := VBoxContainer.new()
	root.anchor_left = 0.5
	root.anchor_top = 0.5
	root.anchor_right = 0.5
	root.anchor_bottom = 0.5
	root.offset_left = -640
	root.offset_top = -360
	root.offset_right = 640
	root.offset_bottom = 360
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	root.add_theme_constant_override("separation", 28)
	add_child(root)

	root.add_child(_build_title())
	root.add_child(_build_subtitle())

	# 卡牌行
	var cards_row := HBoxContainer.new()
	cards_row.alignment = BoxContainer.ALIGNMENT_CENTER
	cards_row.add_theme_constant_override("separation", 45)
	root.add_child(cards_row)

	_card_slot_refs.clear()
	for _i in range(3):
		var slot := _build_card_slot()
		_card_slot_refs.append(slot)
		cards_row.add_child(slot["panel"])

	root.add_child(_build_tips())


func _apply_rarity_style(slot: Dictionary, rarity: String) -> void:
	var colors: Dictionary = RARITY_COLORS.get(rarity, RARITY_COLORS["普通"])

	# 卡片边框和背景
	var card := slot["panel"] as PanelContainer
	var c_style := card.get_theme_stylebox("panel", "PanelContainer") as StyleBoxFlat
	if c_style:
		c_style.bg_color = colors["card_bg"]
		c_style.border_color = colors["border"]

	# 稀有度标签
	var badge := slot["badge"] as PanelContainer
	var b_style := badge.get_theme_stylebox("panel", "PanelContainer") as StyleBoxFlat
	if b_style:
		b_style.bg_color = colors["badge_bg"]
	var badge_lbl := badge.get_child(0) as Label
	if badge_lbl:
		badge_lbl.text = rarity
		badge_lbl.add_theme_color_override("font_color", colors["badge_text"])

	# 图标区
	var icon := slot["icon_area"] as ColorRect
	if icon:
		icon.color = colors["icon_bg"]

	# 按钮
	var btn := slot["pick_btn"] as Button
	_apply_button_color(btn, colors["btn"])


func _apply_button_color(btn: Button, bg_color: Color) -> void:
	var normal := btn.get_theme_stylebox("normal", "Button") as StyleBoxFlat
	if normal:
		normal.bg_color = bg_color
	var hover := btn.get_theme_stylebox("hover", "Button") as StyleBoxFlat
	if hover:
		hover.bg_color = bg_color.lightened(0.15)
	var pressed := btn.get_theme_stylebox("pressed", "Button") as StyleBoxFlat
	if pressed:
		pressed.bg_color = bg_color.darkened(0.15)


func show_cards(cards: Array) -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = true
	for i in range(_card_slot_refs.size()):
		var refs := _card_slot_refs[i]
		var name_lbl := refs["name_lbl"] as Label
		var desc_lbl := refs["desc_lbl"] as Label
		var pick_btn := refs["pick_btn"] as Button

		if i < cards.size():
			var card = cards[i]
			var rarity: String = card.get("rarity") if card.get("rarity") else "普通"
			_apply_rarity_style(refs, rarity)

			name_lbl.text = card.card_name
			desc_lbl.text = card.description
			pick_btn.disabled = false
			pick_btn.set_meta("card_data", card)
			# 上轮未被点击的按钮 ONE_SHOT 连接仍存活, 先断开避免重复 connect 报错
			var pick_callable := _on_pick_button_pressed.bind(pick_btn)
			if pick_btn.pressed.is_connected(pick_callable):
				pick_btn.pressed.disconnect(pick_callable)
			pick_btn.pressed.connect(pick_callable, CONNECT_ONE_SHOT)
		else:
			_apply_rarity_style(refs, "普通")
			name_lbl.text = ""
			desc_lbl.text = ""
			pick_btn.disabled = true
			pick_btn.remove_meta("card_data")


func _on_pick_button_pressed(button: Button) -> void:
	if button == null or button.disabled:
		return
	if not button.has_meta("card_data"):
		return
	var card = button.get_meta("card_data")
	process_mode = Node.PROCESS_MODE_DISABLED
	card_selected.emit(card)
	visible = false
