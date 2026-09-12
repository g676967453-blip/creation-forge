class_name VillagerFall
extends Node2D
## 红窗跳楼村民（规则 §3.4）：周期性从红窗跳下，重力下落
## - 被蹦床接住 → 加分（红窗救人分）+ 获救表现
## - 未被接住 → 落出屏幕消失（不影响过关、不扣命）
## 由 GameRoot 统一遍历更新与销毁

const VIEW_W: float = 450.0
const VIEW_H: float = 800.0
const GRAVITY: float = 260.0
const VY_MAX: float = 300.0
const CATCH_Y_MIN: float = -26.0
const CATCH_Y_MAX: float = 24.0
const CATCH_X_PAD: float = 6.0

var vy: float = 0.0
var vx: float = 0.0
var from_red: bool = true
var game: GameRoot = null
var _sprite: Sprite2D


static func make(tex: Texture2D, pos: Vector2, game_ref: GameRoot, red: bool = true) -> VillagerFall:
	var f := VillagerFall.new()
	f.game = game_ref
	f.position = pos
	f.from_red = red
	f.vy = 40.0
	f.vx = randf_range(-18.0, 18.0)
	f._sprite = Sprite2D.new()
	f._sprite.texture = tex
	f._sprite.scale = Vector2(0.5, 0.5)  # 64px → 32px
	f.add_child(f._sprite)
	return f


## 返回 false 表示应移除
func update_fall(delta: float) -> bool:
	vy = minf(vy + GRAVITY * delta, VY_MAX)
	position.y += vy * delta
	position.x += vx * delta
	if position.x < 8.0:
		position.x = 8.0
		vx = absf(vx)
	elif position.x > VIEW_W - 8.0:
		position.x = VIEW_W - 8.0
		vx = -absf(vx)

	# 被蹦床接住
	if vy > 0.0 and game != null and is_instance_valid(game):
		if game.try_catch_faller(self):
			return false

	# 落出屏幕 → 未获救，直接消失（不影响过关）
	if position.y > VIEW_H + 40.0:
		return false
	return true
