extends CharacterBody2D
## 底部蹦床：消防员1 + 蹦床 + 消防员2 三个像素元素组成
## 左右消防员为 2 帧序列动画（底边对齐），踩床为静态
## 支持宽度拉伸（道具）、消防员跟随两端、弹跳动画（发射/接球）

const TEX_MAT := preload("res://assets/props/trampoline/mat.png")

const LF0 := preload("res://assets/props/trampoline/frames/fireman_left_00.png")
const LF1 := preload("res://assets/props/trampoline/frames/fireman_left_01.png")
const RF0 := preload("res://assets/props/trampoline/frames/fireman_right_00.png")
const RF1 := preload("res://assets/props/trampoline/frames/fireman_right_01.png")

const FIREMAN_FPS: float = 5.0

## ✅ 方向已修正：棕消防员在左、紫消防员在右、踩床居中
## 位置 = 你在 Godot 引擎里调好的值（main.tscn）
const MAT_POS := Vector2(0, 9)                 # 踩床位置 (Mat)
const MAT_TEX_W: float = 74.0                  # mat.png 源图宽
const FIREMAN_EDGE_GAP: float = 6.0            # 消防员距床面边缘的横向间距（92 宽时 =40）
## 消防员缩放（保持 1:1 像素，不缩放）
const FIREMAN_SCALE := Vector2(1, 1)

@export var move_speed: float = 420.0
@export var base_width: float = 92.0
## 基础移动速度（皮肤/道具叠加用，随关卡不再变化）
var base_move_speed: float = 420.0
## 蹦床宽度范围：基准 92；长条永久加长到顶屏边（450），螺丝永久缩短下限 40
const PADDLE_MIN_W: float = 40.0
const PADDLE_MAX_W: float = float(GameConstants.VIEW_W)

var _half_w: float = 46.0
var _virtual_dir: float = 0.0   ## 触屏虚拟按钮方向（-1 左 / 1 右）
var _suppress_drag: bool = false ## 虚拟按钮按下时禁鼠标拖动（避免两者冲突）
var on_fire: bool = false
var control_enabled: bool = true
var _bounce_tween: Tween
var _mat_base_modulate: Color = Color.WHITE
var _mod_captured: bool = false

@onready var _collision: CollisionShape2D = $CollisionShape2D
@onready var _visual: Node2D = $Visual
@onready var _mat: Sprite2D = $Visual/Mat
@onready var _fireman_left: AnimatedSprite2D = $Visual/FiremanLeft
@onready var _fireman_right: AnimatedSprite2D = $Visual/FiremanRight


func _make_frames(f0: Texture2D, f1: Texture2D) -> SpriteFrames:
	var sf := SpriteFrames.new()
	sf.add_animation("run")
	sf.set_animation_speed("run", FIREMAN_FPS)
	sf.set_animation_loop("run", true)
	sf.add_frame("run", f0)
	sf.add_frame("run", f1)
	return sf


func _ready() -> void:
	base_width = GameConstants.PADDLE_W
	base_move_speed = move_speed
	position = Vector2(float(GameConstants.VIEW_W) * 0.5, GameConstants.PADDLE_Y)
	_setup_textures()
	_apply_width(base_width)


## 按角色能力重设移动速度：小猫敏捷 +25%
func apply_skin_speed() -> void:
	base_move_speed = GameConstants.PADDLE_SPEED_BASE
	if CharacterDB.cur_is("cat"):
		base_move_speed *= 1.25
	move_speed = base_move_speed


func _setup_textures() -> void:
	if _mat:
		_mat.texture = TEX_MAT
	if _fireman_left:
		_fireman_left.sprite_frames = _make_frames(LF0, LF1)
	if _fireman_right:
		_fireman_right.sprite_frames = _make_frames(RF0, RF1)


func set_control_enabled(enabled: bool) -> void:
	control_enabled = enabled
	if not enabled:
		_virtual_dir = 0.0


## 触屏左右虚拟按钮设置的移动方向（-1 左 / 0 无 / 1 右）
func set_virtual_dir(d: float) -> void:
	_virtual_dir = clampf(d, -1.0, 1.0)
	_suppress_drag = _virtual_dir != 0.0


func _physics_process(delta: float) -> void:
	if not control_enabled:
		position.y = GameConstants.PADDLE_Y
		return

	var dir: float = 0.0
	if Input.is_action_pressed("move_left"):
		dir -= 1.0
	if Input.is_action_pressed("move_right"):
		dir += 1.0

	if (not _suppress_drag) and Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		var mp: Vector2 = get_viewport().get_mouse_position()
		var target_x: float = clampf(mp.x, _half_w, float(GameConstants.VIEW_W) - _half_w)
		position.x = move_toward(position.x, target_x, move_speed * 1.8 * delta)
	elif dir != 0.0:
		position.x = clampf(
			position.x + dir * move_speed * delta,
			_half_w,
			float(GameConstants.VIEW_W) - _half_w
		)
	elif _virtual_dir != 0.0:
		position.x = clampf(
			position.x + _virtual_dir * move_speed * delta,
			_half_w,
			float(GameConstants.VIEW_W) - _half_w
		)

	position.y = GameConstants.PADDLE_Y


func _apply_width(w: float) -> void:
	w = clampf(w, PADDLE_MIN_W, PADDLE_MAX_W)
	base_width = w
	_half_w = w * 0.5
	if _collision == null:
		_collision = get_node_or_null("CollisionShape2D") as CollisionShape2D
	if _collision and _collision.shape is RectangleShape2D:
		(_collision.shape as RectangleShape2D).size = Vector2(w, GameConstants.PADDLE_H)
	_relayout()


func _relayout() -> void:
	# 床面视觉宽度 = 当前碰撞宽（长条拉长 / 锤子收窄时床面可见变化）
	var w: float = maxf(40.0, base_width)
	if _mat:
		_mat.scale = Vector2(w / MAT_TEX_W, 1.0)
		_mat.position = MAT_POS
	# 左右消防员贴床面两端（基准 92 宽 → ±40）
	var edge: float = w * 0.5 - FIREMAN_EDGE_GAP
	if _fireman_left:
		_fireman_left.scale = FIREMAN_SCALE
		_fireman_left.position = Vector2(-edge, -2.0)
		if not _fireman_left.is_playing():
			_fireman_left.play("run")
	if _fireman_right:
		_fireman_right.scale = FIREMAN_SCALE
		_fireman_right.position = Vector2(edge, 0.0)
		if not _fireman_right.is_playing():
			_fireman_right.play("run")


func set_width_factor(factor: float) -> void:
	_apply_width(GameConstants.PADDLE_W * factor)


## 长条 / 螺丝：永久增减蹦床长度（无时限），clamp 到 [40, 顶屏边 450]
func adjust_width_permanent(delta: float) -> void:
	_apply_width(base_width + delta)


## 旧接口保留（内部调用方若传绝对值会按 clamp 处理；现改为永久语义）
func set_effect_width(width: float) -> void:
	_apply_width(width)


func reset_width() -> void:
	_apply_width(GameConstants.PADDLE_W)


## 弹跳动画：发射 / 接球时向下压缩再回弹
func play_bounce() -> void:
	if _bounce_tween and _bounce_tween.is_valid():
		_bounce_tween.kill()
	if _visual == null:
		return
	_visual.position.y = 0.0
	_bounce_tween = create_tween()
	_bounce_tween.tween_property(_visual, "position:y", 6.0, 0.06) \
		.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	_bounce_tween.tween_property(_visual, "position:y", 0.0, 0.14) \
		.set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)


func set_on_fire(val: bool) -> void:
	on_fire = val
	if _mat == null:
		return
	if not _mod_captured:
		_mat_base_modulate = _mat.modulate
		_mod_captured = true
	# 着火：踩床偏红橙；灭火器扑灭后还原初始色调
	_mat.modulate = Color(1.0, 0.55, 0.45) if on_fire else _mat_base_modulate


func get_top_y() -> float:
	return position.y - GameConstants.PADDLE_H * 0.5
