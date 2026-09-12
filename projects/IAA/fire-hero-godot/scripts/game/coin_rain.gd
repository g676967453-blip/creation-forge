class_name CoinRain
extends Node2D
## 金币雨小游戏：蹦床接住「金币宝箱」后进入
##
## 三段式流程：
##   1. RAIN   40% 黑幕 + 金币疯狂坠落（有大有小）+ 蹦床接住 → 金币回弹 + 跳字
##   2. SETTLE 10 秒到 → 大金币浮在前面，后面数值快速滚动 → 定格动画
##   3. 结束   统一结算发奖（金币/分数一次性到账）→ 回主流程
##
## 设计取舍：
## - 不新增 GameRoot.State，改用 _coin_rain_active 标志位。main_ui._on_state 里
##   playing = (s == State.PLAYING) 控制虚拟按键与技能键显隐，新增状态会让它们
##   在金币雨期间消失。
## - 暂停安全：_process 首行判断 _game.state != PLAYING 即整体冻结（含倒计时与结算演出），
##   复用主状态机，无需额外暂停逻辑。
## - 分数/金币只在结束时统一入账（GameRoot 负责记账），rain 期间 HUD 不动，
##   避免「逐个到账」把结算演出的意义冲掉。

## 结算完成：caught=接住枚数，coins/score=本次应入账总量（由 GameRoot 记账）
signal finished(caught: int, coins: int, score: int)

enum Phase { RAIN, SETTLE }

# ===== 可调数值（手感集中在这里）=====

const DURATION: float = 10.0             ## 限时（秒）
const CURTAIN_ALPHA: float = 0.4         ## 黑幕不透明度（0.4 = 40% 黑）
const SPAWN_INTERVAL_MIN: float = 0.05   ## 金币生成间隔下限（秒）——「疯狂」体现在这里
const SPAWN_INTERVAL_MAX: float = 0.12   ## 金币生成间隔上限（秒）
const COIN_SCORE: int = 5                ## 金币 → 分数的换算系数
const COIN_DISPLAY: float = 26.0         ## 金币基准显示边长（逻辑像素）
const COIN_SCALE_MIN: float = 0.72       ## 金币大小随机下限（有大有小）
const COIN_SCALE_MAX: float = 1.35       ## 金币大小随机上限
const VY_MIN: float = 340.0              ## 下落速度下限（px/s）—— 调大 = 掉得更急
const VY_MAX: float = 620.0              ## 下落速度上限（px/s）
const VX_MAX: float = 40.0               ## 横向漂移上限（px/s）
const WALL_MARGIN: float = 8.0           ## 左右壁反弹边界
const FALL_Y: float = float(GameConstants.VIEW_H) + 20.0  ## 落出屏幕即回收
const SFX_CD: float = 0.08               ## 接币音效最小间隔（防止叠成机关枪）

## 接住后的回弹弧线（只是动画，不再参与接取判定）
const CATCH_BOUNCE_VY: float = -320.0    ## 接住瞬间的向上初速
const CATCH_GRAVITY: float = 1150.0      ## 回弹弧线重力
const CATCH_FADE: float = 0.42           ## 回弹+淡出总时长（秒）

## 接住时弹的数值 = **这一枚真实入账的金币数**，按连击递增。
##
## 早先这里是「纯动画表现」：飘字按 +1/+2/+4/+8/+16 递增，但每枚实际只记 1 金币。
## 结果玩家把飘字加起来和结算数字对不上（反馈即为「和我接到的数值对不上」）。
## 现在飘字就是真实入账，结算总量 = 所有飘字之和，两者永远一致。
## 想改手感/产出曲线，只动这一个数组即可。
const POP_SERIES: Array[int] = [1, 2, 4]
const POP_COLOR: Color = Color(1.0, 0.9, 0.45)
const POP_FONT_SIZE: int = 20

## 结算演出
const SETTLE_ROLL: float = 1.8           ## 数值快速滚动时长（秒）——太短会看不清
const SETTLE_HOLD: float = 1.4           ## 定格后停留时长（秒）
const BIG_COIN_SIZE: float = 132.0       ## 结算大金币边长
const SETTLE_NUM_SIZE: int = 92          ## 结算数字字号
const SETTLE_CAPTION: String = "金币雨结算"

## 结算版面：纵向三段式（标题 / 金币 / 数字），金币与数字之间**完全留空不重叠**。
##
## 第一版把数字与金币都放在画布中心，132px 金币把数字字形整个盖住
## （字形 y 213~267 全在金币 y 149~281 内），玩家只看到金币。
## 第二版改成「压住字形顶部 19px」，用户反馈仍有重叠。
## 现在改成彻底分开：金币与数字之间留 35px 空隙，仍保持前后层次
## （金币 z_index 更高），但不再互相遮挡。
##
## 注意：金币不能只往上挪 —— 上方 32px 处就是标题。要让「不重叠 + 整体居中」
## 同时成立，必须标题上移、金币上移、数字下移三者一起动。
## 当前排布：标题 240~268 / 金币 296~428 / 字形 463~529，间隙 28 与 35，整块中心 ≈384。
const SETTLE_CAPTION_Y: float = 240.0    ## 标题 Label 顶边 y
const SETTLE_COIN_CY: float = 362.0      ## 大金币中心 y
const SETTLE_NUM_CY: float = 496.0       ## 数字中心 y
const SETTLE_NUM_H: float = 130.0        ## 数字 Label 高度（用于垂直居中）

## 接取判定盒（蹦床中心为原点）——与 item.gd 保持一致，玩家直觉一致
const CATCH_Y_MIN: float = -24.0
const CATCH_Y_MAX: float = 22.0
const CATCH_X_PAD: float = 6.0

## 下落拖尾粒子
## 思路与 Ball/Trail 一致：粒子初速归零、且 local_coords = false（不跟随父节点），
## 于是残影留在发射点，金币移开自然拉出一条轨迹。
## 与球不同的是这里**显式给了贴图** —— 球那条没设 texture，无贴图粒子只画亚像素白点，
## 是否可见取决于引擎默认行为；拖尾不能赌这个。
const TRAIL_AMOUNT: int = 10          ## 同时存在的残影数
const TRAIL_LIFETIME: float = 0.30    ## 单个残影存活时长（秒）
const TRAIL_TEX_SIZE: int = 16        ## 程序生成的柔光点贴图边长
const TRAIL_SCALE_MIN: float = 0.35   ## 残影相对贴图的缩放
const TRAIL_SCALE_MAX: float = 0.70

## 金币图标复用已有 UI 素材（64×64 真实插画，不另造美术）
const COIN_TEX: Texture2D = preload("res://assets/pixel/ui/ui_icon_coin.png")
## 结算画面用的大金币：原生 132px 贴图（tools/make_big_coin.py 生成）。
## 不能复用上面那张 64px UI 图标 —— 放大 2.06 倍 + canvas 默认 Nearest 过滤
## 会变成块状马赛克（UI 图标平时都是缩小使用，只有这里被放大）。
const SETTLE_COIN_TEX: Texture2D = preload("res://assets/props/items/coin_big.png")
## Label 在 GameRoot 空间下拿不到 HUD 的 Theme，需自带字体
## （Web 导出无系统中文字体，不设会显示成方框）
const UI_THEME: Theme = preload("res://assets/fonts/ui_theme.tres")


## 单枚金币：Sprite2D + 自己的速度
class Coin extends Sprite2D:
	var vx: float = 0.0
	var vy: float = 0.0
	var caught: bool = false   ## 已被接住 → 进入回弹淡出，不再判定
	var fade: float = 0.0      ## 回弹剩余时长
	var trail: CPUParticles2D = null  ## 下落拖尾（接住后停发）


var _game: GameRoot = null
var _coins: Array[Coin] = []
var _phase: int = Phase.RAIN
var _elapsed: float = 0.0
var _spawn_timer: float = 0.0
var _sfx_timer: float = 0.0
var _caught: int = 0
var _coins_gained: int = 0     ## 本次已累计的真实入账金币（= 所有飘字之和），结算就报它
var _pop_index: int = 0
var _settle_elapsed: float = 0.0
var _settle_locked: bool = false
var _finished: bool = false
var _label: Label = null
var _settle_root: Node2D = null
var _settle_num: Label = null
var _settle_coin: Sprite2D = null


func setup(game: GameRoot) -> void:
	_game = game


func _ready() -> void:
	_build_curtain()
	_build_label()


# ===== 黑幕与 HUD =====

## 40% 黑幕：盖住整个画布。
## CoinRain 是 GameRoot 运行期新增的最后一个子节点，因此这块黑幕天然画在
## 背景/砖块/蹦床/球之上；金币与文字作为它的后续子节点，再画在黑幕之上。
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


# ===== 主循环 =====

func _process(delta: float) -> void:
	if _finished:
		return
	# 暂停/结算/回菜单：整体冻结（含倒计时与结算演出），无需额外暂停逻辑
	if _game == null or _game.state != GameRoot.State.PLAYING:
		return

	if _phase == Phase.RAIN:
		_process_rain(delta)
	else:
		_process_settle(delta)


func _process_rain(delta: float) -> void:
	_elapsed += delta
	if _elapsed >= DURATION:
		_start_settle()
		return

	if _sfx_timer > 0.0:
		_sfx_timer = maxf(0.0, _sfx_timer - delta)

	_spawn_timer -= delta
	if _spawn_timer <= 0.0:
		_spawn_timer = randf_range(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX)
		_spawn_coin()

	_update_coins(delta)
	_refresh_label()


# ===== 金币 =====

# 拖尾贴图与渐变色静态共享，避免每枚金币各造一份资源
static var _trail_tex: Texture2D = null
static var _trail_ramp: Gradient = null


## 程序生成柔光点：中心实、边缘柔（平方衰减）
static func _trail_texture() -> Texture2D:
	if _trail_tex != null:
		return _trail_tex
	var img := Image.create(TRAIL_TEX_SIZE, TRAIL_TEX_SIZE, false, Image.FORMAT_RGBA8)
	var c: float = float(TRAIL_TEX_SIZE) * 0.5
	var r: float = c - 0.5
	for y in TRAIL_TEX_SIZE:
		for x in TRAIL_TEX_SIZE:
			var dx: float = float(x) + 0.5 - c
			var dy: float = float(y) + 0.5 - c
			var a: float = clampf(1.0 - sqrt(dx * dx + dy * dy) / r, 0.0, 1.0)
			img.set_pixel(x, y, Color(1.0, 0.92, 0.55, a * a))
	_trail_tex = ImageTexture.create_from_image(img)
	return _trail_tex


## 暖金 → 透明
static func _trail_gradient() -> Gradient:
	if _trail_ramp != null:
		return _trail_ramp
	var g := Gradient.new()
	g.set_color(0, Color(1.0, 0.88, 0.42, 0.55))
	g.set_color(1, Color(1.0, 0.70, 0.18, 0.0))
	_trail_ramp = g
	return _trail_ramp


## 造一条挂在金币上的拖尾
func _make_trail() -> CPUParticles2D:
	var p := CPUParticles2D.new()
	p.name = "Trail"
	p.texture = _trail_texture()
	p.z_index = -1  ## 压在金币本体之下
	p.amount = TRAIL_AMOUNT
	p.lifetime = TRAIL_LIFETIME
	p.local_coords = false  ## 关键：不跟随金币 → 残影留在原地，金币移开拉出轨迹
	p.direction = Vector2.ZERO
	p.spread = 180.0
	p.gravity = Vector2.ZERO
	p.initial_velocity_min = 0.0
	p.initial_velocity_max = 0.0
	p.scale_amount_min = TRAIL_SCALE_MIN
	p.scale_amount_max = TRAIL_SCALE_MAX
	p.color_ramp = _trail_gradient()
	p.emitting = true
	return p


func _spawn_coin() -> void:
	var coin := Coin.new()
	coin.name = "Coin"
	coin.texture = COIN_TEX
	# 有大有小：判定盒挂在蹦床上而不是金币上，所以尺寸纯视觉、不影响手感
	var s: float = COIN_DISPLAY / float(COIN_TEX.get_width()) * randf_range(COIN_SCALE_MIN, COIN_SCALE_MAX)
	coin.scale = Vector2(s, s)
	coin.z_index = 1  ## 黑幕之上、倒计时之下
	coin.position = Vector2(
		randf_range(WALL_MARGIN, float(GameConstants.VIEW_W) - WALL_MARGIN),
		-COIN_DISPLAY
	)
	coin.vx = randf_range(-VX_MAX, VX_MAX)
	coin.vy = randf_range(VY_MIN, VY_MAX)
	coin.trail = _make_trail()
	coin.add_child(coin.trail)
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

		if coin.caught:
			if _update_caught_coin(coin, delta):
				alive.append(coin)
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
			_catch_coin(coin)
			alive.append(coin)  # 回弹期间还要继续画
			continue

		if coin.position.y > FALL_Y:
			coin.queue_free()
			continue

		alive.append(coin)

	_coins = alive


## 接住：只标记 + 起跳，实际的回弹与淡出交给 _update_caught_coin
func _catch_coin(coin: Coin) -> void:
	coin.caught = true
	coin.fade = CATCH_FADE
	coin.vy = CATCH_BOUNCE_VY
	coin.vx *= 0.35  # 收一下横向速度，回弹更「直上直下」好辨认
	# 接住后停发拖尾：不然回弹那一小段还拖着一条，看着脏
	if coin.trail != null and is_instance_valid(coin.trail):
		coin.trail.emitting = false
	_caught += 1
	# 飘字 = 这一枚真实入账的金币数；结算总量就是它们的和，不会对不上
	var gain: int = POP_SERIES[mini(_pop_index, POP_SERIES.size() - 1)]
	_pop_index += 1
	_coins_gained += gain
	FloatText.spawn(self, coin.global_position, "+%d" % gain, POP_COLOR, POP_FONT_SIZE)
	if _sfx_timer <= 0.0:
		_sfx_timer = SFX_CD
		Sfx.play("sfx_coin")


## 回弹弧线 + 淡出；返回 false 表示该金币可以回收了
func _update_caught_coin(coin: Coin, delta: float) -> bool:
	coin.vy += CATCH_GRAVITY * delta
	coin.position.y += coin.vy * delta
	coin.position.x += coin.vx * delta
	coin.fade -= delta
	var t: float = clampf(coin.fade / CATCH_FADE, 0.0, 1.0)
	coin.modulate.a = t
	if coin.fade <= 0.0:
		coin.queue_free()
		return false
	return true


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
	# 同时显示枚数与累计金币：让玩家在雨里就能看到最终会结算多少，和结算数字对得上
	_label.text = "金币雨 %d 秒 ｜ %d 枚 · +%d 金币" % [maxi(left, 0), _caught, _coins_gained]


# ===== 结算演出 =====

## 时间到：清掉还在掉的金币，进入结算
func _start_settle() -> void:
	_phase = Phase.SETTLE
	_settle_elapsed = 0.0
	if _label != null:
		_label.visible = false
	for coin: Coin in _coins:
		if is_instance_valid(coin):
			coin.queue_free()
	_coins.clear()
	_build_settle()
	Sfx.play("sfx_level_clear")


## 大金币浮在前面，数值在它后面滚动
func _build_settle() -> void:
	var cx: float = float(GameConstants.VIEW_W) * 0.5
	_settle_root = Node2D.new()
	_settle_root.name = "Settle"
	add_child(_settle_root)

	var caption := Label.new()
	caption.name = "SettleCaption"
	caption.theme = UI_THEME
	caption.text = SETTLE_CAPTION
	caption.position = Vector2(0.0, SETTLE_CAPTION_Y)
	caption.size = Vector2(float(GameConstants.VIEW_W), 28.0)
	caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	caption.add_theme_font_size_override("font_size", 20)
	caption.add_theme_color_override("font_color", Color(0.92, 0.94, 1.0))
	caption.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.85))
	caption.add_theme_constant_override("shadow_offset_x", 2)
	caption.add_theme_constant_override("shadow_offset_y", 2)
	caption.mouse_filter = Control.MOUSE_FILTER_IGNORE
	caption.z_index = 1
	_settle_root.add_child(caption)

	# 数值：先建、z_index 更低 → 被金币压住顶部一小条，形成「金币在前面」的层次
	# （位置必须让字形整体落在金币下方，否则会被整个盖住 —— 见 SETTLE_* 版面常量注释）
	_settle_num = Label.new()
	_settle_num.name = "SettleNumber"
	_settle_num.theme = UI_THEME
	_settle_num.text = "0"
	_settle_num.position = Vector2(0.0, SETTLE_NUM_CY - SETTLE_NUM_H * 0.5)
	_settle_num.size = Vector2(float(GameConstants.VIEW_W), SETTLE_NUM_H)
	_settle_num.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_settle_num.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_settle_num.add_theme_font_size_override("font_size", SETTLE_NUM_SIZE)
	_settle_num.add_theme_color_override("font_color", Color(1.0, 0.95, 0.72))
	_settle_num.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.9))
	_settle_num.add_theme_constant_override("shadow_offset_x", 3)
	_settle_num.add_theme_constant_override("shadow_offset_y", 3)
	_settle_num.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_settle_num.pivot_offset = _settle_num.size * 0.5
	_settle_num.z_index = 1
	_settle_root.add_child(_settle_num)

	# 大金币：z_index 更高 = 在前面
	_settle_coin = Sprite2D.new()
	_settle_coin.name = "SettleCoin"
	_settle_coin.texture = SETTLE_COIN_TEX
	var s: float = BIG_COIN_SIZE / float(SETTLE_COIN_TEX.get_width())
	_settle_coin.scale = Vector2(s, s)
	_settle_coin.position = Vector2(cx, SETTLE_COIN_CY)
	_settle_coin.z_index = 2
	_settle_root.add_child(_settle_coin)

	# 金币入场：从上方落下并回弹一下
	_settle_coin.position.y = SETTLE_COIN_CY - 240.0
	var drop: Tween = create_tween()
	drop.tween_property(_settle_coin, "position:y", SETTLE_COIN_CY, 0.5) \
		.set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)


## 数值快速滚动 → 到点定格
func _process_settle(delta: float) -> void:
	_settle_elapsed += delta
	var total: int = _coins_gained  # 结算数字 = 雨里所有飘字之和

	if _settle_elapsed < SETTLE_ROLL:
		# 先快后慢（三次方缓出），收尾那段慢下来才有「要停住了」的期待感
		var t: float = clampf(_settle_elapsed / SETTLE_ROLL, 0.0, 1.0)
		var eased: float = 1.0 - pow(1.0 - t, 3.0)
		if _settle_num != null:
			_settle_num.text = str(int(round(eased * float(total))))
		return

	if not _settle_locked:
		_lock_settle(total)
		return

	if _settle_elapsed >= SETTLE_ROLL + SETTLE_HOLD:
		_finish()


## 定格动画：数字弹一下并转金，金币同时脉冲
func _lock_settle(total: int) -> void:
	_settle_locked = true
	if _settle_num != null:
		_settle_num.text = str(total)
		_settle_num.add_theme_color_override("font_color", Color(1.0, 0.86, 0.32))
		_settle_num.scale = Vector2(1.0, 1.0)
		var punch: Tween = create_tween()
		punch.tween_property(_settle_num, "scale", Vector2(1.32, 1.32), 0.14) \
			.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		punch.tween_property(_settle_num, "scale", Vector2(1.0, 1.0), 0.20) \
			.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if _settle_coin != null:
		var s: float = BIG_COIN_SIZE / float(SETTLE_COIN_TEX.get_width())
		var pulse: Tween = create_tween()
		pulse.tween_property(_settle_coin, "scale", Vector2(s * 1.18, s * 1.18), 0.14) \
			.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
		pulse.tween_property(_settle_coin, "scale", Vector2(s, s), 0.20) \
			.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	Sfx.play("sfx_coin")


# ===== 收尾 =====

## 结算完成：交回结果并自毁。
## 先 emit 再 queue_free —— GameRoot 的处理器只清引用与恢复球，不会 free 本节点，
## 避免在自身方法执行期间被立即 free。
func _finish() -> void:
	if _finished:
		return
	_finished = true
	finished.emit(_caught, _coins_gained, _coins_gained * COIN_SCORE)
	queue_free()
