#!/usr/bin/env npx tsx
/**
 * build-component-lib.ts
 * 组件库 MD → 自包含 HTML 展示页
 *
 * 用法: npx tsx tools/build-component-lib.ts [选项]
 *   --out <path>  输出路径 (默认: dist/components/index.html)
 *   --tokens <yaml>  Token 覆盖 (JSON 字符串)
 */

import * as path from "path";
import * as fs from "fs";
import { parseAllComponents, groupByCategory } from "./lib/component-parser";
import { renderComponentLib } from "./lib/component-renderer";
import type { TokenOverrides } from "./lib/shared/tokens";

const ROOT = path.resolve(__dirname, "..");
const COMPONENTS_DIR = path.join(ROOT, "components");
const DEFAULT_OUT = path.join(ROOT, "dist", "components", "index.html");

function main(): void {
  // 解析参数
  const args = process.argv.slice(2);
  let outPath = DEFAULT_OUT;
  let tokenOverrides: TokenOverrides | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out" && args[i + 1]) {
      outPath = path.resolve(args[++i]);
    } else if (args[i] === "--tokens" && args[i + 1]) {
      try {
        tokenOverrides = JSON.parse(args[++i]);
      } catch {
        console.error("❌ --tokens 参数不是有效的 JSON");
        process.exit(1);
      }
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
🏭 build-component-lib — 组件库 MD → HTML 展示页

用法: npx tsx tools/build-component-lib.ts [选项]

选项:
  --out <path>     输出路径 (默认: dist/components/index.html)
  --tokens <json>  Token 颜色覆盖 (JSON 格式)
  --help, -h       显示帮助

示例:
  npx tsx tools/build-component-lib.ts
  npx tsx tools/build-component-lib.ts --out my-components.html
  npx tsx tools/build-component-lib.ts --tokens '{"color_primary":"#ff6600","rarity_colors":{"legendary":"#ff9900"}}'
`);
      process.exit(0);
    }
  }

  console.log("🏭 解析组件库...");
  const components = parseAllComponents(COMPONENTS_DIR);

  if (components.length === 0) {
    console.error("❌ 未找到任何组件 MD 文件");
    process.exit(1);
  }

  const grouped = groupByCategory(components);
  console.log(`📦 ${components.length} 个组件 (${grouped.size} 个分类):`);
  for (const [cat, comps] of grouped) {
    console.log(`   ${cat}: ${comps.map((c) => c.meta.component).join(", ")}`);
  }

  console.log("\n🎨 渲染 HTML...");
  const gridConfig = {
    canvas_width: 720,
    canvas_height: 1280,
    grid_base: 8,
    grid_columns: 6,
    grid_gutter: 16,
    grid_margin: 16,
    safe_area_top: 44,
    safe_area_bottom: 34,
  };

  const html = renderComponentLib(components, tokenOverrides, gridConfig);

  // 确保输出目录存在
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outPath, html, "utf-8");
  console.log(`\n✅ 组件库已生成: ${outPath}`);
  console.log(`   大小: ${(html.length / 1024).toFixed(1)} KB`);
  console.log(`   在浏览器中打开: file:///${outPath.replace(/\\/g, "/")}`);
}

main();
