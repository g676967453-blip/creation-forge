/**
 * 游戏全局配置
 * 所有游戏常量集中管理于此
 */
export const GameConfig = {
  /** 画布宽度 */
  width: 800,
  /** 画布高度 */
  height: 600,
  /** 默认重力 (x, y) */
  defaultGravity: { x: 0, y: 0 } as const,
  /** 是否显示物理调试框 */
  debugPhysics: true,
} as const;
