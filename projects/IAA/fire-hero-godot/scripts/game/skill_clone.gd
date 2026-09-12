class_name SkillClone
extends Node2D
## 狐狸·影分身：一个分身节点
## 与主体弹射物一致的无重力直线运动 + 顶/左右壁反弹 + 蹦床反弹
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

	# 无重力直线运动（与主体弹射物一致）
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

	# 蹦床反弹（与主体同款：按落点偏移角反弹）
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
		var bt: int = int(brick.get("brick_type"))
		if bt == WindowBrick.BrickType.FIRE and not bool(brick.get("is_dead")):
			# 命中后向砖侧回弹一点，避免持续贴脸每帧触发
			_bounce_off_brick(brick)
			game._on_clone_extinguish(brick, self)
	return true


func _bounce_off_brick(brick: Node) -> void:
	## 命中火砖：向砖外侧轻微反弹，防止分身卡砖内重复触发
	var n2: Node2D = brick as Node2D
	if n2 == null:
		return
	var nx: float = position.x - n2.position.x
	var ny: float = position.y - n2.position.y
	if absf(nx) > absf(ny):
		position.x += (12.0 if nx >= 0.0 else -12.0)
		vel.x = absf(vel.x) if nx >= 0.0 else -absf(vel.x)
	else:
		position.y += (12.0 if ny >= 0.0 else -12.0)
		vel.y = absf(vel.y) if ny >= 0.0 else -absf(vel.y)


func _find_hit_brick() -> Node:
	if game == null or not is_instance_valid(game):
		return null
	var host: Node2D = game.get_brick_host()
	if host == null:
		return null
	for b: Node in host.get_children():
		if b == null or not is_instance_valid(b):
			continue
		# 必须只认真正的砖。brick_host 下还挂着装饰窗（DecorWindow，也是 Sprite2D/Node2D）与
		# 跳字等非砖节点；此前只按「是不是 Node2D」筛，会把装饰窗当砖返回，
		# 随后 update_clone 里 `brick.get("brick_type")` 得到 null，赋给 int 触发
		# 「Trying to assign value of type 'Nil' to a variable of type 'int'」。
		var wb := b as WindowBrick
		if wb == null:
			continue
		var dx: float = absf(wb.position.x - position.x)
		var dy: float = absf(wb.position.y - position.y)
		if dx < BRICK_HALF + radius and dy < BRICK_HALF + radius:
			return wb
	return null
