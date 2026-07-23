extends Node2D
class_name MainRoot
## 场景根节点 — 开场黑幕 + 世界观字幕

const FONT_PATH := "res://assets/fonts/AlibabaPuHuiTi-3-55-Regular.woff2"

var _black_layer: CanvasLayer
var _state := 0  # 0=animating, 1=revealed, 2=done


func _ready() -> void:
	# 强制窗口尺寸 = 1280×720（Godot 4.7 兼容）
	_fix_window_size()

	# 独立高层 CanvasLayer
	_black_layer = CanvasLayer.new()
	_black_layer.layer = 100
	add_child(_black_layer)

	# 纯黑背景
	var bg := ColorRect.new()
	bg.size = Vector2(1280, 720)
	bg.color = Color.BLACK
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_black_layer.add_child(bg)

	# 居中文本
	var font := load(FONT_PATH) as FontFile
	var paragraphs := [
		"上古时代，仙界与凡间有仙门相连，仙人往来，灵气互通。",
		"仙门一夜崩塌，仙人陨落消散。至强法宝护住最后根基，耗尽灵力，化为凡间荒山，陷入沉睡。",
		"万年后，器灵苏醒，发出跨越轮回的呼唤。",
		"你听到呼唤，承担修复神器、重开仙门的使命。",
	]
	var y := 200.0
	for p in paragraphs:
		var lbl := Label.new()
		lbl.text = p
		lbl.position = Vector2(220, y)
		lbl.size = Vector2(840, 0)
		lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		lbl.modulate.a = 0.0
		lbl.add_theme_font_size_override("font_size", 20)
		lbl.add_theme_color_override("font_color", Color.WHITE)
		if font:
			lbl.add_theme_font_override("font", font)
		_black_layer.add_child(lbl)
		y += 60

	# 底部提示
	var tips := Label.new()
	tips.text = "点击任意处继续"
	tips.position = Vector2(0, 624)
	tips.size = Vector2(1280, 40)
	tips.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tips.modulate.a = 0.0
	tips.add_theme_font_size_override("font_size", 12)
	tips.add_theme_color_override("font_color", Color("#4D4D61"))
	if font:
		tips.add_theme_font_override("font", font)
	_black_layer.add_child(tips)

	# 淡入动画
	var tween := create_tween()
	for child in _black_layer.get_children():
		if child is Label and child != tips:
			tween.tween_property(child, "modulate:a", 1.0, 0.9)
	tween.tween_property(tips, "modulate:a", 1.0, 0.6)
	tween.finished.connect(func(): _state = 1)

	# 下一帧再次确认窗口尺寸（防止 Godot 4.7 在 _ready 后覆盖）
	if not OS.has_feature("web"):
		call_deferred("_fix_window_size")


func _fix_window_size() -> void:
	"""强制窗口为 1280×720，兼容 Godot 4.7 编辑器测试窗口缩放"""
	if not OS.has_feature("web"):
		DisplayServer.window_set_size(Vector2i(1280, 720))


func _input(event: InputEvent) -> void:
	if _state == 2 or not _black_layer:
		return
	if event is InputEventMouseButton and event.pressed:
		_advance()
	elif event is InputEventKey and event.pressed:
		_advance()


func _advance() -> void:
	if _state == 0:
		# Skip animation: show all text immediately
		for child in _black_layer.get_children():
			if child is Label:
				child.modulate.a = 1.0
		_state = 1
	elif _state == 1:
		# Dismiss intro
		_state = 2
		_black_layer.queue_free()
		_black_layer = null
