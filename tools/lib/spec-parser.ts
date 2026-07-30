/**
 * 游戏交互规范 MD 解析器
 * 解析 YAML frontmatter + Markdown 章节 → 结构化数据
 * 供 build-interaction-spec.ts 使用
 */

import { readFileSync } from "fs";

// ---- 类型定义 ----

export interface SpecConfig {
  platform: string;
  canvas_width: number;
  canvas_height: number;
  grid_base: number;
  grid_columns: number;
  grid_gutter: number;
  grid_margin: number;
  safe_area_top: number;
  safe_area_bottom: number;
  color_primary: string;
  color_success: string;
  color_warning: string;
  color_danger: string;
  color_info: string;
  rarity_colors: Record<string, string>;
  principles: Principle[];
  methodology: string;
  benchmarks: string;
  version: string;
}

export interface Principle {
  char: string;
  title: string;
  desc: string;
}

export interface TableRow {
  cells: string[];
}

export interface SpecSection {
  title: string;         // e.g. "画布与安全区"
  anchor: string;        // e.g. "画布与安全区"
  level: number;         // 2 = ##, 3 = ###
  rawContent: string;    // 原始 Markdown 内容
  tables: TableData[];
  lists: ListData[];
  subsections: SpecSection[];
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ListData {
  items: string[];
  ordered: boolean;
}

export interface ParsedSpec {
  config: SpecConfig;
  title: string;
  sections: SpecSection[];
  rawMd: string;
}

// ---- YAML 解析（简单实现，支持本 spec 格式） ----

function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let currentKey: string | null = null;
  let currentObj: Record<string, unknown> | null = null;
  let currentArray: unknown[] | null = null;
  let arrayItemBuffer: Record<string, string> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.search(/\S/);

    // Top-level key: "platform:" (nested) or "platform: value" (scalar)
    if (indent === 0) {
      // Flush pending array item
      if (currentArray && arrayItemBuffer && Object.keys(arrayItemBuffer).length > 0) {
        currentArray.push({ ...arrayItemBuffer });
        arrayItemBuffer = null;
      }

      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) continue; // 跳过非 key:value 行

      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();

      // 移除行尾注释
      const commentIdx = value.indexOf("#");
      const cleanValue = (commentIdx === -1 ? value : value.slice(0, commentIdx)).trim();

      // Nested object: "rarity_colors:" or "principles:"
      if (cleanValue === "" || cleanValue === "{}") {
        currentKey = key;
        currentObj = null;
        currentArray = null;
        arrayItemBuffer = null;
        continue;
      }

      // Top-level scalar: "platform: vertical-mobile"
      currentKey = key;
      currentObj = null;
      currentArray = null;
      arrayItemBuffer = null;
      result[currentKey] = cleanValue.replace(/^['"]|['"]$/g, "");
      continue;
    }

    // Indented line
    if (indent > 0 && currentKey) {
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) continue;

      let key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();

      // Handle "- key: value" array item on single line
      if (key.startsWith("- ")) {
        // Flush previous array item buffer
        if (currentArray && arrayItemBuffer && Object.keys(arrayItemBuffer).length > 0) {
          currentArray.push({ ...arrayItemBuffer });
        }
        // Init array if not yet
        if (!currentArray) {
          currentArray = [];
          result[currentKey] = currentArray;
        }
        arrayItemBuffer = {};
        key = key.slice(2); // Remove "- " prefix
      }

      // Clean value
      const commentIdx = value.indexOf("#");
      let cleanValue = (commentIdx === -1 ? value : value.slice(0, commentIdx)).trim();
      cleanValue = cleanValue.replace(/^['"]|['"]$/g, "");

      // Nested object indicator
      if (cleanValue === "" || cleanValue === "{}") {
        if (currentArray !== null && arrayItemBuffer !== null) {
          // Nested object inside array item - skip for now
          continue;
        }
        currentObj = {};
        result[currentKey] = currentObj;
        currentArray = null;
        continue;
      }

      // Scalar value
      if (currentArray !== null && arrayItemBuffer !== null) {
        arrayItemBuffer[key] = cleanValue;
      } else if (currentObj !== null) {
        currentObj[key] = cleanValue;
      } else {
        result[currentKey] = cleanValue;
      }
      continue;
    }
  }

  // Flush final array item
  if (currentArray && arrayItemBuffer && Object.keys(arrayItemBuffer).length > 0) {
    currentArray.push({ ...arrayItemBuffer });
  }

  return result;
}

// ---- 配置解析 ----

function parseConfig(yamlStr: string): SpecConfig {
  const raw = parseSimpleYaml(yamlStr);

  const rarity: Record<string, string> = {};
  if (raw.rarity_colors && typeof raw.rarity_colors === "object") {
    Object.assign(rarity, raw.rarity_colors as Record<string, string>);
  }

  const principles: Principle[] = [];
  if (Array.isArray(raw.principles)) {
    for (const p of raw.principles as Array<Record<string, string>>) {
      principles.push({
        char: p.char || "",
        title: p.title || "",
        desc: p.desc || "",
      });
    }
  }

  return {
    platform: String(raw.platform || "vertical-mobile"),
    canvas_width: Number(raw.canvas_width) || 750,
    canvas_height: Number(raw.canvas_height) || 1334,
    grid_base: Number(raw.grid_base) || 8,
    grid_columns: Number(raw.grid_columns) || 6,
    grid_gutter: Number(raw.grid_gutter) || 16,
    grid_margin: Number(raw.grid_margin) || 16,
    safe_area_top: Number(raw.safe_area_top) || 44,
    safe_area_bottom: Number(raw.safe_area_bottom) || 34,
    color_primary: String(raw.color_primary || "#c8964a"),
    color_success: String(raw.color_success || "#3ca374"),
    color_warning: String(raw.color_warning || "#c8963c"),
    color_danger: String(raw.color_danger || "#c84848"),
    color_info: String(raw.color_info || "#4a8bc8"),
    rarity_colors: rarity,
    principles,
    methodology: String(raw.methodology || ""),
    benchmarks: String(raw.benchmarks || ""),
    version: String(raw.version || "1.0"),
  };
}

// ---- Markdown 解析 ----

/** 解析 Markdown 表格为结构化数据 */
export function parseTable(md: string): TableData | null {
  const lines = md.trim().split("\n");
  if (lines.length < 2) return null;

  // 找表头行和分隔行
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (line.startsWith("|") && line.endsWith("|")) {
      if (headerIdx === -1) {
        headerIdx = i;
      } else if (line.includes("---")) {
        // 这是分隔行，header 在上一行
        break;
      }
    }
  }

  if (headerIdx === -1) return null;

  // 解析表头
  const headerLine = lines[headerIdx]!.trim();
  const headers = headerLine
    .split("|")
    .slice(1, -1)
    .map((h) => h.trim());

  // 跳过分隔行
  const rows: string[][] = [];
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line.startsWith("|")) break;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length === headers.length) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

/** 解析 Markdown 列表 */
export function parseList(md: string): ListData | null {
  const lines = md.trim().split("\n");
  const items: string[] = [];
  let ordered = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)/);
    const cbMatch = trimmed.match(/^-\s+\[([ x])\]\s+(.+)/);

    if (cbMatch) {
      items.push(`[${cbMatch[1]}] ${cbMatch[2]}`);
      ordered = false;
    } else if (olMatch) {
      items.push(olMatch[2]!);
      ordered = true;
    } else if (ulMatch) {
      items.push(ulMatch[1]!);
    } else if (items.length > 0 && !trimmed) {
      break;
    }
  }

  return items.length > 0 ? { items, ordered } : null;
}

/** 提取章节标题和内容 */
export function parseSections(md: string): SpecSection[] {
  const sections: SpecSection[] = [];
  const lines = md.split("\n");
  let currentSection: SpecSection | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    // 匹配 ## 或 ### 标题
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);

    if (h2Match || h3Match) {
      // 保存前一个 section
      if (currentSection) {
        currentSection.rawContent = contentLines.join("\n").trim();
        currentSection.tables = extractTables(currentSection.rawContent);
        currentSection.lists = extractLists(currentSection.rawContent);
      }

      const title = (h2Match || h3Match)![1]!.trim();
      const anchor = title
        .replace(/[^\w一-鿿]+/g, "-")
        .replace(/^-|-$/g, "");
      const level = h2Match ? 2 : 3;
      const section: SpecSection = {
        title,
        anchor,
        level,
        rawContent: "",
        tables: [],
        lists: [],
        subsections: [],
      };

      if (level === 2) {
        sections.push(section);
        currentSection = section;
        contentLines = [];
      } else if (level === 3 && currentSection) {
        // 子章节挂在当前 ## 章节下
        currentSection.subsections.push(section);
        currentSection = section;
        contentLines = [];
      }
    } else if (currentSection) {
      contentLines.push(line);
    }
  }

  // 保存最后一个 section
  if (currentSection) {
    currentSection.rawContent = contentLines.join("\n").trim();
    currentSection.tables = extractTables(currentSection.rawContent);
    currentSection.lists = extractLists(currentSection.rawContent);
  }

  return sections;
}

function extractTables(content: string): TableData[] {
  const tables: TableData[] = [];
  const blocks = content.split(/\n\n+/);
  for (const block of blocks) {
    const t = parseTable(block);
    if (t) tables.push(t);
  }
  return tables;
}

function extractLists(content: string): ListData[] {
  const lists: ListData[] = [];
  const blocks = content.split(/\n\n+/);
  for (const block of blocks) {
    const l = parseList(block);
    if (l) lists.push(l);
  }
  return lists;
}

/** 提取 # 标题 */
export function parseTitle(md: string): string {
  const match = md.match(/^# (.+)$/m);
  return match ? match[1]!.trim() : "游戏交互规范";
}

// ---- 主入口 ----

export function parseSpec(filePath: string): ParsedSpec {
  const content = readFileSync(filePath, "utf-8");

  // 分离 YAML frontmatter 和 Markdown body
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error(`Invalid spec format: no YAML frontmatter in ${filePath}`);
  }

  const [, yamlStr, body] = fmMatch;
  const config = parseConfig(yamlStr!);
  const title = parseTitle(body!);
  const sections = parseSections(body!);

  return { config, title, sections, rawMd: content };
}
