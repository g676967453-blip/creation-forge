/**
 * 板块5 · 小红书仪表盘（xiaohongshu/）
 * 数据源：期目录实物扫描（YYYY-MM-DD-主题/）+ 每期 index.md（素材源声明）+ PROGRESS.md（自报发布统计）
 * collectBoard5Data() → Board5Data；generateXhsHTML() → 自包含 HTML
 */
import * as fs from "fs";
import * as path from "path";
import { ROOT, esc, gitRecent, gitUncommitted, loadProgressMd, markdownTables,
  pageShell, readUtf8, repoRel, tagClass } from "./board-dashboard-lib";

const XHS_DIR = path.join(ROOT, "xiaohongshu");
const DIR_RE = /^(\d{4})-(\d{2})-(\d{2})-(.+)$/;

export interface PeriodEntry {
  dir: string; date: string; month: string; theme: string;
  hasMd: boolean; hasHtml: boolean; cardCount: number; draft: boolean;
  source: { files: string[]; raw: string } | null;
}
export interface Monthly { month: string; count: number }
export interface Board5Data {
  periods: PeriodEntry[];
  monthlyDirs: Monthly[];
  monthlyReported: { month: string; count: string; note: string }[];
  progress: { phase: string; progress: string; blocker: string } | null;
  nextSteps: string[];
  lastUpdated: string;
  stats: { total: number; full: number; mdHtml: number; htmlOnly: number; draft: number; withSource: number };
}

function collectPeriod(dir: string): PeriodEntry | null {
  const m = DIR_RE.exec(dir);
  if (!m) return null;
  const abs = path.join(XHS_DIR, dir);
  const mdPath = path.join(abs, "index.md");
  const htmlPath = path.join(abs, "index.html");
  const hasMd = fs.existsSync(mdPath);
  const hasHtml = fs.existsSync(htmlPath);
  let cardCount = 0;
  try { cardCount = fs.readdirSync(abs).filter(f => f.startsWith("卡片") && f.endsWith(".png")).length; } catch {}
  let theme = m[4];
  let source: PeriodEntry["source"] = null;
  if (hasMd) {
    try {
      const text = readUtf8(mdPath);
      const h1 = text.match(/^#\s+(.+)$/m);
      if (h1) theme = h1[1].trim().replace(/^\[[\d-]+\]\s*/, "");
      const srcLine = text.match(/^>\s*(?:素材来源|来源|素材源)[：:]\s*(.+)$/m);
      if (srcLine) {
        const files = [...srcLine[1].matchAll(/造化仪表盘\/works\/([^`\s]+\.md)/g)].map(x => x[1]);
        source = { files, raw: srcLine[1].trim() };
      }
    } catch {}
  }
  return {
    dir, date: m[1] + "-" + m[2] + "-" + m[3], month: m[1] + "-" + m[2], theme,
    hasMd, hasHtml, cardCount, draft: !hasHtml, source,
  };
}

export function collectBoard5Data(): Board5Data {
  const periods: PeriodEntry[] = [];
  const monthMap = new Map<string, number>();
  try {
    for (const d of fs.readdirSync(XHS_DIR)) {
      const p = collectPeriod(d);
      if (!p) continue;
      periods.push(p);
      monthMap.set(p.month, (monthMap.get(p.month) || 0) + 1);
    }
  } catch {}
  periods.sort((a, b) => (a.date < b.date ? 1 : -1));
  const monthlyDirs = [...monthMap.entries()].map(([month, count]) => ({ month, count }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  let monthlyReported: { month: string; count: string; note: string }[] = [];
  let lastUpdated = "—";
  let progress: Board5Data["progress"] = null;
  let nextSteps: string[] = [];
  try {
    const text = readUtf8(path.join(XHS_DIR, "PROGRESS.md"));
    const lu = text.match(/>\s*最后更新[：:]\s*(\d{4}-\d{2}-\d{2})/);
    if (lu) lastUpdated = lu[1];
    for (const rows of markdownTables(text)) {
      if (rows[0][0] === "月份") {
        monthlyReported = rows.slice(1).map(r => ({ month: r[0], count: r[1] || "—", note: r[2] || "" }));
      }
    }
    const m = text.match(/## 下一步\s*\n([\s\S]*?)(?=\n## )/);
    if (m) nextSteps = m[1].split("\n").map(l => l.replace(/^\s*\d+\.\s*/, "").trim()).filter(Boolean);
    progress = loadProgressMd(path.join(XHS_DIR, "PROGRESS.md"));
  } catch {}

  const stats = {
    total: periods.length,
    full: periods.filter(p => p.cardCount > 0 && p.hasHtml).length,
    mdHtml: periods.filter(p => p.hasMd && p.hasHtml && p.cardCount === 0).length,
    htmlOnly: periods.filter(p => !p.hasMd && p.hasHtml).length,
    draft: periods.filter(p => p.draft).length,
    withSource: periods.filter(p => p.source && p.source.files.length > 0).length,
  };
  return { periods, monthlyDirs, monthlyReported, progress, nextSteps, lastUpdated, stats };
}

/* ------------------------------------------------------------------ */
/* 渲染                                                                */
/* ------------------------------------------------------------------ */

function formTag(p: PeriodEntry): string {
  if (p.draft) return `<span class="tag r">仅文案 · 草稿</span>`;
  if (p.cardCount > 0) return `<span class="tag g">全配（含卡片）</span>`;
  if (p.hasMd) return `<span class="tag o">图文就绪 · 待截图</span>`;
  return `<span class="tag b">仅排版页</span>`;
}

export function generateXhsHTML(): string {
  const d = collectBoard5Data();
  const s = d.stats;

  const stats = `<section><div class="mini-stats">
    <div class="stat"><div class="num">${s.total}</div><div class="lb">期目录总数</div></div>
    <div class="stat"><div class="num" style="color:var(--green)">${s.full}</div><div class="lb">全配（含卡片）</div></div>
    <div class="stat"><div class="num" style="color:var(--gold)">${s.mdHtml}</div><div class="lb">图文待截图</div></div>
    <div class="stat"><div class="num ${s.draft ? "sub" : ""}" style="${s.draft ? "color:var(--red)" : "color:var(--dim)"}">${s.draft}</div><div class="lb">草稿/未成帖</div></div>
    <div class="stat"><div class="num" style="color:var(--cyan)">${s.withSource}</div><div class="lb">素材源已声明</div></div>
  </div></section>`;

  /* 月度双列：目录实测 vs PROGRESS 自报 */
  const maxMonth = Math.max(1, ...d.monthlyDirs.map(x => x.count));
  const dirBars = d.monthlyDirs.map(x =>
    `<tr><td style="white-space:nowrap"><b>${esc(x.month)}</b></td>
     <td style="width:60%"><div class="bar" style="width:100%"><i style="width:${Math.round(x.count / maxMonth * 100)}%"></i></div></td>
     <td style="white-space:nowrap">${x.count} 期</td></tr>`).join("");
  const reportRows = d.monthlyReported.map(r =>
    `<tr><td>${esc(r.month)}</td><td>${esc(r.count)}</td><td>${esc(r.note)}</td></tr>`).join("");
  const monthlySection = `<section><h2>📅 月度产出</h2>
    <div class="grid" style="grid-template-columns:1fr 1fr;align-items:start">
      <div class="card"><h3>目录实测（按期目录名按月）</h3>
        <table><tbody>${dirBars || `<tr><td><div class="empty">无数据</div></td></tr>`}</tbody></table>
      </div>
      <div class="card"><h3>PROGRESS「发布统计」自报（更新于 ${esc(d.lastUpdated)}）</h3>
        <table><thead><tr><th>月份</th><th>期数</th><th>备注</th></tr></thead><tbody>
          ${reportRows || `<tr><td colspan="3"><div class="empty">PROGRESS 无发布统计表</div></td></tr>`}
        </tbody></table>
        <div class="footnote">两列口径并存：左为仓库目录实物，右为 PROGRESS 人工自报（可能有滞后），不作互相推断。</div>
      </div>
    </div></section>`;

  /* 期列表 */
  const periodRows = d.periods.map(p => {
    const srcCell = (() => {
      if (!p.source) return `<span class="mono" style="color:var(--dim)">—</span>`;
      const chips = p.source.files.map(f =>
        `<a href="${repoRel("造化仪表盘/works/" + f)}"><span class="tag c">${esc(f)}</span></a>`).join(" ");
      const raw = p.source.files.length ? "" : `<span class="mono" style="color:var(--dim)">${esc(p.source.raw)}</span>`;
      return chips || raw || `<span class="mono" style="color:var(--dim)">${esc(p.source.raw)}</span>`;
    })();
    const links = [];
    if (p.hasHtml) links.push(`<a href="${repoRel("xiaohongshu/" + p.dir + "/index.html")}">排版页</a>`);
    if (p.hasMd) links.push(`<a href="${repoRel("xiaohongshu/" + p.dir + "/index.md")}">文案</a>`);
    links.push(`<a href="${repoRel("xiaohongshu/" + p.dir)}">目录</a>`);
    return `<tr class="${p.draft ? "draft-row" : ""}">
      <td style="white-space:nowrap">${esc(p.date)}</td>
      <td><b>${esc(p.theme)}</b></td>
      <td>${formTag(p)}</td>
      <td>${p.cardCount ? `${p.cardCount} 张` : `<span class="mono" style="color:var(--dim)">0</span>`}</td>
      <td style="max-width:380px">${srcCell}</td>
      <td style="white-space:nowrap">${links.join(" · ")}</td>
    </tr>`;
  }).join("");
  const listSection = `<section><h2>🗒 期列表（${d.periods.length} 期 · 降序 · 权威源=目录实物）</h2>
    <div class="card" style="overflow:auto"><table>
      <thead><tr><th>日期</th><th>主题</th><th>形态</th><th>卡片</th><th>素材源（造化仪表盘/works/ 日志）</th><th>打开</th></tr></thead>
      <tbody>${periodRows || `<tr><td colspan="6"><div class="empty">无期目录</div></td></tr>`}</tbody>
    </table></div></section>`;

  /* 最新可浏览期 */
  const recent = d.periods.filter(p => p.hasHtml).slice(0, 6).map(p =>
    `<a href="${repoRel("xiaohongshu/" + p.dir + "/index.html")}"><span class="tag g">${esc(p.date)} ${esc(p.theme)}</span></a>`).join(" ");
  const recentSection = recent ? `<section><h2>🆕 最新排版页（${Math.min(6, d.periods.filter(p => p.hasHtml).length)} 个）</h2>
    <div>${recent}</div></section>` : "";

  /* 流程入口 + 当前状态 */
  const progressBlock = d.progress
    ? `<div class="card"><h3>当前状态（PROGRESS.md）</h3>
       <div style="font-size:13px"><b>阶段</b>：${esc(d.progress.phase)}<br><b>进度</b>：${esc(d.progress.progress)}<br><b>阻塞</b>：${esc(d.progress.blocker)}</div></div>` : "";
  const entrySection = `<section><h2>🧭 流程与入口</h2>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr));align-items:start">
      ${progressBlock}
      <div class="card"><h3>入口</h3><div style="font-size:13px">
        <a href="${repoRel("docs/workflows/小红书-制作帖子.md")}">工作流：小红书-制作帖子</a>（SKILL <span class="mono">/new-post</span>）<br>
        <a href="${repoRel("xiaohongshu/_template.md")}">_template.md 选题模板</a> · <a href="${repoRel("xiaohongshu/CLAUDE.md")}">CLAUDE.md</a> · <a href="${repoRel("xiaohongshu/PROGRESS.md")}">PROGRESS.md</a><br>
        素材源：<a href="${repoRel("造化仪表盘/works")}">造化仪表盘/works/ 工作日志</a>
      </div></div>
    </div></section>`;

  const latest = gitRecent("xiaohongshu", 1)[0];
  return pageShell({
    emoji: "📱",
    title: "板块5 · 小红书",
    subtitle: "xiaohongshu/ — 素材源声明 → 帖子 → 发布 · 每期一个「问题→AI 解法→效果」图文",
    badges: [
      { text: `${s.full} 期全配`, cls: "ok" },
      { text: `${s.draft} 草稿`, cls: s.draft ? "warn" : "dim" },
      { text: `未提交 ${gitUncommitted("xiaohongshu")} 项`, cls: "dim" },
    ],
    snapshot: `板块目录 xiaohongshu/ · 最近提交 ${latest ? latest.date + " " + latest.hash : "—"} · PROGRESS 最后更新 ${esc(d.lastUpdated)}`,
    authority: [
      { text: "xiaohongshu/CLAUDE.md", href: repoRel("xiaohongshu/CLAUDE.md") },
      { text: "PROGRESS.md", href: repoRel("xiaohongshu/PROGRESS.md") },
    ],
  }, stats + monthlySection + listSection + recentSection + entrySection,
    `发布状态以目录实物推断（有 index.html=已成帖，缺卡=待截图，仅 md=草稿）；官方口径见 PROGRESS「发布统计」。`);
}

/* CLI */
if (require.main === module) {
  const { writeFileSync } = require("fs");
  const out = path.join(ROOT, "造化仪表盘", "reports", "板块5-小红书仪表盘.html");
  writeFileSync(out, generateXhsHTML(), "utf-8");
  console.log("✅ 板块5-小红书仪表盘.html");
}
