extends Area2D
class_name Disciple
## V0.1 弟子 — 独立战斗单位，自动索敌攻击
## 由 DiscipleSquad 统一管理

signal disciple_died(disciple: Disciple)
signal attack_dealt(target: Node2D, damage: float)

# ── 基础属性 ──
var disciple_id: String = ""
var disciple_name: String = ""
var peak_id: String = ""
var max_hp: float = 100.0
var current_hp: float = 100.0
var attack: float = 10.0
var defense: float = 0.0
var attack_speed: float = 1.0
var move_speed: float = 200.0
var attack_range: float = 150.0
var skill_id: String = ""

# ── 内部状态 ──
var _attack_timer: float = 0.0
var _target: Node2D = null
var _formation_pos: Vector2 = Vector2.ZERO
var _alive: bool = true
var _projectile_scene: PackedScene = preload("res://scenes/projectiles/projectile.tscn")


func _ready() -> void:
	current_hp = max_hp
	set_process(true)


func _process(delta: float) -> void:
	if not _alive:
		return
	_attack_timer -= delta
	_find_target()
	if _target and is_instance_valid(_target):
		var dist := global_position.distance_to(_target.global_position)
		if dist <= attack_range:
			_try_attack()
		else:
			_move_toward(_target.global_position, delta)
	else:
		_return_to_formation(delta)


func setup(data: DiscipleData, formation_pos: Vector2) -> void:
	disciple_id = data.disciple_id
	disciple_name = data.disciple_name
	peak_id = data.peak_id
	max_hp = data.hp
	current_hp = max_hp
	attack = data.attack
	defense = data.defense
	attack_speed = data.attack_speed
	move_speed = data.move_speed
	attack_range = data.attack_range
	skill_id = data.skill_id
	_formation_pos = formation_pos
	global_position = formation_pos


func _find_target() -> void:
	if _target and is_instance_valid(_target):
		return
	var enemies := get_tree().get_nodes_in_group("enemies")
	if enemies.is_empty():
		return
	var nearest: Node2D = null
	var nearest_dist := INF
	for enemy in enemies:
		if not is_instance_valid(enemy):
			continue
		var d := global_position.distance_to(enemy.global_position)
		if d < nearest_dist:
			nearest_dist = d
			nearest = enemy
	_target = nearest


func _move_toward(target_pos: Vector2, delta: float) -> void:
	var dir := global_position.direction_to(target_pos)
	global_position += dir * move_speed * delta
	# 限制移动范围：不能越过 spirit_seat 太远（Y 不超过 550）
	global_position.y = min(global_position.y, 550.0)


func _return_to_formation(delta: float) -> void:
	var dist := global_position.distance_to(_formation_pos)
	if dist < 5.0:
		global_position = _formation_pos
		return
	var dir := global_position.direction_to(_formation_pos)
	global_position += dir * move_speed * delta * 0.5


func _try_attack() -> void:
	if _attack_timer > 0.0:
		return
	_attack_timer = attack_speed
	if _target and is_instance_valid(_target) and _target.has_method("take_damage"):
		_target.take_damage(attack)
		attack_dealt.emit(_target, attack)
		_spawn_projectile()


func _spawn_projectile() -> void:
	if _projectile_scene == null or not _target:
		return
	var proj := _projectile_scene.instantiate()
	if proj == null:
		return
	var container := get_tree().current_scene.get_node_or_null("Battlefield/Projectiles")
	if container:
		container.add_child(proj)
	else:
		get_tree().current_scene.add_child(proj)
	if proj.has_method("launch"):
		proj.launch(global_position, _target)


func take_damage(amount: float) -> float:
	if not _alive:
		return 0.0
	var dmg: float = max(0.0, amount - defense)
	current_hp -= dmg
	if current_hp <= 0.0:
		_alive = false
		disciple_died.emit(self)
		queue_free()
	return dmg


func heal(amount: float) -> void:
	if not _alive:
		return
	current_hp = minf(current_hp + amount, max_hp)


func is_alive() -> bool:
	return _alive


func apply_blessing(effect_type: String, value: float) -> void:
	match effect_type:
		"atk_up": attack += value
		"hp_up": max_hp += value; current_hp += value
		"speed_up": move_speed += value
		"cd_reduce": attack_speed = max(0.2, attack_speed - value)
		"range_up": attack_range += value
