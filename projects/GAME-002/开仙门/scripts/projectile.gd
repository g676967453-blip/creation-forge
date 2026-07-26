extends Area2D
class_name Projectile
## V0.1 投射物 — 简化版，仅直线轨迹
## 旧 cycle sword / chain bounce 逻辑已移除（V0.0 灵器自动攻击遗留）

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

var form_channel: Dictionary = {}   ## V0.0 兼容
## V0.0 兼容字段（chain bounce / cycle sword 已移除，保留字段避免旧代码报错）
var bounces_remaining: int = 0
var bounce_range: float = 200.0
var bounce_decay_pct: float = 0.25
var bounce_stun_chance: float = 0.0
var _hit_targets: Array = []
var _travelled: float = 0.0
var _max_distance: float = 1800.0
var _active_sprite: Sprite2D = null
var _visual: ProjectileVisual = null

@onready var _sword_sprite: Sprite2D = $SwordSprite
@onready var _trail_particles: CPUParticles2D = $TrailParticles


func _ready() -> void:
	var mpcfg = DataManager.main_peak_config
	if mpcfg:
		_max_distance = mpcfg.projectile_max_distance
	area_entered.connect(_on_area_entered)
	body_entered.connect(_on_body_entered)

	match projectile_shape:
		"sword": _active_sprite = _sword_sprite

	if _active_sprite:
		_active_sprite.visible = true
		_active_sprite.modulate = projectile_color
		_trail_particles.visible = true
		_trail_particles.color = projectile_color
		_trail_particles.emitting = true
	else:
		_visual = ProjectileVisual.new()
		_visual.projectile_shape = projectile_shape
		_visual.projectile_color = projectile_color
		add_child(_visual)


func _physics_process(delta: float) -> void:
	position += direction * speed * delta
	_travelled += speed * delta
	if _active_sprite and _active_sprite.visible:
		_active_sprite.rotation = direction.angle() + PI / 2.0
	if _travelled >= _max_distance:
		queue_free()


func launch(from_pos: Vector2, target: Node2D) -> void:
	## V0.1: 由 Disciple 调用 — 设置起点和追踪目标
	global_position = from_pos
	var delta := target.global_position - from_pos
	if delta.length_squared() > 0.0:
		direction = delta.normalized()


func set_target(target_position: Vector2) -> void:
	## V0.0 兼容：旧 main_peak / enemy_base 调用此方法设置飞行方向
	var delta := target_position - global_position
	if delta.length_squared() > 0.0:
		direction = delta.normalized()


func setup_cycle(target: Node2D, _cycle_count: int, _cycle_distance: float,
		_arc_offset_min: float, _arc_offset_max: float,
		_turn_duration: float, _speed_mult: float, _target_time: float,
		_use_arc: bool) -> void:
	## V0.0 兼容桩：旧 cycle sword 逻辑已移除，降级为直线投射物
	set_target(target.global_position)


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
		if crit_rate > 0.0 and randf() < crit_rate:
			final_damage *= crit_damage
		target.take_damage(final_damage)
		if is_instance_valid(from_peak) and from_peak.has_method("apply_lifesteal"):
			from_peak.apply_lifesteal(final_damage)

	if knockback_force > 0.0 and target.has_method("apply_knockback"):
		target.apply_knockback(knockback_force, global_position)

	if pierce_count > 0:
		pierce_count -= 1
	else:
		queue_free()
