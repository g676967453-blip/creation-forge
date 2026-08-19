extends Node

const SAVE_PATH := "user://save_data.json"
const TEMP_PATH := "user://save_data.json.tmp"

var _economy_manager: EconomyManager
var _mountain_manager: Node
var _play_time: float = 0.0
var _spirit_id: String = "spirit_book"
var _clear_count: int = 0
var _settings: Dictionary = {"master_volume": 80.0, "window_mode": "windowed"}


func _ready() -> void:
	var timer := Timer.new()
	timer.wait_time = DataManager.get_game_config("auto_save_interval_sec", 60.0)
	timer.autostart = true
	timer.timeout.connect(save_game)
	add_child(timer)


func _process(delta: float) -> void:
	_play_time += delta


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST:
		save_game()


func bind_runtime(economy_manager: EconomyManager, mountain_manager: Node) -> void:
	_economy_manager = economy_manager
	_mountain_manager = mountain_manager
	var data := load_game()
	if not data.is_empty():
		_apply_data(data)


func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


func load_game() -> Dictionary:
	if not has_save():
		return {}
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	return parsed if parsed is Dictionary else {}


func save_game() -> bool:
	if _economy_manager == null or _mountain_manager == null:
		return false
	var data := _build_data()
	var file := FileAccess.open(TEMP_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(data, "\t"))
	file.close()
	var absolute_save := ProjectSettings.globalize_path(SAVE_PATH)
	var absolute_temp := ProjectSettings.globalize_path(TEMP_PATH)
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(absolute_save)
	return DirAccess.rename_absolute(absolute_temp, absolute_save) == OK


func _build_data() -> Dictionary:
	var resources := _economy_manager.get_resources()
	return {
		"version": 1,
		"play_time": _play_time,
		"save_timestamp": int(Time.get_unix_time_from_system()),
		"spirit_id": _spirit_id,
		"spirit_level": _mountain_manager.get_all_activated_peak_ids().size(),
		"peaks": _mountain_manager.export_repaired_states(),
		"spirit_energy": int(resources.get("spirit_energy", 0)),
		"nuwa_stone": int(resources.get("nuwa_stone", 0)),
		"secret_treasures": resources.get("secret_treasures", {}),
		"clear_count": _clear_count,
		"buff_end_timestamp": _economy_manager.idle_boost_end_timestamp,
		"settings": _settings,
	}


func _apply_data(data: Dictionary) -> void:
	_play_time = float(data.get("play_time", 0.0))
	_spirit_id = str(data.get("spirit_id", "spirit_book"))
	_clear_count = int(data.get("clear_count", 0))
	_settings = data.get("settings", _settings)
	_economy_manager.spirit = int(data.get("spirit_energy", 0)) + calculate_offline_reward(data)
	_economy_manager.nuwa_stone = int(data.get("nuwa_stone", 0))
	_economy_manager.secret_treasures = data.get("secret_treasures", {}).duplicate()
	_economy_manager.idle_boost_end_timestamp = int(data.get("buff_end_timestamp", 0))
	_mountain_manager.import_repaired_states(data.get("peaks", {}))
	_economy_manager.spirit_updated.emit(_economy_manager.spirit)


func calculate_offline_reward(data: Dictionary) -> int:
	var saved_at := int(data.get("save_timestamp", int(Time.get_unix_time_from_system())))
	var elapsed := maxi(int(Time.get_unix_time_from_system()) - saved_at, 0)
	var capped := mini(elapsed, DataManager.get_game_config_int("offline_reward_cap_sec", 86400))
	return int(DataManager.get_game_config("energy_base_rate_per_sec", 10.0) * capped)
