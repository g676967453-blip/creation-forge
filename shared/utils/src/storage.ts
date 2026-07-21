/**
 * 本地存储工具
 * 对 localStorage 的类型安全封装，用于游戏存档和设置
 */

/** 存储键名前缀，避免与浏览器其他数据冲突 */
const PREFIX = 'creation-forge:';

/**
 * 保存数据到 localStorage
 * @param key 键名（自动添加前缀）
 * @param value 要保存的值（自动 JSON 序列化）
 */
export function save<T>(key: string, value: T): void {
  try {
    const json = JSON.stringify(value);
    localStorage.setItem(PREFIX + key, json);
  } catch (error) {
    console.warn(`[存储] 保存 "${key}" 失败:`, error);
  }
}

/**
 * 从 localStorage 读取数据
 * @param key 键名
 * @param fallback 读取失败时的默认值
 * @returns 读取的值或默认值
 */
export function load<T>(key: string, fallback: T): T {
  try {
    const json = localStorage.getItem(PREFIX + key);
    if (json === null) return fallback;
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn(`[存储] 读取 "${key}" 失败:`, error);
    return fallback;
  }
}

/**
 * 删除指定键的数据
 */
export function remove(key: string): void {
  localStorage.removeItem(PREFIX + key);
}

/**
 * 清除所有造化坊相关的存储数据
 */
export function clearAll(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
