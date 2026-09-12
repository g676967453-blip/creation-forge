class_name FloatText
extends Label
## 跳字：命中 / 灭火时在砖位上方弹出的短命数字
##
## 自己接管完整生命周期（弹一下 → 上升 → 淡出 → 自毁），
## 调用方只需 FloatText.spawn(...)，不必持有引用、不必手动清理。
##
## 挂在 brick_host 下 → 换关时由 _clear_bricks() 一并清掉，不会跨关残留。
## 自带 ui_theme.tres：它在 GameRoot 空间下拿不到 HUD 的 Theme，
## 不设会导致 Web 导出（无系统中文字体）下数字都是方框。

const RISE: float = 48.0       ## 上升距离（px）
const LIFE: float = 0.62       ## 存活时长（秒）
const POP_TIME: float = 0.12   ## 弹出放大时长（秒）
const POP_SCALE: float = 1.2   ## 弹出时的峰值缩放

const UI_THEME: Theme = preload("res://assets/fonts/ui_theme.tres")

var _at: Vector2 = Vector2.ZERO  ## 目标世界坐标（入树前设好，_ready 里用）


## 在 parent 下、以 at（世界坐标）为中心弹出一个跳字
static func spawn(
	parent: Node, at: Vector2, text: String, color: Color, size: int = 20
) -> FloatText:
	var t := FloatText.new()
	t.name = "FloatText"
	t.text = text
	t.theme = UI_THEME
	t.add_theme_font_size_override("font_size", size)
	t.add_theme_color_override("font_color", color)
	t.add_theme_color_override("font_shadow_color", Color(0.0, 0.0, 0.0, 0.85))
	t.add_theme_constant_override("shadow_offset_x", 2)
	t.add_theme_constant_override("shadow_offset_y", 2)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	t.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	t.size = Vector2(GameConstants.BRICK_W * 2.0, 28.0)
	t.mouse_filter = Control.MOUSE_FILTER_IGNORE
	t.z_index = 5  ## 压在砖块与掉落道具之上
	t._at = at
	parent.add_child(t)
	return t


func _ready() -> void:
	# 入树后才设 global_position：此时 global 变换才有效，也才能让父节点非原点时同样正确
	global_position = _at - size * 0.5
	pivot_offset = size * 0.5

	var pop: Tween = create_tween()
	pop.tween_property(self, "scale", Vector2(POP_SCALE, POP_SCALE), POP_TIME) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	pop.tween_property(self, "scale", Vector2.ONE, POP_TIME)

	var rise: Tween = create_tween()
	rise.set_parallel(true)
	rise.tween_property(self, "position:y", position.y - RISE, LIFE) \
		.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	# 前半段保持不透明，后半段才淡出，数字才看得清
	rise.tween_property(self, "modulate:a", 0.0, LIFE * 0.55).set_delay(LIFE * 0.45)

	get_tree().create_timer(LIFE).timeout.connect(queue_free)
