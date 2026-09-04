extends RefCounted
class_name LevelBuilder
## 根据 LevelDB / 程序化规则生成窗户


static func build(parent: Node, level: int) -> Dictionary:
	## 返回 { bricks: Array, fire_left: int, rescue_left: int }
	var layout: Array = LevelDB.get_layout(level)
	if layout.is_empty():
		return _build_procedural(parent, level)

	var bricks: Array = []
	var fire_left: int = 0
	var rescue_left: int = 0

	for r in range(layout.size()):
		for c in range(GameConstants.BRICK_COLS):
			var ch: String = LevelDB.cell_at(layout, r, c)
			if ch == "." or ch == "":
				continue
			var brick: WindowBrick = _spawn_from_char(parent, ch, c, r)
			if brick == null:
				continue
			bricks.append(brick)
			if brick.brick_type == WindowBrick.BrickType.FIRE:
				fire_left += 1
			elif brick.brick_type == WindowBrick.BrickType.RESCUE and not brick.is_red:
				rescue_left += 1

	return {"bricks": bricks, "fire_left": fire_left, "rescue_left": rescue_left}


static func _spawn_from_char(parent: Node, ch: String, col: int, row: int) -> WindowBrick:
	var brick: WindowBrick = _make_brick_node(parent)
	match ch:
		"F":
			brick.setup(WindowBrick.BrickType.FIRE, 1, false)
		"f":
			brick.setup(WindowBrick.BrickType.FIRE, 2, false)
		"g":
			brick.setup(WindowBrick.BrickType.FIRE, 3, false)
		"R":
			brick.setup(WindowBrick.BrickType.RESCUE, 1, false)
		"r":
			brick.setup(WindowBrick.BrickType.RESCUE, 1, true)
		_:
			brick.queue_free()
			return null
	brick.grid_col = col
	brick.grid_row = row
	var pos: Vector2 = GameConstants.brick_pos(col, row)
	brick.position = pos + Vector2(GameConstants.BRICK_W * 0.5, GameConstants.BRICK_H * 0.5)
	return brick


static func _build_procedural(parent: Node, level: int) -> Dictionary:
	var bricks: Array = []
	var fire_left: int = 0
	var rescue_left: int = 0
	var rows: int = mini(5 + int((level - 7) / 2.0), 8)
	var max_lv: int = 3 if level >= 12 else (2 if level >= 9 else 1)
	var rng: RandomNumberGenerator = RandomNumberGenerator.new()
	rng.randomize()

	var temp: Array = []
	for r in range(rows):
		for c in range(GameConstants.BRICK_COLS):
			if rng.randf() < 0.12:
				continue
			var lev: int = 1
			if max_lv >= 2 and rng.randf() < 0.3 + (float(r) / float(rows)) * 0.2:
				lev = 2
			if max_lv >= 3 and rng.randf() < 0.12:
				lev = 3
			var brick: WindowBrick = _make_brick_node(parent)
			brick.setup(WindowBrick.BrickType.FIRE, lev, false)
			brick.grid_col = c
			brick.grid_row = r
			var pos: Vector2 = GameConstants.brick_pos(c, r)
			brick.position = pos + Vector2(GameConstants.BRICK_W * 0.5, GameConstants.BRICK_H * 0.5)
			temp.append(brick)
			bricks.append(brick)
			fire_left += 1

	var n: int = mini(2 + int(level / 3.0), 5)
	n = mini(n, temp.size())
	for i in range(temp.size() - 1, 0, -1):
		var j: int = rng.randi_range(0, i)
		var tmp: Variant = temp[i]
		temp[i] = temp[j]
		temp[j] = tmp

	for i in range(n):
		var b: WindowBrick = temp[i] as WindowBrick
		if b == null:
			continue
		if b.brick_type == WindowBrick.BrickType.FIRE:
			fire_left = maxi(0, fire_left - 1)
		var make_red: bool = rng.randf() < 0.35
		b.setup(WindowBrick.BrickType.RESCUE, 1, make_red)
		if not make_red:
			rescue_left += 1

	return {"bricks": bricks, "fire_left": fire_left, "rescue_left": rescue_left}


static func spawn_single_fire(parent: Node, col: int, row: int) -> WindowBrick:
	var brick: WindowBrick = _make_brick_node(parent)
	brick.setup(WindowBrick.BrickType.FIRE, 1, false)
	brick.grid_col = col
	brick.grid_row = row
	var pos: Vector2 = GameConstants.brick_pos(col, row)
	brick.position = pos + Vector2(GameConstants.BRICK_W * 0.5, GameConstants.BRICK_H * 0.5)
	return brick


static func _make_brick_node(parent: Node) -> WindowBrick:
	var brick: WindowBrick = WindowBrick.new()
	brick.add_to_group("brick")
	brick.collision_layer = 8
	brick.collision_mask = 0

	var shape: CollisionShape2D = CollisionShape2D.new()
	shape.name = "CollisionShape2D"
	var rect: RectangleShape2D = RectangleShape2D.new()
	rect.size = Vector2(GameConstants.BRICK_W, GameConstants.BRICK_H)
	shape.shape = rect
	brick.add_child(shape)

	var visual: Sprite2D = Sprite2D.new()
	visual.name = "Visual"
	visual.texture = preload("res://assets/props/windows/window_fire.png")
	brick.add_child(visual)

	var label: Label = Label.new()
	label.name = "Label"
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.add_theme_font_size_override("font_size", 12)
	brick.add_child(label)

	parent.add_child(brick)
	return brick
