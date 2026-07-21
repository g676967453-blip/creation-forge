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
	var form_ids: Array = []
	var levels: Dictionary = {}
	if economy_manager.mountain_manager and economy_manager.mountain_manager.has_method("debug_dump_mountain_forms"):
		economy_manager.mountain_manager.debug_dump_mountain_forms()
	if economy_manager.mountain_manager and economy_manager.mountain_manager.has_method("get_all_activated_form_ids"):
		form_ids = economy_manager.mountain_manager.get_all_activated_form_ids()
		for form_id in form_ids:
			var form_cfg = DataManager.get_form_config(form_id)
			if form_cfg and economy_manager.mountain_manager.has_method("get_peak_level"):
				levels[form_id] = economy_manager.mountain_manager.get_peak_level(form_cfg.peak_id)
	print("[BattleFlowController] start_battle form_ids=%s levels=%s" % [str(form_ids), str(levels)])
	if main_peak and main_peak.has_method("set_attack_channels"):
		main_peak.set_attack_channels(form_ids, levels)
	var dmg_bonus: float = economy_manager.get_damage_bonus()
	if dmg_bonus > 0.0 and main_peak and main_peak.has_method("apply_damage_bonus"):
		main_peak.apply_damage_bonus(dmg_bonus)
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
			if main_peak and main_peak.has_method("get_ultimate_info") and battle_hud.has_method("update_energy"):
				var info = main_peak.get_ultimate_info()
				if info.get("cd", 0) > 0 or info.get("max_cd", 0) > 0:
					battle_hud.update_energy(info["cd"], info["max_cd"], info["ultimate_name"])
				else:
					battle_hud.update_energy(info["energy"], info["max_energy"], info["ultimate_name"])


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
	for child in battlefield.get_node(NODE_ENEMIES).get_children():
		child.queue_free()
	for child in battlefield.get_node(NODE_PROJECTILES).get_children():
		child.queue_free()


func restart_game() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()
