extends Node2D
## Flash effect at chain bounce impact points

func _ready() -> void:
	queue_redraw()
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "modulate:a", 0.0, 0.3).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tween.tween_property(self, "scale", Vector2(1.8, 1.8), 0.3).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.chain().tween_callback(queue_free)


func _draw() -> void:
	draw_circle(Vector2.ZERO, 10.0, Color(0.4, 0.6, 1.0, 0.5))
	draw_circle(Vector2.ZERO, 4.0, Color(1.0, 1.0, 1.0, 0.85))
