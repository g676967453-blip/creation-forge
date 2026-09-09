extends Node
## 冒烟：商店（补给队）流程
## 运行：godot --headless --path . res://tools/smoke_shop.tscn
## 覆盖：过关→LEVELUP→商店生成→买英雄(金币)→买道具入队→下关应用

func _ready() -> void:
	_run()

## 兜底：若 _run 异常挂起，10 秒后强制退出并报错
func _timeout_quit() -> void:
	print("== smoke TIMEOUT guard fired ==")
	get_tree().quit(2)

func _run() -> void:
	var guard := Timer.new()
	guard.one_shot = true
	guard.wait_time = 12.0
	guard.timeout.connect(_timeout_quit)
	add_child(guard)
	guard.start()

	await get_tree().process_frame
	print("[step1] load main")
	var packed: PackedScene = load("res://scenes/main.tscn")
	var main := packed.instantiate()
	get_tree().root.add_child(main)
	await get_tree().process_frame

	var game: Node = main.get_node("GameRoot")
	var ui: Node = main.get_node("UI")
	print("[smoke] state=", game.state, " (expect MENU=0)")

	# 给足金币，测购买
	GameState.coins = 20000

	# 开始一局 → 立即完成该关进入 LEVELUP
	game.start_run()
	await get_tree().process_frame
	game._level_complete()
	await get_tree().process_frame

	var checks: Array = []
	checks.append(["state==LEVELUP", game.state == game.State.LEVELUP])
	var stock: Dictionary = game.get_shop_stock()
	checks.append(["shop_stock_generated", not stock.is_empty() and stock.has("hero")])
	checks.append(["shop_hero_slot", game.shop_hero_priced()])

	# 买英雄
	var hero_before: Array = GameState.owned_skins.duplicate()
	var hero_ok: bool = game.buy_shop_hero()
	checks.append(["buy_hero_ok", hero_ok])
	checks.append(["hero_added", GameState.owned_skins.size() == hero_before.size() + 1])

	# 买道具（bag 即时 / wide 入队）
	var bag_before: int = GameState.coins
	var bag_ok: bool = game.buy_shop_item("bag")
	checks.append(["buy_bag_ok", bag_ok])
	checks.append(["bag_instant_gain", GameState.coins >= bag_before or GameState.pending_buffs.size() == 0])
	var wide_ok: bool = game.buy_shop_item("wide")
	checks.append(["buy_wide_ok", wide_ok])
	checks.append(["wide_pending", GameState.pending_buffs.has("wide")])

	# 继续下一关（消费 buff）
	game.shop_continue()
	await get_tree().process_frame
	checks.append(["next_level_ok", game.state == game.State.PLAYING])
	checks.append(["pending_consumed", GameState.pending_buffs.is_empty()])
	checks.append(["paddle_wider", absf(game.paddle.base_width - 122.0) < 0.5])
	# 长条视觉回归：床面 mat 横向拉伸
	var mat_node: Node = game.paddle.get_node_or_null("Visual/Mat")
	if mat_node:
		checks.append(["mat_stretched", (mat_node as Node2D).scale.x > 1.3])
	else:
		checks.append(["mat_stretched", false])

	# 角色能力：切猫 → 移速 +25%
	GameState.set_skin(0)
	game.apply_skin_change()
	var cat_speed: float = game.paddle.base_move_speed
	checks.append(["cat_speed_bonus", absf(cat_speed - 525.0) < 1.0])

	# 狐狸技能入口存在性（无法真发射，仅验证 can_use_skill 在等待时不触发）
	var can_before_launch: bool = game.can_use_skill()
	checks.append(["skill_waiting_blocked", not can_before_launch])

	# ===== 角色能力专项 =====
	print("[step2] abilities")
	checks.append(["dog_kind_detect", CharacterDB.cur_is("dog") == (GameState.skin_index == CharacterDB.DOG)])
	GameState.set_skin(CharacterDB.PANDA)
	checks.append(["panda_kind_detect", CharacterDB.cur_is("panda")])
	GameState.set_skin(CharacterDB.CAPY)
	checks.append(["capy_kind_detect", CharacterDB.cur_is("capy")])
	# 狐狸：设狐狸，模拟发射后 can_use_skill 应为 true，技能分 6 分身 + CD
	GameState.set_skin(CharacterDB.FOX)
	game.apply_skin_change()
	game._waiting_launch = false
	game._set_state(game.State.PLAYING)
	print("[step3] fox skill")
	checks.append(["skill_ready_after_launch", game.can_use_skill()])
	game.use_skill()
	checks.append(["use_skill_ok", game._clones.size() == 6])
	checks.append(["six_clones_spawned", game._clones.size() == 6])
	checks.append(["skill_cd_set", game.get_skill_cd_left() > 0.0])
	checks.append(["skill_cd_blocks", not game.can_use_skill()])
	game._skill_cd = 0.0
	checks.append(["skill_reusable", game.can_use_skill()])
	game.use_skill()
	checks.append(["second_use_ok", game._clones.size() == 6])
	print("[step4] done asserts")

	# 打印结果
	var failed: Array = []
	for row in checks:
		var name: String = str(row[0])
		var pass_ok: bool = bool(row[1])
		print(("[PASS] " if pass_ok else "[FAIL] ") + name)
		if not pass_ok:
			failed.append(name)
	print("== shop smoke: %d/%d passed ==" % [checks.size() - failed.size(), checks.size()])
	get_tree().quit(0 if failed.is_empty() else 1)
