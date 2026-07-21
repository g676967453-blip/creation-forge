extends Control
## 浮字模板 — 可在场景里调整样式

@onready var label: Label = $Label


func show_text(text: String, color: Color) -> void:
	label.text = text
	label.modulate = color
	_play_animation()


func _play_animation() -> void:
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "position", position + Vector2(0, -28), 0.6).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "modulate:a", 0.0, 0.6).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.finished.connect(queue_free)
