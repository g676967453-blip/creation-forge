/**
 * Stitch DESIGN.md 设计令牌解析器
 * 解析 YAML frontmatter + Markdown body → 结构化设计令牌
 * 供 stitch-to-godot-theme.ts 和 stitch-html-to-godot.ts 共享
 */

import { readFileSync } from 'fs';

// ---- 类型定义 ----

export interface ColorToken {
  name: string;       // e.g. "surface"
  hex: string;        // e.g. "#12121d"
  r: number; g: number; b: number;
  role: string;       // "Background", "Primary Action", etc.
}

export interface TypographyToken {
  name: string;       // e.g. "headline-xl"
  fontFamily: string;
  fontSize: number;   // px
  fontWeight: number; // 400 | 700 | 800
  lineHeight: number; // px
  letterSpacing: number; // em
}

export interface RoundedToken {
  name: string;       // e.g. "sm", "DEFAULT", "lg"
  rem: number;
  px: number;
}

export interface SpacingToken {
  name: string;       // e.g. "unit", "sm", "xl"
  px: number;
  rem: number;
}

export interface DesignTokens {
  name: string;
  colors: ColorToken[];
  typography: TypographyToken[];
  rounded: RoundedToken[];
  spacing: SpacingToken[];
  designRules: string[]; // 从 Markdown body 提取的设计规则
}

// ---- 颜色角色推断 ----

function inferColorRole(name: string): string {
  if (name.startsWith('surface_container_lowest') || name === 'surface_dim' || name === 'background')
    return 'Background (Darkest)';
  if (name.startsWith('surface_container_low') || name === 'surface' || name.startsWith('surface_container'))
    return 'Surface';
  if (name.startsWith('surface_bright') || name.startsWith('surface_container_highest'))
    return 'Surface (Bright)';
  if (name.startsWith('on_surface') || name.startsWith('on_background'))
    return 'Text on Surface';
  if (name.startsWith('primary') || name === 'surface_tint')
    return 'Primary / Gold / Qi';
  if (name.startsWith('on_primary'))
    return 'Text on Primary';
  if (name.startsWith('secondary') || name.startsWith('on_secondary'))
    return 'Secondary / Jade / Life';
  if (name.startsWith('tertiary') || name.startsWith('on_tertiary'))
    return 'Tertiary / Purple / Mystic';
  if (name.startsWith('error') || name.startsWith('on_error'))
    return 'Error / Red';
  if (name.startsWith('outline'))
    return 'Outline / Border';
  if (name.startsWith('inverse'))
    return 'Inverse';
  if (name === 'surface_variant')
    return 'Surface Variant';
  if (name.includes('fixed'))
    return `${inferColorRole(name.replace('-fixed', '').replace('_fixed', ''))} (Fixed)`;
  return 'Uncategorized';
}

// ---- YAML 解析（简单实现，仅支持本 DESIGN.md 格式） ----

function parseSimpleYaml(yaml: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yaml.split('\n');
  let currentKey: string | null = null;
  let currentIndent = 0;

  for (const line of lines) {
    if (!line.trim() || line.startsWith('#')) continue;

    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Top-level key: "name:", "colors:", "typography:", etc.
    if (indent === 0 && trimmed.endsWith(':')) {
      currentKey = trimmed.slice(0, -1);
      currentIndent = 0;
      result[currentKey] = result[currentKey] || {};
      continue;
    }

    // Nested key under top-level
    if (indent > 0 && currentKey) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;

      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      const unquoted = value.replace(/^['"]|['"]$/g, '');
      result[currentKey][key] = unquoted;
    }
  }

  return result;
}

// ---- 提取 Markdown body 中的设计规则 ----

function extractDesignRules(body: string): string[] {
  const rules: string[] = [];
  const h2Regex = /^## (.+)$/gm;
  let match;
  while ((match = h2Regex.exec(body)) !== null) {
    rules.push(`Section: ${match[1].trim()}`);
  }
  return rules;
}

// ---- 主解析函数 ----

export function parseDesignMd(filePath: string): DesignTokens {
  const content = readFileSync(filePath, 'utf-8');

  // 分离 YAML frontmatter 和 Markdown body
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) throw new Error(`Invalid DESIGN.md format: no YAML frontmatter in ${filePath}`);

  const [, yamlStr, body] = fmMatch;
  const yaml = parseSimpleYaml(yamlStr);

  // 解析颜色
  const colors: ColorToken[] = [];
  if (yaml.colors) {
    for (const [name, hex] of Object.entries(yaml.colors)) {
      const cleanHex = (hex as string).replace(/^['"]|['"]$/g, '');
      const r = parseInt(cleanHex.slice(1, 3), 16) / 255;
      const g = parseInt(cleanHex.slice(3, 5), 16) / 255;
      const b = parseInt(cleanHex.slice(5, 7), 16) / 255;
      colors.push({
        name,
        hex: cleanHex.startsWith('#') ? cleanHex : `#${cleanHex}`,
        r: Math.round(r * 1000) / 1000,
        g: Math.round(g * 1000) / 1000,
        b: Math.round(b * 1000) / 1000,
        role: inferColorRole(name),
      });
    }
  }

  // 解析字体
  const typography: TypographyToken[] = [];
  if (yaml.typography) {
    for (const [name, spec] of Object.entries(yaml.typography)) {
      if (typeof spec !== 'object') continue;
      const s = spec as Record<string, any>;
      const fs = parseInt(s.fontSize) || 14;
      typography.push({
        name,
        fontFamily: s.fontFamily || 'Unknown',
        fontSize: fs,
        fontWeight: parseInt(s.fontWeight) || 400,
        lineHeight: parseInt(s.lineHeight) || fs + 8,
        letterSpacing: parseFloat(s.letterSpacing || '0em'),
      });
    }
  }

  // 解析圆角
  const rounded: RoundedToken[] = [];
  if (yaml.rounded) {
    for (const [name, val] of Object.entries(yaml.rounded)) {
      const remStr = (val as string).replace(/rem$/, '');
      const rem = parseFloat(remStr);
      rounded.push({ name, rem, px: Math.round(rem * 16) });
    }
  }

  // 解析间距
  const spacing: SpacingToken[] = [];
  if (yaml.spacing) {
    for (const [name, val] of Object.entries(yaml.spacing)) {
      if (name === 'container-max') {
        spacing.push({ name: 'container-max', px: parseInt(val as string) || 1200, rem: 0 });
        continue;
      }
      const pxStr = (val as string).replace(/px$/, '');
      const px = parseInt(pxStr);
      spacing.push({ name, px, rem: px / 16 });
    }
  }

  const designRules = extractDesignRules(body);

  return {
    name: (yaml.name as string) || 'Unnamed Design',
    colors,
    typography,
    rounded,
    spacing,
    designRules,
  };
}
