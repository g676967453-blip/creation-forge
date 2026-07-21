extends Node2D
class_name ProjectileVisual

var projectile_shape: String = "circle"
var projectile_color: Color = Color(1, 0.9, 0.3, 0.95)


func _draw() -> void:
	match projectile_shape:
		"sword":
			var pts := PackedVector2Array([
				Vector2(0, -6),
				Vector2(3, 0),
				Vector2(0, 5),
				Vector2(-3, 0),
			])
			draw_colored_polygon(pts, projectile_color)
		"fist":
			draw_circle(Vector2.ZERO, 4.5, projectile_color)
			draw_circle(Vector2.ZERO, 2.0, Color(1, 1, 1, 0.6))
		"crystal":
			var pts_hex := PackedVector2Array()
			for i in range(6):
				var angle_rad := deg_to_rad(i * 60.0 - 30.0)
				pts_hex.append(Vector2(cos(angle_rad), sin(angle_rad)) * 4.0)
			draw_colored_polygon(pts_hex, projectile_color)
		"lightning":
			return
		_:
			draw_circle(Vector2.ZERO, 3.0, projectile_color)
			draw_circle(Vector2.ZERO, 1.5, Color(1, 1, 1, 0.8))
