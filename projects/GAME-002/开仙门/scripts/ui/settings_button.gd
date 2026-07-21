extends Control
## 左下角设置按钮，返回器灵选择

signal pressed


func _ready() -> void:
	_build_ui()


func _build_ui() -> void:
	anchors_preset = Control.PRESET_BOTTOM_LEFT
	offset_left = 24
	offset_top = -84
	offset_right = 84
	offset_bottom = -24
	mouse_filter = Control.MOUSE_FILTER_STOP

	var btn := Button.new()
	btn.anchor_left = 0.0
	btn.anchor_top = 0.0
	btn.anchor_right = 1.0
	btn.anchor_bottom = 1.0
	btn.text = "设置"
	btn.custom_minimum_size = Vector2(60, 60)
	btn.pressed.connect(func():
		pressed.emit()
	)
	add_child(btn)
