/**
 * 输入管理工具
 * 键盘/鼠标/触屏输入的抽象和辅助函数
 */

/** 输入方向枚举 */
export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

/** 键盘按键映射 */
export const KeyMap = {
  UP: ['W', 'UP', 'ARROWUP'],
  DOWN: ['S', 'DOWN', 'ARROWDOWN'],
  LEFT: ['A', 'LEFT', 'ARROWLEFT'],
  RIGHT: ['D', 'RIGHT', 'ARROWRIGHT'],
  JUMP: ['SPACE', 'W', 'UP'],
  ACTION: ['E', 'ENTER'],
  PAUSE: ['ESC', 'P'],
} as const;

/**
 * 从键盘输入获取方向向量
 * @param keys Phaser 或类似的按键状态对象
 * @returns 归一化的方向向量 { x, y }
 */
export function getDirectionFromKeys(keys: Record<string, { isDown: boolean }>): {
  x: number;
  y: number;
} {
  let x = 0;
  let y = 0;

  const isDown = (keyNames: readonly string[]): boolean => keyNames.some((k) => keys[k]?.isDown);

  if (isDown(KeyMap.LEFT)) x -= 1;
  if (isDown(KeyMap.RIGHT)) x += 1;
  if (isDown(KeyMap.UP)) y -= 1;
  if (isDown(KeyMap.DOWN)) y += 1;

  // 对角线移动时归一化
  if (x !== 0 && y !== 0) {
    const factor = Math.SQRT1_2; // 1/√2 ≈ 0.707
    x *= factor;
    y *= factor;
  }

  return { x, y };
}
