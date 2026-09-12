extends Node
## 冒烟：金币宝箱 + 金币雨小游戏
## 运行：godot --headless --path . res://tools/smoke_coinrain.tscn
## 覆盖：宝箱权重可抽中 → 接住宝箱进入金币雨 → 40% 黑幕 / 倒计时 Label / 球冻结
##      → 金币大小随机 → 接住回弹 + 跳字 + 不当帧入账 → 落空不计
##      → 到点进结算（大金币在前 / 数值滚动 / 定格）→ 统一个人入账 → 恢复主玩法
##      → 中途离开强制清理 → 金币雨期间不刷跳楼村民
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


func _count_float_texts(parent: Node) -> int:
	var n: int = 0
	for c in parent.get_children():
		if c is FloatText:
			n += 1
	return n


## 场上现存的宝箱道具
func _chest_items(game: GameRoot) -> Array:
	var found: Array = []
	for c in game.item_host.get_children():
		var it := c as GameItem
		if it != null and it.kind == GameItem.Kind.CHEST:
			found.append(it)
	return found


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
	var kids: Array = game.get_children()
	checks.append(["rain_is_last_child", kids[kids.size() - 1] == rain])

	# ===== 5) 倒计时 Label（自带 Theme，否则 Web 下中文成方框）=====
	checks.append(["label_exists", rain._label != null])
	checks.append(["label_has_theme", rain._label != null and rain._label.theme != null])
	checks.append(["label_shows_time", rain._label != null and rain._label.text.contains("金币雨")])

	# ===== 6) 金币生成 + 大小随机 =====
	for i in 30:
		rain._spawn_coin()
	await get_tree().process_frame
	checks.append(["coin_spawned", rain._coins.size() >= 30])
	checks.append(["coin_uses_ui_icon", rain._coins.size() > 0 and rain._coins[0].texture != null])

	# ===== 6b) 档位：数值落在该档区间内 =====
	var tiers_seen: Dictionary = {}
	var values_ok: bool = true
	for c: CoinRain.Coin in rain._coins:
		tiers_seen[c.tier] = true
		if c.value < CoinRain.TIER_VALUE_MIN[c.tier] or c.value > CoinRain.TIER_VALUE_MAX[c.tier]:
			values_ok = false
	checks.append(["coin_value_in_tier_range", values_ok])
	checks.append(["coin_tiers_vary", tiers_seen.size() >= 2])

	# ===== 6c) 概率分布：高档必须更稀有，且五档都抽得到 =====
	var counts: Array[int] = [0, 0, 0, 0, 0]
	for i in 20000:
		counts[CoinRain.roll_tier()] += 1
	var monotonic: bool = true
	for i in range(1, counts.size()):
		if counts[i] > counts[i - 1]:
			monotonic = false
	checks.append(["tier_rarity_monotonic", monotonic])
	var all_reachable: bool = true
	for c: int in counts:
		if c <= 0:
			all_reachable = false
	checks.append(["all_tiers_reachable", all_reachable])

	# ===== 6d) 档位视觉：特效档独立贴图 + 加法光晕 =====
	checks.append([
		"tier_textures_distinct",
		CoinRain.TIER_TEX[2] != CoinRain.TIER_TEX[0]
			and CoinRain.TIER_TEX[3] != CoinRain.TIER_TEX[0]
			and CoinRain.TIER_TEX[4] != CoinRain.TIER_TEX[0]
	])
	var halo: Sprite2D = rain._make_halo(Color(0.42, 0.72, 1.0))
	checks.append(["halo_has_texture", halo.texture != null])
	checks.append([
		"halo_is_additive",
		halo.material is CanvasItemMaterial
			and (halo.material as CanvasItemMaterial).blend_mode == CanvasItemMaterial.BLEND_MODE_ADD
	])
	checks.append(["halo_bigger_than_coin", halo.scale.x > 1.5])
	halo.free()

	# 真抽到特效档时，金币上确实挂了光晕（最多试 500 次，抽到即验证）
	var effect_halo_ok: bool = false
	var tried: int = 0
	while tried < 500 and not effect_halo_ok:
		tried += 1
		rain._spawn_coin()
		var hc: CoinRain.Coin = rain._coins[rain._coins.size() - 1]
		if hc.tier >= CoinRain.HALO_FROM_TIER:
			effect_halo_ok = hc.halo != null
			break
		rain._coins.remove_at(rain._coins.size() - 1)
		hc.free()
	checks.append(["effect_tier_gets_halo", effect_halo_ok])

	# 拖尾粒子：两条「配错了就完全看不见」的项必须守住
	#  - 必须有贴图（无贴图粒子只画亚像素白点）
	#  - local_coords 必须为 false（否则粒子跟着金币走，形不成轨迹）
	var trail: CPUParticles2D = rain._coins[0].get_node_or_null("Trail") as CPUParticles2D
	checks.append(["coin_has_trail", trail != null])
	checks.append(["trail_has_texture", trail != null and trail.texture != null])
	checks.append(["trail_not_local_coords", trail != null and not trail.local_coords])
	checks.append(["trail_emitting", trail != null and trail.emitting])
	checks.append(["trail_behind_coin", trail != null and trail.z_index < 0])

	# ===== 7) 接住：回弹 + 跳字 + 不当帧入账 =====
	# 清场，做单枚接住的精细断言
	for c: CoinRain.Coin in rain._coins:
		if is_instance_valid(c):
			c.free()
	rain._coins.clear()
	rain._caught = 0
	rain._coins_gained = 0
	await get_tree().process_frame

	rain._spawn_coin()
	var coin: CoinRain.Coin = rain._coins[0]
	var score0: int = GameState.score
	var coins0: int = GameState.coins
	var ft0: int = _count_float_texts(rain)
	coin.position = Vector2(game.paddle.position.x, game.paddle.position.y)
	rain._update_coins(0.0)
	checks.append(["coin_caught_flag", coin.caught])
	checks.append(["coin_bounces_upward", coin.vy < 0.0])
	checks.append(["bounced_coin_kept_for_animation", rain._coins.has(coin)])
	checks.append(["catch_counted", rain._caught == 1])
	checks.append(["catch_pops_float", _count_float_texts(rain) > ft0])
	checks.append(["trail_stops_when_caught", coin.trail != null and not coin.trail.emitting])
	# 接住即按这一枚的真实数值累加（不是按枚数 ×1）
	checks.append(["catch_adds_coin_value", rain._coins_gained == coin.value])
	# 本版改动：接住当帧不入账，等结算统一发
	checks.append(["no_immediate_score", GameState.score == score0])
	checks.append(["no_immediate_coins", GameState.coins == coins0])

	# 回弹动画走完应被回收（不看真实时钟，靠内部列表判断）
	var bounced_removed: bool = false
	for i in 100:
		rain._update_coins(0.02)
		if not rain._coins.has(coin):
			bounced_removed = true
			break
	checks.append(["bounced_coin_removed", bounced_removed])

	# 接不到（落到屏幕外）不应计分
	var missed0: int = rain._caught
	rain._spawn_coin()
	var miss: CoinRain.Coin = rain._coins[rain._coins.size() - 1]
	miss.position = Vector2(20.0, CoinRain.FALL_Y + 1.0)
	rain._update_coins(0.0)
	checks.append(["miss_not_counted", rain._caught == missed0])

	# ===== 8) 结算演出：大金币在前 / 数值滚动 / 定格 =====
	# 接满 6 枚，构造可观察的结算总量
	for c: CoinRain.Coin in rain._coins:
		if is_instance_valid(c):
			c.free()
	rain._coins.clear()
	rain._caught = 0
	rain._coins_gained = 0
	# 逐枚记录 value，最后断言累计 == 这些 value 之和（= 玩家看到的飘字加起来）
	var expect_total: int = 0
	for i in 6:
		rain._spawn_coin()
		var c: CoinRain.Coin = rain._coins[rain._coins.size() - 1]
		expect_total += c.value
		c.position = Vector2(game.paddle.position.x, game.paddle.position.y)
		rain._update_coins(0.0)
	checks.append(["caught_six", rain._caught == 6])
	# 核心断言：累计入账必须精确等于逐枚 value 之和，
	# 也就是玩家在雨里看到的那些飘字加起来 —— 对不上就是「结算和接到的数值对不上」复现
	checks.append(["gained_equals_sum_of_values", rain._coins_gained == expect_total])
	var total_coins: int = rain._coins_gained
	var total_score: int = total_coins * CoinRain.COIN_SCORE
	var score_before: int = GameState.score
	var coins_before: int = GameState.coins

	rain._elapsed = CoinRain.DURATION
	await get_tree().process_frame
	checks.append(["enter_settle", rain._phase == CoinRain.Phase.SETTLE])
	checks.append(["rain_label_hidden", rain._label != null and not rain._label.visible])
	checks.append(["coins_cleared_on_settle", rain._coins.is_empty()])
	checks.append(["settle_number_exists", rain._settle_num != null])
	checks.append(["settle_big_coin_exists", rain._settle_coin != null])
	# 结算大金币必须是原生大贴图，不能是 64px UI 图标放大（Nearest 下会成马赛克）
	checks.append([
		"settle_coin_not_upscaled",
		rain._settle_coin != null
			and rain._settle_coin.texture != null
			and float(rain._settle_coin.texture.get_width()) >= CoinRain.BIG_COIN_SIZE
	])
	# 「金币在前面」= 金币 z_index 高于数值
	checks.append([
		"big_coin_in_front_of_number",
		rain._settle_coin != null and rain._settle_num != null
			and rain._settle_coin.z_index > rain._settle_num.z_index
	])
	# 版面自检：金币只允许压住数字字形顶部一小条，不能把它盖住。
	# 旧版面把数字与金币都放在画布中心，132px 金币把数字字形完全覆盖
	# （字形 213~267 全在金币 149~281 内）→ 玩家只看到金币，这条必挂。
	var coin_half: float = CoinRain.BIG_COIN_SIZE * 0.5
	var coin_top: float = CoinRain.SETTLE_COIN_CY - coin_half
	var coin_bottom: float = CoinRain.SETTLE_COIN_CY + coin_half
	var glyph_half: float = float(CoinRain.SETTLE_NUM_SIZE) * 0.36  # 数字字形高度约为字号的一半多一点
	var glyph_top: float = CoinRain.SETTLE_NUM_CY - glyph_half
	var glyph_bottom: float = CoinRain.SETTLE_NUM_CY + glyph_half
	var covered: float = maxf(0.0, minf(coin_bottom, glyph_bottom) - maxf(coin_top, glyph_top))
	checks.append([
		"number_not_buried_by_coin",
		covered < (glyph_bottom - glyph_top) * 0.5
	])
	# 用户明确要求「不再重叠」：金币底边必须在字形顶边之上，且留出可见空隙
	checks.append(["number_clear_of_coin", glyph_top - coin_bottom >= 20.0])
	checks.append([
		"number_glyphs_on_canvas",
		glyph_top > 0.0 and glyph_bottom < float(GameConstants.VIEW_H)
	])
	checks.append(["big_coin_on_canvas", coin_top > 0.0 and coin_bottom < float(GameConstants.VIEW_H)])

	# 滚动中：数值应在 0..total 之间且不等于最终值
	rain._settle_elapsed = CoinRain.SETTLE_ROLL * 0.5
	rain._process_settle(0.02)
	var mid_text: String = rain._settle_num.text
	checks.append(["rolling_in_progress", mid_text != str(total_coins)])
	checks.append(["rolling_within_range", int(mid_text) > 0 and int(mid_text) <= total_coins])
	# 再推进一点：单调不减
	rain._settle_elapsed = CoinRain.SETTLE_ROLL * 0.7
	rain._process_settle(0.02)
	checks.append(["rolling_monotonic", int(rain._settle_num.text) >= int(mid_text)])

	# 定格：数值锁到最终值
	rain._settle_elapsed = CoinRain.SETTLE_ROLL + 0.01
	rain._process_settle(0.0)
	checks.append(["settle_locked", rain._settle_locked])
	checks.append(["settle_shows_total", rain._settle_num.text == str(total_coins)])

	# 结算走完 → 统一个人入账 + 恢复主玩法（emit 是同步的，无需等帧）
	rain._settle_elapsed = CoinRain.SETTLE_ROLL + CoinRain.SETTLE_HOLD + 0.01
	rain._process_settle(0.0)
	checks.append(["rain_finished", not game._coin_rain_active])
	checks.append(["rain_ref_cleared", game._coin_rain == null])
	checks.append(["ball_unfrozen", game.ball.active])
	checks.append(["settle_awards_score", GameState.score == score_before + total_score])
	checks.append(["settle_awards_coins", GameState.coins == coins_before + total_coins])

	await get_tree().process_frame

	# ===== 9) 调试入口：debug_drop_chest（右上角「掉宝箱」按钮背后）=====
	game._clear_coin_rain()
	await get_tree().process_frame
	var chests_before: int = _chest_items(game).size()
	game.debug_drop_chest()
	await get_tree().process_frame
	var chests_now: Array = _chest_items(game)
	checks.append(["debug_drop_spawns_chest", chests_now.size() == chests_before + 1])
	var radar: Node = main.get_node_or_null("UI/Overlays/TestChestButton")
	checks.append(["test_chest_button_on_screen", radar != null])
	# 必须正好落在蹦床正上方且 vx=0 —— 否则调试按钮还得靠运气接
	var dropped: GameItem = null
	if not chests_now.is_empty():
		dropped = chests_now[chests_now.size() - 1] as GameItem
	checks.append([
		"debug_chest_above_paddle",
		dropped != null and is_equal_approx(dropped.global_position.x, game.paddle.global_position.x)
	])
	checks.append(["debug_chest_falls_straight", dropped != null and is_zero_approx(dropped.vx)])
	# 清场，别影响后面的清理断言
	for c in chests_now:
		if c != null and is_instance_valid(c):
			c.free()
	await get_tree().process_frame

	# ===== 10) 中途离开 → 强制清理，无残留节点 =====
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

	# ===== 11) 金币雨期间不刷跳楼村民 =====
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
