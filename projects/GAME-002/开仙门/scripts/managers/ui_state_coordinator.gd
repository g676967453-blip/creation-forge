extends Node
class_name UIStateCoordinator
## UI 状态机 — 6 状态驱动 10 个面板显隐

signal state_changed(new_state: int)
signal battle_start_button_pressed

var current_state: int = GameManager.GameState.MAIN_PEAK_SELECT

var main_peak
var main_peak_select_panel: Control
var battle_hud: Control
var card_selection_ui: Control
var result_ui: Control
var repair_prompt_ui: Control
var battle_start_button_ui: Control
var settings_button_ui: Control
var economy_manager: EconomyManager
var mountain_manager: Node
var intro_screen: Control


func setup(p_main_peak, p_main_peak_select_panel, p_battle_hud, p_card_selection_ui, p_result_ui, p_repair_prompt_ui, p_battle_start_button_ui, p_settings_button_ui, p_economy_manager, p_mountain_manager, p_intro_screen = null) -> void:
	main_peak = p_main_peak
	main_peak_select_panel = p_main_peak_select_panel
	battle_hud = p_battle_hud
	card_selection_ui = p_card_selection_ui
	result_ui = p_result_ui
	repair_prompt_ui = p_repair_prompt_ui
	battle_start_button_ui = p_battle_start_button_ui
	settings_button_ui = p_settings_button_ui
	economy_manager = p_economy_manager
	mountain_manager = p_mountain_manager
	intro_screen = p_intro_screen


func set_state(new_state: int) -> void:
	current_state = new_state
	if intro_screen:
		intro_screen.visible = (new_state == GameManager.GameState.INTRO)
	if main_peak:
		main_peak.visible = (new_state != GameManager.GameState.MAIN_PEAK_SELECT and new_state != GameManager.GameState.INTRO)
	if main_peak_select_panel:
		main_peak_select_panel.visible = (new_state == GameManager.GameState.MAIN_PEAK_SELECT)
	if battle_hud:
		battle_hud.visible = (new_state == GameManager.GameState.BATTLE or new_state == GameManager.GameState.PREPARATION)
		if battle_hud.has_method("set_battle_active"):
			battle_hud.set_battle_active(new_state == GameManager.GameState.BATTLE)
	if card_selection_ui:
		card_selection_ui.visible = (new_state == GameManager.GameState.CARD_SELECTION)
	if result_ui:
		result_ui.visible = (new_state == GameManager.GameState.GAME_OVER)
	if repair_prompt_ui:
		repair_prompt_ui.visible = false
	if battle_start_button_ui:
		battle_start_button_ui.visible = (new_state == GameManager.GameState.PREPARATION)
		if battle_start_button_ui.has_method("set_enabled"):
			battle_start_button_ui.set_enabled(economy_manager.has_any_mountain_activated())
	if settings_button_ui:
		settings_button_ui.visible = (new_state == GameManager.GameState.PREPARATION or new_state == GameManager.GameState.BATTLE)
	if economy_manager:
		economy_manager.set_active(new_state == GameManager.GameState.PREPARATION)
	state_changed.emit(new_state)


func update_ui() -> void:
	if battle_hud and battle_hud.has_method("update_spirit"):
		battle_hud.update_spirit(economy_manager.spirit)
	if battle_hud and battle_hud.has_method("update_level"):
		battle_hud.update_level(economy_manager.current_level, economy_manager.current_exp, economy_manager.exp_to_next)
	if repair_prompt_ui and repair_prompt_ui.has_method("update_prompt"):
		repair_prompt_ui.update_prompt(economy_manager.get_selected_mountain_state())


func _on_mountain_state_changed(_peak_id: String) -> void:
	update_ui()
	if battle_start_button_ui and battle_start_button_ui.has_method("set_enabled"):
		battle_start_button_ui.set_enabled(economy_manager.has_any_mountain_activated())


func _on_repair_prompt_requested(_peak_id: String, can_repair: bool) -> void:
	if repair_prompt_ui and repair_prompt_ui.has_method("show_prompt"):
		repair_prompt_ui.show_prompt(economy_manager.get_selected_mountain_state(), can_repair)


func on_mountain_deselected() -> void:
	if repair_prompt_ui:
		repair_prompt_ui.visible = false


func _on_battle_start_button_pressed() -> void:
	battle_start_button_pressed.emit()
