class_name GameRoot
extends Node2D
## 局内主循环：双通道胜利、抓人救援、生命、过关
## P0：状态机收口、清场同步、救人计数、双倍/复活防重入

enum State { MENU, PLAYING, LEVELUP, OVER, PAUSE }

signal state_changed(state: int)
signal hud_refresh
signal show_message(text: String)

var state: int = State.MENU
var fire_left: int = 0
var rescue_left: int = 0
var initial_fire: int = 0
var initial_rescue: int = 0
var level_bonus: int = 0

var _bricks: Array = []
var _waiting_launch: bool = true
var _double_claimed: bool = false
var _level_closing: bool = false  ## 防止同一帧多次过关
var _carry_is_red: bool = false   ## 当前携带是否来自红窗（不计硬目标）

## 角色/商店相关
var _boost_timer: float = 0.0          ## 限时增益·灭火×2 剩余秒（下关生效）
var _extinguish_pending: bool = false  ## 灭火器：下关首次着火自动扑灭
var _capy_fire_timer: float = 0.0      ## 卡皮巴拉：着火自动熄灭倒计时（秒）
var _clones: Array = []                ## 狐狸·影分身列表
var _skill_cd: float = 0.0             ## 技能冷却剩余秒（0=可用）
var _fallers: Array = []               ## 红窗跳楼村民（下落中）
var _fall_timer: float = 0.0           ## 下一次跳楼倒计时（秒）
var _shop_stock: Dictionary = {}       ## 当前商品组 {hero,items}
var _shop_used: bool = false           ## 本关是否已弹出过商店

## 金币雨小游戏（蹦床接住「金币宝箱」触发）
var _coin_rain: CoinRain = null        ## 进行中的金币雨节点
var _coin_rain_active: bool = false    ## 是否正在金币雨中（主玩法冻结）

## 表现层：球擦过「单纯窗户」（DecorWindow）时闪烁
var _decor_touching: Dictionary = {}   ## 上一帧仍与球重叠的窗户 → 只在「进入」时闪一次

## 跳字配色：灭火得分（金） / 命中伤害（白）
const FLOAT_SCORE_COLOR: Color = Color(1.0, 0.86, 0.32)
const FLOAT_DAMAGE_COLOR: Color = Color(0.94, 0.94, 0.94)

## 红窗跳楼节奏（规则 §3.4：周期性跳窗）
const FALL_INTERVAL_MIN: float = 2.6
const FALL_INTERVAL_MAX: float = 4.2

## 道具掉落：掉率随关卡微升（对齐 HTML maybeDropItem）
const ITEM_CHANCE_BASE: float = 0.28
const ITEM_CHANCE_PER_LEVEL: float = 0.015
const ITEM_CHANCE_MAX: float = 0.45
## 长条 +30 / 螺丝(锤子) -24：永久改变蹦床长度（无时限），clamp 见 paddle.gd

var item_host: Node2D = null       ## 道具容器（代码创建于 _ready，排在砖层之上）

@onready var paddle: CharacterBody2D = $Paddle
@onready var ball: CharacterBody2D = $Ball
@onready var brick_host: Node2D = $BrickHost
@onready var bg: Control = $Background


func _ready() -> void:
	# 背景已改为 TextureRect（纯视觉层）。仅当保持 ColorRect 占位时兜底设色。
	if bg is ColorRect:
		var c := bg as ColorRect
		c.color = Color(0.07, 0.11, 0.16)
		c.size = Vector2(GameConstants.VIEW_W, GameConstants.VIEW_H)
		c.position = Vector2.ZERO
		c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	elif bg:
		bg.mouse_filter = Control.MOUSE_FILTER_IGNORE

	# 道具容器：添加在 BrickHost 之后 → 绘制在砖层之上；不动 main.tscn
	item_host = Node2D.new()
	item_host.name = "ItemHost"
	add_child(item_host)

	paddle.add_to_group("paddle")
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(false)

	ball.fell_off.connect(_on_ball_fell)
	ball.bounced_paddle.connect(_on_ball_paddle)
	ball.hit_brick.connect(_on_ball_hit_brick)
	_set_state(State.MENU)


func _process(delta: float) -> void:
	if state != State.PLAYING:
		return

	# 限时增益（灭火×2）倒计时
	if _boost_timer > 0.0:
		_boost_timer = maxf(0.0, _boost_timer - delta)

	# 卡皮巴拉：着火 3 秒自动熄灭
	if _capy_fire_timer > 0.0:
		_capy_fire_timer = maxf(0.0, _capy_fire_timer - delta)
		if _capy_fire_timer <= 0.0 and paddle.on_fire:
			paddle.set_on_fire(false)
			show_message.emit("卡皮巴拉：火自动熄灭")

	# 技能冷却倒计时
	if _skill_cd > 0.0:
		_skill_cd = maxf(0.0, _skill_cd - delta)
		if _skill_cd <= 0.0:
			hud_refresh.emit()  # 让技能按钮恢复可点

	# 影分身更新（只存活在 PLAYING 态，天然暂停安全）
	# 注意：不能用带类型注解的 filter（分身释放后 Object→Node 转换会抛错中断本帧）
	var alive: Array = []
	for c in _clones:
		if c == null or not is_instance_valid(c):
			continue
		var clone := c as SkillClone
		if clone == null:
			continue
		if clone.update_clone(delta):
			alive.append(clone)
		else:
			clone.queue_free()
	_clones = alive

	# 红窗跳楼村民：更新下落 + 周期性生成（规则 §3.4）
	var alive_fall: Array = []
	for f in _fallers:
		if f == null or not is_instance_valid(f):
			continue
		var faller := f as VillagerFall
		if faller == null:
			continue
		if faller.update_fall(delta):
			alive_fall.append(faller)
		else:
			faller.queue_free()
	_fallers = alive_fall

	# 金币雨期间不刷跳楼村民：玩家要专注接金币，且黑幕下跳窗视觉混乱
	if not _coin_rain_active:
		_fall_timer -= delta
		if _fall_timer <= 0.0:
			_fall_timer = randf_range(FALL_INTERVAL_MIN, FALL_INTERVAL_MAX)
			_spawn_red_window_faller()

	if _waiting_launch and ball.stuck_to_paddle:
		ball.position = _ball_rest_pos()

	# 表现层：球擦过单纯窗户 → 闪一下
	_check_decor_flash()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause_game"):
		if state == State.PLAYING:
			pause_game()
			get_viewport().set_input_as_handled()
		elif state == State.PAUSE:
			resume_game()
			get_viewport().set_input_as_handled()
		return

	if state != State.PLAYING:
		return

	var want_launch: bool = false
	if event.is_action_pressed("launch"):
		want_launch = true
	elif event is InputEventMouseButton:
		var mb: InputEventMouseButton = event as InputEventMouseButton
		if mb.pressed and mb.button_index == MOUSE_BUTTON_LEFT:
			want_launch = true
	elif event is InputEventScreenTouch:
		var st: InputEventScreenTouch = event as InputEventScreenTouch
		if st.pressed:
			want_launch = true

	if want_launch and _waiting_launch and not _level_closing:
		_launch()
		get_viewport().set_input_as_handled()


func start_run() -> void:
	GameState.reset_run()
	_start_level(true)


func continue_next_level() -> void:
	if state != State.LEVELUP:
		return
	GameState.next_level()
	# 过关进下一关：保留整局长条/螺丝积累的蹦床宽度（跨关永久）
	_start_level(false)


func retry_run() -> void:
	start_run()


func pause_game() -> void:
	if state != State.PLAYING:
		return
	_set_state(State.PAUSE)
	if ball.has_method("freeze_motion"):
		ball.freeze_motion()
	else:
		ball.active = false
		ball.velocity = Vector2.ZERO
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(false)


func resume_game() -> void:
	if state != State.PAUSE:
		return
	_set_state(State.PLAYING)
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(true)
	if _waiting_launch:
		ball.reset_on_paddle(paddle)
	elif ball.has_method("unfreeze_motion"):
		ball.unfreeze_motion()
	else:
		ball.active = true


func go_menu() -> void:
	_level_closing = false
	_clear_bricks()
	_clear_items()
	paddle.set_on_fire(false)
	ball.reset_on_paddle(paddle)
	ball.freeze_motion()
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(false)
	_clear_clones()
	_clear_fallers()
	_clear_coin_rain()
	# 回菜单也落盘：保证本局刷出的最高分/金币不丢
	GameState.save()
	_set_state(State.MENU)
	hud_refresh.emit()


func mock_double_coins() -> void:
	if state != State.LEVELUP:
		return
	if _double_claimed:
		show_message.emit("本关已领取双倍")
		return
	_double_claimed = true
	GameState.add_coins(level_bonus)
	GameState.save()
	show_message.emit("金币双倍 +%d" % level_bonus)
	hud_refresh.emit()


func mock_revive() -> void:
	if state != State.OVER:
		return
	if GameState.revive_used:
		show_message.emit("本关已复活过")
		return
	GameState.revive_used = true
	GameState.set_lives(1)
	_level_closing = false
	_waiting_launch = true
	_carry_is_red = false
	ball.speed = _speed_for_level(GameState.level)
	ball.reset_on_paddle(paddle)
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(true)
	_set_state(State.PLAYING)
	hud_refresh.emit()
	show_message.emit("复活成功")


# ===== 补给队商店（过关后弹出） =====

func open_shop() -> void:
	if state != State.LEVELUP:
		return
	_shop_used = true
	if _shop_stock.is_empty():
		_shop_stock = ShopDB.generate()
	hud_refresh.emit()
	show_message.emit("补给队到啦！")


## 商店「继续」：跳过消费进入下一关
func shop_continue() -> void:
	_shop_stock = {}
	continue_next_level()


## 购买英雄（角色）：金币扣减 + 解锁 + 装备。返回成功
func buy_shop_hero() -> bool:
	if state != State.LEVELUP:
		return false
	var hero: int = int(_shop_stock.get("hero", -1))
	if hero < 0:
		return false
	if not GameState.buy_skin_with_coins(hero):
		return false
	_shop_stock["hero"] = -1
	_apply_skin_runtime()
	hud_refresh.emit()
	show_message.emit("解锁 " + str(CharacterDB.role(hero).get("name", "")) + "！")
	return true


## 购买道具：bag 即时结算；其余入 pending 下关生效。返回成功
func buy_shop_item(key: String) -> bool:
	if state != State.LEVELUP:
		return false
	if not ShopDB.ITEM_DEFS.has(key):
		return false
	var price: int = ShopDB.item_price(key)
	if GameState.coins < price:
		return false
	GameState.coins -= price
	if key == "bag":
		GameState.add_score(80)
		GameState.add_coins(8)
		show_message.emit("钱袋 +80 分 +8 金币")
	else:
		GameState.pending_buffs.append(key)
		show_message.emit("已购 " + ShopDB.item_name(key) + "（下一关生效）")
	GameState.save()
	hud_refresh.emit()
	return true


## 刷新商品（激励视频 mock：立即刷新，模拟看完广告）
func mock_refresh_shop() -> void:
	if state != State.LEVELUP:
		return
	_shop_stock = ShopDB.generate()
	hud_refresh.emit()
	show_message.emit("商品已刷新！")


## 商品组查询（UI 用）
func get_shop_stock() -> Dictionary:
	return _shop_stock


func shop_hero_priced() -> bool:
	var hero: int = int(_shop_stock.get("hero", -1))
	return hero >= 0


## 当前角色切换后运行时重挂（移速 + 球视觉）
func apply_skin_change() -> void:
	if paddle.has_method("apply_skin_speed"):
		paddle.apply_skin_speed()
	if ball.has_method("refresh_visual"):
		ball.refresh_visual()


func _apply_skin_runtime() -> void:
	apply_skin_change()


# ===== 狐狸·影分身技能（6 分身 / CD 6 秒可重复） =====

const SKILL_CLONE_COUNT: int = 6
const SKILL_CLONE_LIFE: float = 6.0
const SKILL_CD_TIME: float = 6.0

func can_use_skill() -> bool:
	return (
		state == State.PLAYING
		and CharacterDB.cur_is("fox")
		and _skill_cd <= 0.0
		and not _waiting_launch
	)


func get_skill_cd_left() -> float:
	return _skill_cd


func use_skill() -> void:
	if not can_use_skill():
		return
	_skill_cd = SKILL_CD_TIME
	_clear_clones()  # 点击=重新召唤一批（场上保持 6 个）
	var tex: Texture2D = _clone_texture()
	var origin: Vector2 = ball.position if ball != null else Vector2(225, 620)
	# 6 个分身朝上半扇形 6 个方向飞出
	for i in range(SKILL_CLONE_COUNT):
		var ang: float = deg_to_rad(-165.0 + 30.0 * i + 7.0)  # -165°..-15° 均匀
		var dir := Vector2(cos(ang), sin(ang))
		var c := SkillClone.make(tex, origin + Vector2(0, -12), dir, 260.0, self)
		add_child(c)
		_clones.append(c)
	show_message.emit("影分身！6 个分身出击")
	hud_refresh.emit()


func _clone_texture() -> Texture2D:
	## 分身兜底贴图（= 狐狸图）
	if ball != null and is_instance_valid(ball) and ball.has_method("get_visual_frame"):
		var t: Texture2D = ball.get_visual_frame()
		if t != null:
			return t
	return preload("res://assets/props/ball/char_naruto.png")


func _clear_clones() -> void:
	for c in _clones:
		if c != null and is_instance_valid(c):
			c.queue_free()
	_clones.clear()


# ===== 红窗跳楼村民（规则 §3.4） =====

const VILL_NAMES: Array[String] = [
	"vil_rabbit", "vil_chick", "vil_fox", "vil_pig", "vil_sheep", "vil_squirrel",
]
const VILL_DIR: String = "res://assets/pixel/villagers/"


func _villager_texture(call: bool) -> Texture2D:
	var base: String = VILL_NAMES[randi_range(0, VILL_NAMES.size() - 1)]
	var suffix: String = "_front_call.png" if call else "_front.png"
	var p: String = VILL_DIR + base + suffix
	if ResourceLoader.exists(p):
		return load(p) as Texture2D
	return null


## 从随机红窗跳下一个村民（无可跳窗口时跳过）
func _spawn_red_window_faller() -> void:
	# 仅游玩态生成：结算/暂停/菜单态不得产生游离村民
	if state != State.PLAYING or _level_closing:
		return
	if brick_host == null or not is_instance_valid(brick_host):
		return
	var reds: Array = []
	for b in brick_host.get_children():
		if b == null or not is_instance_valid(b):
			continue
		if b is WindowBrick:
			var wb := b as WindowBrick
			if wb.brick_type == WindowBrick.BrickType.RESCUE and wb.is_red and not wb.is_dead:
				reds.append(wb)
	if reds.is_empty():
		return
	var pick: WindowBrick = reds[randi_range(0, reds.size() - 1)]
	var tex: Texture2D = _villager_texture(true)
	if tex == null:
		return
	var f := VillagerFall.make(tex, pick.position + Vector2(randf_range(-8.0, 8.0), 10.0), self, true)
	add_child(f)
	_fallers.append(f)


## 蹦床接住跳楼村民 → 加分/金币（红窗救人向）；返回是否接住
func try_catch_faller(f: VillagerFall) -> bool:
	if f == null or not is_instance_valid(f):
		return false
	if paddle == null or not is_instance_valid(paddle):
		return false
	var half_w: float = GameConstants.PADDLE_W * 0.5
	var bw: Variant = paddle.get("base_width")
	if typeof(bw) == TYPE_FLOAT or typeof(bw) == TYPE_INT:
		half_w = float(bw) * 0.5
	var top: float = paddle.position.y
	var dx: float = absf(f.position.x - paddle.position.x)
	var dy: float = f.position.y - top
	if dx <= half_w + VillagerFall.CATCH_X_PAD and dy >= VillagerFall.CATCH_Y_MIN and dy <= VillagerFall.CATCH_Y_MAX:
		var dog_mult: float = 1.5 if CharacterDB.cur_is("dog") else 1.0
		var pts: int = int(round(150.0 * dog_mult))
		var coin_gain: int = int(round(12.0 * dog_mult))
		GameState.add_score(pts)
		GameState.add_coins(coin_gain)
		Sfx.play("sfx_rescue_save")
		show_message.emit("接住跳楼村民 +%d" % pts)
		hud_refresh.emit()
		return true
	return false


func _clear_fallers() -> void:
	for f in _fallers:
		if f != null and is_instance_valid(f):
			f.queue_free()
	_fallers.clear()
	_fall_timer = randf_range(FALL_INTERVAL_MIN, FALL_INTERVAL_MAX)


## 获救表现：村民从弹起点上浮并淡出（规则 §3.4：弹起瞬间获救）
func _spawn_rescued_villager(at: Vector2) -> void:
	var tex: Texture2D = _villager_texture(true)
	if tex == null:
		return
	var s := Sprite2D.new()
	s.texture = tex
	s.scale = Vector2(0.5, 0.5)
	s.position = at + Vector2(0, -18)
	s.z_index = 5
	add_child(s)
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(s, "position:y", s.position.y - 34.0, 0.75) \
		.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(s, "modulate:a", 0.0, 0.75)
	tw.chain().tween_callback(s.queue_free)


## 分身灭到火砖：计分/金币/掉落，与主球 fire_out 一致
func _on_clone_extinguish(brick: Node, _clone: SkillClone) -> void:
	if state != State.PLAYING or _level_closing:
		return
	if brick == null or not is_instance_valid(brick):
		return
	var dmg: int = 1 + maxi(0, GameState.power_level)
	if CharacterDB.cur_is("panda"):
		dmg *= 2
	if _boost_timer > 0.0:
		dmg *= 2
	var result: String = str(brick.hit(dmg))
	if result == "fire_out":
		if bool(brick.get("is_dead")):
			return
		fire_left = maxi(0, fire_left - 1)
		var fl: int = int(brick.get("fire_level"))
		GameState.add_score(15 * maxi(1, fl))
		GameState.add_coins(2)
		var at: Vector2 = Vector2.ZERO
		if brick is Node2D:
			at = (brick as Node2D).global_position
		brick.extinguish()
		_maybe_drop_item(at)
		_check_win()
		hud_refresh.emit()


# ===== 供 SkillClone 查询 =====

func get_paddle_node() -> Node2D:
	return paddle


## 触屏虚拟按钮设置蹦床移动方向（-1/0/1）
func paddle_dir(d: float) -> void:
	if paddle != null and is_instance_valid(paddle) and paddle.has_method("set_virtual_dir"):
		paddle.set_virtual_dir(d)


func get_paddle_half_w() -> float:
	if paddle != null:
		var bw: Variant = paddle.get("base_width")
		if typeof(bw) == TYPE_FLOAT or typeof(bw) == TYPE_INT:
			return float(bw) * 0.5
	return GameConstants.PADDLE_W * 0.5


func get_brick_host() -> Node2D:
	return brick_host


# ===== 下关道具生效 =====

func _apply_pending_buffs() -> void:
	if GameState.pending_buffs.is_empty():
		return
	var buffs: Array = GameState.pending_buffs.duplicate()
	GameState.pending_buffs.clear()
	for key: String in buffs:
		match key:
			"wide":
				# 商店长条：下关永久加长
				if paddle.has_method("adjust_width_permanent"):
					paddle.adjust_width_permanent(30.0)
				show_message.emit("长条生效：蹦床永久加长")
			"extinguish":
				_extinguish_pending = true
				show_message.emit("灭火器就绪：着火自动扑灭")
			"up":
				GameState.power_level = mini(2, GameState.power_level + 1)
				show_message.emit("1UP：灭火等级 +1")
			"boost":
				_boost_timer = 8.0
				show_message.emit("限时增益：8 秒灭火 ×2")


func _start_level(reset_paddle: bool = true) -> void:
	_level_closing = false
	_double_claimed = false
	_carry_is_red = false
	_clear_bricks()
	_clear_items()
	# 本关开始时清理分身/增益计时（商店 buff 在下关才用，这里先复位运行期状态）
	_clear_clones()
	_clear_fallers()
	_clear_coin_rain()
	_boost_timer = 0.0
	_extinguish_pending = false
	_capy_fire_timer = 0.0
	_skill_cd = 0.0
	_shop_used = false

	if paddle.has_method("apply_skin_speed"):
		paddle.apply_skin_speed()
	if reset_paddle and paddle.has_method("reset_width"):
		paddle.reset_width()
	paddle.set_on_fire(false)
	# 商店购买的道具：下一关开局生效
	_apply_pending_buffs()
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(true)

	var result: Dictionary = LevelBuilder.build(brick_host, GameState.level)
	_bricks = result.get("bricks", [])
	fire_left = int(result.get("fire_left", 0))
	rescue_left = int(result.get("rescue_left", 0))
	initial_fire = fire_left
	initial_rescue = rescue_left

	# 空关兜底：不应出现；若出现直接视为可过关目标异常，给 1 火避免卡死
	if initial_fire <= 0 and initial_rescue <= 0:
		show_message.emit("关卡数据异常，已跳过")
		# 仍进入可玩态，点一下会因无目标——改为直接发奖励进下一关流程过重；生成一扇火
		var fallback: WindowBrick = LevelBuilder.spawn_single_fire(brick_host, 3, 0)
		if fallback:
			_bricks.append(fallback)
			fire_left = 1
			initial_fire = 1
			if fallback.has_signal("destroyed"):
				fallback.destroyed.connect(_on_brick_destroyed)

	for b in _bricks:
		if b.has_signal("destroyed") and not b.destroyed.is_connected(_on_brick_destroyed):
			b.destroyed.connect(_on_brick_destroyed)

	ball.speed = _speed_for_level(GameState.level)
	_waiting_launch = true
	ball.reset_on_paddle(paddle)
	_set_state(State.PLAYING)
	hud_refresh.emit()
	show_message.emit("第 %d 关 · 灭火或救人" % GameState.level)


func _speed_for_level(level: int) -> float:
	return GameConstants.BALL_SPEED_BASE + float(level - 1) * 12.0


func _ball_rest_pos() -> Vector2:
	return paddle.position + Vector2(0, -GameConstants.PADDLE_H * 0.5 - ball.radius - 2.0)


func _launch() -> void:
	if state != State.PLAYING or not _waiting_launch or _level_closing:
		return
	_waiting_launch = false
	var ang: float = deg_to_rad(-90.0 + randf_range(-18.0, 18.0))
	ball.launch(Vector2(cos(ang), sin(ang)))
	Sfx.play("sfx_launch")
	if paddle.has_method("play_bounce"):
		paddle.play_bounce()
	hud_refresh.emit()


func _on_ball_fell() -> void:
	if state != State.PLAYING or _level_closing:
		return
	_carry_is_red = false
	if ball.carry_person:
		ball.carry_person = false
		ball.refresh_visual()
	Sfx.play("sfx_life_lose", 0.0, 0.9)
	GameState.lose_life()
	hud_refresh.emit()
	if GameState.lives <= 0:
		_game_over()
	else:
		_waiting_launch = true
		ball.reset_on_paddle(paddle)
		show_message.emit("掉落！剩余生命 %d" % GameState.lives)


func _on_ball_paddle() -> void:
	if state != State.PLAYING or _level_closing:
		return

	# 任何接球（球碰到蹦床）都播放弹跳动画
	if paddle.has_method("play_bounce"):
		paddle.play_bounce()
	Sfx.play("sfx_bounce")

	# 未带人：只是普通弹起，无需结算救人
	if not ball.carry_person:
		return

	var was_red: bool = _carry_is_red
	ball.carry_person = false
	_carry_is_red = false
	ball.refresh_visual()
	Sfx.play("sfx_rescue_save")
	# 获救表现：村民从蹦床处弹出上浮（规则 §3.4 弹起瞬间获救）
	_spawn_rescued_villager(ball.position)

	# 红窗救人只加分，不扣硬目标 rescue_left
	if not was_red and rescue_left > 0:
		rescue_left = maxi(0, rescue_left - 1)

	# 小狗·救援：救人得分 +50%（含红窗），金币同比例
	var dog_mult: float = 1.5 if CharacterDB.cur_is("dog") else 1.0
	var pts: int = int(round((150.0 if was_red else 100.0) * dog_mult))
	var coin_gain: int = int(round((12.0 if was_red else 10.0) * dog_mult))
	GameState.add_score(pts)
	GameState.add_coins(coin_gain)
	show_message.emit(("红窗救人 +%d" if was_red else "救人 +%d") % pts)
	hud_refresh.emit()
	_check_win()


func _on_ball_hit_brick(brick: Node) -> void:
	if state != State.PLAYING or _level_closing:
		return
	if brick == null or not is_instance_valid(brick):
		return
	if not brick.has_method("hit"):
		return

	# 已带人时不再抓第二人，但火窗仍可灭
	var dmg: int = 1 + maxi(0, GameState.power_level)
	# 熊猫·力量：灭火伤害 ×2；限时增益（boost）同样 ×2；可叠加
	if CharacterDB.cur_is("panda"):
		dmg *= 2
	if _boost_timer > 0.0:
		dmg *= 2
	var result: String = str(brick.hit(dmg))

	match result:
		"rescue_grab":
			if ball.carry_person:
				return
			if bool(brick.get("is_dead")):
				return
			_carry_is_red = bool(brick.get("is_red"))
			ball.carry_person = true
			ball.refresh_visual()
			Sfx.play("sfx_rescue_grab")
			if brick.has_method("consume_for_rescue"):
				brick.consume_for_rescue()
			show_message.emit("抓住伤员！带回蹦床" if not _carry_is_red else "红窗伤员！带回加分")
		"fire_out":
			if bool(brick.get("is_dead")):
				return
			fire_left = maxi(0, fire_left - 1)
			var fl: int = int(brick.get("fire_level"))
			var pts: int = 15 * maxi(1, fl)
			GameState.add_score(pts)
			GameState.add_coins(2)
			Sfx.play("sfx_fire_out")
			var at: Vector2 = Vector2.ZERO
			if brick is Node2D:
				at = (brick as Node2D).global_position
			# 跳字：灭火成功 → 金色得分
			FloatText.spawn(brick_host, at, "+%d" % pts, FLOAT_SCORE_COLOR, 24)
			if brick.has_method("extinguish"):
				brick.extinguish()
				_maybe_drop_item(at)
			_check_win()
		"fire_down":
			GameState.add_score(5)
			Sfx.play("sfx_fire_hit", 0.0, 1.0 + randf_range(-0.05, 0.05))
			# 跳字：这一下打掉多少血（嫌吵就把这几行删掉，灭火跳字不受影响）
			if brick is Node2D:
				FloatText.spawn(
					brick_host,
					(brick as Node2D).global_position,
					"-%d" % dmg,
					FLOAT_DAMAGE_COLOR,
					18
				)
		"none":
			pass
		_:
			pass
	hud_refresh.emit()


## 灭火完成按概率掉道具（位置=被灭砖中心，权重见 GameItem.pick_kind）
func _maybe_drop_item(at: Vector2) -> void:
	var chance: float = minf(
		ITEM_CHANCE_BASE + float(GameState.level) * ITEM_CHANCE_PER_LEVEL,
		ITEM_CHANCE_MAX
	)
	if randf() >= chance:
		return
	var kind: int = GameItem.pick_kind()
	if kind < 0:
		return
	var it := GameItem.new()
	it.setup(self, kind)
	item_host.add_child(it)
	it.position = item_host.to_local(at)
	it.collected.connect(_on_item_collected)


## 蹦床接住道具 → 结算效果（数值对齐 HTML applyItem）
func _on_item_collected(it: GameItem) -> void:
	if state != State.PLAYING or _level_closing:
		return
	# 音效：按道具类型先播提示音
	match it.kind:
		GameItem.Kind.BAG:
			Sfx.play("sfx_coin")
		GameItem.Kind.WIDE, GameItem.Kind.EXTINGUISH, GameItem.Kind.UP:
			Sfx.play("sfx_item_pos")
		GameItem.Kind.HAMMER, GameItem.Kind.FIREBALL:
			Sfx.play("sfx_item_neg")
		GameItem.Kind.CHEST:
			Sfx.play("sfx_item_pos")
	match it.kind:
		GameItem.Kind.BAG:
			var pts: int = 50 if randi_range(0, 1) == 1 else 25
			var coin_gain: int = randi_range(15, 30)
			GameState.add_score(pts)
			GameState.add_coins(coin_gain)
			show_message.emit("钱袋 +%d 分 +%d 金币" % [pts, coin_gain])
		GameItem.Kind.WIDE:
			# 长条：永久加长蹦床（+30，无时限；顶到屏边后不再增加）
			if paddle.has_method("adjust_width_permanent"):
				paddle.adjust_width_permanent(30.0)
			show_message.emit("蹦床永久加长 +30！")
		GameItem.Kind.HAMMER:
			# 螺丝（原锤子）：永久缩短蹦床（-24，无时限）
			if paddle.has_method("adjust_width_permanent"):
				paddle.adjust_width_permanent(-24.0)
			show_message.emit("螺丝：蹦床永久变短 -24")
		GameItem.Kind.EXTINGUISH:
			if paddle.on_fire:
				paddle.set_on_fire(false)
				show_message.emit("灭火器：火已扑灭")
			else:
				show_message.emit("灭火器：暂无火可灭")
		GameItem.Kind.UP:
			if GameState.power_level < 2:
				GameState.power_level += 1
				# 现存所有火砖剩余需求 -1（不低于 1），立即见效
				for b: Node in brick_host.get_children():
					if b is WindowBrick and not (b as WindowBrick).is_dead:
						(b as WindowBrick).shave_hp()
				show_message.emit("灭火等级提升，灭火更快！")
			else:
				GameState.add_score(50)
				show_message.emit("灭火等级已满，+50 分")
		GameItem.Kind.FIREBALL:
			# 卡皮巴拉·稳定：50% 概率抗火（无论着火与否）
			var capy_safe: bool = CharacterDB.cur_is("capy") and randf() < 0.5
			if capy_safe:
				show_message.emit("卡皮巴拉：抗火！火苗弹开")
			elif paddle.on_fire:
				# 灭火器（商店购，下关）：着火自动扑灭一次
				if _extinguish_pending:
					_extinguish_pending = false
					paddle.set_on_fire(false)
					show_message.emit("灭火器：火已自动扑灭")
				else:
					GameState.lose_life()
					if GameState.lives <= 0:
						show_message.emit("蹦床烧毁了…")
						_game_over()
					else:
						show_message.emit("蹦床再次着火，-1 命")
			else:
				paddle.set_on_fire(true)
				show_message.emit("蹦床着火了！快找灭火器")
				# 卡皮巴拉：着火 3 秒自动熄灭
				if CharacterDB.cur_is("capy"):
					_capy_fire_timer = 3.0
		GameItem.Kind.CHEST:
			# 金币宝箱：不即时给分，转入 10 秒金币雨小游戏
			_start_coin_rain()
	hud_refresh.emit()


## 清理场上道具（新关卡/回菜单）
func _clear_items() -> void:
	if item_host == null or not is_instance_valid(item_host):
		return
	for c in item_host.get_children():
		if is_instance_valid(c):
			c.free()


# ===== 金币雨小游戏（蹦床接住「金币宝箱」触发）=====

## 进入金币雨：冻结主玩法（球停在原地），玩家专注接金币。
## 刻意不新增 State —— main_ui._on_state 用 playing=(s==PLAYING) 控制虚拟按键与
## 技能键显隐，新增状态会让它们在金币雨期间整个消失。
func _start_coin_rain() -> void:
	if _coin_rain_active or state != State.PLAYING or _level_closing:
		return
	_coin_rain_active = true
	if ball.has_method("freeze_motion"):
		ball.freeze_motion()
	else:
		ball.active = false
		ball.velocity = Vector2.ZERO

	_coin_rain = CoinRain.new()
	_coin_rain.name = "CoinRain"
	_coin_rain.setup(self)
	add_child(_coin_rain)  # 运行期最后一个子节点 → 黑幕天然盖在背景/蹦床/球之上
	_coin_rain.coin_caught.connect(_on_coin_rain_caught)
	_coin_rain.finished.connect(_on_coin_rain_finished)
	show_message.emit("金币宝箱！10 秒疯狂接金币")


## 每接住一枚金币：仍由 GameRoot 记账，分数唯一权威留在 game_root
func _on_coin_rain_caught(score: int, coins: int) -> void:
	GameState.add_score(score)
	GameState.add_coins(coins)


## 10 秒结束：恢复主玩法。
## 这里不 free 金币雨节点 —— 它在 _finish() 里自行 queue_free()，
## 若在此立即释放会在其自身方法执行期间销毁对象。
func _on_coin_rain_finished(caught: int) -> void:
	if not _coin_rain_active:
		return
	_coin_rain_active = false
	_coin_rain = null
	if _waiting_launch:
		ball.reset_on_paddle(paddle)
	elif ball.has_method("unfreeze_motion"):
		ball.unfreeze_motion()
	else:
		ball.active = true
	show_message.emit("金币雨结束：接住 %d 枚" % caught)


## 强制清理：金币雨没走完就回菜单/换关/结束时调用。
## 只负责撤掉节点与标志位；球由各调用方自行复位（它们本来就会复位）。
func _clear_coin_rain() -> void:
	if not _coin_rain_active:
		return
	_coin_rain_active = false
	if _coin_rain != null and is_instance_valid(_coin_rain):
		_coin_rain.free()
	_coin_rain = null


## 球擦过「单纯窗户」（DecorWindow）→ 让它闪一下。
##
## 用「球心 vs 砖格矩形」的 AABB 判定，只保留本帧仍重叠的集合，
## 因此是「进入时闪一次」而不是每帧闪。
##
## 刻意不用带类型注解的循环变量：窗户在换关时被 free()，数组里会留下已释放对象，
## 带注解会触发 Object→Node 转换错误中断本帧（分身 filter 踩过同一个坑）。
func _check_decor_flash() -> void:
	if ball == null or not is_instance_valid(ball):
		return
	var ball_pos: Vector2 = ball.global_position
	var r: float = ball.radius
	var half_w: float = GameConstants.BRICK_W * 0.5 + r
	var half_h: float = GameConstants.BRICK_H * 0.5 + r
	var now: Dictionary = {}
	for n in get_tree().get_nodes_in_group("decor_window"):
		if n == null or not is_instance_valid(n):
			continue
		var w := n as DecorWindow
		if w == null:
			continue
		var d: Vector2 = ball_pos - w.global_position
		if absf(d.x) <= half_w and absf(d.y) <= half_h:
			now[w] = true
			if not _decor_touching.has(w):
				w.flash()
	_decor_touching = now


func _on_brick_destroyed(brick: Node) -> void:
	_bricks.erase(brick)


func _check_win() -> void:
	if state != State.PLAYING or _level_closing:
		return
	# 双通道：有火则灭光可过；有普通救援则救完可过
	var fire_done: bool = initial_fire > 0 and fire_left <= 0
	var rescue_done: bool = initial_rescue > 0 and rescue_left <= 0
	if fire_done or rescue_done:
		_level_complete()


func _level_complete() -> void:
	if state != State.PLAYING or _level_closing:
		return
	_level_closing = true
	_waiting_launch = true
	_carry_is_red = false
	ball.carry_person = false
	ball.freeze_motion()
	ball.stuck_to_paddle = true
	ball.position = _ball_rest_pos()
	ball.refresh_visual()
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(false)

	level_bonus = 50 + GameState.level * 10
	GameState.add_score(level_bonus)
	GameState.add_coins(level_bonus)
	Sfx.play("sfx_level_clear")
	GameState.save()
	# 过关：分身/跳楼村民清理（避免结算界面残留）
	_clear_clones()
	_clear_fallers()
	# 每关通关刷新补给队商品
	_shop_stock = ShopDB.generate()
	_set_state(State.LEVELUP)
	hud_refresh.emit()
	show_message.emit("过关！补给队已就位")


func _game_over() -> void:
	_level_closing = true
	ball.freeze_motion()
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(false)
	_clear_clones()
	_clear_fallers()
	_clear_coin_rain()
	_set_state(State.OVER)
	GameState.save()
	hud_refresh.emit()


func _clear_bricks() -> void:
	# 立即 free，避免 queue_free 延迟导致同帧新旧砖并存
	var kids: Array = brick_host.get_children()
	for c in kids:
		if is_instance_valid(c):
			c.free()
	_bricks.clear()
	fire_left = 0
	rescue_left = 0
	initial_fire = 0
	initial_rescue = 0


func _set_state(s: int) -> void:
	state = s
	state_changed.emit(state)


func get_goal_text() -> String:
	return "火 %d   人 %d" % [fire_left, rescue_left]


func is_double_claimed() -> bool:
	return _double_claimed
