extends Node
class_name SpiritGrowthManager
## 监听山峰修复信号 → 更新器灵成长等级

var _repair_count: int = 0

signal spirit_growth_changed(repair_count: int)


func _ready() -> void:
	_repair_count = 0


func on_mountain_repaired(_peak_id: String) -> void:
	_repair_count = min(_repair_count + 1, 6)
	var growth: Dictionary = DataManager.get_spirit_growth(_repair_count)
	if growth.is_empty():
		return

	var main_peak: Node = get_tree().current_scene.get_node_or_null("Battlefield/MainPeak")
	if main_peak and main_peak.has_method("apply_spirit_growth"):
		main_peak.apply_spirit_growth(_repair_count, growth)

	spirit_growth_changed.emit(_repair_count)


func get_repair_count() -> int:
	return _repair_count
