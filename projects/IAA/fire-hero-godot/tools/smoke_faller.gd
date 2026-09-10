extends Node
## 冒烟：红窗跳楼村民（规则 §3.4）
## 运行：godot --headless --path . res://tools/smoke_faller.tscn
## 覆盖：红窗生成跳楼村民 → 下落 → 被蹦床接住加分 / 未被接住自动消失 → 状态出口清理

func _ready() -> void:
	_run()

func _timeout_quit() -> void:
	print("== faller smoke TIMEOUT ==")
	get_tree().quit(2)

func _run() -> void:
	var guard := Timer.new()
	guard.one_shot = true
	guard.wait_time = 15.0
	guard.timeout.connect(_timeout_quit)
	add_child(guard)
	guard.start()

	await get_tree().process_frame
	var packed: PackedScene = load("res://scenes/main.tscn")
	var main := packed.instantiate()
	get_tree().root.add_child(main)
	await get_tree().process_frame
	var game: Node = main.get_node("GameRoot")

	GameState.reset_run()
	game.start_run()
	await get_tree().process_frame
	game._waiting_launch = false
	game._set_state(game.State.PLAYING)
	await get_tree().process_frame

	var checks: Array = []

	# 手工放一个红窗（第 1 关布局无红窗）
	var host: Node2D = game.get_brick_host()
	var red: WindowBrick = LevelBuilder._make_brick_node(host)
	red.setup(WindowBrick.BrickType.RESCUE, 1, true)
	red.position = Vector2(225, 300)
	await get_tree().process_frame
	checks.append(["red_brick_ready", red.is_red and not red.is_dead])

	# 生成跳楼村民
	game._spawn_red_window_faller()
	await get_tree().process_frame
	checks.append(["faller_spawned", game._fallers.size() == 1])

	# 让村民落到蹦床位置 → 应被接住并加分
	var score_before: int = GameState.score
	var f: VillagerFall = game._fallers[0]
	f.position = Vector2(game.paddle.position.x, game.paddle.position.y - 10.0)
	f.vy = 120.0
	var caught: bool = game.try_catch_faller(f)
	checks.append(["catch_ok", caught])
	checks.append(["catch_scored", GameState.score > score_before])

	# 未被接住：放到屏幕外，应返回 false（消失）
	var f2: VillagerFall = VillagerFall.make(null, Vector2(60, 900), game, true)
	game.add_child(f2)
	checks.append(["fall_out_removed", not f2.update_fall(0.016)])

	# 状态出口清理：过关后不应残留
	game._clear_fallers()
	game._level_complete()
	await get_tree().process_frame
	checks.append(["cleared_on_levelup", game._fallers.size() == 0])

	# 无红窗时不生成（结算态下不应新增）
	var before: int = game._fallers.size()
	game._spawn_red_window_faller()
	checks.append(["no_spawn_when_none", game._fallers.size() == before])

	var failed: Array = []
	for row in checks:
		var ok: bool = bool(row[1])
		print(("[PASS] " if ok else "[FAIL] ") + str(row[0]))
		if not ok:
			failed.append(str(row[0]))
	print("== faller smoke: %d/%d passed ==" % [checks.size() - failed.size(), checks.size()])
	get_tree().quit(0 if failed.is_empty() else 1)
