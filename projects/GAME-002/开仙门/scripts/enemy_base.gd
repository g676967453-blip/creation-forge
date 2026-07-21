extends Area2D
class_name EnemyBase

const NODE_MAIN_PEAK := "Battlefield/MainPeak"

signal enemy_destroyed(enemy)
signal reached_main_peak(enemy)

const FLOATING_TEXT_SCENE: PackedScene = preload("res://scenes/ui/floating_text.tscn")
const STUN_STAR_SCRIPT = preload("effects/stun_star.gd")
const PROJECTILE_SCENE: PackedScene = preload("res://scenes/projectiles/projectile.tscn")

var data
var current_hp: float
var speed: float
var base_speed: float
var target_position: Vector2 = Vector2.ZERO
var _knockback_remaining: float = 0.0
var _knockback_dir: Vector2 = Vector2.ZERO
var _siege_mode: bool = false
var _attack_timer: float = 0.0
var _march_style: String = "quick"
var _attack_range: float = 0.0
var _ranged_attack_timer: float = 0.0

var slow_amount: float = 0.0
var slow_timer: float = 0.0
var frozen: bool = false
var freeze_timer: float = 0.0
var stunned: bool = false
var stun_timer: float = 0.0

var _poison_dps: float = 0.0
var _poison_timer: float = 0.0
var _poison_tick: float = 0.0
var _charmed: bool = false
var _charm_timer: float = 0.0

var _animated_sprite: AnimatedSprite2D = null
var _use_sprite: bool = false

var _soul_marks: int = 0
var _soul_mark_weaken: float = 0.0

# Sword Intent (剑意追击) — 御剑诀 core mechanic
var _sword_intent_stacks: int = 0
var _sword_intent_max: int = 5
var _sword_intent_timer: float = 0.0
var _sword_intent_decay: float = 3.0


func initialize(enemy_data) -> void:
	data = enemy_data
	current_hp = enemy_data.hp
	speed = enemy_data.speed
	base_speed = enemy_data.speed
	target_position = Vector2(640, 650)
	_march_style = enemy_data.march_style if enemy_data.get("march_style") != null else "quick"
	_attack_range = enemy_data.attack_range if enemy_data.get("attack_range") != null else 0.0
	collision_layer = 4
	collision_mask = 1
	add_to_group("enemies")
	area_entered.connect(_on_area_entered)
	_setup_sprite()
	queue_redraw()


func _setup_sprite() -> void:
	var cfg: Dictionary = DataManager.get_enemy_sprite_config(data.id)
	if cfg.is_empty():
		return
	var tex: Texture2D = load(cfg["sheet"])
	if not tex:
		return
	var frames := SpriteFrames.new()
	var frame_w: int = cfg["frame_w"]
	var frame_h: int = cfg.get("frame_h", frame_w)
	var fps: float = cfg["fps"]
	var total_frames: int = cfg["frames"]
	for i in range(total_frames):
		var atlas := AtlasTexture.new()
		atlas.atlas = tex
		atlas.region = Rect2(i * frame_w, 0, frame_w, frame_h)
		frames.add_frame("default", atlas)
	frames.set_animation_speed("default", fps)
	frames.set_animation_loop("default", true)

	_animated_sprite = AnimatedSprite2D.new()
	_animated_sprite.sprite_frames = frames
	_animated_sprite.animation = "default"
	_animated_sprite.centered = true
	_animated_sprite.z_index = 1
	var scale_factor: float = data.size * 0.8
	_animated_sprite.scale = Vector2(scale_factor, scale_factor)
	_animated_sprite.play()
	add_child(_animated_sprite)
	_use_sprite = true


func _physics_process(delta: float) -> void:
	if current_hp <= 0.0:
		return

	if _siege_mode:
		_attack_timer -= delta
		if _attack_timer <= 0.0:
			_attack_timer = 1.0
			var main_peak = get_tree().current_scene.get_node_or_null(NODE_MAIN_PEAK)
			if main_peak and main_peak.has_method("take_damage"):
				main_peak.take_damage(data.damage)
		_update_sprite_direction()
		return

	if _march_style == "ranged":
		var main_peak = get_tree().current_scene.get_node_or_null(NODE_MAIN_PEAK)
		if main_peak:
			var dist := global_position.distance_to(main_peak.global_position)
			if dist <= _attack_range:
				# In range — stop and shoot
				speed = 0.0
				_ranged_attack_timer -= delta
				if _ranged_attack_timer <= 0.0:
					_ranged_attack_timer = 1.5
					_shoot_at_main_peak()
				_update_sprite_direction()
				return
			else:
				# Out of range — move toward main_peak
				speed = base_speed
				var dir: Vector2 = (main_peak.global_position - global_position).normalized()
				position += dir * speed * delta
				_update_sprite_direction()
				return

	if frozen:
		freeze_timer -= delta
		if freeze_timer <= 0.0:
			frozen = false
			speed = base_speed * (1.0 - slow_amount)
		return

	if stunned:
		stun_timer -= delta
		if stun_timer <= 0.0:
			stunned = false
			speed = base_speed * (1.0 - slow_amount)
		return

	if _knockback_remaining > 0.0:
		position += _knockback_dir * speed * 3.0 * delta
		_knockback_remaining -= delta
		return

	if slow_timer > 0.0:
		slow_timer -= delta
		if slow_timer <= 0.0:
			slow_amount = 0.0
			speed = base_speed
	else:
		speed = base_speed * (1.0 - slow_amount)

	if _poison_timer > 0.0:
		_poison_timer -= delta
		_poison_tick += delta
		if _poison_tick >= 1.0:
			_poison_tick -= 1.0
			take_damage(_poison_dps)
			_spawn_damage_number(_poison_dps, Color(0.6, 0.2, 0.8))
		if _poison_timer <= 0.0:
			_poison_dps = 0.0
			_poison_tick = 0.0

	_process_sword_intent(delta)

	var dir := (target_position - global_position).normalized()
	if _charmed:
		_charm_timer -= delta
		dir = -dir
		if _charm_timer <= 0.0:
			_charmed = false
	position += dir * speed * delta
	_update_sprite_direction()


func _process_sword_intent(delta: float) -> void:
	if _sword_intent_stacks <= 0:
		return
	_sword_intent_timer -= delta
	if _sword_intent_timer <= 0.0:
		_sword_intent_stacks = 0


func apply_sword_intent(stacks: int, max_stacks: int, decay_time: float) -> void:
	_sword_intent_max = max_stacks
	_sword_intent_decay = decay_time
	_sword_intent_stacks = min(_sword_intent_stacks + stacks, _sword_intent_max)
	_sword_intent_timer = _sword_intent_decay


func get_sword_intent_stacks() -> int:
	return _sword_intent_stacks


func clear_sword_intent() -> void:
	_sword_intent_stacks = 0
	_sword_intent_timer = 0.0


func apply_soul_mark(stacks: int, max_stacks: int = 4, weaken_per_stack: float = 0.08) -> void:
	_soul_marks = min(_soul_marks + stacks, max_stacks)
	_soul_mark_weaken = _soul_marks * weaken_per_stack


func detonate_soul_mark(blast_bonus: float = 1.0, extra_stacks: int = 0, stun_duration: float = 0.0) -> void:
	if _soul_marks <= 0:
		return
	var effective_stacks: int = _soul_marks + extra_stacks
	var dmg := 20.0 * effective_stacks * blast_bonus
	take_damage(dmg)
	_soul_marks = 0
	_soul_mark_weaken = 0.0
	if stun_duration > 0.0:
		apply_stun(stun_duration)


func apply_stun(duration: float) -> void:
	var was_stunned := stunned
	stunned = true
	stun_timer = max(stun_timer, duration)
	speed = 0.0
	queue_redraw()
	if not was_stunned:
		_spawn_stun_effect()


func apply_slow(amount: float, duration: float) -> void:
	if data and data.get("enemy_type") == "flying":
		amount *= 0.5
	slow_amount = clamp(slow_amount + amount, 0.0, 0.85)
	slow_timer = max(slow_timer, duration)
	speed = base_speed * (1.0 - slow_amount)
	queue_redraw()


func apply_freeze(duration: float) -> void:
	if data and data.get("enemy_type") == "elite" and data.id == "enemy_frost_beast":
		apply_slow(0.3, duration)
		return
	frozen = true
	freeze_timer = max(freeze_timer, duration)
	speed = 0.0
	queue_redraw()


func apply_poison(dps: float, duration: float) -> void:
	_poison_dps = max(_poison_dps, dps)
	_poison_timer = max(_poison_timer, duration)
	queue_redraw()


func apply_charm(duration: float) -> void:
	_charmed = true
	_charm_timer = max(_charm_timer, duration)
	queue_redraw()


func take_damage(amount: float) -> void:
	if data and data.get("armor") != null:
		amount = max(1.0, amount - float(data.armor))
	current_hp -= amount
	_spawn_damage_number(amount)
	if current_hp <= 0:
		enemy_destroyed.emit(self)
		queue_free()


func _spawn_damage_number(amount: float, text_color: Color = Color(1.0, 0.2, 0.2)) -> void:
	var ui_root := get_tree().current_scene.get_node_or_null("UI")
	if ui_root == null:
		return
	var popup := FLOATING_TEXT_SCENE.instantiate()
	if popup == null:
		return
	popup.position = global_position + Vector2(randf_range(-12, 12), randf_range(-24, -8))
	ui_root.add_child(popup)
	if popup.has_method("show_text"):
		popup.show_text("-%.0f" % amount, text_color)


func _spawn_stun_effect() -> void:
	var ui_root := get_tree().current_scene.get_node_or_null("UI")
	if ui_root == null:
		return
	var popup := FLOATING_TEXT_SCENE.instantiate()
	if popup == null:
		return
	popup.position = global_position + Vector2(0, -32)
	ui_root.add_child(popup)
	if popup.has_method("show_text"):
		popup.show_text("眩晕!", Color(1.0, 0.9, 0.2))

	for i in range(3):
		var star := Node2D.new()
		star.script = STUN_STAR_SCRIPT
		star.z_index = 80
		var angle := deg_to_rad(120.0 * float(i) + 60.0)
		star.position = Vector2(cos(angle), sin(angle)) * (data.size * 14.0 + 8.0)
		add_child(star)
		_animate_stun_star(star)


func _animate_stun_star(star: Node2D) -> void:
	var tween := star.create_tween()
	tween.set_parallel(true)
	tween.tween_property(star, "position", star.position * 1.5, 0.5).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(star, "modulate:a", 0.0, 0.5).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
	tween.tween_property(star, "rotation", TAU, 0.5)
	tween.chain().tween_callback(star.queue_free)


func apply_knockback(distance: float, from_pos: Vector2) -> void:
	_knockback_remaining = distance / 100.0
	_knockback_dir = (global_position - from_pos).normalized()


func _update_sprite_direction() -> void:
	if not _use_sprite or _animated_sprite == null:
		return
	var dir: Vector2 = (target_position - global_position).normalized()
	if abs(dir.x) > 0.1:
		_animated_sprite.flip_h = dir.x < 0


func _on_area_entered(area: Area2D) -> void:
	if area.is_in_group("main_peak") and not _siege_mode:
		_siege_mode = true
		_attack_timer = 1.0
		speed = 0.0
		reached_main_peak.emit(self)


func _shoot_at_main_peak() -> void:
	var main_peak = get_tree().current_scene.get_node_or_null(NODE_MAIN_PEAK)
	if not main_peak:
		return

	var proj: Projectile = PROJECTILE_SCENE.instantiate() as Projectile
	proj.damage = data.damage
	proj.speed = 300.0
	proj.projectile_shape = "circle"
	proj.projectile_color = data.color if data else Color(0.2, 0.6, 0.2)
	proj.from_peak = null
	proj.global_position = global_position
	proj.collision_mask = 1  # Hit main peak
	proj.set_target(main_peak.global_position)

	var battlefield = get_tree().current_scene.get_node_or_null("Battlefield")
	if battlefield and battlefield.has_node("Projectiles"):
		battlefield.get_node("Projectiles").add_child(proj)
	elif battlefield:
		battlefield.add_child(proj)


func _draw() -> void:
	var r: float = data.size * 14.0
	if data.enemy_type == "boss":
		draw_circle(Vector2.ZERO, r + 10.0, Color(0.35, 0.05, 0.05, 0.8))
		draw_circle(Vector2.ZERO, r + 4.0, Color(1.0, 0.25, 0.2, 0.25))
	if not _use_sprite:
		draw_circle(Vector2.ZERO, r, data.color)

	if frozen:
		draw_circle(Vector2.ZERO, r + 3, Color(0.5, 0.8, 1.0, 0.3))
	if stunned:
		draw_circle(Vector2.ZERO, r + 4, Color(1.0, 0.9, 0.2, 0.4))
	if _poison_timer > 0.0:
		draw_circle(Vector2.ZERO, r + 4, Color(0.6, 0.2, 0.8, 0.35))
	if _charmed:
		draw_circle(Vector2.ZERO, r + 6, Color(1.0, 0.4, 0.7, 0.3))
	if _soul_marks > 0:
		draw_circle(Vector2.ZERO, r + 5, Color(0.8, 0.3, 0.9, 0.35))
	if _sword_intent_stacks > 0:
		var alpha: float = float(_sword_intent_stacks) / float(_sword_intent_max)
		draw_circle(Vector2.ZERO, r + 7, Color(0.3, 0.9, 0.9, 0.3 + alpha * 0.5))

	var hp_ratio: float = current_hp / data.hp
	var bar_w := r * 2.0
	var bar_h := 3.0
	draw_rect(Rect2(-bar_w/2, -r - 6, bar_w, bar_h), Color(0.2, 0.2, 0.2))
	draw_rect(Rect2(-bar_w/2, -r - 6, bar_w * hp_ratio, bar_h), Color.GREEN if hp_ratio > 0.3 else Color.RED)
