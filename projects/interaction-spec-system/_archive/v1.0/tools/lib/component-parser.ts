/**
 * 组件库 MD 解析器
 * 解析 components/*.md → 结构化组件数据
 */
import * as fs from "fs";
import * as path from "path";

export interface ComponentMeta {
  component: string;
  category: string; // "basic" | "layout" | "game"
  variants?: string[];
  sizes?: string[];
  states?: string[];
  tokens?: string[];
  [key: string]: unknown;
}

export interface ComponentSpec {
  meta: ComponentMeta;
  title: string;       // # 标题
  specSection: string;  // ## 规格 章节的 Markdown 内容
  htmlCode: string;    // ```html 代码块
  cssCode: string;     // ```css 代码块
  file: string;        // 文件名
}

/**
 * 简化 YAML 解析（只处理一层嵌套）
 */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let currentArrayKey: string | null = null;
  let currentArray: unknown[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // 数组项: - value or - key: value
    if (trimmed.startsWith("- ")) {
      const item = trimmed.slice(2).trim();
      const colonIdx = item.indexOf(":");
      if (colonIdx > -1) {
        const obj: Record<string, string> = {};
        const k = item.slice(0, colonIdx).trim();
        const v = item.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");
        obj[k] = v;
        currentArray.push(obj);
      } else {
        currentArray.push(item.replace(/^["']|["']$/g, ""));
      }
      continue;
    }

    // 数组结束 — 写入 result
    if (currentArrayKey && currentArray.length > 0) {
      result[currentArrayKey] = currentArray;
      currentArrayKey = null;
      currentArray = [];
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();

    // 数组声明: key: [a, b, c]
    if (value.startsWith("[") && value.endsWith("]")) {
      result[key] = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""));
      continue;
    }

    // 字符串
    value = value.replace(/^["']|["']$/g, "");
    result[key] = value;
  }

  // 最后可能还有未写入的数组
  if (currentArrayKey && currentArray.length > 0) {
    result[currentArrayKey] = currentArray;
  }

  return result;
}

/**
 * 提取两个 --- 之间的 YAML frontmatter
 */
function extractFrontmatter(content: string): { yaml: string; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { yaml: "", body: content };
  return { yaml: match[1], body: content.slice(match[0].length) };
}

/**
 * 提取指定 ## 章节的内容
 */
function extractSection(md: string, heading: string): string {
  const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = md.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * 提取代码块 (```lang ... ```)
 */
function extractCodeBlock(md: string, lang: string): string {
  const regex = new RegExp(`\`\`\`${lang}\\n([\\s\\S]*?)\`\`\``, "i");
  const match = md.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * 解析单个组件 MD 文件
 */
export function parseComponent(filePath: string): ComponentSpec | null {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { yaml, body } = extractFrontmatter(raw);

  if (!yaml) return null;

  const meta = parseSimpleYaml(yaml) as unknown as ComponentMeta;
  if (!meta.component) return null;

  const titleMatch = body.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : meta.component;

  const specSection = extractSection(body, "规格");
  const htmlCode = extractCodeBlock(body, "html");
  const cssCode = extractCodeBlock(body, "css");

  return {
    meta,
    title,
    specSection,
    htmlCode,
    cssCode,
    file: path.basename(filePath),
  };
}

/**
 * 解析所有组件 MD 文件
 */
export function parseAllComponents(componentsDir: string): ComponentSpec[] {
  const files = fs
    .readdirSync(componentsDir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"));

  const components: ComponentSpec[] = [];
  for (const file of files) {
    const spec = parseComponent(path.join(componentsDir, file));
    if (spec) components.push(spec);
  }
  return components;
}

/** 按 category 分组 */
export function groupByCategory(components: ComponentSpec[]): Map<string, ComponentSpec[]> {
  const map = new Map<string, ComponentSpec[]>();
  for (const c of components) {
    const cat = c.meta.category || "other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(c);
  }
  return map;
}
