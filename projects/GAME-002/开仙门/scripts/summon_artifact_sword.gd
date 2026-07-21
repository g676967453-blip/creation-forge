extends Area2D
class_name SummonArtifactSword

signal energy_gained(amount: float)

func _physics_process(delta: float) -> void:
	var peak: Node = get_meta("main_peak_ref", null)
	if not peak:
		return

	var orbit_radius: float = float(get_meta("orbit_radius", 80))
	var orbit_speed: float = float(get_meta("orbit_speed", 2.5))
	var orbit_angle: float = float(get_meta("orbit_angle", 0)) + orbit_speed * delta
	set_meta("orbit_angle", orbit_angle)

	var offset: Vector2 = Vector2(cos(orbit_angle), sin(orbit_angle)) * orbit_radius
	global_position = peak.global_position + offset
	rotation = orbit_angle + PI / 2.0

	var atk_timer: float = float(get_meta("atk_timer", 0)) - delta
	if atk_timer <= 0.0:
		atk_timer = float(get_meta("atk_interval", 0.9))
		var target: Node2D = _find_nearest_in_range()
		if target:
			var dmg: float = float(get_meta("atk", 10))
			target.take_damage(dmg)
			var ls: float = float(get_meta("lifesteal", 0.0))
			if ls > 0.0 and peak.has_method("heal"):
				peak.heal(dmg * ls)
			energy_gained.emit(3.0)
	set_meta("atk_timer", atk_timer)

	queue_redraw()

func _find_nearest_in_range() -> Node2D:
	var peak: Node = get_meta("main_peak_ref", null)
	if not peak:
		return null
	var enemies: Array = get_tree().get_nodes_in_group("enemies")
	var best: Node2D = null
	var best_dist: float = INF
	for e in enemies:
		if not is_instance_valid(e):
			continue
		var d: float = peak.global_position.distance_to(e.global_position)
		if d < best_dist and d < 200:
			best_dist = d
			best = e
	return best

func _draw() -> void:
	var c: Color = Color(0.7, 0.65, 0.4)
	var half: Vector2 = Vector2(8, 3)
	draw_rect(Rect2(-half, half * 2), c)
	draw_line(Vector2.ZERO, Vector2(12, 0), c.lightened(0.3), 1)
