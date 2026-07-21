extends Node
class_name CardManager

signal card_applied(form_id: String, effect_type: String, effect_value: float)

var card_pool: Array = []
var used_cards: Array = []
var _talent_counts: Dictionary = {}  # "form_id|card_id" → int (0,1,2 = selections so far)


func initialize(pool: Array) -> void:
	card_pool = pool.duplicate()
	used_cards.clear()
	_talent_counts.clear()


func draw_three_cards(active_form_ids: Array) -> Array:
	if active_form_ids.is_empty():
		return []

	# Build per-form pools, excluding cards at max talent count (3)
	var per_form: Dictionary = {}
	for c in card_pool:
		if c in used_cards:
			continue
		var key := "%s|%s" % [c.form_id, c.card_id]
		if _talent_counts.get(key, 0) >= 3:
			continue  # talent exhausted
		if active_form_ids.has(c.form_id):
			if not per_form.has(c.form_id):
				per_form[c.form_id] = []
			per_form[c.form_id].append(c)

	# Count total available
	var total_available := 0
	for arr in per_form.values():
		total_available += arr.size()

	# If not enough cards, reset used pool
	if total_available < 3:
		per_form.clear()
		used_cards.clear()
		for c in card_pool:
			if active_form_ids.has(c.form_id):
				if not per_form.has(c.form_id):
					per_form[c.form_id] = []
				per_form[c.form_id].append(c)

	var result: Array = []

	# Priority: draw 1 card per active form first, then fill remaining
	for form_id in active_form_ids:
		if result.size() >= 3:
			break
		if per_form.has(form_id) and per_form[form_id].size() > 0:
			per_form[form_id].shuffle()
			result.append(per_form[form_id].pop_front())

	# Fill remaining slots from any active form
	var all_available: Array = []
	for arr in per_form.values():
		all_available.append_array(arr)
	all_available.shuffle()

	while result.size() < 3 and all_available.size() > 0:
		var card = all_available.pop_front()
		if card not in result:
			result.append(card)

	# Last resort: any unused card from entire pool
	if result.size() < 3:
		var fallback: Array = []
		for c in card_pool:
			if c not in result:
				fallback.append(c)
		fallback.shuffle()
		while result.size() < 3 and fallback.size() > 0:
			result.append(fallback.pop_front())

	return result.slice(0, 3)


func apply_card(card, _active_form_ids: Array = []) -> void:
	used_cards.append(card)
	# Track talent selection count
	var key := "%s|%s" % [card.form_id, card.card_id]
	var count: int = _talent_counts.get(key, 0) + 1
	_talent_counts[key] = count
	# Build tier-suffixed effect_type (e.g. "volley" → "volley_t2" on 2nd pick)
	var tiered_type: String = card.effect_type
	if count >= 2:
		tiered_type = "%s_t%d" % [card.effect_type, count]
	card_applied.emit(card.form_id, tiered_type, card.effect_value)
