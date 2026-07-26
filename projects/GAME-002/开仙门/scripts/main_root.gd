extends Node2D
class_name MainRoot
## 场景根节点 — 窗口尺寸管理
## V0.1 注：原 main_root.gd 中的重复开场动画已移除，统一使用 IntroScreen (scripts/ui/intro_screen.gd)


func _ready() -> void:
	# 强制窗口尺寸 = 1280×720（Godot 4.7 兼容）
	_fix_window_size()
	# 下一帧再次确认窗口尺寸（防止 Godot 4.7 在 _ready 后覆盖）
	if not OS.has_feature("web"):
		call_deferred("_fix_window_size")


func _fix_window_size() -> void:
	"""强制窗口为 1280×720，兼容 Godot 4.7 编辑器测试窗口缩放"""
	if not OS.has_feature("web"):
		DisplayServer.window_set_size(Vector2i(1280, 720))
