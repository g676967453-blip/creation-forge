extends Node
class_name EconomyManager
## V0.1 灵气经济 + EXP 升级 + 祝福选择流程

const FLOATING_TEXT_SCENE: PackedScene = preload("res://scenes/ui/floating_text.tscn")

signal spirit_updated(value: int)
signal resource_changed(resource_type: String, new_value: int, delta: int)
signal resource_insufficient(resource_type: String, required: int, current: int)
signal upgrade_triggered
signal card_resolved

var spirit: int = 0
var nuwa_stone: int = 0
var secret_treasures: Dictionary = {}
var _spirit_accumulated: int = 0
var current_level: int = 1
var current_exp: int = 0
var exp_to_next: int = 100
var _pending_upgrade_count: int = 0
var _spirit_bonus: float = 0.0
var _damage_bonus: float = 0.0
var _exp_bonus: float = 0.0
var spirit_active: bool = false
var _in_selection: bool = false

@onready var _auto_spirit_timer: Timer = $AutoSpiritTimer
@onready var _auto_display_timer: Timer = $AutoDisplayTimer

var main_peak
var mountain_manager: Node
var card_selection_ui: Control
var battle_hud: Control
var blessing_manager: BlessingManager = null
var disciple_squad: DiscipleSquad = null


func setup(p_main_peak, p_mountain_manager, p_card_selection_ui, p_battle_hud, p_blessing_manager, p_disciple_squad) -> void:
	main_peak = p_main_peak
	mountain_manager = p_mountain_manager
	card_selection_ui = p_card_selection_ui
	battle_hud = p_battle_hud
	blessing_manager = p_blessing_manager
	disciple_squad = p_disciple_squad


func set_bonuses(spirit_bonus: float, damage_bonus: float, exp_bonus: float) -> void:
	_spirit_bonus = spirit_bonus
	_damage_bonus = damage_bonus
	_exp_bonus = exp_bonus


func add_energy(amount: int) -> void:
	spirit += maxi(amount, 0)
	spirit_updated.emit(spirit)
	resource_changed.emit("energy", spirit, maxi(amount, 0))


func spend_energy(amount: int) -> bool:
	if amount <= 0:
		return true
	if spirit < amount:
		resource_insufficient.emit("energy", amount, spirit)
		return false
	spirit -= amount
	spirit_updated.emit(spirit)
	resource_changed.emit("energy", spirit, -amount)
	return true


func add_stone(amount: int) -> void:
	nuwa_stone += maxi(amount, 0)
	resource_changed.emit("stone", nuwa_stone, maxi(amount, 0))


func spend_stone(amount: int) -> bool:
	if amount <= 0:
		return true
	if nuwa_stone < amount:
		resource_insufficient.emit("stone", amount, nuwa_stone)
		return false
	nuwa_stone -= amount
	resource_changed.emit("stone", nuwa_stone, -amount)
	return true


func add_treasure(peak_id: String, amount: int) -> void:
	if amount <= 0:
		return
	var value: int = int(secret_treasures.get(peak_id, 0)) + amount
	secret_treasures[peak_id] = value
	resource_changed.emit("treasure:%s" % peak_id, value, amount)


func spend_treasure(peak_id: String, amount: int) -> bool:
	if amount <= 0:
		return true
	var current: int = int(secret_treasures.get(peak_id, 0))
	if current < amount:
		resource_insufficient.emit("treasure:%s" % peak_id, amount, current)
		return false
	secret_treasures[peak_id] = current - amount
	resource_changed.emit("treasure:%s" % peak_id, current - amount, -amount)
	return true


func get_resources() -> Dictionary:
	return {
		"spirit_energy": spirit,
		"nuwa_stone": nuwa_stone,
		"secret_treasures": secret_treasures.duplicate(),
	}


func get_damage_bonus() -> float:
	return _damage_bonus


func set_level_data(level: int, exp_to_next_val: int) -> void:
	current_level = level
	exp_to_next = exp_to_next_val


func set_active(active: bool) -> void:
	spirit_active = active
	if active:
		_spirit_accumulated = 0
		if _auto_spirit_timer:
			_auto_spirit_timer.start()
		if _auto_display_timer:
			_auto_display_timer.start()
	else:
		if _auto_spirit_timer:
			_auto_spirit_timer.stop()
		if _auto_display_timer:
			_auto_display_timer.stop()
		_spirit_accumulated = 0


func reset_progress() -> void:
	current_level = 1
	current_exp = 0
	exp_to_next = 100
	_pending_upgrade_count = 0
	_in_selection = false


func handle_main_peak_clicked(screen_position: Vector2 = Vector2.ZERO) -> void:
	if not spirit_active:
		return
	var mpcfg = DataManager.main_peak_config
	var base_click: int = mpcfg.spirit_click_base if mpcfg else 10
	var gain: int = int(float(base_click) * (1.0 + _spirit_bonus))
	spirit += gain
	_spawn_spirit_popup(screen_position, gain)
	spirit_updated.emit(spirit)


func _spawn_spirit_popup(screen_position: Vector2, amount: int, color: Color = Color(1.0, 0.93, 0.45)) -> void:
	var ui_root := get_tree().current_scene.get_node_or_null("UI")
	if ui_root == null:
		return
	var popup := FLOATING_TEXT_SCENE.instantiate()
	if popup == null:
		return
	popup.position = screen_position + Vector2(-14, -44)
	ui_root.add_child(popup)
	if popup.has_method("show_text"):
		popup.show_text("+%d" % amount, color)


func _on_auto_spirit_tick() -> void:
	if not spirit_active:
		return
	var mpcfg = DataManager.main_peak_config
	var base_auto: int = mpcfg.spirit_auto_base if mpcfg else 5
	var gain: int = int(float(base_auto) * (1.0 + _spirit_bonus))
	spirit += gain
	_spirit_accumulated += gain
	spirit_updated.emit(spirit)


func _on_auto_display_tick() -> void:
	if not spirit_active:
		return
	if _spirit_accumulated <= 0:
		return
	_spawn_spirit_popup(Vector2(640, 600), _spirit_accumulated, Color(0.8, 0.85, 0.4))
	_spirit_accumulated = 0


func try_spend_spirit(amount: int) -> bool:
	if amount <= 0:
		return true
	if spirit < amount:
		return false
	spirit -= amount
	spirit_updated.emit(spirit)
	return true


func get_selected_mountain_state() -> Dictionary:
	if mountain_manager and mountain_manager.has_method("get_selected_mountain_state"):
		return mountain_manager.get_selected_mountain_state()
	return {}


func can_repair_selected() -> bool:
	if mountain_manager and mountain_manager.has_method("can_repair_selected"):
		return mountain_manager.can_repair_selected()
	return false


func repair_selected_mountain() -> bool:
	if not (mountain_manager and mountain_manager.has_method("can_repair_selected")):
		return false
	if not mountain_manager.can_repair_selected():
		return false
	var peak_id: String = mountain_manager.get_selected_peak_id()
	var cost: int = mountain_manager.get_repair_cost(peak_id)
	if not try_spend_spirit(cost):
		return false
	if mountain_manager.has_method("repair_selected"):
		var ok: bool = mountain_manager.repair_selected()
		spirit_updated.emit(spirit)
		return ok
	return false


func upgrade_selected_mountain() -> bool:
	if not (mountain_manager and mountain_manager.has_method("can_upgrade_selected")):
		return false
	if not mountain_manager.can_upgrade_selected():
		return false
	var peak_id: String = mountain_manager.get_selected_peak_id()
	var cost: int = mountain_manager.get_upgrade_cost(peak_id)
	if not try_spend_spirit(cost):
		return false
	if mountain_manager.has_method("upgrade_selected"):
		var ok: bool = mountain_manager.upgrade_selected()
		spirit_updated.emit(spirit)
		return ok
	return false


func has_any_mountain_activated() -> bool:
	if not mountain_manager:
		return false
	if mountain_manager.has_method("has_any_mountain_activated"):
		return mountain_manager.has_any_mountain_activated()
	if mountain_manager.has_method("get_selected_form_id"):
		return not str(mountain_manager.get_selected_form_id()).is_empty()
	return false


func add_exp(amount: int) -> void:
	var boosted: int = int(float(amount) * (1.0 + _exp_bonus))
	current_exp += boosted
	var leveled_up := false
	while current_exp >= exp_to_next:
		current_exp -= exp_to_next
		current_level += 1
		var mpcfg = DataManager.main_peak_config; exp_to_next += mpcfg.exp_per_level_increase if mpcfg else 25
		_pending_upgrade_count += 1
		leveled_up = true
	if leveled_up and not _in_selection:
		_trigger_battle_upgrade()
	spirit_updated.emit(spirit)


func _trigger_battle_upgrade() -> void:
	get_tree().paused = true
	_in_selection = true
	upgrade_triggered.emit()
	var active_peak_ids: Array[String] = []
	if mountain_manager and mountain_manager.has_method("get_all_activated_form_ids"):
		active_peak_ids = mountain_manager.get_all_activated_form_ids()
	var blessings: Array = blessing_manager.draw_three(active_peak_ids)
	# 桥接：BlessingData → 现有选择面板的字典格式。
	var cards: Array = []
	for b in blessings:
		cards.append({
			"card_id": b.blessing_id,
			"card_name": b.display_name,
			"description": b.description,
			"form_id": b.blessing_line,
			"rarity": b.rarity,
			"effect_type": b.effect_key,
			"effect_value": b.effect_value,
			"effect_value_2": b.effect_value_2,
			"_is_blessing": true,
			"_blessing": b,
		})
	if card_selection_ui and card_selection_ui.has_method("show_cards"):
		card_selection_ui.show_cards(cards)


func on_card_selected(card) -> void:
	if card is Dictionary and card.get("_is_blessing", false):
		var blessing: BlessingData = card.get("_blessing")
		if blessing and blessing_manager:
			blessing_manager.apply(blessing)
			_pending_upgrade_count = max(0, _pending_upgrade_count - 1)
			if _pending_upgrade_count > 0:
				_trigger_battle_upgrade()
				return
			get_tree().paused = false
			_in_selection = false
			card_resolved.emit()
