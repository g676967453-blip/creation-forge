class_name WindowBrick
extends StaticBody2D
## 窗户砖：燃烧窗 / 救援窗 / 红窗（使用像素纹理）

enum BrickType { FIRE, RESCUE }

signal destroyed(brick: Node)

const TEX_FIRE := preload("res://assets/props/windows/window_fire.png")
## 火 1/2/3 级独立贴图（LOVART 生成：小火/中火/大火，色相体量可辨）
const TEX_FIRE_LV1 := preload("res://assets/props/windows/window_fire_lv1.png")
const TEX_FIRE_LV2 := preload("res://assets/props/windows/window_fire_lv2.png")
const TEX_FIRE_LV3 := preload("res://assets/props/windows/window_fire_lv3.png")
const TEX_RESCUE := preload("res://assets/props/windows/window_rescue.png")
const TEX_RESCUE_RED := preload("res://assets/props/windows/window_rescue_red.png")

## 待救村民素材（窗内叠加，随机动物）
const VILLAGER_NAMES: Array[String] = [
	"vil_rabbit", "vil_chick", "vil_fox", "vil_pig", "vil_sheep", "vil_squirrel",
]
const VILL_DIR: String = "res://assets/pixel/villagers/"

var brick_type: BrickType = BrickType.FIRE
var fire_level: int = 1
var hp: int = 3
var req: int = 3
var is_red: bool = false
var villager_kind: int = -1  ## -1=无；0..5=动物序号（rescue 砖用）
var grid_col: int = 0
var grid_row: int = 0
var is_dead: bool = false  ## 已结算，防止 queue_free 前连撞

var _collision: CollisionShape2D
var _visual: Sprite2D
var _label: Label
var _villager: Sprite2D


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
	if brick_type == BrickType.RESCUE:
		# 随机一只待救村民（红窗用 call 帧由 _refresh 决定）
		villager_kind = randi_range(0, VILLAGER_NAMES.size() - 1)
	else:
		villager_kind = -1
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


## 1UP：现存所有火砖剩余需求减 1（不低于 1），对齐 HTML applyItem
func shave_hp() -> void:
	if brick_type != BrickType.FIRE or is_dead:
		return
	hp = maxi(1, hp - 1)
	_refresh()


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
			# 火 1/2/3 用各自的独立贴图（不再靠 modulate 调色）
			match fire_level:
				1:
					_visual.texture = TEX_FIRE_LV1
				2:
					_visual.texture = TEX_FIRE_LV2
				_:
					_visual.texture = TEX_FIRE_LV3
			_visual.modulate = Color.WHITE
			# 规则 §3.3：撞击后火焰变小 → 按剩余 hp 比例轻微缩小（1.0 → 0.82）
			var frac: float = clampf(float(hp) / maxf(1.0, float(req)), 0.0, 1.0)
			var sc: float = lerpf(0.82, 1.0, frac)
			_visual.scale = Vector2(sc, sc)
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
			_ensure_villager()


## 确保救援窗内叠有待救村民 Sprite（多样动物；红窗用呼救帧）
func _ensure_villager() -> void:
	_cache_nodes()
	if villager_kind < 0:
		_remove_villager()
		return
	var tex: Texture2D = _villager_texture(villager_kind, is_red)
	if tex == null:
		_remove_villager()
		return
	if _villager == null or not is_instance_valid(_villager):
		_villager = Sprite2D.new()
		_villager.name = "Villager"
		_villager.z_index = 1
		add_child(_villager)
	_villager.texture = tex
	# 显示在窗洞中央（村民脚贴窗台）：整体略放大，中心下沉
	_villager.scale = Vector2(0.5, 0.5)  # 64px→32px，接近窗洞宽度
	_villager.position = Vector2(0, 6)
	_villager.visible = true


func _remove_villager() -> void:
	if _villager != null and is_instance_valid(_villager):
		_villager.queue_free()
	_villager = null


func _villager_texture(kind: int, call: bool) -> Texture2D:
	if kind < 0 or kind >= VILLAGER_NAMES.size():
		return null
	var base: String = VILLAGER_NAMES[kind]
	var suffix: String = "_front_call.png" if call else "_front.png"
	var p: String = VILL_DIR + base + suffix
	if not ResourceLoader.exists(p):
		return null
	return load(p) as Texture2D
