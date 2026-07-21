extends Control
## 右下角开战按钮

signal pressed

var _button: Button


func _ready() -> void:
	_build_ui()


func _build_ui() -> void:
	anchors_preset = Control.PRESET_BOTTOM_RIGHT
	offset_left = -84
	offset_top = -84
	offset_right = -24
	offset_bottom = -24
	mouse_filter = Control.MOUSE_FILTER_STOP

	_button = Button.new()
	_button.anchor_left = 0.0
	_button.anchor_top = 0.0
	_button.anchor_right = 1.0
	_button.anchor_bottom = 1.0
	_button.offset_left = 0
	_button.offset_top = 0
	_button.offset_right = 0
	_button.offset_bottom = 0
	_button.text = "开战"
	_button.custom_minimum_size = Vector2(60, 60)
	_button.pressed.connect(func():
		pressed.emit()
	)
	add_child(_button)


func set_enabled(enabled: bool) -> void:
	if _button:
		_button.disabled = not enabled
