class_name GameConstants
extends Object
## 画布与玩法常量（对齐 HTML 原型 450×800）
## 注：手配关（LevelDB layouts）不消耗以下网格常量——窗户坐标为自由像素（中心）。
## 网格常量仅程序化关（≥ LevelDB 手配数+1）与空关兜底位置使用。

const VIEW_W: int = 450
const VIEW_H: int = 800

const PADDLE_W: float = 92.0
const PADDLE_H: float = 18.0
const PADDLE_Y: float = 650.0
const PADDLE_SPEED_BASE: float = 420.0

const BALL_R: float = 10.0
const BALL_SPEED_BASE: float = 320.0

const BRICK_COLS: int = 7
const BRICK_W: float = 48.0
const BRICK_H: float = 48.0
const BRICK_GAP: float = 4.0
const GRID_TOP: float = 80.0

## 手配关坐标迁移公式（编辑器同款，勿改）：cx = 45 + col*52 + 24；cy = 80 + row*52 + 24

## power_level=0 时各级火焰所需命中次数
const FIRE_HIT_REQ: Array[int] = [3, 5, 7]


static func facade_x0() -> float:
	var total: float = float(BRICK_COLS) * BRICK_W + float(BRICK_COLS - 1) * BRICK_GAP
	return (float(VIEW_W) - total) * 0.5


static func brick_pos(col: int, row: int) -> Vector2:
	var x: float = facade_x0() + float(col) * (BRICK_W + BRICK_GAP)
	var y: float = GRID_TOP + float(row) * (BRICK_H + BRICK_GAP)
	return Vector2(x, y)
