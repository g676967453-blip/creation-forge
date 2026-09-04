extends CharacterBody2D
## 弹射物（消防员角色 / 水球抽象）
## 视觉用 AnimatedSprite2D：小猫=2帧序列动画，其它角色=单帧
## 都按 GameState.skin_index 切换

signal fell_off
signal bounced_paddle
signal hit_brick(brick: Node)

const SPEED_MIN: float = 260.0
const SPEED_MAX: float = 520.0

const TEX_DOG := preload("res://assets/props/ball/char_dog.png")
const TEX_PANDA := preload("res://assets/props/ball/char_panda.png")
const TEX_CAPY := preload("res://assets/props/ball/char_capybara.png")
const TEX_NARUTO := preload("res://assets/props/ball/char_naruto.png")

## 猫帧动画（底边对齐后的帧，脚底同一水平线）
const CAT_F0 := preload("res://assets/props/ball/frames/cat_anim_00.png")
const CAT_F1 := preload("res://assets/props/ball/frames/cat_anim_01.png")

## 按 game_state.skin_index 的角色纹理（猫用 SpriteFrames 动画，其它单张）
const CHAR_TEX: Array = [TEX_DOG, TEX_PANDA, TEX_CAPY, TEX_NARUTO]  # 索引1..4
const CAT_ANIM_FPS: float = 6.0

## 角色使用原始大小（原图约 38~41 宽），不缩放
const CHAR_SCALE: float = 1.0

var radius: float = 10.0
var active: bool = false
var stuck_to_paddle: bool = true
var carry_person: bool = false
var speed: float = 320.0

var _fell_lock: bool = false
var _hit_cooldown: float = 0.0
var _saved_velocity: Vector2 = Vector2.ZERO  ## 暂停恢复用

@onready var _collision: CollisionShape2D = $CollisionShape2D
@onready var _visual: AnimatedSprite2D = $Visual

## 拖尾粒子：引用场景里的静态节点（Ball/Trail），编辑器里可手动调
@onready var _trail_particles: CPUParticles2D = $Trail


func _ready() -> void:
	radius = GameConstants.BALL_R
	speed = GameConstants.BALL_SPEED_BASE
	if _collision and _collision.shape is CircleShape2D:
		(_collision.shape as CircleShape2D).radius = radius
	_build_frames()
	refresh_visual()


## 更新拖尾：运动时发射、吸附/静止停发
## 残影留在发射点(初速0)，靠球移开形成轨迹 → 方向自然、不横跳
func _update_trail() -> void:
	if _trail_particles == null:
		return
	var moving := active and velocity.length() > 1.0
	_trail_particles.emitting = moving
	# 初速归零：残影原地保留，拖尾方向由球的运动自然带出
	_trail_particles.initial_velocity_min = 0.0
	_trail_particles.initial_velocity_max = 0.0
	_trail_particles.direction = Vector2.ZERO


## 为每个角色构建 SpriteFrames（猫=2帧循环，其它=单帧）
func _build_frames() -> void:
	if _visual == null:
		return
	var cat_anim := SpriteFrames.new()
	cat_anim.add_animation("run")
	cat_anim.set_animation_speed("run", CAT_ANIM_FPS)
	cat_anim.set_animation_loop("run", true)
	cat_anim.add_frame("run", CAT_F0)
	cat_anim.add_frame("run", CAT_F1)


func _char_frames() -> SpriteFrames:
	var idx: int = GameState.skin_index
	if idx == 0:
		return _build_cat_frames()
	# 其它角色：单帧动画
	var rest: int = clampi(idx - 1, 0, CHAR_TEX.size() - 1)
	var tex := CHAR_TEX[rest] as Texture2D
	var sf := SpriteFrames.new()
	sf.add_animation("run")
	sf.set_animation_speed("run", 1.0)
	sf.set_animation_loop("run", true)
	sf.add_frame("run", tex)
	return sf


func _build_cat_frames() -> SpriteFrames:
	var sf := SpriteFrames.new()
	sf.add_animation("run")
	sf.set_animation_speed("run", CAT_ANIM_FPS)
	sf.set_animation_loop("run", true)
	sf.add_frame("run", CAT_F0)
	sf.add_frame("run", CAT_F1)
	return sf


func reset_on_paddle(paddle_node: Node2D) -> void:
	active = false
	stuck_to_paddle = true
	carry_person = false
	_fell_lock = false
	_hit_cooldown = 0.0
	_saved_velocity = Vector2.ZERO
	velocity = Vector2.ZERO
	if paddle_node:
		position = paddle_node.position + Vector2(
			0.0,
			-GameConstants.PADDLE_H * 0.5 - radius - 2.0
		)
	refresh_visual()


func freeze_motion() -> void:
	if active and not stuck_to_paddle:
		_saved_velocity = velocity
	active = false
	velocity = Vector2.ZERO


func unfreeze_motion() -> void:
	if stuck_to_paddle:
		active = false
		velocity = Vector2.ZERO
		_saved_velocity = Vector2.ZERO
		return
	active = true
	if _saved_velocity.length() >= SPEED_MIN * 0.4:
		velocity = _saved_velocity.normalized() * clampf(_saved_velocity.length(), SPEED_MIN, SPEED_MAX)
	elif velocity.length() >= SPEED_MIN * 0.4:
		pass
	else:
		velocity = Vector2(0.0, -1.0) * speed
	_saved_velocity = Vector2.ZERO


func launch(dir: Vector2 = Vector2(0.25, -1.0)) -> void:
	if not stuck_to_paddle and active:
		return
	stuck_to_paddle = false
	active = true
	_fell_lock = false
	_hit_cooldown = 0.0
	_saved_velocity = Vector2.ZERO
	var d: Vector2 = dir.normalized()
	if d.length() < 0.01:
		d = Vector2(0.0, -1.0)
	if absf(d.y) < 0.35:
		d = Vector2(d.x, -1.0).normalized()
	if d.y > -0.2:
		d.y = -absf(d.y) - 0.35
		d = d.normalized()
	velocity = d * speed
	refresh_visual()


func _physics_process(delta: float) -> void:
	if _hit_cooldown > 0.0:
		_hit_cooldown = maxf(0.0, _hit_cooldown - delta)

	# 每帧更新拖尾方向（吸附板上时自动关闭）
	_update_trail()

	if stuck_to_paddle:
		return
	if not active:
		return

	var collide: KinematicCollision2D = move_and_collide(velocity * delta)
	if collide:
		_handle_collision(collide)
		position += collide.get_normal() * 0.75

	if position.x < radius:
		position.x = radius
		velocity.x = absf(velocity.x)
	elif position.x > float(GameConstants.VIEW_W) - radius:
		position.x = float(GameConstants.VIEW_W) - radius
		velocity.x = -absf(velocity.x)

	if position.y < radius:
		position.y = radius
		velocity.y = absf(velocity.y)

	if position.y > float(GameConstants.VIEW_H) + 40.0:
		if not _fell_lock:
			_fell_lock = true
			active = false
			velocity = Vector2.ZERO
			_saved_velocity = Vector2.ZERO
			fell_off.emit()

	_update_trail()


func _handle_collision(collide: KinematicCollision2D) -> void:
	var n: Vector2 = collide.get_normal()
	var collider_obj: Object = collide.get_collider()
	velocity = velocity.bounce(n)
	if absf(velocity.y) < 80.0:
		velocity.y = -80.0 if velocity.y <= 0.0 else 80.0
	var sp: float = clampf(velocity.length(), SPEED_MIN, SPEED_MAX)
	if velocity.length() > 0.001:
		velocity = velocity.normalized() * sp
	else:
		velocity = Vector2(0.0, -1.0) * speed

	if collider_obj == null:
		return

	if collider_obj is Node and (collider_obj as Node).is_in_group("paddle"):
		var paddle_node: Node2D = collider_obj as Node2D
		if paddle_node == null:
			return
		var half_w: float = GameConstants.PADDLE_W * 0.5
		var bw: Variant = paddle_node.get("base_width")
		if typeof(bw) == TYPE_FLOAT or typeof(bw) == TYPE_INT:
			half_w = float(bw) * 0.5
		var offset: float = (position.x - paddle_node.position.x) / maxf(1.0, half_w)
		offset = clampf(offset, -1.0, 1.0)
		var angle: float = lerpf(deg_to_rad(-150.0), deg_to_rad(-30.0), (offset + 1.0) * 0.5)
		velocity = Vector2(cos(angle), sin(angle)) * speed
		position.y = minf(
			position.y,
			paddle_node.position.y - GameConstants.PADDLE_H * 0.5 - radius - 1.0
		)
		bounced_paddle.emit()
		return

	if collider_obj is Node and (collider_obj as Node).is_in_group("brick"):
		if _hit_cooldown > 0.0:
			return
		_hit_cooldown = 0.06
		hit_brick.emit(collider_obj as Node)


func refresh_visual() -> void:
	if not _visual:
		_visual = get_node_or_null("Visual") as AnimatedSprite2D
	if not _visual:
		return
	_visual.sprite_frames = _char_frames()
	_visual.scale = Vector2(CHAR_SCALE, CHAR_SCALE)
	# 拖尾粒子用当前角色帧贴图（取第一帧）
	if _trail_particles:
		var sf := _visual.sprite_frames
		if sf and sf.has_animation("run") and sf.get_frame_count("run") > 0:
			_trail_particles.texture = sf.get_frame_texture("run", 0)
	# 带人时整体偏暖黄，提示正在救援
	_visual.modulate = Color(1.0, 0.9, 0.62) if carry_person else Color.WHITE
	if not _visual.is_playing():
		_visual.play("run")
