/**
 * 板块3 · 知识库仪表盘（docs/）
 * 数据源：docs 各子目录文件清单（mtime 陈旧检测）+ docs/workflows frontmatter（复用主盘 loadWorkflowsFromDocs）
 * collectBoard3Data() → Board3Data；generateDocsHTML() → 自包含 HTML
 */
import * as fs from "fs";
import * as path from "path";
import { loadWorkflowsFromDocs, WorkflowDef } from "./collect-data";
import { ROOT, esc, daysOld, gitRecent, gitUncommitted, pageShell, repoRel, tagClass } from "./board-dashboard-lib";

export interface DocEntry { rel: string; name: string; days: number | null; note?: string }
export interface DocGroup {
  key: string; title: string; relDir: string; count: number;
  collapse?: boolean; recursive?: boolean; entries: DocEntry[];
}
export interface Board3Data {
  groups: DocGroup[];
  workflows: WorkflowDef[];
  workflowGroups: { category: string; count: number }[];
  stats: { totalMd: number; staleCount: number; groupCount: number; wfCount: number };
}

const DOCS_DIR = path.join(ROOT, "docs");
const STALE_DAYS = 30;

/** 目录下全部 md（一层或递归），返回仓库相对 rel */
function scanMd(relDir: string, recursive: boolean, excludeName?: Set<string>): { rel: string; name: string; days: number | null }[] {
  const out: { rel: string; name: string; days: number | null }[] = [];
  const walk = (rel: string) => {
    const abs = path.join(DOCS_DIR, rel);
    let names: string[] = [];
    try { names = fs.readdirSync(abs); } catch { return; }
    for (const n of names) {
      if (n.startsWith(".")) continue;
      const full = path.join(abs, n);
      if (fs.statSync(full).isDirectory()) {
        if (recursive) walk(rel + "/" + n);
      } else if (n.endsWith(".md") && !(excludeName && excludeName.has(n))) {
        out.push({ rel: "docs/" + rel + "/" + n, name: n.replace(/\.md$/, ""), days: daysOld(full) });
      }
    }
  };
  walk(relDir);
  out.sort((a, b) => a.rel.localeCompare(b.rel, "zh-CN"));
  return out;
}

export function collectBoard3Data(): Board3Data {
  const groups: DocGroup[] = [];
  const groupDefs: { key: string; title: string; relDir: string; collapse?: boolean; recursive?: boolean }[] = [
    { key: "zh-CN", title: "zh-CN · 平台规范与长文", relDir: "zh-CN" },
    { key: "workflows", title: "workflows · 工作流（30 条定义见下节工作流表）", relDir: "workflows" },
    { key: "wf-templates", title: "workflows/templates · 流程模板", relDir: "workflows/templates" },
    { key: "tool-guides", title: "tool-guides · 工具指南（含子目录）", relDir: "tool-guides", recursive: true },
    { key: "specs", title: "specs · 规格", relDir: "specs" },
    { key: "knowledge", title: "knowledge · 知识索引", relDir: "knowledge" },
    { key: "personal", title: "personal-work-records · 个人工作记录", relDir: "personal-work-records", collapse: true },
    { key: "en", title: "en · English", relDir: "en" },
  ];
  let totalMd = 0, staleCount = 0;
  for (const g of groupDefs) {
    let entries: DocEntry[] = [];
    if (g.key === "workflows") {
      // 工作流正文由 loadWorkflowsFromDocs 覆盖；此处只列元文件与 README（排除被 frontmatter 收录的）
      const wfNames = new Set(loadWorkflowsFromDocs().map(w => w.name));
      const scanned = scanMd("workflows", false);
      entries = scanned.filter(e => !wfNames.has(e.name))
        .map(e => ({ ...e, note: e.name === "README" ? "目录入口" : e.name === "变更日志" || e.name === "改进追踪" ? "过程记录" : undefined }));
    } else {
      entries = scanMd(g.relDir, !!g.recursive).map(e => ({
        ...e,
        note: g.key === "knowledge" && e.name === "README" ? "知识索引（正文按 docs/README 分桶于 zh-CN/ 等）" : undefined,
      }));
    }
    const staleHere = entries.filter(e => e.days !== null && e.days > STALE_DAYS).length;
    totalMd += entries.length; staleCount += staleHere;
    groups.push({ key: g.key, title: g.title, relDir: g.relDir, count: entries.length, collapse: g.collapse, entries });
  }
  const workflows = loadWorkflowsFromDocs();
  const catMap = new Map<string, number>();
  for (const w of workflows) catMap.set(w.category, (catMap.get(w.category) || 0) + 1);
  const workflowGroups = [...catMap.entries()].map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
  return {
    groups, workflows, workflowGroups,
    stats: { totalMd, staleCount, groupCount: groups.length, wfCount: workflows.length },
  };
}

/* ------------------------------------------------------------------ */
/* 渲染                                                                 */
/* ------------------------------------------------------------------ */

function groupTableHtml(g: DocGroup): string {
  const rows = g.entries.map(e => {
    const stale = e.days !== null && e.days > STALE_DAYS;
    const dayCell = e.days === null ? `<span class="mono">—</span>` :
      stale ? `<span class="tag o">${e.days} 天未更新</span>` : `<span class="mono" style="color:var(--dim)">${e.days} 天前</span>`;
    return `<tr class="${stale ? "stale" : ""}">
      <td><a href="${repoRel(e.rel)}">${esc(e.name)}</a>${e.note ? `<span class="mono" style="color:var(--dim)"> · ${esc(e.note)}</span>` : ""}</td>
      <td style="white-space:nowrap">${dayCell}</td>
    </tr>`;
  }).join("");
  const body = rows || `<tr><td colspan="2"><div class="empty">（空目录）</div></td></tr>`;
  const inner = `<div class="card" style="overflow:auto"><table><tbody>${body}</tbody></table></div>`;
  const head = `<h2>📁 ${esc(g.title)}<span style="margin-left:8px;color:var(--dim);font-size:12.5px">${g.count} 篇</span></h2>`;
  if (!g.collapse) return `<section>${head}${inner}</section>`;
  return `<section>${head}<details open><summary>展开 / 折叠全部 ${g.count} 篇</summary><div style="margin-top:10px">${inner.replace("<div class=\"card\"", "<div class=\"card\" style='margin-top:10px'")}</div></details></section>`;
}

function workflowSectionHtml(ws: WorkflowDef[]): string {
  // frontmatter name 与文件名可能不一致 → 存在才给链接
  const wfHref = (name: string): string => {
    const abs = path.join(DOCS_DIR, "workflows", name + ".md");
    if (fs.existsSync(abs)) return repoRel("docs/workflows/" + name + ".md");
    return "";
  };
  return `<section><h2>🔧 工作流定义（docs/workflows frontmatter · ${ws.length} 条）</h2>
    <div class="card" style="overflow:auto"><table>
      <thead><tr><th>工作流</th><th>版本</th><th>状态</th><th>SKILL</th><th>适用项目</th><th>说明</th><th>触发</th></tr></thead>
      <tbody>${ws.map(w => {
        const href = wfHref(w.name);
        return `<tr>
        <td>${href ? `<a href="${href}">` : ""}${esc(w.name)}${href ? "</a>" : ""}</td>
        <td><span class="mono">${esc(w.version)}</span></td>
        <td><span class="tag ${tagClass(w.status)}">${esc(w.status)}</span></td>
        <td><span class="mono">${esc(w.skill)}</span></td>
        <td>${esc(w.project)}</td>
        <td style="max-width:340px">${esc(w.desc)}</td>
        <td><span class="mono" style="color:var(--muted)">${esc(w.trigger)}</span></td>
      </tr>`;
      }).join("")}</tbody>
    </table></div></section>`;
}

export function generateDocsHTML(): string {
  const d = collectBoard3Data();
  const s = d.stats;
  const stats = `<section><div class="mini-stats">
    <div class="stat"><div class="num">${s.groupCount}</div><div class="lb">知识分组</div></div>
    <div class="stat"><div class="num">${s.totalMd}</div><div class="lb">md 文档总数</div></div>
    <div class="stat"><div class="num" style="${s.staleCount ? "color:var(--red)" : "color:var(--green)"}">${s.staleCount}</div><div class="lb">陈旧（>${STALE_DAYS} 天）</div></div>
    <div class="stat"><div class="num" style="color:var(--cyan)">${s.wfCount}</div><div class="lb">工作流定义</div></div>
  </div></section>`;

  const banner = `<section><div class="card" style="font-size:13px">
    📖 不知道知识放哪？先看 <a href="${repoRel("docs/README.md")}">docs/README.md</a>「30 秒选桶」——工作流/规范/工具指南/个人记录各有其位。
    完整盘点报告见 <a href="./docs知识库盘点_2026-09-04.md">docs知识库盘点_2026-09-04.md</a>（同目录报告）。
    陈旧 = ${STALE_DAYS} 天以上未更新（高亮行），供整理参考。
  </div></section>`;

  const groups = d.groups.map(groupTableHtml).join("");

  // 按 category 分组渲染工作流（正文表在每组之前给组小节更利于阅读 → 直接一张大表 + 分类计数 chips）
  const catChips = d.workflowGroups.map(g =>
    `<span class="tag ${tagClass(g.category)}">${esc(g.category)} × ${g.count}</span>`).join(" ");
  const wf = workflowSectionHtml(d.workflows);

  const latest = gitRecent("docs", 1)[0];
  return pageShell({
    emoji: "📚",
    title: "板块3 · 知识库",
    subtitle: "docs/ — 纯知识文档：平台规范（zh-CN）/ 工作流 / 工具指南 / 规格 / 个人工作记录",
    badges: [
      { text: `${s.totalMd} 篇 md`, cls: "ok" },
      { text: `${s.staleCount} 篇陈旧`, cls: s.staleCount ? "warn" : "dim" },
      { text: `未提交 ${gitUncommitted("docs")} 项`, cls: "dim" },
    ],
    snapshot: `板块目录 docs/ · 最近提交 ${latest ? latest.date + " " + latest.hash : "—"} · 按文档 mtime 检测陈旧`,
    authority: [{ text: "docs/README.md", href: repoRel("docs/README.md") }],
  }, stats + banner + groups + `<section><h2>🏷 工作流分类分布${catChips ? `<span style="margin-left:10px">${catChips}</span>` : ""}</h2></section>` + wf,
    `工作流元数据来自 docs/workflows/*.md 的 YAML frontmatter（SKILL 体系统一维护）；陈旧判定按文件 mtime。`);
}

/* CLI */
if (require.main === module) {
  const { writeFileSync } = require("fs");
  const out = path.join(ROOT, "造化仪表盘", "reports", "板块3-知识库仪表盘.html");
  writeFileSync(out, generateDocsHTML(), "utf-8");
  console.log("✅ 板块3-知识库仪表盘.html");
}
