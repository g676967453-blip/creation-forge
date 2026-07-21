extends Node
## 通用 CSV 解析器


func load_csv(path: String) -> Array[Dictionary]:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("[CsvLoader] 无法打开文件: %s" % path)
		return []

	var rows: Array[Dictionary] = []
	var headers: PackedStringArray = []

	while not file.eof_reached():
		var line := file.get_csv_line()
		if line.size() == 0 or (line.size() == 1 and line[0] == ""):
			continue
		if headers.is_empty():
			if line[0].begins_with("﻿"):
				line[0] = line[0].substr(1)
			headers = line
			continue
		var row: Dictionary = {}
		for i in range(min(headers.size(), line.size())):
			row[headers[i]] = line[i]
		rows.append(row)

	file.close()
	return rows
