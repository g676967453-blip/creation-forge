extends Node
class_name BattleFlowController
## 战斗生命周期 — 倒计时→波次→结算→返回经营

const SCENE_BATTLEFIELD := ^"Battlefield"
const NODE_ENEMIES := ^"Enemies"
const NODE_PROJECTILES := ^"Projectiles"

signal battle_ended(victory: bool)

var _battle_time: float = 0.0
var _kill_count: int = 0

var main_peak
var wave_manager: WaveManager
var battle_hud: Control
var result_ui: Control
var countdown_label: Label
var ui_state_coordinator: UIStateCoordinator
var economy_manager: EconomyManager


func setup(p_main_peak, p_wave_manager, p_battle_hud, p_result_ui, p_countdown_label, p_ui_state_coordinator, p_economy_manager) -> void:
	main_peak = p_main_peak
	wave_manager = p_wave_manager
	battle_hud = p_battle_hud
	result_ui = p_result_ui
	countdown_label = p_countdown_label
	ui_state_coordinator = p_ui_state_coordinator
	economy_manager = p_economy_manager


func _show_countdown(text: String, duration: float) -> void:
	if countdown_label == null:
		return
	countdown_label.text = text
	countdown_label.visible = true
	var tween := create_tween()
	tween.tween_interval(duration)
	tween.tween_callback(func():
		if countdown_label:
			countdown_label.visible = false
	)


func start_battle() -> void:
	if ui_state_coordinator.current_state != GameManager.GameState.PREPARATION:
		return
	var challenge_cost := DataManager.get_game_config_int("challenge_cost_energy", 100)
	if not economy_manager.spend_energy(challenge_cost):
		return
	_kill_count = 0
	economy_manager.blessing_manager.reset_run()
	_battle_time = 0.0
	ui_state_coordinator.set_state(GameManager.GameState.BATTLE)
	economy_manager._pending_upgrade_count += 1
	economy_manager._trigger_battle_upgrade()
	await economy_manager.card_resolved
	if ui_state_coordinator.current_state != GameManager.GameState.BATTLE:
		return
	if main_peak:
		main_peak.set_battle_active(false)
	_show_countdown("3", 1.0)
	await get_tree().create_timer(1.0).timeout
	if ui_state_coordinator.current_state != GameManager.GameState.BATTLE:
		return
	_show_countdown("2", 1.0)
	await get_tree().create_timer(1.0).timeout
	if ui_state_coordinator.current_state != GameManager.GameState.BATTLE:
		return
	_show_countdown("1", 1.0)
	await get_tree().create_timer(1.0).timeout
	if ui_state_coordinator.current_state != GameManager.GameState.BATTLE:
		return
	if main_peak:
		main_peak.set_battle_active(true)
	wave_manager.start_battle()


func _on_battle_started() -> void:
	if battle_hud and battle_hud.has_method("set_wave_info"):
		battle_hud.set_wave_info(1, max(1, wave_manager.wave_configs.size()))
		battle_hud.update_enemy_count(wave_manager.enemies_alive)
		battle_hud.update_level(economy_manager.current_level, economy_manager.current_exp, economy_manager.exp_to_next)
		if main_peak and battle_hud.has_method("update_hp"):
			battle_hud.update_hp(main_peak.current_hp, main_peak.max_hp)
		if battle_hud.has_method("update_battle_timer"):
			battle_hud.update_battle_timer(_battle_time)
		if battle_hud.has_method("update_energy"):
			battle_hud.update_energy(0, 100, "")


func _on_battle_ended() -> void:
	main_peak.set_battle_active(false)
	if battle_hud and battle_hud.has_method("set_battle_active"):
		battle_hud.set_battle_active(false)


func _process(_delta: float) -> void:
	if ui_state_coordinator.current_state == GameManager.GameState.BATTLE:
		_battle_time += _delta
		if battle_hud:
			battle_hud.update_enemy_count(wave_manager.enemies_alive)
			if main_peak and battle_hud.has_method("update_hp"):
				battle_hud.update_hp(main_peak.current_hp, main_peak.max_hp)
			if battle_hud.has_method("update_battle_timer"):
				battle_hud.update_battle_timer(_battle_time)


func _on_wave_changed(wave_idx: int, total: int) -> void:
	if battle_hud and battle_hud.has_method("set_wave_info"):
		battle_hud.set_wave_info(wave_idx, total)
	_show_countdown("第 %d 波" % wave_idx, 3.0)


func _on_victory() -> void:
	economy_manager.add_stone(DataManager.get_game_config_int("victory_reward_nuwa_stone", 1))
	economy_manager.add_energy(_kill_count * DataManager.get_game_config_int("victory_reward_energy_per_kill", 1))
	var peak_ids := DataManager.peak_config_database.keys()
	if not peak_ids.is_empty():
		for index in range(DataManager.get_game_config_int("victory_reward_treasure_count", 1)):
			economy_manager.add_treasure(str(peak_ids.pick_random()), 1)
	economy_manager.apply_idle_boost()
	ui_state_coordinator.set_state(GameManager.GameState.GAME_OVER)
	if result_ui and result_ui.has_method("show_result"):
		result_ui.show_result(true)
	battle_ended.emit(true)


func on_defeat() -> void:
	if main_peak and main_peak.has_method("set_invincible"):
		main_peak.current_hp = main_peak.max_hp
		main_peak.queue_redraw()
	ui_state_coordinator.set_state(GameManager.GameState.GAME_OVER)
	if result_ui and result_ui.has_method("show_result"):
		result_ui.show_result(false)
	battle_ended.emit(false)


func on_enemy_killed(_exp_reward: int) -> void:
	_kill_count += 1


func return_to_preparation() -> void:
	get_tree().paused = false
	_clear_battlefield()
	wave_manager.reset_battle()
	main_peak.current_hp = main_peak.max_hp
	main_peak.queue_redraw()
	main_peak.set_battle_active(false)
	economy_manager.reset_progress()
	economy_manager.blessing_manager.reset_run()
	ui_state_coordinator.set_state(GameManager.GameState.PREPARATION)
	ui_state_coordinator.update_ui()


func _clear_battlefield() -> void:
	var battlefield = get_tree().current_scene.get_node_or_null(SCENE_BATTLEFIELD)
	if not battlefield:
		return
	var enemies_node := battlefield.get_node_or_null(NODE_ENEMIES)
	if enemies_node:
		for child in enemies_node.get_children():
			child.queue_free()
	var projectiles_node := battlefield.get_node_or_null(NODE_PROJECTILES)
	if projectiles_node:
		for child in projectiles_node.get_children():
			child.queue_free()


func restart_game() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()
