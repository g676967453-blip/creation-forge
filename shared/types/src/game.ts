/**
 * 游戏通用类型定义
 */

/** 游戏状态枚举 */
export enum GameState {
  /** 启动/加载中 */
  LOADING = 'loading',
  /** 主菜单 */
  MENU = 'menu',
  /** 游戏进行中 */
  PLAYING = 'playing',
  /** 暂停 */
  PAUSED = 'paused',
  /** 游戏结束 */
  GAME_OVER = 'gameOver',
  /** 关卡完成 */
  LEVEL_COMPLETE = 'levelComplete',
}

/** 基础玩家配置 */
export interface PlayerConfig {
  /** 移动速度 (像素/秒) */
  speed: number;
  /** 跳跃速度 (像素/秒) */
  jumpVelocity: number;
  /** 最大生命值 */
  maxHp: number;
  /** 精灵图资源 key */
  spriteKey: string;
}

/** 坐标位置 */
export interface Position {
  x: number;
  y: number;
}

/** 矩形区域 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 分数系统 */
export interface ScoreData {
  /** 当前得分 */
  score: number;
  /** 最高得分 */
  highScore: number;
  /** 连击数 */
  combo: number;
}

/** 关卡配置 */
export interface LevelConfig {
  /** 关卡编号 */
  level: number;
  /** 关卡名称 */
  name: string;
  /** 关卡描述 */
  description: string;
  /** 时间限制 (秒，0 = 无限制) */
  timeLimit: number;
  /** 目标分数 */
  targetScore: number;
}

/** 游戏存档 */
export interface SaveData {
  /** 存档版本号 */
  version: number;
  /** 保存时间戳 */
  savedAt: number;
  /** 最高分记录 */
  highScores: Record<string, number>;
  /** 已解锁关卡 */
  unlockedLevels: number[];
  /** 玩家设置 */
  settings: GameSettings;
}

/** 游戏设置 */
export interface GameSettings {
  /** 音量 (0-1) */
  masterVolume: number;
  /** 音效音量 (0-1) */
  sfxVolume: number;
  /** 背景音乐音量 (0-1) */
  bgmVolume: number;
  /** 语言 */
  language: 'zh-CN' | 'en';
  /** 是否显示 FPS */
  showFps: boolean;
}
