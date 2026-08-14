extends Node
class_name BlessingManager
## V3.0 祝福池、局内叠层与质变管理。

signal blessing_applied(blessing_id: String, effect_key: String, effect_value: float, effect_value_2: float, tier: int)
signal blessing_drawn(blessings: Array)
signal blessing_transformed(blessing_line: String, tier: int, effect_key: String)

var _pool: Array[BlessingData] = []
var _stacks: Dictionary = {}
var _exhausted_lines: Dictionary = {}


func initialize(pool: Array[BlessingData]) -> void:
	_pool = pool.duplicate()
	reset_run()


func reset_run() -> void:
	_stacks.clear()
	_exhausted_lines.clear()


func draw_three(active_peak_ids: Array[String]) -> Array[BlessingData]:
	var available: Array[BlessingData] = []
	for blessing in _pool:
		if _exhausted_lines.has(blessing.blessing_line):
			continue
		if blessing.required_peak != "" and not active_peak_ids.has(blessing.required_peak):
			continue
		var line_tier: int = int(_stacks.get(blessing.blessing_line, 0))
		if blessing.tier != line_tier + 1:
			continue
		available.append(blessing)

	var drawn: Array[BlessingData] = []
	var candidates := available.duplicate()
	while drawn.size() < 3 and not candidates.is_empty():
		var picked := _weighted_pick(candidates)
		if picked == null:
			break
		drawn.append(picked)
		candidates.erase(picked)

	blessing_drawn.emit(drawn)
	return drawn


func _weighted_pick(candidates: Array[BlessingData]) -> BlessingData:
	var total_weight := 0
	for blessing in candidates:
		total_weight += maxi(blessing.weight, 1)
	if total_weight <= 0:
		return candidates.pick_random() if not candidates.is_empty() else null
	var roll := randi_range(0, total_weight - 1)
	var accumulated := 0
	for blessing in candidates:
		accumulated += maxi(blessing.weight, 1)
		if roll < accumulated:
			return blessing
	return candidates.back()


func apply(blessing: BlessingData) -> void:
	if blessing == null:
		return
	var next_tier: int = int(_stacks.get(blessing.blessing_line, 0)) + 1
	if next_tier > 3:
		return
	_stacks[blessing.blessing_line] = next_tier
	if next_tier == 3:
		_exhausted_lines[blessing.blessing_line] = true
		blessing_transformed.emit(blessing.blessing_line, next_tier, blessing.effect_key)
	blessing_applied.emit(blessing.blessing_id, blessing.effect_key, blessing.effect_value, blessing.effect_value_2, next_tier)


func get_stack(blessing_line: String) -> int:
	return int(_stacks.get(blessing_line, 0))


func is_exhausted(blessing_line: String) -> bool:
	return _exhausted_lines.has(blessing_line)
