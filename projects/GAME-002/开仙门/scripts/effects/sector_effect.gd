extends Node2D
## 扇形攻击区域视觉特效 — 显示后渐隐消失

@export var angle: float = 90.0
@export var radius: float = 180.0
@export var color: Color = Color(1.0, 0.84, 0.0, 0.45)
@export var duration: float = 0.28


func _ready() -> void:
	queue_redraw()
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "modulate:a", 0.0, duration).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tween.tween_property(self, "scale", Vector2(1.15, 1.15), duration).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.chain().tween_callback(queue_free)


func _draw() -> void:
	var half_angle := deg_to_rad(angle / 2.0)
	var center_angle := -PI / 2.0
	var start_angle := center_angle - half_angle
	var end_angle := center_angle + half_angle
	var segments := 24
	var points := PackedVector2Array()
	points.append(Vector2.ZERO)
	for i in range(segments + 1):
		var a := start_angle + (end_angle - start_angle) * float(i) / float(segments)
		points.append(Vector2(cos(a), sin(a)) * radius)
	draw_colored_polygon(points, color)
	draw_arc(Vector2.ZERO, radius + 3.0, start_angle, end_angle, 24, color, 3.0, true)
