/**
 * 板块仪表盘共享库（板块2-5 独立仪表盘共用）
 * 仅被 board{2,3,4,5}-dashboard.ts / generate-board-dashboards.ts / dashboard-server.ts 使用
 * 风格基于 asset-pipeline/art-dashboard.html 暗色系（2026-09-05 验收过的视觉）
 */
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";

/** 仓库根（本文件位于 造化仪表盘/tools/） */
export const ROOT = path.resolve(__dirname, "../..");
/** 板块盘产物目录 */
export const REPORTS_DIR = path.join(ROOT, "造化仪表盘", "reports");

/* ------------------------------------------------------------------ */
/* 通用小工具                                                           */
/* ------------------------------------------------------------------ */

/** HTML 转义（null/undefined → ""） */
export function esc(s: unknown): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** 读 UTF-8 文本并规整：去 BOM、去 \r */
export function readUtf8(absPath: string): string {
  return fs.readFileSync(absPath, "utf-8").replace(/^﻿/, "").replace(/\r/g, "");
}

/** 读 JSON，失败返回 null */
export function loadJsonFile(absPath: string): any | null {
  try { return JSON.parse(readUtf8(absPath)); } catch { return null; }
}

/** 泛化版 loadProjectProgress：接受任意 PROGRESS.md 绝对路径，正则与其一致 */
export function loadProgressMd(absPath: string): { progress: string; blocker: string; phase: string } | null {
  try {
    const content = readUtf8(absPath);
    const phase = (content.match(/\*\*阶段\*\*[：:]\s*(.+)/) || [])[1] || "";
    const progress = (content.match(/\*\*进度\*\*[：:]\s*(.+)/) || [])[1] || "";
    const blocker = (content.match(/\*\*阻塞\*\*[：:]\s*(.+)/) || [])[1] || "无";
    return { progress: progress || "—", blocker: blocker === "无" ? "—" : blocker, phase: phase || "—" };
  } catch { return null; }
}

/** 从 markdown 中提取全部表格（连续 | 行块），返回 rows: string[][]（含表头行） */
export function markdownTables(text: string): string[][] {
  const out: string[][] = [];
  const blocks = text.match(/^(\|[^\n]+\|\s*$\n?)+/gm);
  if (!blocks) return out;
  for (const block of blocks) {
    const rows = block.trim().split("\n")
      .map(line => line.replace(/^\||\|$/g, "").split("|").map(c => c.trim().replace(/^`+|`+$/g, "")))
      .filter(r => r.length > 1 && r.some(c => c !== ""));
    // 丢弃分隔行 |---|---|
    const body = rows.filter(r => !r.every(c => /^:?-{2,}:?$/.test(c)));
    if (body.length >= 2) out.push(body);
  }
  return out;
}

/** 距今天数（mtime），文件不存在返回 null */
export function daysOld(absPath: string): number | null {
  try {
    const mt = fs.statSync(absPath).mtimeMs;
    return Math.max(0, Math.floor((Date.now() - mt) / 86400000));
  } catch { return null; }
}

/** git 命令封装：execFileSync 不经 shell（中文路径安全），失败返回 "" */
export function gitOut(args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: ROOT, timeout: 5000, encoding: "utf-8" }).trim();
  } catch { return ""; }
}

/** 某路径（仓库相对）最近 n 条提交 */
export function gitRecent(repoRelPath: string, n = 5): { date: string; msg: string; hash: string }[] {
  const out = gitOut(["log", `-${n}`, '--format=%ad|%s|%h', "--date=short", "--", repoRelPath]);
  if (!out) return [];
  return out.split("\n").map(line => {
    const [date, msg, hash] = line.split("|");
    return { date: date || "—", msg: msg || "—", hash: hash || "—" };
  });
}

/** 某路径未提交改动数 */
export function gitUncommitted(repoRelPath: string): number {
  const out = gitOut(["status", "--porcelain", "--", repoRelPath]);
  if (!out) return 0;
  return out.split("\n").filter(Boolean).length;
}

/** 仓库相对路径 → 从 reports/ 目录出发的相对链接 */
export function repoRel(p: string): string {
  const clean = p.replace(/^\.?\//, "");
  if (clean.startsWith("造化仪表盘/")) return "../" + clean.slice("造化仪表盘/".length);
  return "../../" + clean;
}

/** 状态 → tag 颜色类（art-dashboard .tag.g/c/v/o/r/b 体系） */
export function tagClass(status: string): string {
  const s = String(status);
  if (/投产|mature|active|已完成|✅|发布/.test(s)) return "g";
  if (/验证|testing|planned|已规划|待定/.test(s)) return "c";
  if (/就绪|ongoing|进行中|草稿/.test(s)) return "b";
  if (/🔲|wip|待|搁置|暂停|—$/.test(s)) return "o";
  if (/取消|废弃|禁用|❌|失败/.test(s)) return "r";
  return "";
}

/** 本地时间戳 YYYY-MM-DD HH:mm */
export function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ------------------------------------------------------------------ */
/* 共享 CSS（暗色系，变量与 art-dashboard.html 同源）                    */
/* ------------------------------------------------------------------ */

export const BOARD_CSS = `:root{
  --bg:#0e1320;--bg2:#121a2c;--card:#161f33;--card2:#1b2640;
  --line:#2a3656;--txt:#dfe7f5;--muted:#8fa3c4;--dim:#5d6f93;
  --gold:#f0b35c;--cyan:#5ad1e6;--violet:#a78bfa;--green:#4ade80;--red:#f87171;--blue:#60a5fa;
  --grad:linear-gradient(135deg,#f0b35c,#e879f9 60%,#60a5fa);
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:radial-gradient(1200px 500px at 15% -10%,#1b2a4a 0%,var(--bg) 55%) fixed,var(--bg);color:var(--txt);
  font-family:"Segoe UI","Microsoft YaHei",system-ui,sans-serif;line-height:1.55;padding:28px 20px 60px}
.wrap{max-width:1180px;margin:0 auto}
a{color:var(--cyan);text-decoration:none}
a:hover{text-decoration:underline}
.mono{font-family:Consolas,"Cascadia Mono",monospace;font-size:12px}
header{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end;justify-content:space-between;
  border:1px solid var(--line);border-radius:16px;padding:22px 26px;background:linear-gradient(180deg,var(--card2),var(--card));
  box-shadow:0 10px 40px #0008}
h1{font-size:26px;letter-spacing:.5px}
h1 .grad{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{color:var(--muted);font-size:13px;margin-top:6px}
.badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.badge{font-size:12px;padding:4px 12px;border-radius:999px;border:1px solid var(--line);background:#101a30;color:var(--txt)}
.badge.ok{color:#0d1f12;background:var(--green);border-color:var(--green);font-weight:600}
.badge.warn{color:#261503;background:var(--gold);border-color:var(--gold);font-weight:600}
.badge.wip{color:#0b1526;background:var(--blue);border-color:var(--blue);font-weight:600}
.badge.dim{color:var(--muted);background:transparent}
.snapshot{font-size:12px;color:var(--dim);text-align:right}
.snapshot b{color:var(--gold)}
section{margin-top:26px}
h2{font-size:17px;display:flex;align-items:center;gap:9px;margin-bottom:12px}
h2::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)}
.grid{display:grid;gap:12px}
.card{border:1px solid var(--line);border-radius:14px;background:linear-gradient(180deg,var(--card),#131b2e);padding:16px 18px}
.card h3{font-size:14px;color:var(--gold);margin-bottom:10px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{color:var(--muted);text-align:left;font-weight:600;padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap}
td{padding:9px 10px;border-bottom:1px solid #1e2a44;vertical-align:top}
tr:hover td{background:#141e36}
tr.stale td{background:rgba(240,179,92,.07)}
tr.stale:hover td{background:rgba(240,179,92,.12)}
.tag{display:inline-block;font-size:11px;padding:1px 8px;border-radius:6px;border:1px solid var(--line);color:var(--muted);margin:1px 0;white-space:nowrap}
.tag.g{color:var(--green);border-color:#1f5131}
.tag.c{color:var(--cyan);border-color:#1d4d5c}
.tag.v{color:var(--violet);border-color:#463a76}
.tag.o{color:var(--gold);border-color:#5c4a26}
.tag.r{color:var(--red);border-color:#6e2b2b}
.tag.b{color:var(--blue);border-color:#244a76}
.mini-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.stat{border:1px solid var(--line);border-radius:12px;background:#131c30;padding:11px 16px}
.stat .num{font-size:21px;font-weight:700;color:var(--gold)}
.stat .lb{font-size:12px;color:var(--muted);margin-top:2px}
.stat .num.sub{font-size:15px;color:var(--cyan);font-weight:600}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{border:1px solid var(--line);border-radius:12px;padding:10px 14px;min-width:150px;background:#111a2e}
.chip .nm{font-size:14px;font-weight:600}
.chip .use{font-size:11px;color:var(--muted)}
.chip .day{font-size:11px;margin-top:4px;color:var(--dim)}
.chip .day b{color:var(--green)}
.chip.main{border-color:#3d5b93;box-shadow:0 0 0 1px #3d5b9355 inset}
.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.kv div{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:#101a30}
.kv b{color:var(--gold);font-size:12px;display:block;margin-bottom:3px}
.kv span{font-size:12px;color:var(--txt);word-break:break-all}
ul.tasks{list-style:none}
ul.tasks li{display:flex;gap:10px;align-items:flex-start;padding:9px 4px;border-bottom:1px dashed #223052;font-size:13.5px}
ul.tasks li:last-child{border-bottom:none}
.dot{flex:none;width:9px;height:9px;border-radius:50%;margin-top:6px}
.dot.w{background:var(--gold)} .dot.h{background:var(--red)} .dot.d{background:var(--dim)} .dot.b{background:var(--blue)}
.stages{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
.stage{border:1px solid var(--line);border-radius:12px;padding:12px;background:#131c30}
.stage .no{font-size:20px;font-weight:700;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.stage b{display:block;font-size:13px;margin:6px 0 4px}
.stage span{font-size:11px;color:var(--muted)}
.owner{font-size:11px;color:var(--dim);margin-top:6px}
.bar{height:8px;background:#101a30;border-radius:99px;overflow:hidden;min-width:90px}
.bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--cyan),var(--violet))}
.bar.g i{background:linear-gradient(90deg,#2f9e57,var(--green))}
.draft-row{opacity:.55}
.footnote{font-size:11.5px;color:var(--dim);margin-top:10px}
.empty{color:var(--dim);font-size:13px;padding:10px 2px}
details{border:1px solid var(--line);border-radius:12px;background:#131c30;padding:10px 14px}
summary{cursor:pointer;font-size:13px;color:var(--cyan);user-select:none}
pre{background:#0a101e;border:1px solid var(--line);border-radius:12px;padding:14px 16px;overflow:auto;color:#b9e8d8;font-size:12px;line-height:1.7}
pre .c{color:#54698f}
footer{margin-top:34px;color:var(--dim);font-size:12px;text-align:center;border-top:1px solid #1c2740;padding-top:16px}
@media(max-width:900px){.stages{grid-template-columns:repeat(3,1fr)}}
@media(max-width:560px){.stages{grid-template-columns:repeat(2,1fr)}}
@media(max-width:700px){.kv,.chips,.grid{grid-template-columns:1fr}}`;

/* ------------------------------------------------------------------ */
/* 页面外壳                                                             */
/* ------------------------------------------------------------------ */

export interface PageHead {
  emoji: string;
  title: string;              // 板块名（h1 渐变部分）
  subtitle: string;
  badges: { text: string; cls: string }[];   // cls ∈ ok/warn/wip/dim/""
  snapshot: string;           // 快照/实测行
  authority: { text: string; href: string }[]; // 权威源链接
}

export function pageShell(head: PageHead, bodyHtml: string, footExtra: string): string {
  const badges = head.badges.map(b =>
    `<span class="badge${b.cls ? " " + b.cls : ""}">${esc(b.text)}</span>`).join("");
  const auth = head.authority.map(a => `<a href="${esc(a.href)}">${esc(a.text)}</a>`).join(" · ");
  const refreshCmd = "npx tsx 造化仪表盘/tools/generate-board-dashboards.ts";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(head.title)} — 造化坊板块仪表盘</title>
<style>${BOARD_CSS}</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <h1>${esc(head.emoji)} <span class="grad">${esc(head.title)}</span></h1>
      <div class="sub">${esc(head.subtitle)}</div>
      ${badges ? `<div class="badges">${badges}</div>` : ""}
    </div>
    <div class="snapshot">${esc(head.snapshot)}<br>权威源：${auth}</div>
  </header>
${bodyHtml}
  <footer>
    ${esc(head.title)} · 生成于 ${nowStamp()} · 刷新：<span class="mono">${refreshCmd}</span><br>
    ${footExtra}
  </footer>
</div>
</body>
</html>
`;
}
