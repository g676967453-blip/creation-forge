extends Node2D


func _ready() -> void:
	queue_redraw()


func _draw() -> void:
	draw_circle(Vector2.ZERO, 2.5, Color(1.0, 0.95, 0.3, 0.9))
	draw_circle(Vector2.ZERO, 1.0, Color(1.0, 1.0, 1.0, 0.7))
