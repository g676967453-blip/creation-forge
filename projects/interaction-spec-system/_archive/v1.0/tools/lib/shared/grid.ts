/**
 * 共享网格计算引擎
 * 从 spec-renderer.ts 提取，供组件渲染器和原型生成器共用
 */

export interface GridConfig {
  canvas_width: number;
  canvas_height: number;
  grid_base: number;
  grid_columns: number;
  grid_gutter: number;
  grid_margin: number;
  safe_area_top: number;
  safe_area_bottom: number;
}

export interface GridMetrics {
  phoneW: number;
  phoneH: number;
  scale: number;
  contentW: number;
  colW: number;
  gutterW: number;
  marginW: number;
  gridUnit: number;
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number; xxxl: number };
  thumbZones: { y0: number; y1: number; y2: number; y3: number };
}

const PHONE_DISPLAY_WIDTH = 420; // 展示用手机框宽度

export function computeGrid(config: GridConfig): GridMetrics {
  const phoneW = PHONE_DISPLAY_WIDTH;
  const scale = phoneW / config.canvas_width;
  const phoneH = (phoneW * config.canvas_height) / config.canvas_width;

  const contentW = config.canvas_width - config.grid_margin * 2;
  const colW = Math.round((contentW - config.grid_gutter * (config.grid_columns - 1)) / config.grid_columns);
  const gutterW = config.grid_gutter;
  const marginW = config.grid_margin;
  const gridUnit = Math.round(config.grid_base * scale * 100) / 100;

  const spacing = {
    xs: Math.round(4 * scale),
    sm: Math.round(8 * scale),
    md: Math.round(16 * scale),
    lg: Math.round(24 * scale),
    xl: Math.round(32 * scale),
    xxl: Math.round(48 * scale),
    xxxl: Math.round(64 * scale),
  };

  const thumbZones = {
    y0: 0,
    y1: Math.round(phoneH * 0.39),
    y2: Math.round(phoneH * 0.625),
    y3: Math.round(phoneH * 0.859),
  };

  return { phoneW, phoneH, scale, contentW, colW, gutterW, marginW, gridUnit, spacing, thumbZones };
}

/** 默认竖版手游网格配置 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  canvas_width: 720,
  canvas_height: 1280,
  grid_base: 8,
  grid_columns: 6,
  grid_gutter: 16,
  grid_margin: 16,
  safe_area_top: 44,
  safe_area_bottom: 34,
};
