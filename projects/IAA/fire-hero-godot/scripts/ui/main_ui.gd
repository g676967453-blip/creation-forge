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

var _toast_tween: Tween


func _ready() -> void:
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

	_on_state(game.state)
	refresh_hud()
	_toast("救火英雄 IAA · Godot 4.7")


func _on_start() -> void:
	if game.has_method("start_run"):
		game.start_run()


func _on_next() -> void:
	if game.has_method("continue_next_level"):
		game.continue_next_level()


func _on_double() -> void:
	if game.has_method("mock_double_coins"):
		game.mock_double_coins()
	_sync_double_btn()


func _on_retry() -> void:
	if game.has_method("retry_run"):
		game.retry_run()


func _on_revive() -> void:
	if game.has_method("mock_revive"):
		game.mock_revive()
	btn_revive.disabled = GameState.revive_used


func _on_menu() -> void:
	if game.has_method("go_menu"):
		game.go_menu()


func _on_resume() -> void:
	if game.has_method("resume_game"):
		game.resume_game()


func _on_state(s: int) -> void:
	ov_menu.visible = s == game.State.MENU
	ov_level.visible = s == game.State.LEVELUP
	ov_over.visible = s == game.State.OVER
	ov_pause.visible = s == game.State.PAUSE
	hud.visible = s != game.State.MENU

	if s == game.State.LEVELUP:
		level_stats.text = "本关奖励\n⭐ +%d 分　💰 +%d 金币" % [game.level_bonus, game.level_bonus]
		_sync_double_btn()
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
	btn_double.text = "已领取双倍" if claimed else "📺 看广告双倍金币（mock）"


func _refresh_menu_stats() -> void:
	if menu_stats:
		menu_stats.text = "🏆 最高分 %d　　💰 金币 %d" % [GameState.best, GameState.coins]


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


func _toast(text: String) -> void:
	label_toast.text = text
	label_toast.modulate.a = 1.0
	if _toast_tween and _toast_tween.is_valid():
		_toast_tween.kill()
	_toast_tween = create_tween()
	_toast_tween.tween_interval(1.2)
	_toast_tween.tween_property(label_toast, "modulate:a", 0.0, 0.5)
