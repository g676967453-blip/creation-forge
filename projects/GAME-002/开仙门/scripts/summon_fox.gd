extends Area2D
class_name SummonFox

signal energy_gained(amount: float)

func is_alive() -> bool:
	return get_meta("hp", 0) > 0

func take_damage(amount: float) -> void:
	var effective_amount: float = amount
	if get_meta("taunt", false):
		effective_amount *= 0.7  # taunt: 30%% damage reduction
	var hp: float = float(get_meta("hp", 0)) - effective_amount
	set_meta("hp", hp)
	if hp <= 0:
		queue_free()

func _physics_process(delta: float) -> void:
	var hp: float = float(get_meta("hp", 0))
	if hp <= 0:
		queue_free()
		return

	var target: Node2D = _find_target()

	var atk_timer: float = float(get_meta("atk_timer", 0)) - delta
	if atk_timer <= 0.0:
		atk_timer = float(get_meta("atk_interval", 0.9))
		if target:
			var dmg: float = float(get_meta("atk", 8))
			target.take_damage(dmg)
			energy_gained.emit(2.0)
	set_meta("atk_timer", atk_timer)

	if target:
		var dir: Vector2 = (target.global_position - global_position).normalized()
		global_position += dir * float(get_meta("speed", 180)) * delta

	queue_redraw()

func _find_target() -> Node2D:
	var enemies: Array = get_tree().get_nodes_in_group("enemies")
	var best: Node2D = null
	var best_dist: float = INF
	for e in enemies:
		if not is_instance_valid(e):
			continue
		var d: float = global_position.distance_to(e.global_position)
		if d < best_dist:
			best_dist = d
			best = e
	return best

func _draw() -> void:
	var c: Color = Color(1.0, 0.85, 0.5)
	draw_circle(Vector2.ZERO, 10, c)
	draw_circle(Vector2.ZERO, 7, c.darkened(0.3))
