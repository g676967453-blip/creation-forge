class_name SkillClone
extends Node2D
## 狐狸·影分身：一个分身节点
## 简易物理（对齐 HTML updateBall2 思路）：移动 + 顶/左右壁反弹 + 蹦床反弹
## + 与火砖 AABB 相交只灭火（不抓人 / 不捡道具 / 不扣命）
## GameRoot 统一遍历更新与销毁；超时/落屏自灭

const VIEW_W: float = 450.0
const VIEW_H: float = 800.0
const BRICK_HALF: float = 24.0   # 砖 48×48 半宽
const PADDLE_HALF_H: float = 9.0

var vel: Vector2 = Vector2(0, -1)
var radius: float = 8.0
var life_left: float = 6.0
var game: GameRoot = null
var _sprite: Sprite2D

## kind: "fire1" 等不重要；分身一律按当前 damage 规则灭火


static func make(tex: Texture2D, pos: Vector2, dir: Vector2, spd: float, game_ref: GameRoot) -> SkillClone:
	var c := SkillClone.new()
	c.game = game_ref
	c.position = pos
	c.vel = dir.normalized() * spd
	c._sprite = Sprite2D.new()
	c._sprite.texture = tex
	c._sprite.scale = Vector2(1, 1)
	c._sprite.modulate = Color(1.0, 0.85, 0.7, 0.75)  # 影分身半透明暖色
	c.add_child(c._sprite)
	return c


func update_clone(delta: float) -> bool:
	## 返回 false 表示该分身应移除
	life_left -= delta
	if life_left <= 0.0:
		return false

	position += vel * delta

	# 顶 / 左右壁
	if position.x < radius:
		position.x = radius
		vel.x = absf(vel.x)
	elif position.x > VIEW_W - radius:
		position.x = VIEW_W - radius
		vel.x = -absf(vel.x)
	if position.y < radius:
		position.y = radius
		vel.y = absf(vel.y)

	# 落屏自灭（不掉命）
	if position.y > VIEW_H + 40.0:
		return false

	# 蹦床反弹
	if vel.y > 0.0 and game != null and is_instance_valid(game):
		var paddle: Node2D = game.get_paddle_node()
		if paddle != null:
			var top: float = paddle.position.y - PADDLE_HALF_H
			if position.y + radius >= top and position.y + radius <= top + 6.0 \
					and absf(position.x - paddle.position.x) <= game.get_paddle_half_w() + 4.0:
				position.y = top - radius
				var rel: float = clampf((position.x - paddle.position.x) / maxf(1.0, game.get_paddle_half_w()), -1.0, 1.0)
				var ang: float = lerpf(deg_to_rad(-150.0), deg_to_rad(-30.0), (rel + 1.0) * 0.5)
				vel = Vector2(cos(ang), sin(ang)) * vel.length()
				return true

	# 与砖 AABB：分身只对火砖造成伤害，救援窗忽略（穿行不救人）
	var brick: Node = _find_hit_brick()
	if brick != null and is_instance_valid(brick) and game != null and is_instance_valid(game):
		var bt: int = brick.get("brick_type")
		if bt == WindowBrick.BrickType.FIRE and not bool(brick.get("is_dead")):
			game._on_clone_extinguish(brick, self)
	return true


func _find_hit_brick() -> Node:
	if game == null or not is_instance_valid(game):
		return null
	var host: Node2D = game.get_brick_host()
	if host == null:
		return null
	for b: Node in host.get_children():
		if b == null or not is_instance_valid(b):
			continue
		var n2: Node2D = b as Node2D
		if n2 == null:
			continue
		var dx: float = absf(n2.position.x - position.x)
		var dy: float = absf(n2.position.y - position.y)
		if dx < BRICK_HALF + radius and dy < BRICK_HALF + radius:
			return b
	return null
