extends Node
class_name BlessingManager
## V0.1 祝福系统 — 替换 card_manager.gd
## 每轮升级从祝福池抽 3 张，玩家选 1；同名叠 3 张升阶质变

signal blessing_applied(category: String, effect_type: String, effect_value: float, tier: int)
signal blessing_drawn(blessings: Array)

var _pool: Array[BlessingData] = []
var _stacks: Dictionary = {}   ## blessing_id → count (0-3)
var _exhausted: Array[String] = []  ## 已达 3 层的祝福 ID

const RARITY_WEIGHTS := {
	"common": 50,
	"rare": 30,
	"epic": 15,
	"legend": 5,
}


func initialize(pool: Array[BlessingData]) -> void:
	_pool = pool.duplicate()
	_stacks.clear()
	_exhausted.clear()


func draw_three(active_peak_ids: Array[String], active_disciple_ids: Array[String]) -> Array[BlessingData]:
	## 过滤可用祝福池，抽 3 张
	var available: Array[BlessingData] = []
	for b in _pool:
		if b.blessing_id in _exhausted:
			continue
		# 过滤：peak_filter 非空时必须匹配
		if not b.peak_filter.is_empty() and not active_peak_ids.has(b.peak_filter):
			continue
		# 过滤：disciple_filter 非空时必须匹配
		if not b.disciple_filter.is_empty() and not active_disciple_ids.has(b.disciple_filter):
			continue
		available.append(b)

	# 不够 3 张时放宽过滤
	if available.size() < 3:
		available.clear()
		for b in _pool:
			if b.blessing_id in _exhausted:
				continue
			if not b.peak_filter.is_empty() and not active_peak_ids.has(b.peak_filter):
				continue
			available.append(b)

	# 仍不够则重置（所有非 exhausted 的祝福都可选）
	if available.size() < 3:
		available.clear()
		for b in _pool:
			if b.blessing_id in _exhausted:
				continue
			available.append(b)

	# 按稀有度加权抽取 3 张
	var drawn: Array[BlessingData] = []
	var candidates := available.duplicate()
	while drawn.size() < 3 and candidates.size() > 0:
		var pick := _weighted_pick(candidates)
		if pick != null:
			drawn.append(pick)
			candidates.erase(pick)

	blessing_drawn.emit(drawn)
	return drawn


func _weighted_pick(candidates: Array[BlessingData]) -> BlessingData:
	var total_weight := 0
	for b in candidates:
		total_weight += RARITY_WEIGHTS.get(b.tier, 10)
	if total_weight <= 0:
		return candidates.pick_random() if candidates.size() > 0 else null
	var roll := randi() % total_weight
	var acc := 0
	for b in candidates:
		acc += RARITY_WEIGHTS.get(b.tier, 10)
		if roll < acc:
			return b
	return candidates.back() if candidates.size() > 0 else null


func apply(blessing: BlessingData) -> void:
	## 应用祝福，追踪叠层
	var count: int = _stacks.get(blessing.blessing_id, 0) + 1
	_stacks[blessing.blessing_id] = count

	var tier := count
	var tiered_effect := blessing.effect_type
	# 叠 3 层 = 质变
	if count >= 3:
		tiered_effect = "%s_t3" % blessing.effect_type
		_exhausted.append(blessing.blessing_id)

	blessing_applied.emit(blessing.category, tiered_effect, blessing.effect_value, tier)


func get_stack(blessing_id: String) -> int:
	return _stacks.get(blessing_id, 0)


func is_exhausted(blessing_id: String) -> bool:
	return blessing_id in _exhausted
