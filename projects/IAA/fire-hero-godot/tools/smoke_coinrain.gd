extends Node
## 冒烟：金币宝箱 + 金币雨小游戏
## 运行：godot --headless --path . res://tools/smoke_coinrain.tscn
## 覆盖：宝箱权重可抽中 → 接住宝箱进入金币雨 → 40% 黑幕 / 倒计时 Label / 球冻结
##      → 金币坠落与蹦床接取计分 → 10 秒结束恢复主玩法 → 中途离开强制清理
##
## 注：直接调用 coin_rain 的内部方法并传入显式 delta，不依赖真实时钟
## —— headless 下每秒帧数不确定，等真实 10 秒既慢又不稳。

func _ready() -> void:
	_run()


func _timeout_quit() -> void:
	print("== coinrain smoke TIMEOUT ==")
	get_tree().quit(2)


func _chest_weight() -> float:
	for row: Array in GameItem.PICK_BOUNDS:
		if int(row[0]) == GameItem.Kind.CHEST:
			return float(row[1])
	return 0.0


func _run() -> void:
	var guard := Timer.new()
	guard.one_shot = true
	guard.wait_time = 20.0
	guard.timeout.connect(_timeout_quit)
	add_child(guard)
	guard.start()

	await get_tree().process_frame
	var packed: PackedScene = load("res://scenes/main.tscn")
	var main := packed.instantiate()
	get_tree().root.add_child(main)
	await get_tree().process_frame
	var game: GameRoot = main.get_node("GameRoot") as GameRoot

	GameState.reset_run()
	game.start_run()
	await get_tree().process_frame
	game._waiting_launch = false
	game._set_state(game.State.PLAYING)
	while game.ball.stuck_to_paddle:
		game.ball.launch()
		await get_tree().process_frame

	var checks: Array = []

	# ===== 1) 宝箱作为道具类型存在且可掉落 =====
	checks.append(["chest_has_weight", _chest_weight() > 0.0])
	var droppable: bool = false
	for i in 5000:
		if GameItem.pick_kind() == GameItem.Kind.CHEST:
			droppable = true
			break
	checks.append(["chest_droppable", droppable])

	# ===== 2) 宝箱贴图链路（无 png 时走程序绘制占位）=====
	var it := GameItem.new()
	it.setup(game, GameItem.Kind.CHEST)
	checks.append(["chest_file_name", it._kind_file(GameItem.Kind.CHEST) == "item_chest.png"])
	var tex: Texture2D = it._texture_for(GameItem.Kind.CHEST)
	checks.append(["chest_texture_ok", tex != null and tex.get_width() == GameItem.SIZE])

	# ===== 3) 走真实链路：接住宝箱 → 进入金币雨 =====
	checks.append(["not_raining_initially", not game._coin_rain_active])
	game.item_host.add_child(it)
	it.position = Vector2(game.paddle.position.x, game.paddle.position.y)
	it.collected.connect(game._on_item_collected)
	it.collected.emit(it)
	await get_tree().process_frame

	var rain: CoinRain = game._coin_rain
	checks.append(["chest_starts_rain", game._coin_rain_active and rain != null])
	checks.append(["state_still_playing", game.state == game.State.PLAYING])
	checks.append(["ball_frozen", not game.ball.active])
	if it != null and is_instance_valid(it):
		it.free()

	# ===== 4) 40% 黑幕 =====
	var curtain: ColorRect = rain.get_node_or_null("Curtain") as ColorRect
	checks.append(["curtain_exists", curtain != null])
	checks.append(["curtain_alpha_40", curtain != null and is_equal_approx(curtain.color.a, CoinRain.CURTAIN_ALPHA)])
	checks.append([
		"curtain_covers_canvas",
		curtain != null and curtain.size == Vector2(float(GameConstants.VIEW_W), float(GameConstants.VIEW_H))
	])
	# 黑幕必须画在蹦床之上：CoinRain 是 GameRoot 的最后一个子节点
	var kids: Array = game.get_children()
	checks.append(["rain_is_last_child", kids[kids.size() - 1] == rain])

	# ===== 5) 倒计时 Label（自带 Theme，否则 Web 下中文成方框）=====
	var label: Label = rain.get_node_or_null("RainLabel") as Label
	checks.append(["label_exists", label != null])
	checks.append(["label_has_theme", label != null and label.theme != null])
	checks.append(["label_shows_time", label != null and label.text.contains("金币雨")])

	# ===== 6) 金币生成 + 下落 =====
	# 注意：_spawn_timer 初值为 0，金币雨的首次 _process 本身就会生成一枚，
	# 所以这里断言 >= 1 而不是 == 1。
	rain._spawn_coin()
	await get_tree().process_frame
	checks.append(["coin_spawned", rain._coins.size() >= 1])
	if rain._coins.is_empty():
		print("== coinrain smoke: 金币未生成，提前结束 ==")
		get_tree().quit(1)
		return
	var coin: CoinRain.Coin = rain._coins[0]
	checks.append(["coin_uses_ui_icon", coin.texture == CoinRain.COIN_TEX])
	var y0: float = coin.position.y
	rain._update_coins(0.1)
	checks.append(["coin_falls", coin.position.y > y0])

	# ===== 7) 蹦床接住 → 计分 =====
	var score0: int = GameState.score
	var coins0: int = GameState.coins
	coin.position = Vector2(game.paddle.position.x, game.paddle.position.y)
	rain._update_coins(0.0)
	checks.append(["coin_caught", rain._caught == 1])
	checks.append(["coin_scored", GameState.score > score0])
	checks.append(["coin_added_coins", GameState.coins > coins0])

	# 接不到（落到屏幕外）不应计分
	var missed0: int = rain._caught
	rain._spawn_coin()
	var miss: CoinRain.Coin = rain._coins[rain._coins.size() - 1]
	miss.position = Vector2(20.0, CoinRain.FALL_Y + 1.0)
	rain._update_coins(0.0)
	checks.append(["miss_not_counted", rain._caught == missed0])

	# ===== 8) 10 秒结束 → 恢复主玩法 =====
	rain._elapsed = CoinRain.DURATION
	await get_tree().process_frame
	checks.append(["rain_finished", not game._coin_rain_active])
	checks.append(["rain_ref_cleared", game._coin_rain == null])
	checks.append(["ball_unfrozen", game.ball.active])

	# ===== 9) 中途离开 → 强制清理，无残留节点 =====
	game._start_coin_rain()
	await get_tree().process_frame
	checks.append(["rain_restarted", game._coin_rain_active])
	game._clear_coin_rain()
	await get_tree().process_frame
	checks.append(["clear_flag", not game._coin_rain_active])
	checks.append(["clear_ref", game._coin_rain == null])
	var leftovers: int = 0
	for c in game.get_children():
		if c is CoinRain:
			leftovers += 1
	checks.append(["no_leftover_node", leftovers == 0])

	# ===== 10) 金币雨期间不刷跳楼村民 =====
	game._start_coin_rain()
	await get_tree().process_frame
	var fall_before: int = game._fallers.size()
	game._fall_timer = -1.0  # 强制到期，若未被拦住就会立刻生成
	await get_tree().process_frame
	checks.append(["no_faller_during_rain", game._fallers.size() == fall_before])
	game._clear_coin_rain()

	var failed: Array = []
	for row in checks:
		var ok: bool = bool(row[1])
		print(("[PASS] " if ok else "[FAIL] ") + str(row[0]))
		if not ok:
			failed.append(str(row[0]))
	print("== coinrain smoke: %d/%d passed ==" % [checks.size() - failed.size(), checks.size()])
	get_tree().quit(0 if failed.is_empty() else 1)
