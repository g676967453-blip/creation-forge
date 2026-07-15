/**
 * 游戏资源类型定义
 */

/** 资源类型 */
export enum AssetType {
  IMAGE = 'image',
  SPRITESHEET = 'spritesheet',
  AUDIO = 'audio',
  FONT = 'font',
  TILEMAP = 'tilemap',
  JSON = 'json',
}

/** 图片资源 */
export interface ImageAsset {
  type: AssetType.IMAGE;
  key: string;
  path: string;
}

/** 精灵图（动画帧表）资源 */
export interface SpritesheetAsset {
  type: AssetType.SPRITESHEET;
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
}

/** 音频资源 */
export interface AudioAsset {
  type: AssetType.AUDIO;
  key: string;
  path: string;
  /** audio 类型: 背景音乐还是音效 */
  category: 'bgm' | 'sfx';
}

/** 地图资源 */
export interface TilemapAsset {
  type: AssetType.TILEMAP;
  key: string;
  path: string;
}

/** 资源清单 — 一个游戏的所有资源 */
export type AssetManifest = (ImageAsset | SpritesheetAsset | AudioAsset | TilemapAsset)[];
