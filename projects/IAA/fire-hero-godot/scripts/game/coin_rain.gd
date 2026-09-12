class_name CoinRain
extends Node2D
## 金币雨小游戏：蹦床接住「金币宝箱」后进入
##
## 规则：40% 黑幕盖场 + 天上疯狂掉金币 + 10 秒限时 + 蹦床接住即计分
## 期间主玩法冻结（球停在原地），玩家专注接金币，结束后发 finished 回主流程。
##
## 设计取舍：
## - 不新增 GameRoot.State，改用 _coin_rain_active 标志位。main_ui._on_state 里
##   playing = (s == State.PLAYING) 控制虚拟按键与技能键显隐，新增状态会让它们
##   在金币雨期间消失。
## - 暂停安全：_process 首行判断 _game.state != PLAYING 即整体冻结（含倒计时），
##   复用主状态机，无需额外暂停逻辑。

## 每接住一枚金币：score/coins 由 GameRoot 记账（保持分数唯一权威在 game_root）
signal coin_caught(score: int, coins: int)
## 10 秒结束：caught = 本次共接住多少枚
signal finished(caught: int)

# ===== 可调数值（手感集中在这里）=====

const DURATION: float = 10.0             ## 限时（秒）
const CURTAIN_ALPHA: float = 0.4         ## 黑幕不透明度（0.4 = 40% 黑）
const SPAWN_INTERVAL_MIN: float = 0.05   ## 金币生成间隔下限（秒）——「疯狂」体现在这里
const SPAWN_INTERVAL_MAX: float = 0.12   ## 金币生成间隔上限（秒）
const COIN_SCORE: int = 5                ## 每枚金币分数
const COIN_COIN: int = 1                 ## 每枚金币的金币数
const COIN_DISPLAY: float = 26.0         ## 金币显示边长（逻辑像素）
const VY_MIN: float = 240.0              ## 下落速度下限（px/s）
const VY_MAX: float = 430.0              ## 下落速度上限（px/s）
const VX_MAX: float = 40.0               ## 横向漂移上限（px/s）
const WALL_MARGIN: float = 8.0           ## 左右壁反弹边界
const FALL_Y: float = float(GameConstants.VIEW_H) + 20.0  ## 落出屏幕即回收
const SFX_CD: float = 0.08               ## 接币音效最小间隔（防止叠成机关枪）

## 接取判定盒（蹦床中心为原点）——与 item.gd 保持一致，玩家直觉一致
const CATCH_Y_MIN: float = -24.0
const CATCH_Y_MAX: float = 22.0
const CATCH_X_PAD: float = 6.0

## 金币图标复用已有 UI 素材（64×64 真实插画，不另造美术）
const COIN_TEX: Texture2D = preload("res://assets/pixel/ui/ui_icon_coin.png")
## 倒计时 Label 在 GameRoot 空间下，拿不到 HUD 的 Theme，需自带字体
## （Web 导出无系统中文字体，不设会显示成方框）
const UI_THEME: Theme = preload("res://assets/fonts/ui_theme.tres")


## 单枚金币：Sprite2D + 自己的速度
## 用内类而不是独立脚本，金币只是一次性小对象，不值得多一个文件
class Coin extends Sprite2D:
	var vx: float = 0.0
	var vy: float = 0.0


var _game: GameRoot = null
var _coins: Array[Coin] = []
var _elapsed: float = 0.0
var _spawn_timer: float = 0.0
var _sfx_timer: float = 0.0
var _caught: int = 0
var _finished: bool = false
var _label: Label = null


func setup(game: GameRoot) -> void:
	_game = game


func _ready() -> void:
	_build_curtain()
	_build_label()


## 40% 黑幕：盖住整个画布。
## CoinRain 是 GameRoot 运行期新增的最后一个子节点，因此这块黑幕天然画在
## 背景/砖块/蹦床/球之上；金币与倒计时作为它的后续子节点，再画在黑幕之上。
func _build_curtain() -> void:
	var curtain := ColorRect.new()
	curtain.name = "Curtain"
	curtain.color = Color(0.0, 0.0, 0.0, CURTAIN_ALPHA)
	curtain.size = Vector2(float(GameConstants.VIEW_W), float(GameConstants.VIEW_H))
	curtain.position = Vector2.ZERO
	curtain.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(curtain)


## 顶部倒计时 + 已接枚数
func _build_label() -> void:
	_label = Label.new()
	_label.name = "RainLabel"
	_label.theme = UI_THEME
	_label.position = Vector2(0.0, 24.0)
	_label.size = Vector2(float(GameConstants.VIEW_W), 32.0)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.add_theme_font_size_override("font_size", 22)
	_label.add_theme_color_override("font_color", Color(1.0, 0.92, 0.55))
	_label.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.85))
	_label.add_theme_constant_override("shadow_offset_x", 2)
	_label.add_theme_constant_override("shadow_offset_y", 2)
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label.z_index = 2  ## 压在金币之上，落币不遮字
	add_child(_label)
	_refresh_label()


func _process(delta: float) -> void:
	if _finished:
		return
	# 暂停/结算/回菜单：整体冻结（倒计时也停），无需额外暂停逻辑
	if _game == null or _game.state != GameRoot.State.PLAYING:
		return

	_elapsed += delta
	if _elapsed >= DURATION:
		_finish()
		return

	if _sfx_timer > 0.0:
		_sfx_timer = maxf(0.0, _sfx_timer - delta)

	_spawn_timer -= delta
	if _spawn_timer <= 0.0:
		_spawn_timer = randf_range(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX)
		_spawn_coin()

	_update_coins(delta)
	_refresh_label()


func _spawn_coin() -> void:
	var coin := Coin.new()
	coin.name = "Coin"
	coin.texture = COIN_TEX
	var s: float = COIN_DISPLAY / float(COIN_TEX.get_width())
	coin.scale = Vector2(s, s)
	coin.z_index = 1  ## 黑幕之上、倒计时之下
	coin.position = Vector2(
		randf_range(WALL_MARGIN, float(GameConstants.VIEW_W) - WALL_MARGIN),
		-COIN_DISPLAY
	)
	coin.vx = randf_range(-VX_MAX, VX_MAX)
	coin.vy = randf_range(VY_MIN, VY_MAX)
	add_child(coin)
	_coins.append(coin)


func _update_coins(delta: float) -> void:
	var paddle: Node2D = get_tree().get_first_node_in_group("paddle") as Node2D
	var half_w: float = _paddle_half_w(paddle)
	# 金币在 CoinRain 局部坐标，蹦床在 GameRoot 坐标；换到同一空间再比
	var paddle_pos: Vector2 = to_local(paddle.global_position) if paddle != null else Vector2.ZERO
	var limit_x: float = float(GameConstants.VIEW_W) - WALL_MARGIN

	var alive: Array[Coin] = []
	for coin: Coin in _coins:
		if not is_instance_valid(coin):
			continue

		coin.position.y += coin.vy * delta
		coin.position.x += coin.vx * delta
		if coin.position.x < WALL_MARGIN:
			coin.position.x = WALL_MARGIN
			coin.vx = absf(coin.vx)
		elif coin.position.x > limit_x:
			coin.position.x = limit_x
			coin.vx = -absf(coin.vx)

		if _is_caught(coin, paddle, paddle_pos, half_w):
			coin.queue_free()
			_caught += 1
			coin_caught.emit(COIN_SCORE, COIN_COIN)
			if _sfx_timer <= 0.0:
				_sfx_timer = SFX_CD
				Sfx.play("sfx_coin")
			continue

		if coin.position.y > FALL_Y:
			coin.queue_free()
			continue

		alive.append(coin)

	_coins = alive


## 蹦床半宽（吃长条加成；取不到时退回常量）
func _paddle_half_w(paddle: Node2D) -> float:
	if paddle != null:
		var bw: Variant = paddle.get("base_width")
		if typeof(bw) == TYPE_FLOAT or typeof(bw) == TYPE_INT:
			return float(bw) * 0.5
	return GameConstants.PADDLE_W * 0.5


## 接取判定：点盒相交，与 item.gd 同规则
func _is_caught(coin: Coin, paddle: Node2D, paddle_pos: Vector2, half_w: float) -> bool:
	if paddle == null:
		return false
	var dx: float = coin.position.x - paddle_pos.x
	var dy: float = coin.position.y - paddle_pos.y
	return absf(dx) <= half_w + CATCH_X_PAD and dy >= CATCH_Y_MIN and dy <= CATCH_Y_MAX


func _refresh_label() -> void:
	if _label == null:
		return
	var left: int = int(ceil(DURATION - _elapsed))
	_label.text = "金币雨 %d 秒 ｜ 已接 %d 枚" % [maxi(left, 0), _caught]


## 10 秒到：交回结果并自毁。
## 先 emit 再 queue_free —— GameRoot 的处理器只清引用与恢复球，不会 free 本节点，
## 避免在自身方法执行期间被立即 free。
func _finish() -> void:
	if _finished:
		return
	_finished = true
	finished.emit(_caught)
	queue_free()
