class_name DecorWindow
extends Sprite2D
## 装饰性正常窗（规则 §3.2 的 N 态）：无碰撞、不计目标，只为窗格成片更完整
##
## 球擦过时闪一下 —— 这类窗户不参与玩法，砸上去原本毫无反馈，看起来像穿模。
## 加一点光，让「球打到窗户」有即时回应。
##
## 检测方式：由 game_root 每帧按组做一次 AABB 判定后调用 flash()，
## 而不是每个窗户各挂 Area2D —— 装饰窗数量不多（一屏几十个），
## 且纯视觉反馈不值得为它引入物理体。

const FLASH_COLOR: Color = Color(1.0, 0.96, 0.78)
const FLASH_TIME: float = 0.22   ## 闪一下的总时长（秒）
const FLASH_SCALE: float = 1.08  ## 轻微放大，避免只有亮度变化不够显眼

var _tween: Tween = null
var _base_modulate: Color = Color.WHITE
var _base_scale: Vector2 = Vector2.ONE


func _ready() -> void:
	# 记住初始外观：闪光结束后回到它，而不是硬编码回 WHITE/ONE
	_base_modulate = modulate
	_base_scale = scale
	add_to_group("decor_window")


## 被球碰到：闪一下。重复触发会重启动效，不会叠加或卡在中间态
func flash() -> void:
	if _tween != null and _tween.is_valid():
		_tween.kill()
	modulate = FLASH_COLOR
	scale = _base_scale * FLASH_SCALE
	_tween = create_tween()
	_tween.set_parallel(true)
	_tween.tween_property(self, "modulate", _base_modulate, FLASH_TIME)
	_tween.tween_property(self, "scale", _base_scale, FLASH_TIME) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
