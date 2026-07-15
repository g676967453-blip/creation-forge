/**
 * 数学工具函数
 * 向量运算、插值、随机数等游戏开发常用数学
 */

/** 2D 向量 */
export interface Vector2D {
  x: number;
  y: number;
}

/** 创建 2D 向量 */
export function vec2(x: number, y: number): Vector2D {
  return { x, y };
}

/** 向量加法 */
export function addVec2(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** 向量减法 */
export function subVec2(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

/** 向量缩放 */
export function scaleVec2(v: Vector2D, s: number): Vector2D {
  return { x: v.x * s, y: v.y * s };
}

/** 向量长度 */
export function lengthVec2(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/** 向量归一化 */
export function normalizeVec2(v: Vector2D): Vector2D {
  const len = lengthVec2(v);
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
}

/**
 * 线性插值
 * @param a 起始值
 * @param b 结束值
 * @param t 插值因子 (0-1)
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 限制值在 [min, max] 范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 将值从一个范围映射到另一个范围
 */
export function remap(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
): number {
  const t = (value - fromMin) / (fromMax - fromMin);
  return lerp(toMin, toMax, t);
}

/**
 * 生成 [min, max) 范围内的随机数
 */
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * 生成 [min, max] 范围内的随机整数（包含两端）
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 角度转弧度
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 弧度转角度
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
