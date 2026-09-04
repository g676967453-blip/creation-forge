class_name WindowBrick
extends StaticBody2D
## 窗户砖：燃烧窗 / 救援窗 / 红窗（使用像素纹理）

enum BrickType { FIRE, RESCUE }

signal destroyed(brick: Node)

const TEX_FIRE := preload("res://assets/props/windows/window_fire.png")
const TEX_RESCUE := preload("res://assets/props/windows/window_rescue.png")
const TEX_RESCUE_RED := preload("res://assets/props/windows/window_rescue_red.png")

var brick_type: BrickType = BrickType.FIRE
var fire_level: int = 1
var hp: int = 3
var req: int = 3
var is_red: bool = false
var grid_col: int = 0
var grid_row: int = 0
var is_dead: bool = false  ## 已结算，防止 queue_free 前连撞

var _collision: CollisionShape2D
var _visual: Sprite2D
var _label: Label


func _ready() -> void:
	_cache_nodes()
	_apply_shape()
	_refresh()


func _cache_nodes() -> void:
	if _collision == null:
		_collision = get_node_or_null("CollisionShape2D") as CollisionShape2D
	if _visual == null:
		_visual = get_node_or_null("Visual") as Sprite2D
	if _label == null:
		_label = get_node_or_null("Label") as Label


func setup(p_type: BrickType, p_fire_level: int = 1, p_red: bool = false) -> void:
	is_dead = false
	brick_type = p_type
	is_red = p_red
	fire_level = clampi(p_fire_level, 1, 3)
	if brick_type == BrickType.FIRE:
		var idx: int = fire_level - 1
		var hit_req: int = 3
		if idx >= 0 and idx < GameConstants.FIRE_HIT_REQ.size():
			hit_req = int(GameConstants.FIRE_HIT_REQ[idx])
		req = hit_req
		hp = req
	else:
		req = 1
		hp = 999
	collision_layer = 8
	collision_mask = 0
	_cache_nodes()
	_apply_shape()
	_refresh()


func _apply_shape() -> void:
	if _collision and _collision.shape is RectangleShape2D:
		(_collision.shape as RectangleShape2D).size = Vector2(GameConstants.BRICK_W, GameConstants.BRICK_H)
	if _visual:
		# Sprite2D：中心对齐到砖中心
		_visual.position = Vector2.ZERO
	if _label:
		_label.position = Vector2(-GameConstants.BRICK_W * 0.5, -10.0)
		_label.size = Vector2(GameConstants.BRICK_W, 20.0)
		_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		_label.z_index = 2


func hit(damage: int = 1) -> String:
	## 返回："fire_down" | "fire_out" | "rescue_grab" | "none"
	if is_dead:
		return "none"
	if brick_type == BrickType.RESCUE:
		return "rescue_grab"
	var d: int = maxi(1, damage)
	hp = maxi(0, hp - d)
	_refresh()
	if hp <= 0:
		return "fire_out"
	return "fire_down"


func _disable_collision() -> void:
	is_dead = true
	collision_layer = 0
	collision_mask = 0
	if _collision:
		_collision.set_deferred("disabled", true)


func consume_for_rescue() -> void:
	if is_dead:
		return
	_disable_collision()
	destroyed.emit(self)
	queue_free()


func extinguish() -> void:
	if is_dead:
		return
	_disable_collision()
	destroyed.emit(self)
	queue_free()


func _refresh() -> void:
	_cache_nodes()
	if not _visual:
		return
	match brick_type:
		BrickType.FIRE:
			_visual.texture = TEX_FIRE
			_visual.modulate = Color.WHITE
			match fire_level:
				1:
					_visual.modulate = Color(1.0, 0.85, 0.55)
				2:
					_visual.modulate = Color(1.0, 0.62, 0.45)
				_:
					_visual.modulate = Color(1.0, 0.42, 0.4)
			if _label:
				_label.text = str(hp)
				_label.modulate = Color(1, 1, 1, 0.95)
		BrickType.RESCUE:
			if is_red:
				_visual.texture = TEX_RESCUE_RED
				if _label:
					_label.text = "红"
			else:
				_visual.texture = TEX_RESCUE
				if _label:
					_label.text = "救"
			_visual.modulate = Color.WHITE
			if _label:
				_label.modulate = Color(1, 1, 1, 1)
