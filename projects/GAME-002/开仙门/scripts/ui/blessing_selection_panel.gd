extends Control
class_name BlessingSelectionPanel

## V3.0 祝福选择面板的数据契约。
## 具体卡片布局沿用现有 CardSelectionPanel，面板只负责展示和发出选择结果。

signal blessing_selected(blessing_data: Dictionary)

var _cards: Array[Dictionary] = []


func show_blessings(blessings: Array[BlessingData]) -> void:
	_cards.clear()
	for blessing in blessings:
		_cards.append({
			"blessing_id": blessing.blessing_id,
			"blessing_line": blessing.blessing_line,
			"tier": blessing.tier,
			"type": blessing.blessing_type,
			"display_name": blessing.display_name,
			"description": blessing.description,
			"effect_key": blessing.effect_key,
			"effect_value": blessing.effect_value,
			"effect_value_2": blessing.effect_value_2,
			"rarity": blessing.rarity,
			"_blessing": blessing,
		})
	visible = true


func show_cards(cards: Array) -> void:
	## 兼容现有升级面板调用方；新代码应传 BlessingData 并调用 show_blessings。
	_cards.clear()
	for card in cards:
		if card is Dictionary:
			_cards.append(card)
	visible = true


func select_card(index: int) -> void:
	if index < 0 or index >= _cards.size():
		return
	blessing_selected.emit(_cards[index])
	visible = false


func get_cards() -> Array[Dictionary]:
	return _cards.duplicate()
