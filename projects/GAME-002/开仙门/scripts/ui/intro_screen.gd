extends Control
## 开场黑幕 — 世界观简介界面（按 Pixso 设计稿「开场黑幕」frame 2:2 实现）
## 设计: 1280×720, 纯黑背景, 居中 840px 宽白色叙事文本, 20px/行高 28px
## 交互: 逐段淡入（策划文档 4.1）; 点击/按键第一次快进动画, 第二次结束 → intro_finished

signal intro_finished

const FONT_PATH := "res://assets/fonts/AlibabaPuHuiTi-3-55-Regular.woff2"

## 设计参数（与 Pixso 一致）
const TEXT_WIDTH := 840.0
const FONT_SIZE := 20
const LINE_HEIGHT := 28
const COLOR_BG := Color(0, 0, 0, 1)
const COLOR_TEXT := Color.WHITE
const COLOR_TIPS := Color("#4D4D61")
const PARA_FADE_DURATION := 0.9

## 世界观文案（Pixso 原稿逐字, 段落间空行）
const INTRO_PARAGRAPHS: Array[String] = [
	"上古时代，仙界与凡间有仙门相连，仙人往来，灵气互通。",
	"仙门一夜崩塌，仙人陨落消散。至强法宝护住最后根基，耗尽灵力，化为凡间荒山，陷入沉睡。",
	"万年后，器灵苏醒，发出跨越轮回的呼唤。",
	"你听到呼唤，承担修复神器、重开仙门的使命。",
]

var _para_labels: Array[Label] = []
var _tips_label: Label
var _fade_tween: Tween
var _revealed := false
var _finished := false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build()
	visibility_changed.connect(_on_visibility_changed)
	_play_fade_in()


func _build() -> void:
	anchors_preset = Control.PRESET_FULL_RECT
	mouse_filter = Control.MOUSE_FILTER_STOP

	# 纯黑背景
	var bg := ColorRect.new()
	bg.anchors_preset = Control.PRESET_FULL_RECT
	bg.color = COLOR_BG
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	# 居中叙事文本列（宽 840, 段落间空一行 = 28px）
	var vbox := VBoxContainer.new()
	vbox.anchor_left = 0.5
	vbox.anchor_right = 0.5
	vbox.anchor_top = 0.0
	vbox.anchor_bottom = 1.0
	vbox.offset_left = -TEXT_WIDTH / 2.0
	vbox.offset_right = TEXT_WIDTH / 2.0
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_theme_constant_override("separation", LINE_HEIGHT)
	vbox.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(vbox)

	_para_labels.clear()
	for paragraph in INTRO_PARAGRAPHS:
		var lbl := _build_paragraph_label(paragraph)
		vbox.add_child(lbl)
		_para_labels.append(lbl)

	# 底部提示（Pixso 未画, 交互需要; 样式沿用卡牌面板 tips）
	_tips_label = _build_tips()
	add_child(_tips_label)


func _build_paragraph_label(text: String) -> Label:
	var lbl := Label.new()
	lbl.text = text
	lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_FILL
	lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	lbl.modulate.a = 0.0
	var font := load(FONT_PATH) as FontFile
	if font:
		lbl.add_theme_font_override("font", font)
	lbl.add_theme_font_size_override("font_size", FONT_SIZE)
	lbl.add_theme_color_override("font_color", COLOR_TEXT)
	# Godot 行高 = 字体行高 + line_spacing, 用固定值逼近设计的 28px
	lbl.add_theme_constant_override("line_spacing", LINE_HEIGHT - FONT_SIZE)
	return lbl


func _build_tips() -> Label:
	var lbl := Label.new()
	lbl.text = "点击任意处继续"
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.anchor_left = 0.0
	lbl.anchor_right = 1.0
	lbl.anchor_top = 1.0
	lbl.anchor_bottom = 1.0
	lbl.offset_top = -96
	lbl.offset_bottom = -79
	lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	lbl.modulate.a = 0.0
	var font := load(FONT_PATH) as FontFile
	if font:
		lbl.add_theme_font_override("font", font)
	lbl.add_theme_font_size_override("font_size", 12)
	lbl.add_theme_color_override("font_color", COLOR_TIPS)
	return lbl


func _play_fade_in() -> void:
	_revealed = false
	if _fade_tween:
		_fade_tween.kill()
	for lbl in _para_labels:
		lbl.modulate.a = 0.0
	_tips_label.modulate.a = 0.0
	_fade_tween = create_tween()
	for lbl in _para_labels:
		_fade_tween.tween_property(lbl, "modulate:a", 1.0, PARA_FADE_DURATION)
	_fade_tween.tween_property(_tips_label, "modulate:a", 1.0, 0.6)
	_fade_tween.finished.connect(func(): _revealed = true)


## 点击/按键: 动画中 → 快进显示全部; 已显示 → 结束进入器灵选择
func _advance() -> void:
	if _finished or not visible:
		return
	if not _revealed:
		if _fade_tween:
			_fade_tween.kill()
		for lbl in _para_labels:
			lbl.modulate.a = 1.0
		_tips_label.modulate.a = 1.0
		_revealed = true
		return
	_finished = true
	intro_finished.emit()


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		_advance()


func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		_advance()


func _on_visibility_changed() -> void:
	if visible and not _finished:
		_play_fade_in()
