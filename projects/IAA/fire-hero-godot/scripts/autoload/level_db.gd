extends Node
## 关卡布局库（自由坐标版）
## 手配关窗户 = 450×800 画布上的自由坐标（x/y = 窗中心像素，整数），与 level-editor.html v2 同语义。
## type: F=火1 f=火2 g=火3 R=救援 r=红窗。
## 第 layouts.size()+1 关起走程序化生成（level_builder._build_procedural，仍用网格常量）。
## 坐标迁移自旧 7 列网格：cx = 45 + col*52 + 24；cy = 80 + row*52 + 24（与编辑器迁移公式一致）。

var layouts: Array = [
	[ # 1 入门
		{"type": "F", "x": 69, "y": 104},
		{"type": "F", "x": 121, "y": 104},
		{"type": "F", "x": 173, "y": 104},
		{"type": "F", "x": 69, "y": 156},
		{"type": "F", "x": 173, "y": 156},
		{"type": "R", "x": 69, "y": 208},
		{"type": "R", "x": 173, "y": 208},
	],
	[ # 2 二级火+红窗
		{"type": "F", "x": 69, "y": 104},
		{"type": "F", "x": 121, "y": 104},
		{"type": "R", "x": 173, "y": 104},
		{"type": "F", "x": 69, "y": 156},
		{"type": "f", "x": 121, "y": 156},
		{"type": "F", "x": 173, "y": 156},
		{"type": "R", "x": 69, "y": 208},
		{"type": "F", "x": 121, "y": 208},
		{"type": "r", "x": 173, "y": 208},
	],
	[ # 3 三级火
		{"type": "F", "x": 69, "y": 104},
		{"type": "f", "x": 121, "y": 104},
		{"type": "R", "x": 173, "y": 104},
		{"type": "R", "x": 69, "y": 156},
		{"type": "g", "x": 121, "y": 156},
		{"type": "F", "x": 173, "y": 156},
		{"type": "f", "x": 69, "y": 208},
		{"type": "F", "x": 121, "y": 208},
		{"type": "R", "x": 69, "y": 260},
		{"type": "r", "x": 121, "y": 260},
		{"type": "R", "x": 173, "y": 260},
	],
	[ # 4 混编
		{"type": "g", "x": 69, "y": 104},
		{"type": "F", "x": 121, "y": 104},
		{"type": "R", "x": 173, "y": 104},
		{"type": "f", "x": 69, "y": 156},
		{"type": "g", "x": 121, "y": 156},
		{"type": "r", "x": 173, "y": 156},
		{"type": "F", "x": 69, "y": 208},
		{"type": "R", "x": 121, "y": 208},
		{"type": "f", "x": 173, "y": 208},
		{"type": "r", "x": 69, "y": 260},
		{"type": "R", "x": 121, "y": 260},
		{"type": "F", "x": 173, "y": 260},
	],
	[ # 5 火人平衡
		{"type": "R", "x": 69, "y": 104},
		{"type": "r", "x": 121, "y": 104},
		{"type": "R", "x": 173, "y": 104},
		{"type": "F", "x": 69, "y": 156},
		{"type": "g", "x": 121, "y": 156},
		{"type": "F", "x": 173, "y": 156},
		{"type": "f", "x": 69, "y": 208},
		{"type": "R", "x": 121, "y": 208},
		{"type": "f", "x": 173, "y": 208},
		{"type": "g", "x": 69, "y": 260},
		{"type": "R", "x": 121, "y": 260},
		{"type": "g", "x": 173, "y": 260},
		{"type": "R", "x": 69, "y": 312},
		{"type": "r", "x": 121, "y": 312},
		{"type": "R", "x": 173, "y": 312},
	],
	[ # 6 高压
		{"type": "f", "x": 69, "y": 104},
		{"type": "f", "x": 121, "y": 104},
		{"type": "R", "x": 173, "y": 104},
		{"type": "g", "x": 69, "y": 156},
		{"type": "g", "x": 121, "y": 156},
		{"type": "r", "x": 173, "y": 156},
		{"type": "F", "x": 69, "y": 208},
		{"type": "F", "x": 121, "y": 208},
		{"type": "r", "x": 173, "y": 208},
		{"type": "f", "x": 69, "y": 260},
		{"type": "R", "x": 121, "y": 260},
		{"type": "g", "x": 173, "y": 260},
		{"type": "r", "x": 69, "y": 312},
		{"type": "R", "x": 121, "y": 312},
		{"type": "f", "x": 173, "y": 312},
		{"type": "R", "x": 69, "y": 364},
		{"type": "r", "x": 121, "y": 364},
		{"type": "F", "x": 173, "y": 364},
	],
]


func get_layout(level_index_1based: int) -> Array:
	## 手配关数据：dict 数组 [{type,x,y}, ...]；越界返回 []（不表示"空关"，见 has_hand_layout）
	if level_index_1based <= 0:
		return []
	if level_index_1based <= layouts.size():
		return layouts[level_index_1based - 1] as Array
	return []


func has_hand_layout(level_index_1based: int) -> bool:
	## 手配区边界判定：true = 走 _build_hand（即使布局被清空也走手配分支，触发 game_root 空关兜底）；
	## false = 走程序化生成。勿用 get_layout().is_empty() 代替本函数。
	return level_index_1based >= 1 and level_index_1based <= layouts.size()
