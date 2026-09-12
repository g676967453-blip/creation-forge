var root = edited_scene
if root == null:
	_custom_print("ERROR_NO_ROOT")
	return
var out = {}
out["root"] = str(root.name)
var paths = PackedStringArray()
paths.append("UI/Overlays/Menu")
paths.append("UI/Overlays/Menu/VBox")
paths.append("UI/Overlays/Menu/VBox/Title")
paths.append("UI/Overlays/Menu/VBox/Sub")
paths.append("UI/Overlays/Menu/VBox/MenuStats")
paths.append("UI/Overlays/Menu/VBox/StartButton")
paths.append("UI/HUD")
paths.append("UI/HUD/TopBar")
paths.append("UI/HUD/TopBar/LevelBox")
paths.append("UI/HUD/TopBar/LevelBox/Icon")
paths.append("UI/HUD/TopBar/LevelBox/LevelLabel")
paths.append("UI/HUD/TopBar/ScoreBox")
paths.append("UI/HUD/TopBar/ScoreBox/Icon")
paths.append("UI/HUD/TopBar/ScoreBox/ScoreLabel")
paths.append("UI/HUD/TopBar/CoinsBox")
paths.append("UI/HUD/TopBar/CoinsBox/Icon")
paths.append("UI/HUD/TopBar/CoinsBox/CoinsLabel")
paths.append("UI/HUD/TopBar/LivesBox")
paths.append("UI/HUD/TopBar/LivesBox/Icon")
paths.append("UI/HUD/TopBar/LivesBox/LivesLabel")
paths.append("UI/HUD/GoalLabel")
paths.append("UI/HUD/Hint")
paths.append("UI/Overlays/LevelClear")
paths.append("UI/Overlays/LevelClear/VBox")
paths.append("UI/Overlays/LevelClear/VBox/Title")
paths.append("UI/Overlays/LevelClear/VBox/Stats")
paths.append("UI/Overlays/LevelClear/VBox/DoubleButton")
paths.append("UI/Overlays/LevelClear/VBox/NextButton")
paths.append("UI/Overlays/GameOver")
paths.append("UI/Overlays/GameOver/VBox")
paths.append("UI/Overlays/GameOver/VBox/Title")
paths.append("UI/Overlays/GameOver/VBox/Stats")
paths.append("UI/Overlays/GameOver/VBox/ReviveButton")
paths.append("UI/Overlays/GameOver/VBox/RetryButton")
paths.append("UI/Overlays/GameOver/VBox/MenuButton")
paths.append("UI/Overlays/Pause")
paths.append("UI/Overlays/Pause/VBox")
paths.append("UI/Overlays/Pause/VBox/Title")
paths.append("UI/Overlays/Pause/VBox/ResumeButton")
paths.append("UI/Overlays/Pause/VBox/MenuButton")
paths.append("GameRoot/Background")
paths.append("GameRoot/Paddle")
paths.append("GameRoot/Ball")
for i in range(paths.size()):
	var p: String = paths[i]
	var n: Node = root.get_node_or_null(p)
	if n == null:
		out[p] = {"missing": true}
		continue
	var item: Dictionary = {"class": n.get_class(), "name": str(n.name)}
	if n is CanvasItem:
		item["visible"] = (n as CanvasItem).visible
	if n is Control:
		var c: Control = n as Control
		var r: Rect2 = c.get_global_rect()
		item["x"] = r.position.x
		item["y"] = r.position.y
		item["w"] = r.size.x
		item["h"] = r.size.y
		if n is Label:
			var lab: Label = n as Label
			item["text"] = lab.text
			item["font_size"] = lab.get_theme_font_size("font_size")
			var fc: Color = lab.get_theme_color("font_color")
			item["font_color"] = [fc.r, fc.g, fc.b, fc.a]
			item["halign"] = lab.horizontal_alignment
		if n is Button:
			var btn: Button = n as Button
			item["text"] = btn.text
		if n is ColorRect:
			var cr: ColorRect = n as ColorRect
			var col: Color = cr.color
			item["color"] = [col.r, col.g, col.b, col.a]
		if n is TextureRect:
			var tr: TextureRect = n as TextureRect
			if tr.texture != null:
				item["tex"] = str(tr.texture.resource_path)
	elif n is Node2D:
		var n2: Node2D = n as Node2D
		item["x"] = n2.global_position.x
		item["y"] = n2.global_position.y
	out[p] = item
var mv: Node = root.get_node_or_null("UI/Overlays/Menu/VBox")
if mv != null:
	var kids: Array = []
	for ch in mv.get_children():
		var e: Dictionary = {"name": str(ch.name), "class": ch.get_class()}
		if ch is Control:
			var cc: Control = ch as Control
			var rr: Rect2 = cc.get_global_rect()
			e["x"] = rr.position.x
			e["y"] = rr.position.y
			e["w"] = rr.size.x
			e["h"] = rr.size.y
		if ch is Label:
			e["text"] = (ch as Label).text
		if ch is Button:
			e["text"] = (ch as Button).text
		kids.append(e)
	out["menu_kids"] = kids
out["btn_style"] = {"bg": [1.0, 0.69, 0.125, 1.0], "radius": 10}
_custom_print(JSON.stringify(out))
