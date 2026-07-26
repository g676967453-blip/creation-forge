extends Area2D
class_name MainPeak
## V0.1 精简版 — 仅保留 HP/防御/点击/器灵绑定
## 攻击逻辑已移至 DiscipleSquad；升级逻辑已移至 BlessingManager

signal main_peak_destroyed
signal clicked(screen_position: Vector2)

# ── HP 与防御 ──
var max_hp: float = 2000.0
var current_hp: float = 2000.0
var spirit_armor: int = 0
var spirit_def_bonus: float = 0.0
var spirit_regen: float = 0.0
var _regen_timer: float = 0.0

# ── 护盾 ──
var shield_hp: float = 0.0
var shield_max: float = 500.0
var shield_cd: float = 15.0
var shield_timer: float = 0.0
var shield_broken: bool = false

# ── 状态 ──
var battle_active: bool = false
var _invincible: bool = false

# ── 成长 ──
var spirit_repair_count: int = 0
var spirit_slot_count: int = 1
var spirit_spirit_bonus: float = 0.2
var spirit_exp_bonus: float = 0.1

# ── 视觉 ──
var _form_sprite: Sprite2D
@onready var _click_shape: CollisionShape2D = $CollisionShape2D


func _ready() -> void:
	var cfg = DataManager.main_peak_config
	if cfg:
		max_hp = cfg.max_hp
	current_hp = max_hp
	collision_layer = 1
	collision_mask = 4
	input_pickable = true
	add_to_group("main_peak")
	_sync_click_shape()
	set_process(true)


func _process(delta: float) -> void:
	if current_hp <= 0.0:
		return
	_process_shield(delta)
	if not battle_active:
		_process_regen(delta)


func _process_shield(delta: float) -> void:
	if shield_hp <= 0.0 and not shield_broken:
		shield_broken = true
		shield_timer = shield_cd
	if shield_broken:
		shield_timer -= delta
		if shield_timer <= 0.0:
			shield_broken = false
			shield_hp = shield_max


func _process_regen(delta: float) -> void:
	if current_hp >= max_hp:
		return
	_regen_timer += delta
	if _regen_timer >= 1.0:
		_regen_timer -= 1.0
		heal(max_hp * max(0.01, spirit_regen))


# ── 防御链 ──

func take_damage(amount: float) -> void:
	if _invincible or current_hp <= 0.0:
		return
	var dmg: float = amount
	dmg = max(0.0, dmg - float(spirit_armor))
	if shield_hp > 0.0 and dmg > 0.0:
		var absorbed := minf(dmg, shield_hp)
		shield_hp -= absorbed
		dmg -= absorbed
	dmg *= max(0.0, 1.0 - spirit_def_bonus)
	if dmg <= 0.0:
		return
	current_hp -= dmg
	queue_redraw()
	if current_hp <= 0.0:
		var profile: String = get_meta(&"spirit_profile", &"")
		if profile == "spirit_book":
			current_hp = 1.0
			queue_redraw()
			return
		main_peak_destroyed.emit()


func heal(amount: float) -> void:
	current_hp = min(current_hp + amount, max_hp)
	queue_redraw()


# ── 公开 API ──

func set_battle_active(active: bool) -> void:
	battle_active = active
	if active:
		shield_hp = shield_max
		shield_timer = shield_cd
		_regen_timer = 0.0


func set_invincible(val: bool) -> void:
	_invincible = val


func set_form(texture_path: String) -> void:
	if _form_sprite == null or not is_instance_valid(_form_sprite):
		_form_sprite = Sprite2D.new()
		_form_sprite.name = "FormSprite"
		_form_sprite.z_index = 1
		add_child(_form_sprite)
	if texture_path.is_empty():
		_form_sprite.texture = null
		queue_redraw()
		return
	var tex: Texture2D = load(texture_path)
	if tex:
		_form_sprite.texture = tex
		_sync_click_shape(tex)
		queue_redraw()


func apply_spirit_growth(repair_count: int, growth: Dictionary) -> void:
	spirit_repair_count = repair_count
	var new_hp: float = float(growth.get("max_hp", max_hp))
	max_hp = new_hp
	current_hp = min(current_hp, max_hp)
	spirit_slot_count = int(growth.get("slot_count", spirit_slot_count))
	spirit_spirit_bonus = float(growth.get("spirit_bonus", spirit_spirit_bonus))
	spirit_exp_bonus = float(growth.get("exp_bonus", spirit_exp_bonus))
	queue_redraw()


# ── 点击交互 ──

func _input_event(_viewport: Viewport, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		clicked.emit(event.position)


func contains_global_point(point: Vector2) -> bool:
	var rect := _click_shape.shape as RectangleShape2D
	var size := Vector2(120.0, 120.0)
	if rect != null:
		size = rect.size
	var half := size * 0.5
	return abs(point.x - global_position.x) <= half.x and abs(point.y - global_position.y) <= half.y


# ── 绘制 ──

func _draw() -> void:
	if has_node("FormSprite"):
		return
	var points := PackedVector2Array([
		Vector2(0, -40), Vector2(30, 20), Vector2(20, 30),
		Vector2(-20, 30), Vector2(-30, 20)
	])
	draw_colored_polygon(points, Color(0.15, 0.1, 0.2))
	var closed := PackedVector2Array(points)
	closed.append(points[0])
	draw_polyline(closed, Color(0.4, 0.3, 0.5), 1.5)


func _sync_click_shape(tex: Texture2D = null) -> void:
	if _click_shape == null:
		return
	var rect := _click_shape.shape as RectangleShape2D
	if rect == null:
		rect = RectangleShape2D.new()
		_click_shape.shape = rect
	if tex:
		var icon_size := tex.get_size()
		rect.size = Vector2(icon_size.x + 24.0, icon_size.y + 24.0)
	else:
		rect.size = Vector2(120.0, 120.0)
