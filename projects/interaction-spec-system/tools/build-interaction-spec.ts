/**
 * 游戏交互规范 HTML 生成器
 *
 * 用法: npx tsx projects/interaction-spec-system/tools/build-interaction-spec.ts [md文件路径]
 *
 * 示例:
 *   npx tsx projects/interaction-spec-system/tools/build-interaction-spec.ts projects/interaction-spec-system/specs/vertical-game-interaction-spec.md
 *   npx tsx projects/interaction-spec-system/tools/build-interaction-spec.ts projects/interaction-spec-system/specs/_interaction-template.md
 *
 * 输出: MD 同目录下生成同名 .html 文件
 */

import * as fs from "fs";
import * as path from "path";
import { parseSpec } from "./lib/spec-parser";
import { renderHTML } from "./lib/spec-renderer";

const ROOT = path.resolve(__dirname, "..", "..", "..");

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
🧮 游戏交互规范 HTML 生成器

用法: npx tsx projects/interaction-spec-system/tools/build-interaction-spec.ts <md文件路径>

示例:
  npx tsx projects/interaction-spec-system/tools/build-interaction-spec.ts projects/interaction-spec-system/specs/vertical-game-interaction-spec.md

说明:
  读取 MD 规范文件的 YAML frontmatter 和结构化章节，
  生成带网格可视化、组件陈列、手机原型标注的 HTML 展示页。
  输出到 MD 文件同目录，文件名 .md → .html
`);
    return;
  }

  const inputPath = path.resolve(ROOT, args[0]!);
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 文件不存在: ${inputPath}`);
    process.exit(1);
  }

  console.log(`📖 解析: ${path.relative(ROOT, inputPath)}`);
  const spec = parseSpec(inputPath);

  console.log(`  平台: ${spec.config.platform} (${spec.config.canvas_width}×${spec.config.canvas_height})`);
  console.log(`  网格: ${spec.config.grid_base}px 基础 · ${spec.config.grid_columns}列 · 沟槽${spec.config.grid_gutter}px`);
  console.log(`  章节: ${spec.sections.length} 个`);

  console.log(`🎨 渲染 HTML...`);
  const html = renderHTML(spec);

  const outputPath = inputPath.replace(/\.md$/, ".html");
  fs.writeFileSync(outputPath, html, "utf-8");

  const sizeKB = (Buffer.byteLength(html, "utf-8") / 1024).toFixed(1);
  console.log(`✅ 输出: ${path.relative(ROOT, outputPath)} (${sizeKB} KB)`);
  console.log(`\n💡 在浏览器中打开: file:///${outputPath.replace(/\\/g, "/")}`);
}

main();
