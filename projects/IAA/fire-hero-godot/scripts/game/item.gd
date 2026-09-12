class_name GameItem
extends Node2D
## 掉落道具：钱袋 / 长条 / 锤子 / 灭火器 / 1UP / 火球 / 金币宝箱
## 灭掉火砖后按概率从砖位掉落 → 重力下落 + 左右壁反弹
## → 被蹦床接住（game_root 结算效果）或落出屏幕自动清理
## 数值对齐 HTML 原型 fire-hero-iaa.html（maybeDropItem / applyItem）

signal collected(item: GameItem)

enum Kind { BAG, WIDE, HAMMER, EXTINGUISH, UP, FIREBALL, CHEST }

## 贴图尺寸（像素）
const SIZE: int = 24

## 掉落权重：前 6 档与 HTML 一致；CHEST（金币宝箱）为本版新增的稀有奖励档，
## 从原来的「不掉落」余量里切出 0.05，其余档位比例不变。
## boost/life/heli/horn/keychain 尚未实现，抽中这些档位视为不掉落（P1 扩充分量再启用）
const PICK_BOUNDS: Array = [
	[Kind.BAG, 0.16],
	[Kind.WIDE, 0.14],
	[Kind.HAMMER, 0.16],
	[Kind.EXTINGUISH, 0.14],
	[Kind.UP, 0.12],
	[Kind.FIREBALL, 0.10],
	[Kind.CHEST, 0.05],
]

## 下落速度（px/s）：HTML 1.2 px/frame 起步，0.08 px/f² 加速，3.4 px/frame 封顶（≈60fps）
const VY0: float = 72.0
const VY_ACCEL: float = 288.0
const VY_MAX: float = 204.0
## 横向漂移（px/s）：HTML ±0.6 px/frame
const VX_MAX: float = 36.0
## 左右壁反弹边界与落出屏幕阈值
const WALL_MARGIN: float = 10.0
const FALL_Y: float = float(GameConstants.VIEW_H) + 16.0
## 接取判定盒（蹦床中心为原点）：HTML paddle.y-14 ~ paddle.y+30 / x ±(半宽+6)
const CATCH_Y_MIN: float = -24.0
const CATCH_Y_MAX: float = 22.0
const CATCH_X_PAD: float = 6.0

var kind: int = Kind.BAG
var vx: float = 0.0
var vy: float = VY0

var _game: GameRoot = null  ## game_root 引用：非 PLAYING 时冻结（暂停/结算）
var _sprite: Sprite2D


static func pick_kind() -> int:
	## 按权重抽一种道具（无实现档位返回 -1 = 不掉落）
	var r := randf()
	var acc: float = 0.0
	for row: Array in PICK_BOUNDS:
		acc += float(row[1])
		if r < acc:
			return int(row[0])
	return -1


func _ready() -> void:
	vx = randf_range(-VX_MAX, VX_MAX)
	_sprite = Sprite2D.new()
	_sprite.name = "Visual"
	_sprite.texture = _texture_for(kind)
	# 像素道具图 64px，显示为 32 逻辑像素（更大更易辨认），视觉略大于判定盒
	_sprite.scale = Vector2(32.0 / 64.0, 32.0 / 64.0)
	add_child(_sprite)


func setup(game: GameRoot, p_kind: int) -> void:
	_game = game
	kind = p_kind


func _physics_process(delta: float) -> void:
	if _game == null:
		return
	if _game.state != GameRoot.State.PLAYING:
		return

	vy = minf(vy + VY_ACCEL * delta, VY_MAX)
	position.y += vy * delta
	position.x += vx * delta

	if position.x < WALL_MARGIN:
		position.x = WALL_MARGIN
		vx = absf(vx)
	elif position.x > float(GameConstants.VIEW_W) - WALL_MARGIN:
		position.x = float(GameConstants.VIEW_W) - WALL_MARGIN
		vx = -absf(vx)

	if _check_caught():
		collected.emit(self)
		queue_free()
	elif position.y > FALL_Y:
		queue_free()


## 蹦床接取判定（点盒相交，对齐 HTML）
func _check_caught() -> bool:
	var paddle: Node2D = get_tree().get_first_node_in_group("paddle") as Node2D
	if paddle == null:
		return false
	var bw: Variant = paddle.get("base_width")
	var half_w: float = GameConstants.PADDLE_W * 0.5
	if typeof(bw) == TYPE_FLOAT or typeof(bw) == TYPE_INT:
		half_w = float(bw) * 0.5
	var dx: float = position.x - paddle.position.x
	var dy: float = position.y - paddle.position.y
	return absf(dx) <= half_w + CATCH_X_PAD and dy >= CATCH_Y_MIN and dy <= CATCH_Y_MAX


# ===== 运行时生成的占位贴图（美术定稿后换成 assets/props/items/ 纹理）=====

static var _tex_cache: Dictionary = {}

## 道具贴图目录（美术定稿图标；缺文件时回退程序绘制）
const ITEM_TEX_DIR: String = "res://assets/props/items/"


func _kind_file(kind_key: int) -> String:
	match kind_key:
		Kind.BAG:
			return "item_bag.png"
		Kind.WIDE:
			return "item_wide.png"
		Kind.HAMMER:
			return "item_hammer.png"
		Kind.EXTINGUISH:
			return "item_extinguish.png"
		Kind.UP:
			return "item_up.png"
		Kind.FIREBALL:
			return "item_fireball.png"
		Kind.CHEST:
			return "item_chest.png"
	return ""


func _texture_for(kind_key: int) -> Texture2D:
	if _tex_cache.has(kind_key):
		return _tex_cache[kind_key]
	var path := ITEM_TEX_DIR + _kind_file(kind_key)
	var loaded: Texture2D = null
	if ResourceLoader.exists(path):
		loaded = load(path) as Texture2D
	if loaded == null:
		loaded = _paint(kind_key)
	_tex_cache[kind_key] = loaded
	return loaded


func _paint(kind_key: int) -> ImageTexture:
	var img := Image.create(SIZE, SIZE, false, Image.FORMAT_RGBA8)
	match kind_key:
		Kind.BAG:
			# 钱袋：暗金外圈 + 亮金圆币
			_fill_circle(img, 12, 12, 11, Color(0.71, 0.56, 0.10))
			_fill_circle(img, 12, 12, 8, Color(1.0, 0.82, 0.29))
			_fill_circle(img, 12, 12, 3, Color(1.0, 0.93, 0.6))
		Kind.WIDE:
			# 长条：两端外指的加宽箭头
			_fill_rect(img, 5, 10, 14, 4, Color(0.49, 0.94, 0.63))
			_fill_triangle_left(img, 8, 10, 13, Color(0.49, 0.94, 0.63))
			_fill_triangle_right(img, 16, 10, 13, Color(0.49, 0.94, 0.63))
			_fill_rect(img, 10, 12, 4, 1, Color(0.1, 0.25, 0.14))
		Kind.HAMMER:
			# 锤子（负向）：橙色锤头 + 棕柄，竖向
			_fill_rect(img, 6, 4, 12, 6, Color(0.98, 0.55, 0.26))
			_fill_rect(img, 8, 6, 2, 2, Color(0.8, 0.4, 0.18))
			_fill_rect(img, 10, 9, 4, 12, Color(0.52, 0.36, 0.18))
		Kind.EXTINGUISH:
			# 灭火器：蓝瓶身 + 深蓝喷口短管
			_fill_rect(img, 9, 4, 6, 4, Color(0.42, 0.72, 0.9))
			_fill_rect(img, 7, 8, 10, 14, Color(0.56, 0.85, 1.0))
			_fill_rect(img, 10, 10, 4, 8, Color(0.85, 0.95, 1.0))
		Kind.UP:
			# 1UP：橙色上箭头（灭火等级）
			_fill_triangle_up(img, 12, 4, 7, 11, Color(1.0, 0.6, 0.24))
			_fill_rect(img, 9, 9, 6, 9, Color(1.0, 0.6, 0.24))
		Kind.FIREBALL:
			# 火球（负向）：红焰球 + 右上亮黄火花
			_fill_circle(img, 12, 12, 10, Color(0.95, 0.28, 0.2))
			_fill_circle(img, 12, 13, 7, Color(1.0, 0.45, 0.2))
			_fill_circle(img, 16, 7, 3, Color(1.0, 0.85, 0.35))
		Kind.CHEST:
			# 金币宝箱：木箱身 + 金箍 + 锁扣
			# 目前是程序绘制占位（换 assets/props/items/item_chest.png 即自动生效）
			_fill_rect(img, 2, 5, 20, 6, Color(0.45, 0.29, 0.14))    # 箱盖
			_fill_rect(img, 3, 11, 18, 10, Color(0.55, 0.36, 0.18))  # 箱身
			_fill_rect(img, 2, 9, 20, 2, Color(0.95, 0.78, 0.28))    # 盖身之间金边
			_fill_rect(img, 3, 5, 3, 16, Color(0.95, 0.78, 0.28))    # 左金箍
			_fill_rect(img, 18, 5, 3, 16, Color(0.95, 0.78, 0.28))   # 右金箍
			_fill_rect(img, 10, 9, 4, 8, Color(1.0, 0.86, 0.38))     # 锁扣
			_fill_rect(img, 11, 12, 2, 3, Color(0.30, 0.19, 0.09))   # 锁孔
		_:
			_fill_rect(img, 6, 6, 12, 12, Color.WHITE)
	return ImageTexture.create_from_image(img)


func _fill_rect(img: Image, x: int, y: int, w: int, h: int, c: Color) -> void:
	for py in range(maxi(0, y), mini(SIZE, y + h)):
		for px in range(maxi(0, x), mini(SIZE, x + w)):
			img.set_pixel(px, py, c)


func _fill_circle(img: Image, cx: int, cy: int, radius: int, c: Color) -> void:
	var r2 := float(radius) * radius
	for py in range(maxi(0, cy - radius), mini(SIZE, cy + radius + 1)):
		for px in range(maxi(0, cx - radius), mini(SIZE, cx + radius + 1)):
			var dx := float(px - cx)
			var dy := float(py - cy)
			if dx * dx + dy * dy <= r2:
				img.set_pixel(px, py, c)


## 顶点在左、底边在右的实心三角（向左箭头）
func _fill_triangle_left(img: Image, tip_x: int, base_y: int, half_h: int, c: Color) -> void:
	for row in range(-half_h, half_h + 1):
		var dist := absi(row)
		var width: int = 1 + 2 * (half_h - dist)
		var x0: int = tip_x - (half_h - dist)
		_fill_rect(img, x0, base_y + row, width, 1, c)


## 顶点在右、底边在左的实心三角（向右箭头）
func _fill_triangle_right(img: Image, tip_x: int, base_y: int, half_h: int, c: Color) -> void:
	for row in range(-half_h, half_h + 1):
		var dist := absi(row)
		var width: int = 1 + 2 * (half_h - dist)
		var x0: int = tip_x - width + 1
		_fill_rect(img, x0, base_y + row, width, 1, c)


## 顶点在上的实心三角（向上箭头头）
func _fill_triangle_up(img: Image, cx: int, top_y: int, half_w: int, height: int, c: Color) -> void:
	for row in range(0, height):
		var half: int = int(floor(float(half_w) * (1.0 - float(row) / float(height))))
		_fill_rect(img, cx - half, top_y + row, half * 2 + 1, 1, c)
