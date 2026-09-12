class_name DecorWindow
extends Sprite2D
## 装饰性正常窗（规则 §3.2 的 N 态）：无碰撞、不计目标，只为窗格成片更完整
##
## 球擦过时闪一下 —— 这类窗户不参与玩法，砸上去原本毫无反馈，看起来像穿模。
##
## 为什么不是「modulate 调成亮色」：
## modulate 是**乘法**，Color.WHITE 才是「不改变」。任何三通道 ≤1 的颜色只会让窗户
## 变暗（比如 (1.0, 0.96, 0.78) 其实就是「R 不变 / G 略暗 / B 明显变暗」= 暗黄），
## 乘法永远乘不出比原图更亮的像素。所以真正的提亮必须靠加法混合：
## 这里额外叠一层同贴图的 BLEND_MODE_ADD 副本当发光，再把主图 modulate 过曝，
## 两者一起在短时间内衰减回常态。
##
## 检测方式：由 game_root 每帧按组做一次 AABB 判定后调用 flash()，
## 而不是每个窗户各挂 Area2D —— 装饰窗数量不多（一屏几十个），
## 且纯视觉反馈不值得为它引入物理体。

const FLASH_TIME: float = 0.30    ## 闪一下的总时长（秒）
const FLASH_SCALE: float = 1.14   ## 缩放冲击：纯亮度变化在像素风下不够抓眼
## 过曝色（>1 才会真正提亮；超出部分由输出钳到白，表现为「闪白」）
const FLASH_MODULATE: Color = Color(2.2, 2.1, 1.8, 1.0)
const GLOW_PEAK_ALPHA: float = 0.9  ## 加法发光层的峰值不透明度

var _glow: Sprite2D = null
var _tween: Tween = null
var _base_modulate: Color = Color.WHITE
var _base_scale: Vector2 = Vector2.ONE


func _ready() -> void:
	# 记住初始外观：闪光结束后回到它，而不是硬编码回 WHITE/ONE
	_base_modulate = modulate
	_base_scale = scale
	_build_glow()
	add_to_group("decor_window")


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


## 被球碰到：闪一下。重复触发会重启，不会叠加或卡在中间态
func flash() -> void:
	if _tween != null and _tween.is_valid():
		_tween.kill()

	modulate = FLASH_MODULATE
	scale = _base_scale * FLASH_SCALE
	if _glow != null and is_instance_valid(_glow):
		_glow.modulate = Color(1.0, 1.0, 1.0, GLOW_PEAK_ALPHA)

	_tween = create_tween()
	_tween.set_parallel(true)
	_tween.tween_property(self, "modulate", _base_modulate, FLASH_TIME) \
		.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	_tween.tween_property(self, "scale", _base_scale, FLASH_TIME) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	if _glow != null and is_instance_valid(_glow):
		_tween.tween_property(_glow, "modulate:a", 0.0, FLASH_TIME) \
			.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
