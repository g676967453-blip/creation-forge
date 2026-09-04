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

	paddle.add_to_group("paddle")
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(false)

	ball.fell_off.connect(_on_ball_fell)
	ball.bounced_paddle.connect(_on_ball_paddle)
	ball.hit_brick.connect(_on_ball_hit_brick)
	_set_state(State.MENU)


func _process(_delta: float) -> void:
	if state != State.PLAYING:
		return
	if _waiting_launch and ball.stuck_to_paddle:
		ball.position = _ball_rest_pos()


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
	_start_level()


func continue_next_level() -> void:
	if state != State.LEVELUP:
		return
	GameState.next_level()
	_start_level()


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
	ball.reset_on_paddle(paddle)
	ball.freeze_motion()
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(false)
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


func _start_level() -> void:
	_level_closing = false
	_double_claimed = false
	_carry_is_red = false
	_clear_bricks()

	if paddle.has_method("reset_width"):
		paddle.reset_width()
	paddle.on_fire = false
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
	if paddle.has_method("play_bounce"):
		paddle.play_bounce()


func _on_ball_fell() -> void:
	if state != State.PLAYING or _level_closing:
		return
	_carry_is_red = false
	if ball.carry_person:
		ball.carry_person = false
		ball.refresh_visual()
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

	# 未带人：只是普通弹起，无需结算救人
	if not ball.carry_person:
		return

	var was_red: bool = _carry_is_red
	ball.carry_person = false
	_carry_is_red = false
	ball.refresh_visual()

	# 红窗救人只加分，不扣硬目标 rescue_left
	if not was_red and rescue_left > 0:
		rescue_left = maxi(0, rescue_left - 1)

	var pts: int = 150 if was_red else 100
	var coin_gain: int = 12 if was_red else 10
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
			if brick.has_method("extinguish"):
				brick.extinguish()
			_check_win()
		"fire_down":
			GameState.add_score(5)
		"none":
			pass
		_:
			pass
	hud_refresh.emit()


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
	GameState.save()
	_set_state(State.LEVELUP)
	hud_refresh.emit()
	show_message.emit("过关！奖励 %d" % level_bonus)


func _game_over() -> void:
	_level_closing = true
	ball.freeze_motion()
	if paddle.has_method("set_control_enabled"):
		paddle.set_control_enabled(false)
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
