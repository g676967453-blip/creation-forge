##
## [功能简报] 器灵选择 — GameManager 侧改动
## 简报：2026-07-27-器灵选择-功能简报.md
##
## 本功能在 GameManager 中的改动：
##   1. INTRO 状态结束后 → 切换到 MAIN_PEAK_SELECT
##   2. 接收 start_game_requested 信号 → 绑定器灵 → 切换到 PREPARATION
##
## 涉及信号（本功能相关）：
##   接收 — intro_finished (from IntroScreen) → _on_intro_finished()
##   接收 — start_game_requested(profile_id) (from MainPeakSelectPanel) → _on_start_game_requested()
##
## 数据：
##   读 — DataManager.get_spirit_profile(id)
##   写 — main_peak.set_form(icon_path) / main_peak.set_meta("spirit_profile", id)
##
## 流程：
##   INTRO 状态 → intro_finished 信号 → _on_intro_finished()
##   → set_state(MAIN_PEAK_SELECT)
##   → 玩家在面板中确认 → start_game_requested 信号
##   → _on_start_game_requested(profile_id)
##     → 查 spirit_profile_config → set_form 加载图标
##     → set_meta 记录绑定 → set_state(PREPARATION)
##
extends Node
class_name GameManager

enum GameState { MAIN_PEAK_SELECT, PREPARATION, BATTLE, CARD_SELECTION, GAME_OVER, INTRO }

signal spirit_changed(value: int)
signal state_changed(new_state: int)

const NODE_MAIN_PEAK := ^"Battlefield/MainPeak"
const NODE_BATTLE_HUD := ^"UI/BattleHUD"
const NODE_CARD_SELECTION := ^"UI/CardSelectionPanel"
const NODE_RESULT := ^"UI/ResultPanel"
const NODE_REPAIR_PROMPT := ^"UI/RepairPromptPanel"
const NODE_BATTLE_START := ^"UI/BattleStartButton"
const NODE_MAIN_PEAK_SELECT := ^"UI/MainPeakSelectPanel"
const NODE_SETTINGS := ^"UI/SettingsButton"
const NODE_COUNTDOWN := ^"UI/CountdownLabel"
const NODE_INTRO := ^"UI/IntroScreen"

@onready var wave_manager: WaveManager = $WaveManager
@onready var economy_manager: EconomyManager = $EconomyManager
@onready var battle_flow: BattleFlowController = $BattleFlowController
@onready var ui_coordinator: UIStateCoordinator = $UIStateCoordinator
@onready var mountain_manager: Node = get_node_or_null("../MountainManager")
@onready var spirit_growth_manager: SpiritGrowthManager = _get_or_create_spirit_growth()
## V0.1 新模块
@onready var blessing_manager: BlessingManager = _get_or_create_blessing_manager()

var main_peak
var spirit_seat: SpiritSeat = null  ## V0.1 器灵引用
var main_peak_select_panel: Control
var battle_hud: Control
var card_selection_ui: Control
var result_ui: Control
var repair_prompt_ui: Control
var battle_start_button_ui: Control
var settings_button_ui: Control
var countdown_label: Label
var intro_screen: Control

func _ready() -> void:
	var root = get_tree().current_scene
	main_peak = root.get_node(NODE_MAIN_PEAK)
	battle_hud = root.get_node(NODE_BATTLE_HUD)
	card_selection_ui = root.get_node(NODE_CARD_SELECTION)
	result_ui = root.get_node(NODE_RESULT)
	repair_prompt_ui = root.get_node_or_null(NODE_REPAIR_PROMPT)
	battle_start_button_ui = root.get_node_or_null(NODE_BATTLE_START)
	main_peak_select_panel = root.get_node_or_null(NODE_MAIN_PEAK_SELECT)
	settings_button_ui = root.get_node_or_null(NODE_SETTINGS)
	countdown_label = root.get_node_or_null(NODE_COUNTDOWN)
	intro_screen = root.get_node_or_null(NODE_INTRO)
	if countdown_label:
		countdown_label.visible = false

	if battle_hud and battle_hud.has_method("setup_main_peak"):
		battle_hud.setup_main_peak(main_peak)
	# V0.1: 注入新模块
	economy_manager.setup(main_peak, mountain_manager, card_selection_ui, battle_hud, blessing_manager)
	battle_flow.setup(main_peak, wave_manager, battle_hud, result_ui, countdown_label, ui_coordinator, economy_manager)
	ui_coordinator.setup(main_peak, main_peak_select_panel, battle_hud, card_selection_ui, result_ui, repair_prompt_ui, battle_start_button_ui, settings_button_ui, economy_manager, mountain_manager, intro_screen)

	if main_peak:
		main_peak.clicked.connect(economy_manager.handle_main_peak_clicked)
		main_peak.main_peak_destroyed.connect(battle_flow.on_defeat)
	if battle_start_button_ui and battle_start_button_ui.has_method("set_enabled"):
		battle_start_button_ui.pressed.connect(ui_coordinator._on_battle_start_button_pressed)
	if settings_button_ui and settings_button_ui.has_signal("pressed"):
		settings_button_ui.pressed.connect(battle_flow.restart_game)
	if card_selection_ui and card_selection_ui.has_signal("card_selected"):
		card_selection_ui.card_selected.connect(economy_manager.on_card_selected)
	if result_ui and result_ui.has_signal("return_requested"):
		result_ui.return_requested.connect(battle_flow.return_to_preparation)
	if mountain_manager:
		mountain_manager.mountain_state_changed.connect(ui_coordinator._on_mountain_state_changed)
		if mountain_manager.has_signal("mountain_deselected"):
			mountain_manager.mountain_deselected.connect(ui_coordinator.on_mountain_deselected)
		if mountain_manager.has_signal("repair_prompt_requested"):
			mountain_manager.repair_prompt_requested.connect(ui_coordinator._on_repair_prompt_requested)
		if mountain_manager.has_signal("mountain_repaired") and spirit_growth_manager:
			mountain_manager.mountain_repaired.connect(spirit_growth_manager.on_mountain_repaired)
	if repair_prompt_ui and repair_prompt_ui.has_signal("repair_requested"):
		repair_prompt_ui.repair_requested.connect(economy_manager.repair_selected_mountain)
	if main_peak_select_panel and main_peak_select_panel.has_signal("start_game_requested"):
		main_peak_select_panel.start_game_requested.connect(_on_start_game_requested)
	if intro_screen and intro_screen.has_signal("intro_finished"):
		intro_screen.intro_finished.connect(_on_intro_finished)

	var mpcfg = DataManager.main_peak_config
	if economy_manager._auto_spirit_timer:
		economy_manager._auto_spirit_timer.wait_time = mpcfg.spirit_auto_interval if mpcfg else 0.2
		economy_manager._auto_spirit_timer.timeout.connect(economy_manager._on_auto_spirit_tick)
	if economy_manager._auto_display_timer:
		economy_manager._auto_display_timer.wait_time = mpcfg.spirit_display_interval if mpcfg else 1.0
		economy_manager._auto_display_timer.timeout.connect(economy_manager._on_auto_display_tick)

	blessing_manager.initialize(DataManager.get_all_blessings())
	blessing_manager.blessing_applied.connect(_on_blessing_applied)
	wave_manager.load_waves(DataManager.get_waves())
	wave_manager.all_waves_completed.connect(battle_flow._on_victory)
	wave_manager.wave_changed.connect(battle_flow._on_wave_changed)
	wave_manager.battle_started.connect(battle_flow._on_battle_started)
	wave_manager.battle_ended.connect(battle_flow._on_battle_ended)
	wave_manager.enemy_killed.connect(economy_manager.add_exp)
	wave_manager.enemy_killed.connect(battle_flow.on_enemy_killed)
	SaveManager.bind_runtime(economy_manager, mountain_manager)
	if mountain_manager and mountain_manager.has_signal("mountain_repaired"):
		mountain_manager.mountain_repaired.connect(func(_peak_id): SaveManager.save_game())
	battle_flow.battle_ended.connect(func(_victory): SaveManager.save_game())

	economy_manager.spirit_updated.connect(func(val): spirit_changed.emit(val))
	economy_manager.spirit_updated.connect(func(_val): ui_coordinator.update_ui())
	economy_manager.upgrade_triggered.connect(func(): ui_coordinator.set_state(GameState.CARD_SELECTION))
	economy_manager.card_resolved.connect(func(): ui_coordinator.set_state(GameState.BATTLE))
	ui_coordinator.state_changed.connect(func(new_state): state_changed.emit(new_state))
	ui_coordinator.battle_start_button_pressed.connect(battle_flow.start_battle)

	# 开场黑幕 → 器灵选择；intro 节点缺失时直接回退到器灵选择（防御式）
	ui_coordinator.set_state(GameState.INTRO if intro_screen else GameState.MAIN_PEAK_SELECT)
	ui_coordinator.update_ui()


func _on_intro_finished() -> void:
	ui_coordinator.set_state(GameState.MAIN_PEAK_SELECT)


func _on_start_game_requested(profile_id: String) -> void:
	var profile = DataManager.get_spirit_profile(profile_id)
	if profile == null:
		return
	if main_peak:
		if not profile.icon_path.is_empty():
			main_peak.set_form(profile.icon_path)
		main_peak.set_meta("spirit_profile", profile_id)
	ui_coordinator.set_state(GameState.PREPARATION)
	ui_coordinator.update_ui()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or (event is InputEventKey and event.keycode == KEY_ESCAPE and event.pressed):
		# 开场黑幕阶段 ESC 交给 IntroScreen 作跳过, 不触发整局重启
		if ui_coordinator.current_state == GameState.INTRO:
			return
		battle_flow.restart_game()
		return

	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed and ui_coordinator.current_state == GameState.PREPARATION:
		if main_peak and is_instance_valid(main_peak) and main_peak.has_method("contains_global_point") and main_peak.contains_global_point(event.position):
			economy_manager.handle_main_peak_clicked(event.position)
			get_viewport().set_input_as_handled()
			return
		if mountain_manager and mountain_manager.has_method("try_select_peak_at_point") and mountain_manager.try_select_peak_at_point(event.position):
			get_viewport().set_input_as_handled()
			return

	if not (event is InputEventKey) or not event.pressed:
		return

	if not OS.is_debug_build():
		return
	if event.keycode == KEY_F1:
		Engine.time_scale = 3.0 if Engine.time_scale < 2.0 else 1.0
	elif event.keycode == KEY_F2:
		if main_peak and is_instance_valid(main_peak):
			main_peak.set_invincible(not main_peak._invincible)
	elif event.keycode == KEY_F3:
		if ui_coordinator.current_state == GameState.BATTLE:
			economy_manager._trigger_battle_upgrade()


func _get_or_create_spirit_growth() -> SpiritGrowthManager:
	var existing := get_node_or_null("SpiritGrowthManager")
	if existing and existing is SpiritGrowthManager:
		return existing as SpiritGrowthManager
	var new_node := SpiritGrowthManager.new()
	new_node.name = "SpiritGrowthManager"
	add_child(new_node)
	return new_node


func _get_or_create_blessing_manager() -> BlessingManager:
	var existing := get_node_or_null("BlessingManager")
	if existing and existing is BlessingManager:
		return existing as BlessingManager
	var new_node := BlessingManager.new()
	new_node.name = "BlessingManager"
	add_child(new_node)
	return new_node


func _on_blessing_applied(_blessing_id: String, effect_key: String, effect_value: float, _effect_value_2: float, _tier: int) -> void:
	## V3.0 祝福应用：向器灵战斗实体分发效果。
	if spirit_seat and spirit_seat.has_method("apply_blessing"):
		spirit_seat.apply_blessing(effect_key, effect_value)
