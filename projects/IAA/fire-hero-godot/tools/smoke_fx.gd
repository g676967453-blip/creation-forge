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
	var base_x: float = dw.position.x

	# 球移到窗户上 → 应触发撞击反馈
	game.ball.global_position = dw.global_position
	game._check_decor_flash()
	checks.append(["flash_changes_modulate", dw.modulate != base_mod])
	checks.append(["flash_scales_up", dw.scale != base_scale])
	# 关键断言：必须真的「变亮」。modulate 是乘法，三通道 ≤1 的颜色只会让窗户变暗
	# （第一版写成 (1.0, 0.96, 0.78) 就是暗黄，看着根本不像闪），必须 >1 才提亮
	checks.append(["flash_actually_brightens", dw.modulate.r > 1.0])
	var glow: Sprite2D = dw.get_node_or_null("HitGlow") as Sprite2D
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

	# ===== 手动步进撞击动画：不依赖真实时钟，逐帧取样 =====
	dw.set_process(false)  # 交给测试自己步进，避免引擎同时在跑造成双倍推进
	var max_offset: float = 0.0
	var max_scale: float = 0.0
	var saw_red: bool = false
	var saw_white: bool = false
	var steps: int = 40
	for i in steps:
		dw._process(HitImpact.IMPACT_TIME / float(steps))
		max_offset = maxf(max_offset, absf(dw.position.x - base_x))
		max_scale = maxf(max_scale, dw.scale.x)
		var g: Color = glow.modulate
		if g.a > 0.1:
			if g.g < 0.35:
				saw_red = true
			elif g.g > 0.7:
				saw_white = true
	dw._process(0.01)  # 兜底再推一帧，确保走完并触发 _restore

	checks.append(["flash_shakes_horizontally", max_offset > 1.0])
	checks.append(["flash_scale_peaks", max_scale > base_scale.x + 0.05])
	checks.append(["flash_alternates_red_white", saw_red and saw_white])
	checks.append(["flash_restores_position", is_equal_approx(dw.position.x, base_x)])
	checks.append(["flash_restores_modulate", dw.modulate.is_equal_approx(base_mod)])
	checks.append(["flash_restores_scale", dw.scale.is_equal_approx(base_scale)])
	checks.append(["flash_glow_restores", glow != null and is_zero_approx(glow.modulate.a)])

	# ===== 晃动不得反过来触发自己 =====
	# 球停在重叠区「边缘内侧」，窗户晃动 ±SHAKE_AMP 会把它晃出重叠区。
	# 若判定用 global_position，就会出现「晃出→清空→晃回→重触发」的自激循环。
	var edge_offset: float = GameConstants.BRICK_W * 0.5 + game.ball.radius - 2.0
	dw.flash()
	game.ball.global_position = dw.rest_global_position() + Vector2(edge_offset, 0.0)
	game._check_decor_flash()
	var retriggered: bool = false
	for i in 20:
		dw._process(HitImpact.IMPACT_TIME / 20.0)
		game._check_decor_flash()
		if not game._decor_touching.has(dw):
			retriggered = true
			break
	checks.append(["no_retrigger_while_shaking", not retriggered])
	game.ball.global_position = Vector2(5.0, 5.0)

	# ================= 2b) 火砖撞击反馈 =================
	# 最关键的不变量：撞击只驱动 _visual，砖本体 position 与碰撞形状必须一动不动 ——
	# 火砖是 StaticBody2D，晃本体等于晃碰撞体，会干扰球路。
	GameState.power_level = 0
	game.fire_left = 99
	game.rescue_left = 99
	var bb: WindowBrick = LevelBuilder._make_brick_node(host)
	bb.setup(WindowBrick.BrickType.FIRE, 1, false)
	bb.position = Vector2(120.0, 420.0)
	await get_tree().process_frame

	var brick_pos_before: Vector2 = bb.position
	var shape: CollisionShape2D = bb.get_node_or_null("CollisionShape2D") as CollisionShape2D
	var shape_size_before: Vector2 = Vector2.ZERO
	if shape != null and shape.shape is RectangleShape2D:
		shape_size_before = (shape.shape as RectangleShape2D).size
	var vis: Sprite2D = bb.get_node_or_null("Visual") as Sprite2D
	checks.append(["brick_has_visual", vis != null])
	var brick_glow: Sprite2D = null
	if vis != null:
		brick_glow = vis.get_node_or_null("HitGlow") as Sprite2D
	checks.append(["brick_glow_exists", brick_glow != null])

	bb.hit(1)
	checks.append(["brick_hit_starts_impact", bb._impact != null and bb._impact.playing()])
	checks.append(["brick_visual_scales_up", vis != null and vis.scale.x > 1.0])

	var b_max_offset: float = 0.0
	var b_saw_red: bool = false
	var b_saw_white: bool = false
	var b_body_moved: bool = false
	for i in 40:
		bb._process(HitImpact.IMPACT_TIME / 40.0)
		if not bb.position.is_equal_approx(brick_pos_before):
			b_body_moved = true
		if vis == null:
			continue
		b_max_offset = maxf(b_max_offset, absf(vis.position.x))
		if brick_glow != null:
			var bg: Color = brick_glow.modulate
			if bg.a > 0.1:
				if bg.g < 0.35:
					b_saw_red = true
				elif bg.g > 0.7:
					b_saw_white = true
	bb._process(0.01)  # 兜底走完

	checks.append(["brick_visual_shakes", b_max_offset > 1.0])
	checks.append(["brick_alternates_red_white", b_saw_red and b_saw_white])
	checks.append(["brick_body_never_moves", not b_body_moved])
	checks.append(["brick_visual_position_restores", vis != null and is_zero_approx(vis.position.x)])
	# 复原目标必须是「按剩余 hp 算出的那档缩放」（火 1 级 req=3，打到 hp=2 → lerp(0.82,1.0,2/3)），
	# 既不是撞击峰值 1.16、也不是 1.0 —— 这条同时验证了 configure() 有被调用
	var expected_rest: float = lerpf(0.82, 1.0, 2.0 / 3.0)
	checks.append([
		"brick_visual_scale_restores_to_hp_tier",
		vis != null and is_equal_approx(vis.scale.x, expected_rest)
	])
	if shape != null and shape.shape is RectangleShape2D:
		checks.append([
			"brick_collision_size_intact",
			(shape.shape as RectangleShape2D).size.is_equal_approx(shape_size_before)
		])

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
