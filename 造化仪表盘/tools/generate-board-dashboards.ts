/**
 * 板块独立仪表盘生成编排器
 * 用法：npx tsx 造化仪表盘/tools/generate-board-dashboards.ts [b2|b3|b4|b5]   （不带参数 = 全部）
 * 输出：造化仪表盘/reports/板块{2,3,4,5}-*.html（自包含静态页，file:// 可直接打开）
 * dashboard-server.ts 启动时也会调用 writeAllBoardDashboards() 自动刷新。
 */
import * as path from "path";
import { writeFileSync, mkdirSync } from "fs";
import { generateProjectsHTML } from "./board2-projects-dashboard";
import { generateDocsHTML } from "./board3-docs-dashboard";
import { generateAssetHTML } from "./board4-asset-dashboard";
import { generateXhsHTML } from "./board5-xiaohongshu-dashboard";
import { ROOT, REPORTS_DIR } from "./board-dashboard-lib";

export interface BoardTarget { id: string; file: string; gen: () => string; title: string; emoji: string }

export const BOARD_TARGETS: BoardTarget[] = [
  { id: "b2", file: "板块2-项目库仪表盘.html", gen: generateProjectsHTML, title: "板块2 · 项目库", emoji: "🚀" },
  { id: "b3", file: "板块3-知识库仪表盘.html", gen: generateDocsHTML, title: "板块3 · 知识库", emoji: "📚" },
  { id: "b4", file: "板块4-美术产线仪表盘.html", gen: generateAssetHTML, title: "板块4 · 美术产线", emoji: "🎨" },
  { id: "b5", file: "板块5-小红书仪表盘.html", gen: generateXhsHTML, title: "板块5 · 小红书", emoji: "📱" },
];

/** 本机模式入口条（dashboard-server GET / 注入侧栏底部；静态产物不含此内容） */
export function boardEntryBarHtml(): string {
  const rows = BOARD_TARGETS.map(t =>
    `<a class="tab" style="display:block;padding:9px 12px;font-size:12px" href="/board/${encodeURIComponent(t.file)}">${t.emoji} ${t.title}</a>`).join("");
  return `<div style="margin-top:6px;padding:4px 0 8px;border-top:1px solid rgba(255,255,255,.08)">
  <div style="padding:6px 12px;font-size:10px;color:rgba(255,255,255,.28)">板块独立盘 · 本机模式</div>
  ${rows}</div>`;
}

/** 生成板块盘：不传 ids = 全部；传如 ["b2","b4"] = 仅指定盘（server 启动刷新 / CLI 共用），返回成功数 */
export function writeAllBoardDashboards(ids?: string[]): number {
  const pick = ids && ids.length ? BOARD_TARGETS.filter(t => ids.includes(t.id)) : BOARD_TARGETS;
  mkdirSync(REPORTS_DIR, { recursive: true });
  let n = 0;
  for (const t of pick) {
    try {
      writeFileSync(path.join(REPORTS_DIR, t.file), t.gen(), "utf-8");
      console.log("✅ " + t.file);
      n++;
    } catch (e) {
      console.error("❌ " + t.title + " 生成失败：" + (e as Error).message);
    }
  }
  return n;
}

if (require.main === module) {
  const arg = process.argv[2];
  if (arg && !["b2", "b3", "b4", "b5"].includes(arg.toLowerCase())) {
    console.error("参数无效：支持 b2|b3|b4|b5 或不带参数全量生成");
    process.exit(1);
  }
  const n = writeAllBoardDashboards(arg ? [arg.toLowerCase()] : undefined);
  console.log(`✅ 已生成 ${n} 个板块仪表盘 → ${path.relative(ROOT, REPORTS_DIR)}/`);
}

