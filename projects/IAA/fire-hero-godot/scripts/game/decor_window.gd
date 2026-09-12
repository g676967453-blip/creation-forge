class_name DecorWindow
extends Sprite2D
## 装饰性正常窗（规则 §3.2 的 N 态）：无碰撞、不计目标，只为窗格成片更完整
##
## 球擦过时来一下撞击反馈：快速左右晃动 + 轻微放大 + 红白相间闪烁。
## 动画逻辑复用 HitImpact —— 与火砖走同一条路径，不各写一份。
##
## 检测方式：由 game_root 每帧按组做一次 AABB 判定后调用 flash()，
## 而不是每个窗户各挂 Area2D —— 装饰窗一屏几十个，
## 且纯视觉反馈不值得为它引入物理体。

var _impact: HitImpact = null


func _ready() -> void:
	_impact = HitImpact.new(self)
	add_to_group("decor_window")
	set_process(false)  # 平时不跑 _process，只有撞击期间才开


## 被球碰到：起一次撞击反馈。重复触发会重新计时，不会叠加
func flash() -> void:
	if _impact == null:
		return
	_impact.start()
	set_process(true)


func _process(delta: float) -> void:
	if _impact == null or not _impact.update(delta):
		set_process(false)


## 判定用的静止位置（全局坐标）。
##
## 撞击时窗户在左右晃，若判定拿 global_position，就会出现
## 「晃出重叠区 → 判定清空 → 晃回来 → 重新触发」的自激循环，
## 表现为球停在旁边时窗户一直抖。所以判定必须用静止位置。
func rest_global_position() -> Vector2:
	if _impact == null:
		return global_position
	return _impact.rest_global_position()
