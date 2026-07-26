extends Node2D
class_name DiscipleSquad
## V0.1 弟子小队 — 管理 5 名弟子的阵型、生成与战斗生命周期
## 每个已修复的山峰可派 1 名弟子出战（最多 5 人）

signal squad_empty  ## 所有弟子阵亡
signal disciple_count_changed(alive: int, total: int)

const MAX_SLOTS := 5
const FORMATION_Y: float = 540.0         ## 阵型基准 Y
const FORMATION_SPACING: float = 120.0   ## 弟子间距

var _disciples: Array[Disciple] = []
var _slots: Array[Dictionary] = []       ## [{peak_id, disciple_id, occupied}]
var spirit_seat: SpiritSeat = null


func _ready() -> void:
	_init_slots()
	set_process(true)


func _process(_delta: float) -> void:
	# 清理已死亡弟子引用
	_disciples = _disciples.filter(func(d): return is_instance_valid(d) and d.is_alive())


func _init_slots() -> void:
	_slots.clear()
	for i in MAX_SLOTS:
		_slots.append({"peak_id": "", "disciple_id": "", "occupied": false})


func setup(p_spirit_seat: SpiritSeat) -> void:
	spirit_seat = p_spirit_seat


func recruit(peak_id: String, data: DiscipleData) -> bool:
	## 招募弟子到空闲槽位
	var slot_idx := _find_empty_slot()
	if slot_idx < 0:
		return false
	_spawn_disciple(slot_idx, peak_id, data)
	return true


func _find_empty_slot() -> int:
	for i in MAX_SLOTS:
		if not _slots[i]["occupied"]:
			return i
	return -1


func _spawn_disciple(slot_idx: int, peak_id: String, data: DiscipleData) -> void:
	var formation_pos := _calc_formation_pos(slot_idx)
	var inst := Disciple.new()
	inst.name = "Disciple_%s" % data.disciple_id
	add_child(inst)
	# 设置碰撞层（Area2D 需要 collision_shape）
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(32, 32)
	shape.shape = rect
	inst.add_child(shape)
	inst.setup(data, formation_pos)
	inst.disciple_died.connect(_on_disciple_died)
	_disciples.append(inst)
	_slots[slot_idx] = {"peak_id": peak_id, "disciple_id": data.disciple_id, "occupied": true}
	disciple_count_changed.emit(_alive_count(), _occupied_count())


func _calc_formation_pos(slot_idx: int) -> Vector2:
	var total_width := float(_occupied_count()) * FORMATION_SPACING
	var start_x := 640.0 - total_width * 0.5 + FORMATION_SPACING * 0.5
	return Vector2(start_x + float(slot_idx) * FORMATION_SPACING, FORMATION_Y)


func _on_disciple_died(disciple: Disciple) -> void:
	for i in MAX_SLOTS:
		if _slots[i]["disciple_id"] == disciple.disciple_id:
			_slots[i] = {"peak_id": "", "disciple_id": "", "occupied": false}
			break
	disciple_count_changed.emit(_alive_count(), _occupied_count())
	if _alive_count() <= 0 and _occupied_count() > 0:
		squad_empty.emit()


func get_disciples() -> Array[Disciple]:
	_disciples = _disciples.filter(func(d): return is_instance_valid(d) and d.is_alive())
	return _disciples


func _alive_count() -> int:
	return get_disciples().size()


func _occupied_count() -> int:
	var count := 0
	for slot in _slots:
		if slot["occupied"]:
			count += 1
	return count


func get_active_peak_ids() -> Array[String]:
	var ids: Array[String] = []
	for slot in _slots:
		if slot["occupied"] and not slot["peak_id"].is_empty():
			ids.append(slot["peak_id"])
	return ids


func apply_blessing_to_all(effect_type: String, value: float) -> void:
	for d in get_disciples():
		d.apply_blessing(effect_type, value)


func apply_blessing_to_peak(peak_id: String, effect_type: String, value: float) -> void:
	for d in get_disciples():
		if d.peak_id == peak_id:
			d.apply_blessing(effect_type, value)


func heal_all(amount: float) -> void:
	for d in get_disciples():
		d.heal(amount)
