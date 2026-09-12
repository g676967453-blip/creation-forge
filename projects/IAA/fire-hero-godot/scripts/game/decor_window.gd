class_name DecorWindow
extends Sprite2D
## 装饰性正常窗（规则 §3.2 的 N 态）：无碰撞、不计目标，只为窗格成片更完整
##
## 球擦过时来一下「撞击反馈」：快速左右晃动 + 轻微放大 + 红白相间闪烁。
##
## 为什么红白闪烁做在加法发光层、而不是 modulate：
## modulate 是**乘法**，Color.WHITE 才是「不改变」。用红色 modulate（如 (1,0.2,0.2)）
## 只会让窗户「变暗发红」（G/B 被压低），乘法永远乘不出比原图更亮的像素 ——
## 想要真正的红光/白光，必须往画面上**加**光。所以红白交替驱动的是
## BLEND_MODE_ADD 那一层；主图 modulate 只负责整体提亮的「冲一下」。
##
## 检测方式：由 game_root 每帧按组做一次 AABB 判定后调用 flash()，
## 而不是每个窗户各挂 Area2D —— 装饰窗数量不多（一屏几十个），
## 且纯视觉反馈不值得为它引入物理体。

const IMPACT_TIME: float = 0.38      ## 撞击反馈总时长（秒）
const SHAKE_AMP: float = 7.0         ## 左右晃动峰值振幅（px）
const SHAKE_CYCLES: float = 4.0      ## 晃动来回次数（越多越「急」）
const SCALE_PEAK: float = 0.16       ## 轻微放大峰值（1.0 → 1.16）
const GLOW_PEAK_ALPHA: float = 0.85  ## 加法发光层峰值不透明度
const COLOR_SWITCH: float = 0.055    ## 红/白切换间隔（秒）——越小闪得越急

## 过曝色（分量 >1 才真正提亮；超出部分由输出钳到白）
const IMPACT_MODULATE: Color = Color(1.65, 1.60, 1.50, 1.0)
## 加法发光层的两种色：红 / 白
const GLOW_RED: Color = Color(1.0, 0.12, 0.12)
const GLOW_WHITE: Color = Color(1.0, 0.96, 0.88)

var _glow: Sprite2D = null
var _base_modulate: Color = Color.WHITE
var _base_scale: Vector2 = Vector2.ONE
var _base_x: float = 0.0
var _impact_left: float = 0.0
var _impact_total: float = 0.0


func _ready() -> void:
	# 记住静止外观：晃动/放大结束后回到它，而不是硬编码回到 WHITE/ONE
	_base_modulate = modulate
	_base_scale = scale
	_base_x = position.x
	_build_glow()
	add_to_group("decor_window")
	set_process(false)  # 平时不跑 _process，撞击时才开


## 加法混合的发光副本：与主图同贴图、同尺寸，平时完全透明
func _build_glow() -> void:
	var mat := CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	_glow = Sprite2D.new()
	_glow.name = "FlashGlow"
	_glow.texture = texture
	_glow.material = mat
	_glow.modulate = Color(1.0, 1.0, 1.0, 0.0)
	_glow.z_index = 1  ## 压在窗本体之上
	add_child(_glow)


## 判定用的静止位置（全局坐标）。
##
## 撞击时 position.x 会左右晃动，若外部拿 global_position 做重叠判定，就会出现
## 「窗户晃出重叠区 → 判定清空 → 晃回来 → 重新触发」的自激循环，
## 表现为球停在旁边时窗户一直抖。所以判定必须用不受晃动影响的位置。
##
## 注意不要写成 to_global(Vector2(_base_x, position.y))：position 是**父空间**的值，
## 而 to_global() 期望**节点自身空间**的点，混用会把坐标算重（(69,340)→(138,680)）。
## 正确做法是拿实际全局位置减去晃动偏移。
func rest_global_position() -> Vector2:
	return global_position - Vector2(position.x - _base_x, 0.0)


## 被球碰到：起一次撞击反馈。重复触发会重新计时，不会叠加或卡在中间态
func flash() -> void:
	_impact_left = IMPACT_TIME
	_impact_total = IMPACT_TIME
	# 当帧立刻给到峰值，不等下一帧 —— 否则快速擦碰会「看不见反应」
	modulate = IMPACT_MODULATE
	scale = _base_scale * (1.0 + SCALE_PEAK)
	if _glow != null and is_instance_valid(_glow):
		_glow.modulate = Color(GLOW_RED.r, GLOW_RED.g, GLOW_RED.b, GLOW_PEAK_ALPHA)
	set_process(true)


func _process(delta: float) -> void:
	if _impact_left <= 0.0:
		_restore()
		return

	_impact_left = maxf(0.0, _impact_left - delta)
	var t: float = 1.0 - (_impact_left / _impact_total)  # 0 → 1
	var envelope: float = 1.0 - t                        # 1 → 0，统一衰减包络

	# 快速左右晃动：正弦 × 衰减包络，越到后面越轻，收得住
	position.x = _base_x + sin(t * SHAKE_CYCLES * TAU) * SHAKE_AMP * envelope

	# 轻微放大：从峰值持续回落到原尺寸
	scale = _base_scale * (1.0 + SCALE_PEAK * envelope)

	# 整体提亮：同样按包络淡回原色
	modulate = _base_modulate.lerp(IMPACT_MODULATE, envelope)

	# 红白相间：驱动加法发光层（强弱也跟着包络走，避免结束瞬间「啪」地灭掉）
	if _glow != null and is_instance_valid(_glow):
		var half: int = int((_impact_total - _impact_left) / COLOR_SWITCH)
		var tint: Color = GLOW_RED if half % 2 == 0 else GLOW_WHITE
		_glow.modulate = Color(tint.r, tint.g, tint.b, GLOW_PEAK_ALPHA * (0.4 + 0.6 * envelope))

	if _impact_left <= 0.0:
		_restore()


## 回到静止外观并停掉 _process
func _restore() -> void:
	position.x = _base_x
	scale = _base_scale
	modulate = _base_modulate
	if _glow != null and is_instance_valid(_glow):
		_glow.modulate = Color(1.0, 1.0, 1.0, 0.0)
	set_process(false)
