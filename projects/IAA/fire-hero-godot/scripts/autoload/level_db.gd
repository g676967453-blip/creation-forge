extends Node
## 关卡布局库 —— 与 HTML LEVEL_LAYOUTS / level-editor 字符规则一致
## F=火1 f=火2 g=火3 R=救援 r=红窗 .=空  N=普通窗(当空)

const COLS: int = 7

var layouts: Array = [
	["FFF", "F.F", "R.R"],
	["FFR", "FfF", "RFr", "..."],
	["FfR", "RgF", "fF.", "RrR"],
	["gFR", "fgr", "FRf", "rRF"],
	["RrR", "FgF", "fRf", "gRg", "RrR"],
	["ffR", "ggr", "FFr", "fRg", "rRf", "RrF"],
]


func get_layout(level_index_1based: int) -> Array:
	if level_index_1based <= 0:
		return []
	if level_index_1based <= layouts.size():
		return layouts[level_index_1based - 1] as Array
	return []


func has_hand_layout(level_index_1based: int) -> bool:
	return level_index_1based >= 1 and level_index_1based <= layouts.size()


func cell_at(layout: Array, row: int, col: int) -> String:
	if row < 0 or row >= layout.size():
		return "."
	var line: String = str(layout[row])
	if col < 0 or col >= COLS:
		return "."
	if col >= line.length():
		return "."
	var ch: String = line.substr(col, 1)
	if ch == "N":
		return "."
	return ch


func load_from_json_string(text: String) -> bool:
	var parsed: Variant = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		return false
	var data: Dictionary = parsed
	var list: Variant = data.get("levels", null)
	if typeof(list) != TYPE_ARRAY or (list as Array).is_empty():
		return false
	var new_layouts: Array = []
	for item in list as Array:
		var layout: Array = []
		if typeof(item) == TYPE_DICTIONARY:
			var item_dict: Dictionary = item
			var rows: Variant = item_dict.get("layout", item_dict.get("rows", []))
			if typeof(rows) == TYPE_ARRAY:
				for r in rows as Array:
					layout.append(str(r))
		elif typeof(item) == TYPE_ARRAY:
			for r in item as Array:
				layout.append(str(r))
		if not layout.is_empty():
			new_layouts.append(layout)
	if new_layouts.is_empty():
		return false
	layouts = new_layouts
	return true
