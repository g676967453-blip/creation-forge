extends Node
## 冒烟：影分身全生命周期仿真（复现"落屏后其它分身悬浮/不消失"）
## 运行：godot --headless --path . res://tools/smoke_clone.tscn
## 做法：真实 process 帧跑 400 帧（约 6.6s），逐帧记录分身位置是否在动，
##       统计有无"滞留"分身（存活但位置不再变化且未随生命结束移除）

func _ready() -> void:
	_run()

func _timeout_quit() -> void:
	print("== clone-life TIMEOUT fired ==")
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

	# 狐狸 + 足够帧
	GameState.set_skin(CharacterDB.FOX)
	game.apply_skin_change()
	GameState.coins = 0
	game.start_run()
	# 快速消灭火砖目标环境：直接空关不行，start_run 会建 1 关。
	# 进入发射态再放技能
	await get_tree().process_frame
	game._waiting_launch = false
	game._set_state(game.State.PLAYING)
	game.use_skill()
	await get_tree().process_frame

	var failures: Array = []
	var prev_pos: Dictionary = {}
	var stuck_frames: Dictionary = {}
	var ok_frames: int = 0
	var frames: int = 420
	for f in range(frames):
		await get_tree().process_frame
		var clones: Array = game._clones
		# 若游戏提前过关/结束，分身为 0 即正常结束（不算失败）
		if clones.is_empty():
			ok_frames += 1
			continue
		# 逐分身检查是否"滞留"：存活但位置连续 30 帧不变化（无外力应不可能完全静止，
		# 除非它不再被驱动）
		var any_moved: bool = false
		for c in clones:
			if c == null or not is_instance_valid(c):
				continue
			var n2: Node2D = c as Node2D
			var key: int = n2.get_instance_id()
			var cur: Vector2 = n2.position
			if prev_pos.has(key):
				var delta_v: float = cur.distance_to(prev_pos[key])
				if delta_v > 0.01:
					stuck_frames[key] = 0
					any_moved = true
				else:
					stuck_frames[key] = int(stuck_frames.get(key, 0)) + 1
					if int(stuck_frames.get(key, 0)) > 30:
						failures.append("stuck clone id=%d x=%.0f y=%.0f frames=%d" % [
							key, cur.x, cur.y, int(stuck_frames[key])])
						stuck_frames[key] = 0  # 只报一次
			prev_pos[key] = cur

	# 结束后等待数帧让 queue_free 生效，再断言场上无分身
	await get_tree().process_frame
	await get_tree().process_frame
	var remain: int = game._clones.size()
	print("== after %d frames, clones remain=%d (expect 0), stuck reports=%d ==" % [
		frames, remain, failures.size()])
	for msg in failures.slice(0, 5):
		print("[STUCK] ", msg)

	var pass_ok: bool = remain == 0 and failures.is_empty()
	print("== clone-life smoke: %s ==" % ("PASS" if pass_ok else "FAIL"))
	get_tree().quit(0 if pass_ok else 1)
