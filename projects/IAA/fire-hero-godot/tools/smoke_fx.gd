extends Node
## 冒烟：表现层两项 —— 单纯窗户闪烁 + 灭火跳字
## 运行：godot --headless --path . res://tools/smoke_fx.tscn
## 覆盖：DecorWindow 由工厂生成且无碰撞 → 球擦过触发闪烁 → 重叠期间不重复闪
##      → 移开后记录清空 → 闪烁后回到原外观
##      FloatText 生成/居中/带 Theme/自毁 → 灭火真实链路弹跳字并计分
##      → 换关时跳字与装饰窗一并清理

func _ready() -> void:
	_run()


func _timeout_quit() -> void:
	print("== fx smoke TIMEOUT ==")
	get_tree().quit(2)


func _count_float_texts(parent: Node) -> int:
	var n: int = 0
	for c in parent.get_children():
		if c is FloatText:
			n += 1
	return n


func _run() -> void:
	var guard := Timer.new()
	guard.one_shot = true
	guard.wait_time = 25.0
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

	var host: Node2D = game.get_brick_host()
	var checks: Array = []

	# ================= 1) 单纯窗户闪烁 =================
	# 关卡布局不保证有装饰窗，手工放一扇（走真实工厂方法）
	LevelBuilder._spawn_decor_window(host, 0, 5)
	await get_tree().process_frame
	var decors: Array = get_tree().get_nodes_in_group("decor_window")
	checks.append(["decor_in_group", decors.size() >= 1])
	var dw: DecorWindow = decors[decors.size() - 1] as DecorWindow
	checks.append(["decor_is_scripted", dw != null])
	# 装饰窗必须是纯 Sprite2D，不引入物理体。
	# 注意：不能写 `dw is PhysicsBody2D` —— dw 已静态定型为 DecorWindow(Sprite2D)，
	# 编译器会直接判「Expr is of type DecorWindow so it can't be of type PhysicsBody2D」
	# 并让整个脚本解析失败。改用动态 get() 查。
	checks.append(["decor_not_physics_body", dw != null and dw.get("collision_layer") == null])

	if dw == null:
		print("== fx smoke: 装饰窗未生成，提前结束 ==")
		get_tree().quit(1)
		return

	var base_mod: Color = dw.modulate
	var base_scale: Vector2 = dw.scale

	# 球移到窗户上 → 应闪
	game.ball.global_position = dw.global_position
	game._check_decor_flash()
	checks.append(["flash_changes_modulate", dw.modulate != base_mod])
	checks.append(["flash_scales_up", dw.scale != base_scale])
	# 关键断言：必须真的「变亮」。modulate 是乘法，三通道 ≤1 的颜色只会让窗户变暗
	# （第一版写成 (1.0, 0.96, 0.78) 就是暗黄，看着根本不像闪），必须 >1 才提亮
	checks.append(["flash_actually_brightens", dw.modulate.r > 1.0])
	var glow: Sprite2D = dw.get_node_or_null("FlashGlow") as Sprite2D
	checks.append(["flash_glow_exists", glow != null])
	checks.append([
		"flash_glow_is_additive",
		glow != null
			and glow.material is CanvasItemMaterial
			and (glow.material as CanvasItemMaterial).blend_mode == CanvasItemMaterial.BLEND_MODE_ADD
	])
	checks.append(["flash_glow_lit", glow != null and glow.modulate.a > 0.0])
	checks.append(["flash_recorded", game._decor_touching.has(dw)])

	# 同帧再判一次：仍在重叠 → 不应重启（值保持不变）
	var mod_snapshot: Color = dw.modulate
	game._check_decor_flash()
	checks.append(["no_restart_while_overlapping", dw.modulate == mod_snapshot])

	# 球移开 → 记录清空，且不再触发
	game.ball.global_position = Vector2(5.0, 5.0)
	game._check_decor_flash()
	checks.append(["records_cleared_when_away", not game._decor_touching.has(dw)])

	# 等闪烁结束 → 回到初始外观
	await get_tree().create_timer(DecorWindow.FLASH_TIME + 0.2).timeout
	checks.append(["flash_restores_modulate", dw.modulate.is_equal_approx(base_mod)])
	checks.append(["flash_restores_scale", dw.scale.is_equal_approx(base_scale)])
	checks.append(["flash_glow_restores", glow != null and is_zero_approx(glow.modulate.a)])

	# ================= 2) 跳字：独立生成与自毁 =================
	var ft: FloatText = FloatText.spawn(host, Vector2(200.0, 300.0), "+45", game.FLOAT_SCORE_COLOR, 24)
	# 居中检查必须紧跟 spawn、且不能 await —— rise 补间在 _ready 里就启动了，
	# 等一帧再测 y 已经被抬起来了。
	checks.append([
		"ft_centered_on_at",
		is_equal_approx(ft.global_position.x + ft.size.x * 0.5, 200.0)
			and is_equal_approx(ft.global_position.y + ft.size.y * 0.5, 300.0)
	])
	await get_tree().process_frame
	checks.append(["ft_added_to_host", ft.get_parent() == host])
	checks.append(["ft_text_ok", ft.text == "+45"])
	checks.append(["ft_has_theme", ft.theme != null])
	checks.append(["ft_on_top", ft.z_index > 0])

	await get_tree().create_timer(FloatText.LIFE + 0.3).timeout
	checks.append(["ft_self_freed", not is_instance_valid(ft)])

	# ================= 3) 跳字：灭火真实链路 =================
	GameState.power_level = 0
	# 隔离 _check_win：手工砖不在关卡目标里，把计数抬高避免误判过关
	game.fire_left = 99
	game.rescue_left = 99
	var fb: WindowBrick = LevelBuilder._make_brick_node(host)
	fb.setup(WindowBrick.BrickType.FIRE, 1, false)
	fb.position = Vector2(200.0, 300.0)
	await get_tree().process_frame

	var ft_before: int = _count_float_texts(host)
	var score_before: int = GameState.score
	# 火 1 级 req=3，伤害 1 → 三下灭火
	for i in 3:
		game._on_ball_hit_brick(fb)
	await get_tree().process_frame

	checks.append(["hit_spawns_float", _count_float_texts(host) > ft_before])
	checks.append(["hit_scored", GameState.score > score_before])
	# 灭火成功后砖块已 queue_free，不能再读 fb.is_dead（会访问已释放对象）——
	# 改为断言「节点确实已消失」，这本身就证明它被 extingu() 收走了
	checks.append(["fire_extinguished", not is_instance_valid(fb)])

	# ================= 4) 回归：影分身不会把装饰窗当砖 =================
	# 旧 bug：_find_hit_brick 只按「是不是 Node2D」筛选，装饰窗（Sprite2D）被当成砖返回，
	# 随后 update_clone 读 brick_type 得到 null 赋给 int，抛
	# 「Trying to assign value of type 'Nil' to a variable of type 'int'」。
	game._clear_bricks()
	await get_tree().process_frame
	LevelBuilder._spawn_decor_window(host, 3, 4)
	await get_tree().process_frame
	var dec2: DecorWindow = host.get_child(host.get_child_count() - 1) as DecorWindow
	var clone: SkillClone = SkillClone.make(null, dec2.position, Vector2(1.0, 0.0), 300.0, game)
	host.add_child(clone)
	await get_tree().process_frame
	checks.append(["clone_ignores_decor", clone._find_hit_brick() == null])
	clone.update_clone(0.0)  # 旧代码在这一行抛 Nil→int

	# ================= 5) 换关清理：两者都不残留 =================
	game._clear_bricks()
	await get_tree().process_frame
	checks.append(["floats_cleared", _count_float_texts(host) == 0])
	checks.append(["decors_cleared", get_tree().get_nodes_in_group("decor_window").is_empty()])

	var failed: Array = []
	for row in checks:
		var ok: bool = bool(row[1])
		print(("[PASS] " if ok else "[FAIL] ") + str(row[0]))
		if not ok:
			failed.append(str(row[0]))
	print("== fx smoke: %d/%d passed ==" % [checks.size() - failed.size(), checks.size()])
	get_tree().quit(0 if failed.is_empty() else 1)
