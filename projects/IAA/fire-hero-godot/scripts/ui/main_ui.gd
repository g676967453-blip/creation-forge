extends CanvasLayer
## 主界面 HUD + 菜单/过关/失败/暂停

@onready var game: Node2D = $"../GameRoot"

@onready var hud: Control = $HUD
@onready var label_level: Label = $HUD/TopBar/LevelBox/LevelLabel
@onready var label_score: Label = $HUD/TopBar/ScoreBox/ScoreLabel
@onready var label_coins: Label = $HUD/TopBar/CoinsBox/CoinsLabel
@onready var label_lives: Label = $HUD/TopBar/LivesBox/LivesLabel
@onready var label_goal: Label = $HUD/GoalLabel
@onready var label_toast: Label = $Toast

@onready var ov_menu: Control = $Overlays/Menu
@onready var ov_level: Control = $Overlays/LevelClear
@onready var ov_over: Control = $Overlays/GameOver
@onready var ov_pause: Control = $Overlays/Pause

@onready var btn_start: Button = $Overlays/Menu/VBox/StartButton
@onready var btn_next: Button = $Overlays/LevelClear/VBox/NextButton
@onready var btn_double: Button = $Overlays/LevelClear/VBox/DoubleButton
@onready var btn_retry: Button = $Overlays/GameOver/VBox/RetryButton
@onready var btn_revive: Button = $Overlays/GameOver/VBox/ReviveButton
@onready var btn_menu_from_over: Button = $Overlays/GameOver/VBox/MenuButton
@onready var btn_resume: Button = $Overlays/Pause/VBox/ResumeButton
@onready var btn_menu_from_pause: Button = $Overlays/Pause/VBox/MenuButton
@onready var level_stats: Label = $Overlays/LevelClear/VBox/Stats
@onready var over_stats: Label = $Overlays/GameOver/VBox/Stats
@onready var menu_stats: Label = $Overlays/Menu/VBox/MenuStats
@onready var level_vbox: VBoxContainer = $Overlays/LevelClear/VBox
@onready var menu_vbox: VBoxContainer = $Overlays/Menu/VBox

# 补给队商店面板（过关结算界面内，代码构建）
var shop_panel: VBoxContainer = null
var shop_box: VBoxContainer = null
var shop_coins_label: Label = null
var char_btn: Button = null
var skill_btn: Button = null
var vpad_left: Button = null
var vpad_right: Button = null
var coin_test_btn: Button = null

## ==== 临时调试按钮开关（正式发布前置 false 或删除按钮即可）====
const TEST_COIN_BTN_ENABLED: bool = true
const TEST_COIN_AMOUNT: int = 500

var _toast_tween: Tween


func _ready() -> void:
	# Web/全局默认中文字体：圆润中文字体（动态控件无显式字体时也走中文，避免 Web 无系统中文字体乱码）
	_apply_global_font()
	btn_start.pressed.connect(_on_start)
	btn_next.pressed.connect(_on_next)
	btn_double.pressed.connect(_on_double)
	btn_retry.pressed.connect(_on_retry)
	btn_revive.pressed.connect(_on_revive)
	btn_menu_from_over.pressed.connect(_on_menu)
	btn_resume.pressed.connect(_on_resume)
	btn_menu_from_pause.pressed.connect(_on_menu)

	game.state_changed.connect(_on_state)
	game.hud_refresh.connect(refresh_hud)
	game.show_message.connect(_toast)

	GameState.score_changed.connect(func(_v: int) -> void: refresh_hud())
	GameState.coins_changed.connect(func(_v: int) -> void: refresh_hud())
	GameState.lives_changed.connect(func(_v: int) -> void: refresh_hud())

	for ov in [ov_menu, ov_level, ov_over, ov_pause]:
		if ov:
			ov.mouse_filter = Control.MOUSE_FILTER_STOP

	_build_char_btn()
	_build_skill_btn()
	_build_virtual_buttons()
	_build_test_coin_btn()
	_on_state(game.state)
	refresh_hud()
	_toast("救火英雄 IAA · Godot 4.7")


func _on_start() -> void:
	Sfx.play("sfx_ui_click")
	if game.has_method("start_run"):
		game.start_run()


func _on_next() -> void:
	Sfx.play("sfx_ui_click")
	if game.has_method("continue_next_level"):
		game.continue_next_level()


func _on_double() -> void:
	Sfx.play("sfx_ui_click")
	if game.has_method("mock_double_coins"):
		game.mock_double_coins()
	_sync_double_btn()


func _on_retry() -> void:
	Sfx.play("sfx_ui_click")
	if game.has_method("retry_run"):
		game.retry_run()


func _on_revive() -> void:
	Sfx.play("sfx_ui_click")
	if game.has_method("mock_revive"):
		game.mock_revive()
	btn_revive.disabled = GameState.revive_used


func _on_menu() -> void:
	Sfx.play("sfx_ui_click")
	if game.has_method("go_menu"):
		game.go_menu()


func _on_resume() -> void:
	Sfx.play("sfx_ui_click")
	if game.has_method("resume_game"):
		game.resume_game()


func _on_state(s: int) -> void:
	ov_menu.visible = s == game.State.MENU
	ov_level.visible = s == game.State.LEVELUP
	ov_over.visible = s == game.State.OVER
	ov_pause.visible = s == game.State.PAUSE
	hud.visible = s != game.State.MENU
	# 虚拟按钮/技能只在游玩中显示
	var playing: bool = s == game.State.PLAYING
	if vpad_left:
		vpad_left.visible = playing
	if vpad_right:
		vpad_right.visible = playing
	if skill_btn:
		skill_btn.visible = playing
	_sync_skill_btn()

	if s == game.State.LEVELUP:
		level_stats.text = "本关奖励\n分数 +%d　金币 +%d" % [game.level_bonus, game.level_bonus]
		_sync_double_btn()
		_rebuild_shop()
	if s == game.State.OVER:
		over_stats.text = "本局得分 %d\n最高分 %d\n金币 %d\n到达第 %d 关" % [
			GameState.score, GameState.best, GameState.coins, GameState.level
		]
		btn_revive.disabled = GameState.revive_used
	if s == game.State.MENU:
		_refresh_menu_stats()
	refresh_hud()


func _sync_double_btn() -> void:
	var claimed: bool = false
	if game.has_method("is_double_claimed"):
		claimed = bool(game.is_double_claimed())
	btn_double.disabled = claimed
	btn_double.text = "已领取双倍" if claimed else "看广告 · 双倍金币"


func _refresh_menu_stats() -> void:
	if menu_stats:
		menu_stats.text = "最高分 %d　金币 %d" % [GameState.best, GameState.coins]
	_sync_char_btn()


func refresh_hud() -> void:
	# 图标已单独显示，Label 只放数值
	label_level.text = str(GameState.level)
	label_score.text = str(GameState.score)
	label_coins.text = str(GameState.coins)
	label_lives.text = str(GameState.lives)
	if game.has_method("get_goal_text"):
		label_goal.text = game.get_goal_text()
	if game.state == game.State.MENU:
		_refresh_menu_stats()
	_sync_skill_btn()


func _toast(text: String) -> void:
	label_toast.text = text
	label_toast.modulate.a = 1.0
	if _toast_tween and _toast_tween.is_valid():
		_toast_tween.kill()
	_toast_tween = create_tween()
	_toast_tween.tween_interval(1.2)
	_toast_tween.tween_property(label_toast, "modulate:a", 0.0, 0.5)


# ===== 补给队商店（过关结算内，代码构建） =====

## 全局默认字体：圆润中文字体（站酷快乐体子集，Web 无系统中文字体时兜底）
func _apply_global_font() -> void:
	var font: Font = load("res://assets/fonts/round_ui.ttf") as Font
	if font == null:
		return
	var th := Theme.new()
	th.default_font = font
	th.default_font_size = 15
	# 给 UI 下所有直接 Control 子节点设置（子控件继承）
	for child in get_children():
		if child is Control:
			(child as Control).theme = th

func _box_style() -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.07, 0.11, 0.16, 0.82)
	sb.set_border_width_all(1)
	sb.border_color = Color(1, 0.69, 0.125, 0.6)
	sb.set_corner_radius_all(10)
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	sb.content_margin_top = 8
	sb.content_margin_bottom = 8
	return sb


func _btn_style(bg: Color) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(8)
	sb.content_margin_left = 10
	sb.content_margin_right = 10
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	return sb


func _shop_clear() -> void:
	if shop_panel != null and is_instance_valid(shop_panel):
		shop_panel.queue_free()
	shop_panel = null
	shop_box = null
	shop_coins_label = null


func _rebuild_shop() -> void:
	_shop_clear()
	if game == null or not is_instance_valid(game):
		return
	# 商品面板容器
	shop_panel = VBoxContainer.new()
	shop_panel.add_theme_constant_override("separation", 6)
	var title := Label.new()
	title.text = "补给队 · 过关补给"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 18)
	shop_panel.add_child(title)

	# 金币余额行
	shop_coins_label = Label.new()
	shop_coins_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	shop_coins_label.add_theme_color_override("font_color", Color(1, 0.88, 0.45))
	shop_panel.add_child(shop_coins_label)

	# 商品行（英雄位 + 道具位）外层框
	shop_box = VBoxContainer.new()
	shop_box.add_theme_constant_override("separation", 6)
	shop_box.add_theme_stylebox_override("panel", _box_style())
	shop_panel.add_child(shop_box)

	# 插入到「下一关」按钮之前（btn_next 已在 VBox 尾部）
	level_vbox.add_child(shop_panel)
	if is_instance_valid(btn_next):
		level_vbox.move_child(shop_panel, btn_next.get_index())

	_render_shop_rows()


func _render_shop_rows() -> void:
	if shop_box == null or not is_instance_valid(shop_box):
		return
	for c in shop_box.get_children():
		if is_instance_valid(c):
			c.queue_free()
	if shop_coins_label:
		shop_coins_label.text = "金币 %d" % GameState.coins
	if game == null or not is_instance_valid(game):
		return
	var stock: Dictionary = game.get_shop_stock()

	# 英雄位
	var hero: int = int(stock.get("hero", -1))
	if hero >= 0 and not GameState.has_skin(hero):
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		var info := Label.new()
		info.text = "%s · %s" % [
			str(CharacterDB.role(hero).get("name", "")),
			str(CharacterDB.role(hero).get("ability", "")),
		]
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(info)
		var btn := Button.new()
		var cost: int = int(CharacterDB.role(hero).get("cost", 0))
		btn.text = "%d 金币解锁" % cost
		btn.add_theme_stylebox_override("normal", _btn_style(Color(1, 0.69, 0.125)))
		btn.disabled = GameState.coins < cost
		btn.pressed.connect(func() -> void:
			if game.buy_shop_hero():
				_render_shop_rows()
		)
		row.add_child(btn)
		shop_box.add_child(row)

	# 道具位
	var items: Array = stock.get("items", [])
	for key: Variant in items:
		var k: String = str(key)
		if not ShopDB.ITEM_DEFS.has(k):
			continue
		var def: Dictionary = ShopDB.ITEM_DEFS[k] as Dictionary
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		var info := Label.new()
		info.text = "%s · %s" % [str(def.get("name", k)), str(def.get("desc", ""))]
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.add_child(info)
		var btn := Button.new()
		btn.text = "%d 金币" % int(def.get("price", 100))
		btn.add_theme_stylebox_override("normal", _btn_style(Color(0.2, 0.45, 0.32)))
		btn.disabled = GameState.coins < int(def.get("price", 100))
		btn.pressed.connect(func() -> void:
			if game.buy_shop_item(k):
				_render_shop_rows()
		)
		row.add_child(btn)
		shop_box.add_child(row)

	# 刷新（激励视频 mock：立即刷新）
	var refresh_row := HBoxContainer.new()
	var refresh_info := Label.new()
	refresh_info.text = "商品不满意？"
	refresh_info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	refresh_row.add_child(refresh_info)
	var refresh_btn := Button.new()
	refresh_btn.text = "看广告刷新"
	refresh_btn.add_theme_stylebox_override("normal", _btn_style(Color(0.2, 0.36, 0.58)))
	refresh_btn.pressed.connect(func() -> void:
		game.mock_refresh_shop()
		_render_shop_rows()
	)
	refresh_row.add_child(refresh_btn)
	shop_box.add_child(refresh_row)


# ===== 主菜单角色切换 =====

func _build_char_btn() -> void:
	if char_btn != null and is_instance_valid(char_btn):
		char_btn.queue_free()
	char_btn = Button.new()
	char_btn.add_theme_stylebox_override("normal", _btn_style(Color(0.35, 0.24, 0.1)))
	_sync_char_btn()
	char_btn.pressed.connect(_cycle_character)
	# 插到 StartButton 之前（menu_vbox children: Title/Sub/MenuStats/StartButton）
	menu_vbox.add_child(char_btn)
	if is_instance_valid(btn_start):
		menu_vbox.move_child(char_btn, btn_start.get_index())


func _sync_char_btn() -> void:
	if char_btn == null or not is_instance_valid(char_btn):
		return
	var cur_name: String = str(CharacterDB.role(GameState.skin_index).get("name", ""))
	var ability: String = str(CharacterDB.role(GameState.skin_index).get("ability", ""))
	# 不用 emoji（字体无 emoji 字形，Web 会显示方块）
	char_btn.text = "角色：%s · %s（点击切换）" % [cur_name, ability]
	char_btn.tooltip_text = "在已拥有角色间切换"


func _cycle_character() -> void:
	var owned: Array = GameState.owned_skins.duplicate()
	if owned.is_empty():
		return
	owned.sort()
	var cur: int = GameState.skin_index
	var next_idx: int = -1
	for i in range(1, owned.size() + 1):
		var candidate: int = int(owned[(owned.find(cur) + i) % owned.size()])
		if candidate != cur:
			next_idx = candidate
			break
	if next_idx >= 0:
		GameState.set_skin(next_idx)
		if game.has_method("apply_skin_change"):
			game.apply_skin_change()
		_sync_char_btn()
		_refresh_menu_stats()
		_toast("切换为：" + str(CharacterDB.role(next_idx).get("name", "")))


# ===== 触屏左右虚拟按钮（手机操控蹦床）=====

func _build_virtual_buttons() -> void:
	_vpad_clear()
	vpad_left = _make_vpad("◀", -1.0)
	vpad_right = _make_vpad("▶", 1.0)

func _vpad_clear() -> void:
	for b in [vpad_left, vpad_right]:
		if b != null and is_instance_valid(b):
			b.queue_free()
	vpad_left = null
	vpad_right = null

func _make_vpad(label_text: String, dir: float) -> Button:
	var b := Button.new()
	b.text = label_text
	b.visible = false
	# 大号半透明触控钮，屏幕底部左右两侧（逻辑 450×800）
	var st := StyleBoxFlat.new()
	st.bg_color = Color(1, 1, 1, 0.10)
	st.border_color = Color(1, 1, 1, 0.35)
	st.set_border_width_all(2)
	st.set_corner_radius_all(999)
	b.add_theme_stylebox_override("normal", st)
	b.add_theme_font_size_override("font_size", 34)
	b.custom_minimum_size = Vector2(120, 110)
	var sz := b.custom_minimum_size
	if dir < 0.0:
		b.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
		b.offset_left = 18.0
		b.offset_top = -sz.y - 20.0
	else:
		b.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
		b.offset_left = -sz.x - 18.0
		b.offset_top = -sz.y - 20.0
	b.offset_right = b.offset_left + sz.x
	b.offset_bottom = b.offset_top + sz.y
	b.button_down.connect(func() -> void:
		if game != null and is_instance_valid(game) and game.has_method("paddle_dir"):
			game.paddle_dir(dir)
	)
	b.button_up.connect(func() -> void:
		if game != null and is_instance_valid(game) and game.has_method("paddle_dir"):
			game.paddle_dir(0.0)
	)
	hud.add_child(b)
	return b


# ===== 临时测试：右上角 +金币按钮（正式发布删此方法 + _ready 调用 + TEST 常量） =====

func _build_test_coin_btn() -> void:
	if not TEST_COIN_BTN_ENABLED:
		return
	if coin_test_btn != null and is_instance_valid(coin_test_btn):
		coin_test_btn.queue_free()
	coin_test_btn = Button.new()
	coin_test_btn.text = "+%d 金币" % TEST_COIN_AMOUNT
	coin_test_btn.tooltip_text = "临时调试：加金币（正式版去掉）"
	coin_test_btn.add_theme_stylebox_override("normal", _btn_style(Color(0.8, 0.62, 0.1)))
	coin_test_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	coin_test_btn.offset_left = -118.0
	coin_test_btn.offset_top = 46.0
	coin_test_btn.offset_right = -8.0
	coin_test_btn.offset_bottom = 80.0
	coin_test_btn.pressed.connect(func() -> void:
		GameState.add_coins(TEST_COIN_AMOUNT)
		GameState.save()
		_toast("测试金币 +%d（当前 %d）" % [TEST_COIN_AMOUNT, GameState.coins])
		# 商店开着则刷新商品行金币余额
		if shop_panel != null and is_instance_valid(shop_panel):
			_render_shop_rows()
	)
	# 挂到顶层 Overlays：主菜单/商店/游戏中都能点
	$Overlays.add_child(coin_test_btn)


# ===== 狐狸技能按钮 =====

func _build_skill_btn() -> void:
	if skill_btn != null and is_instance_valid(skill_btn):
		skill_btn.queue_free()
	skill_btn = Button.new()
	skill_btn.text = "影分身"
	skill_btn.add_theme_stylebox_override("normal", _btn_style(Color(0.7, 0.25, 0.12)))
	skill_btn.visible = false
	# 右下但抬升到蹦床上方空中（y≈560-610），避开底部左右虚拟按钮区
	skill_btn.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	skill_btn.offset_left = -150.0
	skill_btn.offset_top = -240.0
	skill_btn.offset_right = -20.0
	skill_btn.offset_bottom = -188.0
	skill_btn.pressed.connect(func() -> void:
		if game.has_method("use_skill"):
			game.use_skill()
		_sync_skill_btn()
	)
	hud.add_child(skill_btn)


func _sync_skill_btn() -> void:
	if skill_btn == null or not is_instance_valid(skill_btn):
		return
	var can: bool = false
	if game != null and is_instance_valid(game) and game.has_method("can_use_skill"):
		can = bool(game.can_use_skill())
	var is_fox: bool = CharacterDB.cur_is("fox")
	skill_btn.visible = can or (is_fox and _cd_left() > 0.0 and game != null and game.state == game.State.PLAYING)
	if not is_fox:
		skill_btn.visible = false
		return
	if can:
		skill_btn.text = "影分身"
		skill_btn.disabled = false
	else:
		var cd: float = _cd_left()
		if cd > 0.0:
			skill_btn.text = "冷却 %.1fs" % cd
			skill_btn.disabled = true
		else:
			skill_btn.text = "影分身"
			skill_btn.disabled = true


func _cd_left() -> float:
	if game != null and is_instance_valid(game) and game.has_method("get_skill_cd_left"):
		return float(game.get_skill_cd_left())
	return 0.0


func _process(_delta: float) -> void:
	# 冷却中刷新 CD 文本
	if skill_btn != null and is_instance_valid(skill_btn) and skill_btn.visible:
		if _cd_left() > 0.0:
			skill_btn.text = "冷却 %.1fs" % _cd_left()
