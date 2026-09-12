extends Node
## 关卡布局库 —— 支持两种来源：
##   1) 字符网格（与 HTML LEVEL_LAYOUTS / level-editor 一致）
##      F=火1 f=火2 g=火3 R=救援 r=红窗 .=空  N=普通窗(当空)
##   2) 坐标化窗口（window-editor.html 输出）：每窗带绝对 x/y（逻辑像素，左上角）
## get_layout 返回一种统一形态：
##   字符模式 → Array of String（行）
##   坐标模式 → Dictionary { "coord": true, "windows": [ {x,y,type}, ... ] }

const COLS: int = 7

## 可选：编辑器导出的坐标关卡文件（window-editor.html 的「下载 JSON」产物）
## 放工程此路径即被自动加载；不存在则沿用默认字符布局
const COORD_FILE: String = "res://assets/levels/windows.json"

var layouts: Array = [
	["FFF", "F.F", "R.R"],
	["FFR", "FfF", "RFr", "..."],
	["FfR", "RgF", "fF.", "RrR"],
	["gFR", "fgr", "FRf", "rRF"],
	["RrR", "FgF", "fRf", "gRg", "RrR"],
	["ffR", "ggr", "FFr", "fRg", "rRf", "RrF"],
]

## 坐标化关卡：与 layouts 一一对应（索引一致）；空表示该关仍用字符布局
var coord_levels: Array = []


func _ready() -> void:
	if FileAccess.file_exists(COORD_FILE):
		var f: FileAccess = FileAccess.open(COORD_FILE, FileAccess.READ)
		if f:
			load_from_json_string(f.get_as_text())
			print("[LevelDB] 已加载坐标关卡：", COORD_FILE)


func get_layout(level_index_1based: int) -> Variant:
	if level_index_1based <= 0:
		return []
	if level_index_1based <= coord_levels.size():
		var c: Variant = coord_levels[level_index_1based - 1]
		if typeof(c) == TYPE_DICTIONARY and c.get("coord", false):
			return c
	if level_index_1based <= layouts.size():
		return layouts[level_index_1based - 1] as Array
	return []


func has_hand_layout(level_index_1based: int) -> bool:
	var layout: Variant = get_layout(level_index_1based)
	if typeof(layout) == TYPE_DICTIONARY:
		var wins: Variant = layout.get("windows", null)
		return typeof(wins) == TYPE_ARRAY and not (wins as Array).is_empty()
	return typeof(layout) == TYPE_ARRAY and not (layout as Array).is_empty()


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


## 统一加载入口：自动识别「字符 JSON」与「坐标 JSON」，写入对应缓存
func load_from_json_string(text: String) -> bool:
	var parsed: Variant = JSON.parse_string(text)
	if typeof(parsed) != TYPE_DICTIONARY:
		return false
	var data: Dictionary = parsed
	var list: Variant = data.get("levels", null)
	if typeof(list) != TYPE_ARRAY or (list as Array).is_empty():
		return false

	var new_layouts: Array = []
	var new_coords: Array = []
	var mode: String = "grid"  # grid | coord
	for item in list as Array:
		if typeof(item) == TYPE_DICTIONARY:
			var item_dict: Dictionary = item
			# 坐标模式：有 windows/wins 数组，且窗口带 x/y
			var wins: Variant = item_dict.get("windows", item_dict.get("wins", null))
			if typeof(wins) == TYPE_ARRAY and not (wins as Array).is_empty():
				var coord_win: Array = []
				var is_coord: bool = false
				for w in wins as Array:
					if typeof(w) != TYPE_DICTIONARY:
						continue
					var x: Variant = w.get("x", null)
					var y: Variant = w.get("y", null)
					var typ: Variant = w.get("type", "F")
					if x == null or y == null:
						continue
					is_coord = true
					coord_win.append({
						"x": float(x), "y": float(y),
						"type": _norm_type(str(typ)),
					})
				if is_coord:
					mode = "coord"
					new_coords.append({"coord": true, "windows": coord_win})
					new_layouts.append([])  # 占位保持索引对齐
					continue
			# 字符模式：layout / rows
			var rows: Variant = item_dict.get("layout", item_dict.get("rows", []))
			if typeof(rows) == TYPE_ARRAY:
				new_layouts.append(_norm_rows(rows as Array))
				new_coords.append([])
				continue
		elif typeof(item) == TYPE_ARRAY:
			new_layouts.append(_norm_rows(item as Array))
			new_coords.append([])
			continue
		# 无法识别 → 空占位
		new_layouts.append([])
		new_coords.append([])

	if new_layouts.is_empty() and new_coords.is_empty():
		return false
	layouts = new_layouts
	coord_levels = new_coords
	return true


func _norm_type(ch: String) -> String:
	var c: String = ch.substr(0, 1)
	if c == "F" or c == "f" or c == "g" or c == "R" or c == "r":
		return c
	return "F"


func _norm_rows(rows_in: Array) -> Array:
	var out: Array = []
	for r in rows_in:
		out.append(str(r))
	return out
