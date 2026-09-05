/**
 * 板块4 · 美术产线仪表盘（asset-pipeline/）
 * 数据源：asset-pipeline/PROGRESS.md（阶段/版本路线/已验证/下一步）+ dashboard-data.json（人工运营快照）
 *        + templates/scripts/docs/data 资产清单 + outputs/demo-character-concept/portraits/batch-100 批产记录
 * collectBoard4Data() → Board4Data；generateAssetHTML() → 自包含 HTML
 */
import * as fs from "fs";
import * as path from "path";
import { ROOT, esc, gitRecent, gitUncommitted, loadJsonFile, loadProgressMd, markdownTables,
  pageShell, readUtf8, repoRel, tagClass } from "./board-dashboard-lib";

const B4_DIR = path.join(ROOT, "asset-pipeline");
const JSON_PATH = path.join(B4_DIR, "dashboard-data.json");
const PROGRESS_PATH = path.join(B4_DIR, "PROGRESS.md");
const BATCH_DIR = path.join(B4_DIR, "outputs", "demo-character-concept", "portraits", "batch-100");

export interface Milestone { version: string; goal: string; status: string }
export interface VerifiedRow { style: string; model: string; status: string }
export interface BatchStats {
  rows: number; byModel: [string, number][]; byStyle: [string, number][]; byClass: [string, number][];
  stateCount: number; dirs: string[];
}
export interface DataBatchMeta { file: string; version: string; templateVersion: string; model: string; items: number }
export interface LinkIssue { where: string; path: string }
export interface Board4Data {
  progress: { phase: string; progress: string; blocker: string } | null;
  milestones: Milestone[]; verified: VerifiedRow[]; nextSteps: string[];
  json: any | null; jsonOk: boolean;
  templates: string[]; scripts: string[]; docs: string[]; dataBatches: DataBatchMeta[];
  batch: BatchStats | null;
  linkIssues: LinkIssue[];
}

/* ------------------------------------------------------------------ */
/* 采集                                                                */
/* ------------------------------------------------------------------ */

const MODEL_NAMES: Record<string, string> = { nbp: "Nano Banana Pro", mj: "Midjourney", gpt2: "GPT Image 2" };

function collectBatchStats(): BatchStats | null {
  try {
    if (!fs.existsSync(BATCH_DIR)) return null;
    const csv = readUtf8(path.join(BATCH_DIR, "batch_table.csv"));
    const lines = csv.split("\n").filter(l => l.trim() !== "");
    if (lines.length < 2) return null;
    const headers = lines[0].split(",").map(h => h.trim());
    const iModel = headers.indexOf("model"), iStyle = headers.indexOf("style"), iClass = headers.indexOf("class");
    const rows = lines.slice(1).filter(l => /^\d+/.test(l.trim()));
    const count = (idx: number) => {
      const m = new Map<string, number>();
      for (const l of rows) {
        const v = (l.split(",")[idx] || "").trim();
        m.set(v, (m.get(v) || 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    const dirs = fs.readdirSync(BATCH_DIR)
      .filter(d => fs.statSync(path.join(BATCH_DIR, d)).isDirectory() && !d.startsWith("."))
      .sort();
    const stateCount = fs.readdirSync(BATCH_DIR).filter(f => /^state_\d+\.json$/.test(f)).length;
    return {
      rows: rows.length,
      byModel: iModel >= 0 ? count(iModel) : [],
      byStyle: iStyle >= 0 ? count(iStyle) : [],
      byClass: iClass >= 0 ? count(iClass) : [],
      stateCount, dirs,
    };
  } catch { return null; }
}

function collectDataBatches(): DataBatchMeta[] {
  const out: DataBatchMeta[] = [];
  try {
    for (const f of fs.readdirSync(path.join(B4_DIR, "data")).filter(f => f.endsWith(".json"))) {
      const j = loadJsonFile(path.join(B4_DIR, "data", f));
      out.push({
        file: f,
        version: j?.version || "—",
        templateVersion: j?.template_version || j?.templateVersion || "—",
        model: j?.generation?.model || "—",
        items: Array.isArray(j?.skins) ? j.skins.length : Array.isArray(j?.items) ? j.items.length : 0,
      });
    }
  } catch {}
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

/** 校验 JSON 内文件引用（相对 asset-pipeline/），收集断链 */
function collectLinkIssues(json: any): LinkIssue[] {
  const issues: LinkIssue[] = [];
  if (!json) return issues;
  for (const m of json.matrix || []) {
    for (const [where, p] of [["matrix.templateFile", m.templateFile], ["matrix.docFile", m.docFile]] as const) {
      if (p && !fs.existsSync(path.join(B4_DIR, p))) issues.push({ where, path: p });
    }
  }
  for (const t of json.tasks || []) {
    if (t.link && !fs.existsSync(path.join(B4_DIR, t.link))) issues.push({ where: "tasks.link", path: t.link });
  }
  return issues;
}

export function collectBoard4Data(): Board4Data {
  const progress = loadProgressMd(PROGRESS_PATH);
  let milestones: Milestone[] = [], verified: VerifiedRow[] = [], nextSteps: string[] = [];
  try {
    const text = readUtf8(PROGRESS_PATH);
    for (const rows of markdownTables(text)) {
      const h = rows[0];
      if (h[0] === "版本") milestones = rows.slice(1).map(r => ({ version: r[0], goal: r[1] || "", status: r[2] || "" }));
      else if (h[0] === "风格") verified = rows.slice(1).map(r => ({ style: r[0], model: r[1] || "", status: r[2] || "" }));
    }
    const m = text.match(/## 下一步\s*\n([\s\S]*?)(?=\n## )/);
    if (m) nextSteps = m[1].split("\n").map(l => l.replace(/^\s*\d+\.\s*/, "").trim()).filter(Boolean);
  } catch {}
  let templates: string[] = [], scripts: string[] = [], docs: string[] = [];
  try {
    templates = fs.readdirSync(path.join(B4_DIR, "templates")).filter(f => f.endsWith(".md")).sort();
    scripts = fs.readdirSync(path.join(B4_DIR, "scripts"))
      .filter(f => !fs.statSync(path.join(B4_DIR, "scripts", f)).isDirectory() && /\.(py|jsx)$/.test(f)).sort();
    docs = fs.readdirSync(path.join(B4_DIR, "docs"))
      .filter(f => f.endsWith(".md") && fs.statSync(path.join(B4_DIR, "docs", f)).isFile()).sort();
  } catch {}
  const json = loadJsonFile(JSON_PATH);
  const dataBatches = collectDataBatches();
  return {
    progress, milestones, verified, nextSteps,
    json, jsonOk: !!json,
    templates, scripts, docs, dataBatches,
    batch: collectBatchStats(),
    linkIssues: collectLinkIssues(json),
  };
}

/* ------------------------------------------------------------------ */
/* 渲染                                                                */
/* ------------------------------------------------------------------ */

/** 模型名 → tag 色（沿 art-dashboard 惯例） */
function modelTag(name: string): string {
  if (/Midjourney|MJ/.test(name)) return "o";
  if (/GPT Image/.test(name)) return "g";
  if (/Nano Banana/.test(name)) return "c";
  return "v";
}

const SIX_STAGES = [
  ["①", "需求输入", "需求/参考图/项目规范", "👤 人类发起"],
  ["②", "规格化", "型号·尺寸·命名 → 批次规格表", "🤖 起草 · 👤 确认"],
  ["③", "Prompt 工程", "模板变量 + 色彩约束 + 强制关键词", "🤖 AI"],
  ["④", "生成迭代", "草稿 NBP → 成品模型 · 复用 thread", "🤖 执行 · 👤 选向"],
  ["⑤", "验收", "人眼 + 04 质量清单 · 横向一致性", "👤 人类终审"],
  ["⑥", "归档交付", "后处理 → 桌面落盘 → 汇报 → 登记", "🤖 AI"],
];

export function generateAssetHTML(): string {
  const d = collectBoard4Data();
  const p = d.progress;
  const json = d.jsonOk ? d.json : null;

  const headBadges: { text: string; cls: string }[] = [];
  if (p?.phase) headBadges.push({ text: p.phase.split("（")[0].trim(), cls: /投产|稳定/.test(p.phase) ? "ok" : "wip" });
  if (json?.accountMode?.mode) headBadges.push({ text: "♾ " + json.accountMode.mode, cls: "ok" });
  if (p?.blocker && p.blocker !== "—") headBadges.push({ text: "有阻塞（见下）", cls: "warn" });

  const snapParts = [
    json ? `运营快照 ${json.snapshotDate}（dashboard-data.json 实测）` : "",
    p ? "PROGRESS 最后更新 2026-09-05" : "",
  ].filter(Boolean);

  /* §0 状态 */
  const statusSection = `<section><h2>📌 管线状态</h2>
    <div class="card" style="font-size:13.5px">
      <b>阶段</b>：${esc(p?.phase || "—")}<br>
      <b>进度</b>：${esc(p?.progress || "—")}<br>
      <b>阻塞</b>：${esc(p?.blocker || "—")}
    </div></section>`;

  /* §1 六段循环 */
  const stages = SIX_STAGES.map(s => `<div class="stage"><div class="no">${s[0]}</div><b>${s[1]}</b><span>${s[2]}</span><div class="owner">${s[3]}</div></div>`).join("");
  const stagesSection = `<section><h2>⏱ 标准工作流 · 六段循环（<a href="${repoRel("asset-pipeline/docs/10-美术生产标准工作流.md")}">docs/10</a>）</h2>
    <div class="stages">${stages}</div></section>`;

  /* §2 模型工作流矩阵 */
  let matrixRows = "";
  if (json?.matrix?.length) {
    matrixRows = json.matrix.map((m: any) => {
      const badRef = (where: string, rel: string) =>
        rel && !fs.existsSync(path.join(B4_DIR, rel))
          ? `<span class="tag r">断链</span>`
          : rel ? `<a href="${repoRel("asset-pipeline/" + rel)}">${esc(rel)}</a>` : `<span class="mono" style="color:var(--dim)">—</span>`;
      const finals = (m.finalModels || []).map((x: string) => `<span class="tag ${modelTag(x)}">${esc(x)}</span>`).join(" ");
      const subs = (m.subTags || []).map((t: string) => `<span class="tag">${esc(t)}</span>`).join("");
      return `<tr>
        <td><b>${esc(m.assetType)}</b>${subs ? `<br>${subs}` : ""}</td>
        <td>${badRef("templates", m.templateFile)}</td>
        <td><span class="tag ${modelTag(m.draftModel)}">${esc(m.draftModel)}</span></td>
        <td>${finals}</td>
        <td class="mono">${esc(m.spec)}</td>
        <td class="mono">${esc(m.postprocess)}</td>
        <td>${badRef("docs", m.docFile)}</td>
        <td><span class="tag ${tagClass(m.status)}">${esc(m.status)}</span>${m.forbidden ? `<br><span class="tag r">禁 3 组合*</span>` : ""}</td>
      </tr>`;
    }).join("");
  }
  const matrixSection = `<section><h2>🧩 模型工作流矩阵（dashboard-data.json · 按资产类型）</h2>
    <div class="card" style="overflow:auto"><table>
      <thead><tr><th>资产类型</th><th>Prompt 模板</th><th>草稿模型</th><th>成品模型</th>
      <th>规格（生成 → 交付）</th><th>后处理 / 切片</th><th>工作流文档</th><th>状态</th></tr></thead>
      <tbody>${matrixRows || `<tr><td colspan="8"><div class="empty">dashboard-data.json 缺失或损坏 — 页面降级（区块隐藏）。</div></td></tr>`}</tbody>
    </table>
    ${json?.matrixNote ? `<div class="footnote">${esc(json.matrixNote)}</div>` : ""}
    </div></section>`;

  /* §3 账号与模型可用性 */
  const account = json?.accountMode || null;
  const chips = (json?.models || []).map((m: any) =>
    `<div class="chip${m.main ? " main" : ""}"><div class="nm">${esc(m.name)}</div><div class="use">${esc(m.use)}</div><div class="day">剩余 <b>${esc(m.daysLeft)}</b> 天</div></div>`).join("");
  const accountSection = `<section><h2>🪄 Lovart 账号 · 模型可用性</h2>
    <div class="grid" style="grid-template-columns:240px 1fr;align-items:start">
      <div class="card">${account ? `
        <h3>生成模式</h3>
        <div style="font-size:22px;font-weight:700;color:var(--green)">♾ ${esc(account.mode)}</div>
        <div style="font-size:12px;color:var(--muted);margin:6px 0 10px">${esc(account.note)}</div>
        <div style="font-size:12px;color:var(--muted)">画布：<a href="${esc(account.canvasUrl)}" target="_blank">www.lovart.ai/canvas ↗</a></div>` : `<div class="empty">无快照数据</div>`}
      </div>
      <div class="card"><h3>可用图片模型（无限模式额度）</h3>
        <div class="chips">${chips || `<div class="empty">无数据</div>`}</div>
      </div>
    </div></section>`;

  /* §4 里程碑 / 已验证 / 下一步 */
  const kv = (d.milestones || []).map(m =>
    `<div><b>${esc(m.version)} · ${esc(m.goal.split("：")[0])}</b><span>${esc(m.goal)} — ${esc(m.status)}</span></div>`).join("");
  const verifiedRows = (d.verified || []).map(v => {
    const ok = /✅/.test(v.status);
    return `<tr><td>${esc(v.style)}</td><td><span class="mono">${esc(v.model)}</span></td><td><span class="tag ${ok ? "g" : "r"}">${esc(v.status)}</span></td></tr>`;
  }).join("");
  const nextItems = (d.nextSteps || []).map((s, i) => `<li>${i + 1}. ${esc(s)}</li>`).join("");
  const milestoneSection = `<section><h2>🚩 管线版本路线 · 已验证 · 下一步（PROGRESS.md）</h2>
    <div class="kv" style="margin-bottom:12px">${kv || `<div class="empty">无版本路线</div>`}</div>
    <div class="card" style="margin-bottom:12px"><h3>风格 × 模型 已验证矩阵</h3>
      <table><tbody>${verifiedRows || `<tr><td><div class="empty">无数据</div></td></tr>`}</tbody></table>
    </div>
    <div class="card"><h3>下一步</h3><ol style="padding-left:20px;font-size:13px">${nextItems || "<li>—</li>"}</ol></div>
  </section>`;

  /* §5 批产记录 batch-100 */
  let batchSection = "";
  if (d.batch) {
    const b = d.batch;
    const modelChips = b.byModel.map(([k, n]) => `<span class="tag ${modelTag(MODEL_NAMES[k] || k)}">${esc(MODEL_NAMES[k] || k)} × ${n}</span>`).join(" ");
    const styleChips = b.byStyle.map(([k, n]) => `<span class="tag">${esc(k)} × ${n}</span>`).join(" ");
    const classChips = b.byClass.map(([k, n]) => `<span class="tag">${esc(k)} × ${n}</span>`).join(" ");
    const dirChips = b.dirs.map(dd => `<span class="tag ${/archive|_clean|weak|overshoot/.test(dd) ? "o" : ""}">${esc(dd)}</span>`).join(" ");
    batchSection = `<section><h2>🗃 批产记录：demo-character-concept batch-100</h2>
      <div class="mini-stats" style="margin-bottom:12px">
        <div class="stat"><div class="num">${b.rows}</div><div class="lb">批次行数</div></div>
        <div class="stat"><div class="num" style="color:var(--cyan)">${b.stateCount}</div><div class="lb">state 存档</div></div>
        <div class="stat"><div class="num">${b.dirs.length}</div><div class="lb">迭代/归档目录</div></div>
      </div>
      <div class="card" style="margin-bottom:12px">
        <h3>模型分布（nbp=Nano Banana Pro · mj=Midjourney · gpt2=GPT Image 2）</h3><div>${modelChips}</div>
        <h3 style="margin-top:10px">风格 / 职业分布（批次缩写原样）</h3><div>${styleChips}</div><div style="margin-top:6px">${classChips}</div>
      </div>
      <div class="card"><h3>目录结构</h3><div>${dirChips}</div>
        <div class="footnote">源数据：<a href="${repoRel("asset-pipeline/outputs/demo-character-concept/portraits/batch-100/batch_table.csv")}">batch_table.csv</a> · batch_groups.json · state_0..9.json（媒体文件在外盘，仓库只存过程数据）</div>
      </div>
    </section>`;
  }

  /* §6 资产清单 */
  const docChips = d.docs.map(f => {
    const numbered = /^0?\d+-/.test(f);
    const label = esc(f.replace(/\.md$/, ""));
    return `<span class="tag ${numbered ? "c" : ""}">${numbered ? `<a href="${repoRel("asset-pipeline/docs/" + f)}">${label}</a>` : label}</span>`;
  }).join(" ");
  const dataChips = d.dataBatches.map(b =>
    `<span class="tag">${esc(b.file)}${b.items ? `（${b.items} 项）` : ""}</span>`).join(" ");
  const scriptChips = d.scripts.map(f => `<span class="tag mono">${esc(f)}</span>`).join(" ");
  const templateChips = d.templates.map(f =>
    `<a href="${repoRel("asset-pipeline/templates/" + f)}"><span class="tag">${esc(f)}</span></a>`).join(" ");
  const assetSection = `<section><h2>🧰 管线资产清单</h2>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
      <div class="card"><h3>Prompt 模板 templates/</h3><div>${templateChips || "<span class='empty'>空</span>"}</div></div>
      <div class="card"><h3>后处理脚本 scripts/</h3><div>${scriptChips || "<span class='empty'>空</span>"}</div></div>
      <div class="card"><h3>板块文档 docs/（编号工作流可点）</h3><div>${docChips || "<span class='empty'>空</span>"}</div>
        <div class="footnote">入口：<a href="${repoRel("asset-pipeline/docs/10-美术生产标准工作流.md")}">10-美术生产标准工作流.md</a> · 踩坑记录：<a href="${repoRel("asset-pipeline/docs/05-踩坑记录.md")}">05-踩坑记录.md</a></div></div>
      <div class="card"><h3>批次规格 data/（生产 JSON）</h3><div>${dataChips || "<span class='empty'>空</span>"}</div></div>
    </div></section>`;

  /* §7 运营快照（人工维护 dashboard-data.json） */
  const taskItems = (json?.tasks || []).map((t: any) =>
    `<li><span class="dot ${esc(t.color || "d")}"></span><span><b>${esc(t.title)}</b>${t.note ? ` — ${esc(t.note)}` : ""}${t.link ? ` · <a href="${repoRel("asset-pipeline/" + t.link)}">相关文件</a>` : ""}</span></li>`).join("");
  const env = json?.env || null;
  const kvHtml = env ? `<div><b>网络状态</b><span>${esc(env.network || "—")}（代理 <span class="mono">${esc(env.proxy || "")}</span>）</span></div>
    <div><b>桌面产出根（硬规则）</b><span class="mono">${esc(env.desktopRoot || "")}</span></div>
    <div><b>批次规格表存放</b><span class="mono">${esc(env.batchSpecDir || "")}</span></div>
    <div><b>Lovart skill 基址</b><span class="mono">${esc(env.lovartSkillBase || "")}</span></div>
    ${env.activeCanvas ? `<div><b>活跃画布（本地 state）</b><span class="mono">${esc(env.activeCanvas.id || "")}「${esc(env.activeCanvas.name)}」最近活动 ${esc(env.activeCanvas.lastActive)}</span></div>` : ""}`
    : `<div class="empty">dashboard-data.json 缺失或损坏 — 无运营快照</div>`;
  const opsSection = `<section><h2>📌 挂起任务与待办 + 本机运行配方（dashboard-data.json 人工快照）</h2>
    <div class="card" style="margin-bottom:12px"><ul class="tasks">${taskItems || `<li><span class="empty">无挂起任务</span></li>`}</ul></div>
    <div class="kv">${kvHtml}</div></section>`;

  /* §8 git 变动 */
  const commits = gitRecent("asset-pipeline", 5);
  const uncommitted = gitUncommitted("asset-pipeline");
  const gitSection = `<section><h2>🔀 板块 git 变动（asset-pipeline/，2026-09-04 起根级）</h2>
    <div class="card">
      ${uncommitted ? `<div style="margin-bottom:8px"><span class="tag o">${uncommitted} 个未提交改动</span></div>` : ""}
      ${commits.map(c => `<div style="font-size:12.5px;padding:3px 0"><span class="mono" style="color:var(--dim)">${esc(c.date)} ${esc(c.hash)}</span> ${esc(c.msg)}</div>`).join("") || `<div class="empty">无提交</div>`}
      <div class="footnote">迁移前历史（2026-09-04 前）在 projects/asset-pipeline/ 路径下，主盘 BOARDS 以 legacyPaths 并集统计。</div>
    </div></section>`;

  const issues = d.linkIssues;
  const issueNote = issues.length
    ? ` ⚠ ${issues.length} 个 dashboard-data.json 引用断链：${issues.map(i => esc(i.where + " → " + i.path)).join("；")}`
    : " dashboard-data.json 引用校验全部通过 ✅";
  const degrade = d.jsonOk ? "" : `<div style="color:var(--red);font-size:12px;margin-top:4px">⚠ dashboard-data.json 读取失败，运营快照/矩阵/账号区块为空</div>`;

  return pageShell({
    emoji: "🎨",
    title: "板块4 · 美术产线",
    subtitle: "asset-pipeline — 人 · Claude/DSH · Lovart 三角协作生产线 · 数据权威源 PROGRESS.md + dashboard-data.json",
    badges: headBadges.length ? headBadges : [{ text: "数据待补", cls: "dim" }],
    snapshot: snapParts.join(" · "),
    authority: [
      { text: "dashboard-data.json", href: repoRel("asset-pipeline/dashboard-data.json") },
      { text: "PROGRESS.md", href: repoRel("asset-pipeline/PROGRESS.md") },
      { text: "CLAUDE.md", href: repoRel("asset-pipeline/CLAUDE.md") },
    ],
  }, statusSection + stagesSection + matrixSection + accountSection + milestoneSection + batchSection + assetSection + opsSection + gitSection,
    `生成式仪表盘 · 文件可推导数据（PROGRESS/资产清单/批产记录）由采集器解析；人工实测值维护在 asset-pipeline/dashboard-data.json（改后刷新本页）。${issueNote}${degrade}`);
}

/* CLI */
if (require.main === module) {
  const { writeFileSync } = require("fs");
  const out = path.join(ROOT, "造化仪表盘", "reports", "板块4-美术产线仪表盘.html");
  writeFileSync(out, generateAssetHTML(), "utf-8");
  console.log("✅ 板块4-美术产线仪表盘.html");
}
