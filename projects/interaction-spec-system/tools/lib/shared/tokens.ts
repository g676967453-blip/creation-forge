/**
 * 共享 Design Token 工具
 * 从 tokens/base.css 读取 CSS 变量，支持 YAML 参数注入
 */
import * as fs from "fs";
import * as path from "path";

const TOKENS_DIR = path.resolve(__dirname, "../../../tokens");
const BASE_CSS_PATH = path.join(TOKENS_DIR, "base.css");

/** Token 颜色覆盖映射 */
export interface TokenOverrides {
  color_primary?: string;
  color_success?: string;
  color_warning?: string;
  color_danger?: string;
  color_info?: string;
  rarity_colors?: Record<string, string>;
}

/** 从 base.css 读取原始 CSS 内容 */
export function readBaseCSS(): string {
  return fs.readFileSync(BASE_CSS_PATH, "utf-8");
}

/** 将 hex 颜色转换为 rgba */
export function hexToRGBA(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 将 hex 颜色 darken 指定百分比 */
export function darken(hex: string, percent: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * percent));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * percent));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * percent));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** 用 YAML 参数覆盖 base.css 中的默认颜色值，返回注入后的 CSS */
export function injectTokens(baseCSS: string, overrides: TokenOverrides): string {
  let css = baseCSS;

  if (overrides.color_primary) {
    const hex = overrides.color_primary;
    css = css
      .replace(/--accent:\s*#[a-fA-F0-9]+;/, `--accent: ${hex};`)
      .replace(/--accent-hover:\s*#[a-fA-F0-9]+;/, `--accent-hover: ${darken(hex, 0.1)};`)
      .replace(/--accent-pressed:\s*#[a-fA-F0-9]+;/, `--accent-pressed: ${darken(hex, 0.2)};`)
      .replace(/--accent-bg:\s*rgba\([^)]+\);/, `--accent-bg: ${hexToRGBA(hex, 0.08)};`)
      .replace(/--shadow-glow-accent:\s*[^;]+;/, `--shadow-glow-accent: 0 0 12px ${hexToRGBA(hex, 0.3)};`);
  }

  if (overrides.color_success) {
    const hex = overrides.color_success;
    css = css
      .replace(/--success:\s*#[a-fA-F0-9]+;/, `--success: ${hex};`)
      .replace(/--success-bg:\s*rgba\([^)]+\);/, `--success-bg: ${hexToRGBA(hex, 0.08)};`);
  }

  if (overrides.color_warning) {
    const hex = overrides.color_warning;
    css = css
      .replace(/--warning:\s*#[a-fA-F0-9]+;/, `--warning: ${hex};`)
      .replace(/--warning-bg:\s*rgba\([^)]+\);/, `--warning-bg: ${hexToRGBA(hex, 0.08)};`);
  }

  if (overrides.color_danger) {
    const hex = overrides.color_danger;
    css = css
      .replace(/--danger:\s*#[a-fA-F0-9]+;/, `--danger: ${hex};`)
      .replace(/--danger-bg:\s*rgba\([^)]+\);/, `--danger-bg: ${hexToRGBA(hex, 0.08)};`);
  }

  if (overrides.color_info) {
    const hex = overrides.color_info;
    css = css
      .replace(/--info:\s*#[a-fA-F0-9]+;/, `--info: ${hex};`)
      .replace(/--info-bg:\s*rgba\([^)]+\);/, `--info-bg: ${hexToRGBA(hex, 0.08)};`);
  }

  if (overrides.rarity_colors) {
    const rc = overrides.rarity_colors;
    if (rc.common) {
      css = css
        .replace(/--q-common:\s*#[a-fA-F0-9]+;/, `--q-common: ${rc.common};`)
        .replace(/--q-common-bg:\s*rgba\([^)]+\);/, `--q-common-bg: ${hexToRGBA(rc.common, 0.08)};`);
    }
    if (rc.rare) {
      css = css
        .replace(/--q-rare:\s*#[a-fA-F0-9]+;/, `--q-rare: ${rc.rare};`)
        .replace(/--q-rare-bg:\s*rgba\([^)]+\);/, `--q-rare-bg: ${hexToRGBA(rc.rare, 0.08)};`);
    }
    if (rc.epic) {
      css = css
        .replace(/--q-epic:\s*#[a-fA-F0-9]+;/, `--q-epic: ${rc.epic};`)
        .replace(/--q-epic-bg:\s*rgba\([^)]+\);/, `--q-epic-bg: ${hexToRGBA(rc.epic, 0.08)};`);
    }
    if (rc.legendary) {
      css = css
        .replace(/--q-legendary:\s*#[a-fA-F0-9]+;/, `--q-legendary: ${rc.legendary};`)
        .replace(/--q-legendary-bg:\s*rgba\([^)]+\);/, `--q-legendary-bg: ${hexToRGBA(rc.legendary, 0.08)};`);
    }
  }

  return css;
}

/** 读取并注入 token 后的 CSS（一步完成） */
export function getTokenCSS(overrides?: TokenOverrides): string {
  const baseCSS = readBaseCSS();
  return overrides ? injectTokens(baseCSS, overrides) : baseCSS;
}
