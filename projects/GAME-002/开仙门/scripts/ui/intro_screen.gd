extends Control
## 开场黑幕 — 逐段自动播放世界观叙事文字
## v2 (2026-07-27): 改为逐段播放模式（淡入 → 停留 → 淡出 → 下一段）
##   旧版是一次性显示全部文字；新版每次只显示一段，4s 自动推进
## 设计: 1280×720, 纯黑背景, 居中 840px 宽白色叙事文本, 20px / 行高 28px
## 基准: 策划文档 2026-07-27-开场黑幕-功能需求.md
##
## 流程:
##   段N 淡入(1s) → 停留(2s) → 淡出(1s) → 段N+1 自动播放
##   点击/按键 → 跳过当前段，立即进入下一段（0.3s 冷却防连点）
##   最后一段点击/按键 → 0.5s 黑屏 → 发射 intro_finished 信号

signal intro_finished

const FONT_PATH := "res://assets/fonts/AlibabaPuHuiTi-3-55-Regular.woff2"

## 设计参数（与 Pixso 一致）
const TEXT_WIDTH := 840.0
const FONT_SIZE := 20
const LINE_HEIGHT := 28
const COLOR_BG := Color(0, 0, 0, 1)
const COLOR_TEXT := Color.WHITE

## 时序参数（per 2026-07-27 功能需求 §4 / §6）
const FADE_IN_DURATION := 1.0
const STAY_DURATION := 2.0
const FADE_OUT_DURATION := 1.0
const SKIP_COOLDOWN := 0.3
const FINISH_BLACK_DURATION := 0.5

## 世界观文案（per 2026-07-27 功能规划 §2, 与 HTML 原型一致）
const PARAGRAPHS: Array[String] = [
	"上古时代，仙界与凡间有仙门相连。\n仙人行走人间，凡人亦可登仙。",
	"仙门一夜崩塌，仙人陨落消散。\n至强法宝在崩碎之际护住最后根基，耗尽灵力，化为凡间荒山，陷入沉睡。",
	"六座阵眼山峰环绕，各自代表不同神通法则。\n器灵残破半隐于云海之中，等待转世者的呼唤。",
	"无数年后，器灵苏醒。\n你听到了那跨越轮回的呼唤。",
]

var _label: Label = null
var _current_index: int = 0
var _tween: Tween = null
var _skip_cooldown: bool = false
var _finished: bool = false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build()
	visibility_changed.connect(_on_visibility_changed)
	_show_paragraph(0)


func _build() -> void:
	anchors_preset = Control.PRESET_FULL_RECT
	mouse_filter = Control.MOUSE_FILTER_STOP

	# 纯黑背景
	var bg := ColorRect.new()
	bg.anchors_preset = Control.PRESET_FULL_RECT
	bg.color = COLOR_BG
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	# 单段叙事文本 —— 一次只显示一段
	_label = Label.new()
	_label.anchor_left = 0.5
	_label.anchor_right = 0.5
	_label.anchor_top = 0.0
	_label.anchor_bottom = 1.0
	_label.offset_left = -TEXT_WIDTH / 2.0
	_label.offset_right = TEXT_WIDTH / 2.0
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label.modulate.a = 0.0

	var font := load(FONT_PATH) as FontFile
	if font:
		_label.add_theme_font_override("font", font)
	_label.add_theme_font_size_override("font_size", FONT_SIZE)
	_label.add_theme_color_override("font_color", COLOR_TEXT)
	_label.add_theme_constant_override("line_spacing", LINE_HEIGHT - FONT_SIZE)
	add_child(_label)


## ——————————————————————— 播放逻辑 ———————————————————————


func _show_paragraph(idx: int) -> void:
	if idx >= PARAGRAPHS.size():
		_finish()
		return

	_current_index = idx
	_kill_tween()

	_label.text = PARAGRAPHS[idx]
	_label.modulate.a = 0.0

	_tween = create_tween()
	_tween.set_trans(Tween.TRANS_LINEAR)
	# 淡入 → 停留 → 淡出
	_tween.tween_property(_label, "modulate:a", 1.0, FADE_IN_DURATION)
	_tween.tween_interval(STAY_DURATION)
	_tween.tween_property(_label, "modulate:a", 0.0, FADE_OUT_DURATION)
	_tween.finished.connect(_on_cycle_done)


func _on_cycle_done() -> void:
	if _finished:
		return
	_show_paragraph(_current_index + 1)


func _finish() -> void:
	if _finished:
		return
	_finished = true
	_kill_tween()
	_label.modulate.a = 0.0
	await get_tree().create_timer(FINISH_BLACK_DURATION).timeout
	intro_finished.emit()


## ——————————————————————— 快进 ———————————————————————


func _skip() -> void:
	if _finished or _skip_cooldown:
		return
	_skip_cooldown = true

	# 最后一段 → 直接结束
	if _current_index >= PARAGRAPHS.size() - 1:
		_finish()
		_skip_cooldown = false
		return

	# 跳到下一段
	_kill_tween()
	_label.modulate.a = 0.0
	_show_paragraph(_current_index + 1)

	# 防连点冷却
	await get_tree().create_timer(SKIP_COOLDOWN).timeout
	_skip_cooldown = false


## ——————————————————————— 输入 ———————————————————————


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		_skip()


func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		_skip()


## ——————————————————————— 可见性 ———————————————————————


func _on_visibility_changed() -> void:
	if visible and not _finished:
		_current_index = 0
		_show_paragraph(0)
