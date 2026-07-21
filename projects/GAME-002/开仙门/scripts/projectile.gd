extends Area2D
class_name Projectile

enum CycleState { APPROACHING, OVERSHOOTING, RETURNING }

var damage: float = 0.0
var speed: float = 500.0
var direction: Vector2 = Vector2.RIGHT
var pierce_count: int = 0
var knockback_force: float = 0.0
var from_peak: Node2D = null
var projectile_color: Color = Color(1, 0.9, 0.3, 0.95)
var projectile_shape: String = "circle"
var crit_rate: float = 0.0
var crit_damage: float = 1.5

# Cycle sword state
var _is_cycle: bool = false
var _cycle_state: int = CycleState.APPROACHING
var _cycle_target: Node2D = null
var _cycles_remaining: int = 1
var _cycle_distance: float = 150.0
var _cycle_hits: int = 0
var _cycle_max_hits: int = 2
var _cycle_overshoot_dir: Vector2 = Vector2.ZERO
var _cycle_overshoot_origin: Vector2 = Vector2.ZERO
var _cycle_overshoot_dist: float = 0.0
var _arc_offset_range: Vector2 = Vector2(40, 120)
var _turn_duration: float = 0.3
var _speed_mult: float = 1.0
var _trajectory_type: String = "straight"
var _target_time: float = 0.0
var _approach_arc_p0: Vector2 = Vector2.ZERO
var _approach_arc_p1: Vector2 = Vector2.ZERO
var _return_p0: Vector2 = Vector2.ZERO
var _return_p1: Vector2 = Vector2.ZERO
var _return_arc_progress: float = 0.0
var _base_speed: float = 500.0
var _travelled: float = 0.0
var _max_distance: float = 1800.0

var bounces_remaining: int = 0
var bounce_range: float = 200.0
var bounce_decay_pct: float = 0.25
var bounce_stun_chance: float = 0.0

var form_channel: Dictionary = {}
var _hit_targets: Array = []
var _active_sprite: Sprite2D = null
var _origin_pos: Vector2 = Vector2.ZERO
var _target_pos: Vector2 = Vector2.ZERO
var _flight_fx: Node2D = null
var _visual: ProjectileVisual = null

const CHAIN_BOUNCE_EFFECT_SCRIPT := preload("res://scripts/effects/chain_bounce_effect.gd")
const LIGHTNING_BOLT_SCENE_PATH := "res://scenes/effects/lightning_bolt.tscn"

@onready var _sword_sprite: Sprite2D = $SwordSprite
@onready var _trail_particles: CPUParticles2D = $TrailParticles


func _ready() -> void:
	var mpcfg = DataManager.main_peak_config
	if mpcfg:
		_max_distance = mpcfg.projectile_max_distance
	area_entered.connect(_on_area_entered)
	body_entered.connect(_on_body_entered)

	match projectile_shape:
		"sword":
			_active_sprite = _sword_sprite
		"lightning":
			speed = max(speed, 1800.0)
			_trail_particles.visible = false
			_trail_particles.emitting = false
			call_deferred("_spawn_initial_lightning_visual")

	if _active_sprite:
		_active_sprite.visible = true
		_active_sprite.modulate = projectile_color
		if projectile_shape != "lightning" and projectile_shape != "sword":
			_trail_particles.visible = true
			_trail_particles.color = projectile_color
			_trail_particles.emitting = true
	else:
		_visual = ProjectileVisual.new()
		_visual.projectile_shape = projectile_shape
		_visual.projectile_color = projectile_color
		add_child(_visual)


func _physics_process(delta: float) -> void:
	if _is_cycle:
		_process_cycle(delta)
		return
	position += direction * speed * delta
	_travelled += speed * delta
	if _active_sprite and _active_sprite.visible:
		_active_sprite.rotation = direction.angle() + PI / 2.0
	if _travelled >= _max_distance:
		queue_free()


func set_target(target_position: Vector2) -> void:
	_target_pos = target_position
	_origin_pos = global_position
	var delta := target_position - global_position
	if delta.length_squared() > 0.0:
		direction = delta.normalized()


func _spawn_initial_lightning_visual() -> void:
	if projectile_shape != "lightning":
		return
	if _target_pos == Vector2.ZERO:
		return
	if _flight_fx != null and is_instance_valid(_flight_fx):
		return
	_spawn_lightning_visual(global_position, _target_pos)


func _on_body_entered(body: Node2D) -> void:
	_hit(body)


func _on_area_entered(area: Area2D) -> void:
	if area.is_in_group("enemies"):
		_hit(area)


func _hit(target: Node2D) -> void:
	if target in _hit_targets:
		return
	_hit_targets.append(target)

	if is_instance_valid(target) and target.has_method("take_damage"):
		var final_damage: float = damage
		var is_crit := false
		if crit_rate > 0.0 and randf() < crit_rate:
			final_damage *= crit_damage
			is_crit = true
		# crit_ignore_armor: bypass enemy armor on crit
		if is_crit and not form_channel.is_empty() and form_channel.get("crit_ignore_armor", false):
			if is_instance_valid(target) and target.data != null:
				var ed = target.data
				if ed.armor != null:
					final_damage += float(ed.armor)  # add armor back before take_damage subtracts it
		# Sword intent damage bonus
		if target.has_method("get_sword_intent_stacks"):
			var si_stacks: int = target.get_sword_intent_stacks()
			if si_stacks > 0 and not form_channel.is_empty():
				var cfg: FormConfig = form_channel.get("config", null) as FormConfig
				if cfg and cfg.special_mechanic == "sword_intent":
					var si_params: Dictionary = cfg.get_special_params()
					var si_dmg: float = float(si_params.get("sword_intent_dmg", 0.08))
					final_damage *= (1.0 + si_stacks * si_dmg)
		target.take_damage(final_damage)
		if is_instance_valid(from_peak) and from_peak.has_method("apply_lifesteal"):
			from_peak.apply_lifesteal(final_damage)
		# Talent: hit reduces ultimate CD
		if not form_channel.is_empty() and form_channel.get("hit_reduce_cd", 0.0) > 0.0:
			form_channel["ultimate_cd"] = max(0.0, form_channel.get("ultimate_cd", 0.0) - form_channel["hit_reduce_cd"])
		_apply_form_effects(target)

		if knockback_force > 0.0 and target.has_method("apply_knockback"):
			target.apply_knockback(knockback_force, global_position)

	if _is_cycle:
		_cycle_hits += 1
		if _cycle_hits >= _cycle_max_hits:
			queue_free()
			return
		_cycle_overshoot_dir = direction if direction.length_squared() > 0.0 else (target.global_position - global_position).normalized()
		_cycle_overshoot_origin = global_position
		_cycle_overshoot_dist = 0.0
		_cycle_state = CycleState.OVERSHOOTING
		return

	if bounces_remaining > 0:
		var next_target: Node2D = _find_chain_target()
		if next_target:
			var bounce_from := global_position
			var bounce_to := next_target.global_position
			direction = (bounce_to - bounce_from).normalized()
			bounces_remaining -= 1
			damage *= (1.0 - bounce_decay_pct)
			var stun_guaranteed: bool = not form_channel.is_empty() and form_channel.get("thunder_stun_guaranteed", false)
			if stun_guaranteed or (bounce_stun_chance > 0.0 and randf() < bounce_stun_chance):
				if is_instance_valid(target) and target.has_method("apply_stun"):
					var stun_time: float = 0.5 + (form_channel.get("thunder_stun_time", 0.0) if not form_channel.is_empty() else 0.0)
					target.apply_stun(stun_time)
			_spawn_bounce_effect(bounce_from, bounce_to)
			return

	if pierce_count > 0:
		pierce_count -= 1
		# Talent: double damage on pierce follow-up
		if not form_channel.is_empty() and form_channel.get("pierce_double_dmg", false):
			damage *= 2.0
	else:
		queue_free()


func _apply_form_effects(target: Node2D) -> void:
	var channel: Dictionary = form_channel
	if channel.is_empty():
		return

	var config: FormConfig = channel.get("config", null) as FormConfig
	if config == null:
		return

	match config.special_mechanic:
		"soul_mark":
			if target.has_method("apply_soul_mark"):
				var params := config.get_special_params()
				var base_weaken: float = float(params.get("soul_mark_weaken", 0.08))
				var max_stacks: int = int(params.get("soul_mark_max", 4)) + int(channel.get("soul_mark_max_stacks_bonus", 0)) + int(channel.get("soul_mark_max_bonus", 0))
				var weaken: float = base_weaken + float(channel.get("soul_mark_weaken_bonus", 0.0))
				target.apply_soul_mark(1, max_stacks, weaken)
		"chain":
			pass
		"sword_intent":
			if target.has_method("apply_sword_intent"):
				var params := config.get_special_params()
				var stacks := 2 if randf() < crit_rate else 1
				var max_s: int = int(params.get("sword_intent_max", 5))
				var decay: float = float(params.get("sword_intent_decay", 3.0))
				target.apply_sword_intent(stacks, max_s, decay)


func _find_chain_target() -> Node2D:
	var enemies := get_tree().get_nodes_in_group("enemies")
	var best: Node2D = null
	var best_dist: float = bounce_range
	for enemy in enemies:
		if not is_instance_valid(enemy):
			continue
		if enemy in _hit_targets:
			continue
		var dist := global_position.distance_to(enemy.global_position)
		if dist < best_dist:
			best_dist = dist
			best = enemy
	return best


func _spawn_bounce_effect(from_pos: Vector2, to_pos: Vector2) -> void:
	if projectile_shape == "lightning":
		_spawn_lightning_visual(from_pos, to_pos)
		return

	var effect := Node2D.new()
	effect.set_script(CHAIN_BOUNCE_EFFECT_SCRIPT)
	effect.global_position = from_pos
	effect.z_index = 60
	var battlefield := get_tree().current_scene.get_node_or_null("Battlefield")
	if battlefield:
		battlefield.add_child(effect)


func _spawn_lightning_visual(from: Vector2, to: Vector2) -> void:
	var bolt_scene := _load_lightning_bolt_scene()
	if bolt_scene == null:
		return
	var bolt := bolt_scene.instantiate() as Node2D
	if bolt == null:
		return
	var parent := get_tree().current_scene.get_node_or_null("Battlefield/Projectiles")
	if parent == null:
		parent = get_tree().current_scene.get_node_or_null("Battlefield")
	if parent == null:
		parent = get_tree().current_scene
	parent.add_child(bolt)
	_flight_fx = bolt
	bolt.z_index = 60
	if bolt is CanvasItem:
		bolt.top_level = true
	bolt.call_deferred("strike", from, to)


func _load_lightning_bolt_scene() -> PackedScene:
	if not ResourceLoader.exists(LIGHTNING_BOLT_SCENE_PATH):
		return null
	var scene := load(LIGHTNING_BOLT_SCENE_PATH)
	if scene is PackedScene:
		return scene
	return null

# --- Cycle Sword Methods ---

func setup_cycle(target: Node2D, cycle_count: int, cycle_distance: float,
		arc_offset_min: float, arc_offset_max: float,
		turn_duration: float, speed_mult: float, target_time: float,
		use_arc: bool) -> void:
	_is_cycle = true
	_cycle_target = target
	_cycles_remaining = cycle_count
	_cycle_distance = cycle_distance
	_cycle_max_hits = cycle_count + 1
	_cycle_hits = 0
	_cycle_state = CycleState.APPROACHING
	_arc_offset_range = Vector2(arc_offset_min, arc_offset_max)
	_turn_duration = turn_duration
	_speed_mult = speed_mult
	_target_time = target_time
	_base_speed = speed
	if use_arc:
		_trajectory_type = "arc"
		_setup_approach_arc(target.global_position)
	else:
		_trajectory_type = "straight"
		var dist := global_position.distance_to(target.global_position)
		speed = (dist / target_time) * speed_mult
		direction = (target.global_position - global_position).normalized()
	if _active_sprite and _active_sprite.visible:
		_active_sprite.rotation = direction.angle() + PI / 2.0


func _process_cycle(delta: float) -> void:
	if not is_instance_valid(_cycle_target):
		_cycle_target = _find_new_cycle_target()
		if _cycle_target == null:
			queue_free()
			return

	match _cycle_state:
		CycleState.APPROACHING:
			if _trajectory_type == "arc":
				_approach_arc_p0 = global_position
				_approach_arc_p1 = _calc_arc_control(global_position, _cycle_target.global_position)
				var path_len := _bezier_length(_approach_arc_p0, _approach_arc_p1, _cycle_target.global_position)
				speed = (path_len / _target_time) * _speed_mult
				var step: float = (speed * delta) / max(path_len, 1.0)
				var t: float = clamp(_travelled / max(path_len, 1.0), 0.0, 1.0)
				var next_t: float = min(t + step, 1.0)
				global_position = _bezier_point(next_t, _approach_arc_p0, _approach_arc_p1, _cycle_target.global_position)
				_travelled += speed * delta
				var tangent := _bezier_tangent(next_t, _approach_arc_p0, _approach_arc_p1, _cycle_target.global_position)
				if tangent.length_squared() > 0.001:
					direction = tangent.normalized()
			else:
				direction = (_cycle_target.global_position - global_position).normalized()
				position += direction * speed * delta
				_travelled += speed * delta
			if _active_sprite and _active_sprite.visible:
				_active_sprite.rotation = direction.angle() + PI / 2.0
			if _travelled >= _max_distance:
				queue_free()

		CycleState.OVERSHOOTING:
			position += _cycle_overshoot_dir * speed * delta
			_cycle_overshoot_dist += speed * delta
			if _active_sprite and _active_sprite.visible:
				_active_sprite.rotation = _cycle_overshoot_dir.angle() + PI / 2.0
			if _cycle_overshoot_dist >= _cycle_distance:
				_start_return_arc()

		CycleState.RETURNING:
			if _return_arc_progress < _turn_duration:
				_return_arc_progress += delta
				if is_instance_valid(_cycle_target):
					var target_dir := (_cycle_target.global_position - global_position).normalized()
					var turn_fraction := delta / maxf(_turn_duration - _return_arc_progress + delta, 0.001)
					direction = lerp(direction, target_dir, turn_fraction)
					direction = direction.normalized()
				if _active_sprite and _active_sprite.visible:
					_active_sprite.rotation = direction.angle() + PI / 2.0
			else:
				if is_instance_valid(_cycle_target):
					direction = (_cycle_target.global_position - global_position).normalized()
				position += direction * speed * delta
				if _active_sprite and _active_sprite.visible:
					_active_sprite.rotation = direction.angle() + PI / 2.0


func _setup_approach_arc(target_pos: Vector2) -> void:
	_approach_arc_p0 = global_position
	_approach_arc_p1 = _calc_arc_control(global_position, target_pos)
	var path_len := _bezier_length(_approach_arc_p0, _approach_arc_p1, target_pos)
	speed = (path_len / _target_time) * _speed_mult


func _start_return_arc() -> void:
	_cycle_state = CycleState.RETURNING
	_return_arc_progress = 0.0
	speed = _base_speed * _speed_mult
	_hit_targets.clear()


func _calc_arc_control(from_pos: Vector2, to_pos: Vector2) -> Vector2:
	var mid: Vector2 = (from_pos + to_pos) * 0.5
	var perp: Vector2 = (to_pos - from_pos).orthogonal().normalized()
	var offset: float = randf_range(_arc_offset_range.x, _arc_offset_range.y)
	if randf() < 0.5:
		offset = -offset
	return mid + perp * offset


func _find_new_cycle_target() -> Node2D:
	var enemies := get_tree().get_nodes_in_group("enemies")
	var best: Node2D = null
	var best_dist := 1200.0
	for enemy in enemies:
		if not is_instance_valid(enemy):
			continue
		var dist := global_position.distance_to(enemy.global_position)
		if dist < best_dist:
			best_dist = dist
			best = enemy
	return best


func _bezier_point(t: float, p0: Vector2, p1: Vector2, p2: Vector2) -> Vector2:
	var u := 1.0 - t
	return u * u * p0 + 2.0 * u * t * p1 + t * t * p2


func _bezier_tangent(t: float, p0: Vector2, p1: Vector2, p2: Vector2) -> Vector2:
	return 2.0 * (1.0 - t) * (p1 - p0) + 2.0 * t * (p2 - p1)


func _bezier_length(p0: Vector2, p1: Vector2, p2: Vector2, steps: int = 20) -> float:
	var length := 0.0
	var prev := p0
	for i in range(1, steps + 1):
		var t: float = float(i) / float(steps)
		var pt := _bezier_point(t, p0, p1, p2)
		length += prev.distance_to(pt)
		prev = pt
	return length
