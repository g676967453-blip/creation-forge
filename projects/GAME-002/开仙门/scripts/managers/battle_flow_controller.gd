extends Node
class_name BattleFlowController
## 战斗生命周期 — 倒计时→波次→结算→返回经营

const SCENE_BATTLEFIELD := ^"Battlefield"
const NODE_ENEMIES := ^"Enemies"
const NODE_PROJECTILES := ^"Projectiles"

signal battle_ended(victory: bool)

var _battle_time: float = 0.0

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
	# V0.1: 根据已修复山峰自动生成弟子
	var disciple_squad: DiscipleSquad = null
	if economy_manager and economy_manager.get("disciple_squad") != null:
		disciple_squad = economy_manager.disciple_squad as DiscipleSquad
	if disciple_squad:
		var all_disciples := DataManager.get_all_disciples()
		var active_peaks: Array[String] = []
		if economy_manager.mountain_manager and economy_manager.mountain_manager.has_method("get_all_activated_form_ids"):
			active_peaks = economy_manager.mountain_manager.get_all_activated_form_ids()
		# 为每个已激活的山峰招募对应弟子
		for peak_id in active_peaks:
			for d in all_disciples:
				if d.peak_id == peak_id:
					disciple_squad.recruit(peak_id, d)
					break
		print("[BattleFlowController] V0.1: spawned %d disciples" % disciple_squad.get_disciples().size())
	_battle_time = 0.0
	ui_state_coordinator.set_state(GameManager.GameState.BATTLE)
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
	ui_state_coordinator.set_state(GameManager.GameState.GAME_OVER)
	if result_ui and result_ui.has_method("show_result"):
		result_ui.show_result(true)
	battle_ended.emit(true)


func on_defeat() -> void:
	ui_state_coordinator.set_state(GameManager.GameState.GAME_OVER)
	if result_ui and result_ui.has_method("show_result"):
		result_ui.show_result(false)
	battle_ended.emit(false)


func return_to_preparation() -> void:
	get_tree().paused = false
	_clear_battlefield()
	wave_manager.reset_battle()
	main_peak.current_hp = main_peak.max_hp
	main_peak.queue_redraw()
	main_peak.set_battle_active(false)
	economy_manager.reset_progress()
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
