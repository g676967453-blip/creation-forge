/**
 * 板块2 · 项目库仪表盘（projects/）
 * 数据源：各项目 project.json（权威，目录 = projects/ 子目录）+ PROGRESS.md 进度 + git 变动
 * collectBoard2Data() → Board2Data；generateProjectsHTML() → 自包含 HTML
 */
import * as fs from "fs";
import * as path from "path";
import { loadProjectProgress } from "./collect-data";
import { ROOT, esc, gitRecent, gitUncommitted, pageShell, repoRel, tagClass } from "./board-dashboard-lib";

export interface ProjectCard {
  dir: string; name: string; engine: string; status: string; statusText: string;
  phase: string; progress: string; output: string; blocker: string; sortOrder: number;
  hasProgress: boolean;
  lastCommit: { date: string; msg: string; hash: string } | null;
  uncommitted: number;
}
export interface Board2Data {
  projects: ProjectCard[];
  missingMeta: string[];                       // 无 project.json 的子目录（健康提示）
  byEngine: { engine: string; count: number }[];
  byStatus: { status: string; label: string; count: number }[];
}

const PROJECTS_DIR = path.join(ROOT, "projects");

function statusLabel(status: string, custom?: string): string {
  if (custom) return custom;
  return status === "active" ? "活跃" : status === "planned" ? "已规划" : status === "prototype" ? "原型验证" : "已完成";
}

export function collectBoard2Data(): Board2Data {
  const projects: ProjectCard[] = [];
  const missingMeta: string[] = [];
  const engineMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  try {
    for (const dir of fs.readdirSync(PROJECTS_DIR)) {
      if (dir.startsWith(".")) continue;
      const abs = path.join(PROJECTS_DIR, dir);
      if (!fs.statSync(abs).isDirectory()) continue;
      const jsonPath = path.join(abs, "project.json");
      let meta: any = null;
      try { meta = JSON.parse(fs.readFileSync(jsonPath, "utf-8")); } catch { /* 缺失或损坏 */ }
      if (!meta || !meta.name) { missingMeta.push(dir); continue; }
      const status = meta.status || "active";
      const prog = loadProjectProgress(dir);          // 只读复用主盘采集器（projects/{dir}/PROGRESS.md）
      const hasProgress = fs.existsSync(path.join(abs, "PROGRESS.md"));
      const commits = gitRecent("projects/" + dir, 1);
      projects.push({
        dir,
        name: meta.name || dir,
        engine: meta.engine || "—",
        status,
        statusText: statusLabel(status, meta.statusText),
        phase: prog?.phase || "",
        progress: prog?.progress || meta.progress || "—",
        output: meta.output || "—",
        blocker: prog?.blocker || meta.blocker || "—",
        sortOrder: meta.sortOrder || 99,
        hasProgress,
        lastCommit: commits[0] || null,
        uncommitted: gitUncommitted("projects/" + dir),
      });
      engineMap.set(meta.engine || "—", (engineMap.get(meta.engine || "—") || 0) + 1);
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    }
  } catch {}
  projects.sort((a, b) => a.sortOrder - b.sortOrder || a.dir.localeCompare(b.dir));
  const byEngine = [...engineMap.entries()].map(([engine, count]) => ({ engine, count }))
    .sort((a, b) => b.count - a.count || a.engine.localeCompare(b.engine));
  const byStatus = [...statusMap.entries()].map(([status, count]) => ({
    status, label: statusLabel(status), count,
  })).sort((a, b) => b.count - a.count);
  return { projects, missingMeta, byEngine, byStatus };
}

/* ------------------------------------------------------------------ */
/* 渲染                                                                 */
/* ------------------------------------------------------------------ */

function projectCardHtml(p: ProjectCard): string {
  const gitLine = p.lastCommit
    ? `最近提交 <span class="mono">${esc(p.lastCommit.date)} ${esc(p.lastCommit.hash)}</span> ${esc(p.lastCommit.msg)}`
    : "最近提交 —（目录内暂无提交记录）";
  const uncommitted = p.uncommitted > 0
    ? `<span class="tag o">${p.uncommitted} 个未提交改动</span>` : "";
  const block = p.blocker && p.blocker !== "—"
    ? `<div style="color:var(--red);font-size:12.5px;margin-top:6px">⚠ 阻塞：${esc(p.blocker)}</div>` : "";
  const progLink = p.hasProgress
    ? `<a href="${repoRel("projects/" + p.dir + "/PROGRESS.md")}">PROGRESS</a>` : "";
  return `<div class="card">
    <h3>${esc(p.name)}<span class="tag ${tagClass(p.status)}">${esc(p.statusText)}</span>${p.phase ? `<span class="tag">${esc(p.phase)}</span>` : ""}</h3>
    <table style="font-size:12.5px"><tbody>
      <tr><th style="width:56px">引擎</th><td>${esc(p.engine)}</td></tr>
      <tr><th>进度</th><td>${esc(p.progress)}</td></tr>
      <tr><th>产出</th><td>${esc(p.output)}</td></tr>
    </tbody></table>
    ${block}
    <div style="font-size:11.5px;color:var(--dim);margin-top:8px">${gitLine} ${uncommitted} · <a href="${repoRel("projects/" + p.dir)}">目录</a>${progLink ? " · " + progLink : ""}</div>
  </div>`;
}

export function generateProjectsHTML(): string {
  const d = collectBoard2Data();
  const active = d.projects.filter(p => p.status === "active").length;
  const planned = d.projects.filter(p => p.status === "planned").length;
  const blocked = d.projects.filter(p => p.blocker && p.blocker !== "—").length;

  const stats = `<section><div class="mini-stats">
    <div class="stat"><div class="num">${d.projects.length}</div><div class="lb">项目总数</div></div>
    <div class="stat"><div class="num" style="color:var(--green)">${active}</div><div class="lb">活跃</div></div>
    <div class="stat"><div class="num" style="color:var(--cyan)">${planned}</div><div class="lb">已规划</div></div>
    <div class="stat"><div class="num ${blocked ? "sub" : ""}" style="${blocked ? "color:var(--red)" : ""}">${blocked}</div><div class="lb">有阻塞</div></div>
    <div class="stat"><div class="num ${d.missingMeta.length ? "sub" : ""}" style="${d.missingMeta.length ? "color:var(--red)" : "color:var(--dim)"}">${d.missingMeta.length}</div><div class="lb">缺元数据</div></div>
  </div></section>`;

  const dist = `<section>
    <h2>📊 引擎分布</h2>
    <div class="chips">${d.byEngine.map(e => `<div class="chip"><div class="nm">${esc(e.engine)}</div><div class="day">${e.count} 个项目</div></div>`).join("") || `<div class="empty">无数据</div>`}</div>
    <div style="margin-top:10px">${d.byStatus.map(s => `<span class="tag ${tagClass(s.status)}">${esc(s.label)} × ${s.count}</span>`).join(" ")}</div>
  </section>`;

  const cards = `<section>
    <h2>🗂 项目一览（元数据权威源：projects/*/project.json + PROGRESS.md）</h2>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(360px,1fr))">
      ${d.projects.map(projectCardHtml).join("")}
    </div>
  </section>`;

  const health = d.missingMeta.length > 0 ? `<section>
    <h2>⚠️ 元数据健康</h2>
    <div class="card">以下子目录缺少 project.json（主盘与本盘均不显示其卡片）：${d.missingMeta.map(m => `<span class="tag o">${esc(m)}</span>`).join(" ")}</div>
  </section>` : `<section><div class="card" style="font-size:13px;color:var(--muted)">
    ✅ 全部 ${d.projects.length} 个子项目已登记元数据 · 状态标签以 project.json 的 <span class="mono">status</span>/<span class="mono">statusText</span> 为准，进度/阻塞读 PROGRESS.md（如有）
  </div></section>`;

  const latest = gitRecent("projects", 1)[0];
  return pageShell({
    emoji: "🚀",
    title: "板块2 · 项目库",
    subtitle: "projects/ — 独立游戏与工具项目总览（GAME-002 / IAA / game-bot / 交互规范系统 / 立项组合等）",
    badges: [
      { text: `${active} 活跃`, cls: "ok" },
      { text: `${blocked} 有阻塞`, cls: blocked ? "warn" : "dim" },
      { text: `未提交改动 ${gitUncommitted("projects")} 项`, cls: "dim" },
    ],
    snapshot: `板块目录 projects/ · 最近提交 ${latest ? latest.date : "—"}${latest ? " " + latest.hash : ""} · 数据实时采集`,
    authority: [{ text: "projects/README.md", href: repoRel("projects/README.md") }],
  }, stats + dist + cards + health,
    `以上卡片数据采集自各项目 project.json / PROGRESS.md，修改后重新生成即可。`);
}

/* CLI（可被 generate-board-dashboards.ts 引用，也可单独跑） */
if (require.main === module) {
  const { writeFileSync } = require("fs");
  const out = path.join(ROOT, "造化仪表盘", "reports", "板块2-项目库仪表盘.html");
  writeFileSync(out, generateProjectsHTML(), "utf-8");
  console.log("✅ 板块2-项目库仪表盘.html");
}
