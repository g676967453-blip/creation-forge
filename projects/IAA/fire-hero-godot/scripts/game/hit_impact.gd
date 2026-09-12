class_name HitImpact
extends RefCounted
## 撞击反馈驱动器（可复用）：快速左右晃动 + 轻微放大 + 红白相间闪烁
##
## 只驱动传入的 Sprite2D「视觉层」，**绝不碰宿主的 position / 碰撞体**。
## 火砖是 StaticBody2D，直接晃它会带着 CollisionShape2D 一起动、干扰球路，
## 所以晃动必须落在视觉子节点上；装饰窗同样走这条统一路径。
##
## 为什么红白闪烁做在加法发光层、而不是 modulate：
## modulate 是**乘法**，Color.WHITE 才是「不改变」。用红色 modulate（如 (1,0.2,0.2)）
## 只会让画面「变暗发红」（G/B 被压低），乘法永远乘不出比原图更亮的像素 ——
## 想要真正的红光/白光，必须往画面上**加**光。
##
## 用法：
##   _impact = HitImpact.new(_visual)      # 构造时自动挂上加法发光子节点
##   _impact.configure(modulate, scale)    # 声明「静止外观」（视觉层会被别处改动时必须调）
##   _impact.start()                       # 被撞
##   if _impact.playing(): _impact.update(delta)

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

var target: Sprite2D = null          ## 主视觉节点（承载缩放/提亮/发光）
var glow: Sprite2D = null            ## 加法发光层

var _rest_position: Vector2 = Vector2.ZERO
var _rest_scale: Vector2 = Vector2.ONE
var _rest_modulate: Color = Color.WHITE
var _left: float = 0.0
var _total: float = IMPACT_TIME

## 跟随晃动的附加视觉节点（如火砖的血量数字）——否则窗户在抖、数字钉在原地会很怪。
## 类型用 CanvasItem 而不是 Node2D：Label 属于 Control，与 Node2D 只是同门兄弟，
## 两者唯一的共同祖先就是 CanvasItem。
var _co_shakers: Array[CanvasItem] = []
var _co_base: Dictionary = {}        ## CanvasItem → 静止时的 position.x


func _init(p_target: Sprite2D) -> void:
	target = p_target
	_rest_position = target.position
	_rest_scale = target.scale
	_rest_modulate = target.modulate
	_build_glow()


## 加法混合的发光副本：与主图同贴图、同尺寸，平时完全透明
func _build_glow() -> void:
	var mat := CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	glow = Sprite2D.new()
	glow.name = "HitGlow"
	glow.texture = target.texture
	glow.material = mat
	glow.modulate = Color(1.0, 1.0, 1.0, 0.0)
	glow.z_index = 1  ## 压在视觉层之上
	target.add_child(glow)


## 注册一起晃动的视觉节点（只跟随横向偏移，不参与缩放/发光）。
## 参数是 CanvasItem：Node2D（Sprite2D）与 Control（Label）都能收。
func add_co_shaker(node: CanvasItem) -> void:
	if node == null or _co_base.has(node):
		return
	_co_shakers.append(node)
	var p: Vector2 = node.get("position")
	_co_base[node] = p.x


## 声明「静止外观」。视觉层被别处改动过（如火砖按剩余 hp 缩放）时必须重新调用，
## 否则复原时会跳回旧尺寸。
func configure(rest_modulate: Color, rest_scale: Vector2) -> void:
	_rest_modulate = rest_modulate
	_rest_scale = rest_scale


## 被撞：起一次撞击反馈。重复触发会重新计时，不会叠加或卡在中间态
func start() -> void:
	# 贴图可能被别处换过（火砖有 lv1/2/3 三张），发光层要跟上
	if glow != null and is_instance_valid(glow):
		glow.texture = target.texture
	_left = IMPACT_TIME
	_total = IMPACT_TIME
	# 当帧立刻给到峰值，不等下一帧 —— 否则快速擦碰会「看不见反应」
	target.modulate = IMPACT_MODULATE
	target.scale = _rest_scale * (1.0 + SCALE_PEAK)
	if glow != null and is_instance_valid(glow):
		glow.modulate = Color(GLOW_RED.r, GLOW_RED.g, GLOW_RED.b, GLOW_PEAK_ALPHA)


func playing() -> bool:
	return _left > 0.0


## 推进一帧；返回 false 表示已结束（视觉层已归位）
func update(delta: float) -> bool:
	if _left <= 0.0:
		return false
	_left = maxf(0.0, _left - delta)
	var t: float = 1.0 - (_left / _total)  # 0 → 1
	var envelope: float = 1.0 - t          # 1 → 0，统一衰减包络

	# 快速左右晃动：正弦 × 衰减包络，越到后面越轻，收得住
	var offset: float = sin(t * SHAKE_CYCLES * TAU) * SHAKE_AMP * envelope
	target.position.x = _rest_position.x + offset

	# 轻微放大：从峰值持续回落到原尺寸
	target.scale = _rest_scale * (1.0 + SCALE_PEAK * envelope)

	# 整体提亮：同样按包络淡回原色
	target.modulate = _rest_modulate.lerp(IMPACT_MODULATE, envelope)

	# 红白相间：驱动加法发光层（强弱也跟着包络走，避免结束瞬间「啪」地灭掉）
	if glow != null and is_instance_valid(glow):
		var half: int = int((_total - _left) / COLOR_SWITCH)
		var tint: Color = GLOW_RED if half % 2 == 0 else GLOW_WHITE
		glow.modulate = Color(tint.r, tint.g, tint.b, GLOW_PEAK_ALPHA * (0.4 + 0.6 * envelope))

	_apply_co_shakers(offset)

	if _left <= 0.0:
		restore()
		return false
	return true


## 把跟随节点移到同一个横向偏移上。
## 用 get/set 而不是 .position：CanvasItem 本身没有 position 属性，
## 它分别声明在 Node2D 与 Control 上，静态访问会报「不存在的属性」。
func _apply_co_shakers(offset: float) -> void:
	# 不用带类型注解的循环变量：节点可能已被释放，带注解会触发
	# Object→Node 转换错误中断整帧（项目里分身 filter 踩过同一个坑）
	for n in _co_shakers:
		if n == null or not is_instance_valid(n):
			continue
		var p: Vector2 = n.get("position")
		p.x = float(_co_base[n]) + offset
		n.set("position", p)


## 回到静止外观
func restore() -> void:
	target.position = _rest_position
	target.scale = _rest_scale
	target.modulate = _rest_modulate
	_apply_co_shakers(0.0)
	if glow != null and is_instance_valid(glow):
		glow.modulate = Color(1.0, 1.0, 1.0, 0.0)
	_left = 0.0


## 判定用的静止位置（全局坐标）。
##
## 撞击时视觉层会左右晃动，若外部拿 global_position 做重叠判定，就会出现
## 「晃出重叠区 → 判定清空 → 晃回来 → 重新触发」的自激循环，
## 表现为球停在旁边时窗户一直抖。所以判定必须用不受晃动影响的位置。
##
## 注意不要写成 to_global(Vector2(_rest_x, position.y))：position 是**父空间**的值，
## 而 to_global() 期望**节点自身空间**的点，混用会把坐标算重（(69,340)→(138,680)）。
## 正确做法是拿实际全局位置减去晃动偏移。
func rest_global_position() -> Vector2:
	return target.global_position - (target.position - _rest_position)
