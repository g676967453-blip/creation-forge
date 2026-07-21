extends Node
class_name WaveManager

signal wave_completed(wave_index: int)
signal all_waves_completed
signal wave_changed(wave_idx: int, total: int)
signal battle_started
signal battle_ended
signal enemy_killed(exp_reward: int)

const NODE_BATTLEFIELD := "Battlefield"
const NODE_ENEMIES := "Enemies"

var wave_configs: Array = []
var current_wave: int = 0
var enemies_alive: int = 0
var spawn_timer: Timer
var _wave_pause_timer: Timer
var is_spawning: bool = false
var _spawn_queue: Array = []


func _ready() -> void:
	spawn_timer = Timer.new()
	add_child(spawn_timer)
	spawn_timer.timeout.connect(_spawn_next_from_queue)

	_wave_pause_timer = Timer.new()
	add_child(_wave_pause_timer)
	_wave_pause_timer.one_shot = true
	_wave_pause_timer.timeout.connect(_on_wave_pause_end)


func load_waves(waves: Array) -> void:
	wave_configs = waves


func reset_battle() -> void:
	current_wave = 0
	enemies_alive = 0
	is_spawning = false
	_spawn_queue.clear()
	if spawn_timer:
		spawn_timer.stop()


func start_battle() -> void:
	reset_battle()
	battle_started.emit()
	call_deferred("start_next_wave")


func start_next_wave() -> void:
	if current_wave >= wave_configs.size():
		all_waves_completed.emit()
		battle_ended.emit()
		return
	var config = wave_configs[current_wave]
	wave_changed.emit(current_wave + 1, wave_configs.size())
	current_wave += 1
	_build_spawn_queue(config)
	is_spawning = true
	if spawn_timer:
		spawn_timer.start(0.3)
	_spawn_next_from_queue()


func _build_spawn_queue(config) -> void:
	_spawn_queue.clear()
	for group in config.enemy_groups:
		for i in range(group.count):
			_spawn_queue.append({
				"enemy_id": group.enemy_id,
				"path_type": group.path_type,
				"spawn_interval": group.spawn_interval,
			})
	_spawn_queue.shuffle()


func _on_wave_pause_end() -> void:
	call_deferred("start_next_wave")


func _spawn_next_from_queue() -> void:
	if _spawn_queue.is_empty():
		is_spawning = false
		return

	var entry = _spawn_queue.pop_front()
	_spawn_enemy(entry["enemy_id"], entry["path_type"])

	if not _spawn_queue.is_empty():
		spawn_timer.start(max(0.3, float(entry["spawn_interval"])))
	else:
		spawn_timer.stop()
		is_spawning = false


func _spawn_enemy(enemy_id: String, path_type: String) -> void:
	var enemy_data = DataManager.get_enemy_data(enemy_id)
	if not enemy_data:
		return
	var enemy = preload("res://scenes/enemies/enemy_base.tscn").instantiate()
	enemy.initialize(enemy_data)
	_add_enemy_to_battlefield(enemy)
	enemy.global_position = _get_spawn_position(path_type)
	enemy.enemy_destroyed.connect(_on_enemy_removed)
	enemy.reached_main_peak.connect(_on_enemy_reached_main)
	enemies_alive += 1


func _add_enemy_to_battlefield(enemy: Node) -> void:
	var battlefield = get_tree().current_scene.get_node_or_null(NODE_BATTLEFIELD)
	if battlefield and battlefield.has_node(NODE_ENEMIES):

		battlefield.get_node(NODE_ENEMIES).add_child(enemy)
	elif battlefield:
		battlefield.add_child(enemy)


func _get_spawn_position(path_type: String) -> Vector2:
	var center := Vector2(640, 380)
	var radius := 540.0
	var angle_center := -PI / 2.0
	var angle_range := deg_to_rad(160.0)
	var angle_min := angle_center - angle_range / 2.0
	var angle_max := angle_center + angle_range / 2.0
	match path_type:
		"straight":
			var angle := randf_range(angle_min, angle_max)
			return center + Vector2(cos(angle), sin(angle)) * radius
		"left_flank":
			var angle := randf_range(angle_min, angle_center)
			return center + Vector2(cos(angle), sin(angle)) * radius
		"right_flank":
			var angle := randf_range(angle_center, angle_max)
			return center + Vector2(cos(angle), sin(angle)) * radius
		_:
			var angle := randf_range(angle_min, angle_max)
			return center + Vector2(cos(angle), sin(angle)) * radius


func _on_enemy_removed(_enemy) -> void:
	enemies_alive -= 1
	if _enemy and _enemy.data:
		var exp_reward: int = _enemy.data.exp_reward if _enemy.data else 10
		enemy_killed.emit(exp_reward)
	if enemies_alive <= 0 and not is_spawning:
		if current_wave >= wave_configs.size():
			all_waves_completed.emit()
			battle_ended.emit()
		else:
			wave_completed.emit(current_wave)
			call_deferred("start_next_wave")


func _on_enemy_reached_main(enemy) -> void:
	if is_instance_valid(enemy) and enemy.enemy_destroyed.is_connected(_on_enemy_removed):
		# Boss on final wave must be killed, not just reach the peak
		if enemy.data and enemy.data.enemy_type == "boss" and current_wave >= wave_configs.size():
			return
		enemy.enemy_destroyed.disconnect(_on_enemy_removed)
	enemies_alive -= 1
	if enemies_alive <= 0 and not is_spawning:
		if current_wave >= wave_configs.size():
			all_waves_completed.emit()
			battle_ended.emit()
		else:
			wave_completed.emit(current_wave)
			call_deferred("start_next_wave")
