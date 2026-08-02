/**
 * 组件库 HTML 渲染器
 * 将解析后的组件数据渲染为自包含 HTML 展示页
 */
import type { ComponentSpec } from "./component-parser";
import { getTokenCSS, type TokenOverrides } from "./shared/tokens";
import { computeGrid, DEFAULT_GRID_CONFIG, type GridConfig } from "./shared/grid";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CATEGORY_LABELS: Record<string, string> = {
  basic: "基础组件",
  layout: "布局组件",
  game: "游戏专用组件",
};

export function renderComponentLib(
  components: ComponentSpec[],
  overrides?: TokenOverrides,
  gridConfig?: GridConfig
): string {
  const tokensCSS = getTokenCSS(overrides);
  const grid = computeGrid(gridConfig || DEFAULT_GRID_CONFIG);

  // 分组
  const grouped = new Map<string, ComponentSpec[]>();
  for (const c of components) {
    const cat = c.meta.category || "other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(c);
  }

  const navLinks = Array.from(grouped.entries())
    .map(([cat]) => `<a href="#cat-${cat}">${CATEGORY_LABELS[cat] || cat}</a>`)
    .join("");

  const allCSS = components.map((c) => c.cssCode).filter(Boolean).join("\n\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>游戏 UI 组件库 · 造化坊</title>
<style>
/* ═══════════ Design Tokens ═══════════ */
${tokensCSS}

/* ═══════════ 组件库所有 CSS ═══════════ */
${allCSS}

/* ═══════════ 展示页样式 ═══════════ */
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--font-body);background:var(--bg);color:var(--ink);line-height:1.6;font-size:14px;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:var(--ink);text-decoration:none}

/* Nav */
.lib-nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--rule);padding:var(--space-2) var(--space-5);display:flex;gap:var(--space-4);overflow-x:auto;font-size:12px}
.lib-nav a{color:var(--muted);white-space:nowrap;padding:var(--space-1) var(--space-2);border-radius:var(--radius-sm);transition:all var(--dur-fast) var(--ease-out);font-weight:600}
.lib-nav a:hover{color:var(--ink);background:var(--bg-3)}

/* Cover */
.cover{padding:var(--space-8) var(--space-5);border-bottom:1px solid var(--rule);text-align:center}
.cover h1{font:var(--text-display);margin-bottom:var(--space-2)}
.cover p{color:var(--muted);font-size:15px}
.cover .meta{display:flex;justify-content:center;gap:var(--space-5);margin-top:var(--space-4);font-family:var(--font-mono);font-size:12px;color:var(--muted-2)}

.page{max-width:1100px;margin:0 auto;padding:0 var(--space-5)}

/* Category */
.cat-section{padding:var(--space-7) 0;border-bottom:1px solid var(--rule)}
.cat-section h2{font:var(--text-h1);margin-bottom:var(--space-6);padding-bottom:var(--space-2);border-bottom:2px solid var(--ink);display:inline-block}

/* Component Card */
.comp-card{margin-bottom:var(--space-7);padding:var(--space-5);background:var(--bg-2);border:1px solid var(--rule);border-radius:var(--radius-md)}
.comp-card:hover{border-color:var(--rule-2)}
.comp-card h3{font:var(--text-h2);margin-bottom:var(--space-2);display:flex;align-items:center;gap:var(--space-2)}
.comp-card h3 .tag{font-family:var(--font-mono);font-size:10px;color:var(--muted);background:var(--bg-3);padding:2px 8px;border-radius:var(--radius-xs);font-weight:400}
.comp-meta{display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-4)}
.comp-meta span{font-family:var(--font-mono);font-size:10px;color:var(--muted-2);background:var(--bg-3);padding:1px 6px;border-radius:var(--radius-xs)}

/* Preview + Code 两栏 */
.comp-body{display:flex;gap:var(--space-5);align-items:flex-start}
.comp-preview{flex:0 0 45%;min-width:0;background:var(--bg);border:1px solid var(--rule);border-radius:var(--radius-sm);padding:var(--space-5);display:flex;flex-wrap:wrap;gap:var(--space-3);align-items:center;justify-content:center;min-height:120px}
.comp-code{flex:1;min-width:0;max-height:400px;overflow:auto}
.comp-code pre{background:var(--bg-3);border-radius:var(--radius-sm);padding:var(--space-3) var(--space-4);font-family:var(--font-mono);font-size:11px;line-height:1.55;overflow-x:auto;margin-bottom:var(--space-3);white-space:pre-wrap;word-break:break-all}
.comp-code .code-label{font-family:var(--font-mono);font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;display:block}

/* Spec Table */
.comp-spec{margin-top:var(--space-4)}
.comp-spec table{width:100%;border-collapse:collapse;font-size:12px}
.comp-spec th,.comp-spec td{padding:6px 10px;text-align:left;border-bottom:1px solid var(--rule)}
.comp-spec th{font-family:var(--font-mono);font-size:10px;color:var(--muted);font-weight:600;letter-spacing:0.05em;text-transform:uppercase;background:var(--bg-3)}
.comp-spec .spec-markdown{font-size:12px;color:var(--ink-2);line-height:1.7}
.comp-spec .spec-markdown table{width:100%;border-collapse:collapse;font-size:12px;margin:8px 0}
.comp-spec .spec-markdown th,.comp-spec .spec-markdown td{padding:6px 10px;text-align:left;border-bottom:1px solid var(--rule)}
.comp-spec .spec-markdown th{font-family:var(--font-mono);font-size:10px;color:var(--muted);font-weight:600;background:var(--bg-3)}
.comp-spec .spec-markdown h4{font:var(--text-label);color:var(--ink);margin:10px 0 4px}
.comp-spec .spec-markdown ul,.comp-spec .spec-markdown ol{margin:4px 0 4px 18px}

/* Footer */
footer{text-align:center;padding:var(--space-7) 0;color:var(--muted-2);font-size:12px}

/* Responsive */
@media(max-width:780px){.comp-body{flex-direction:column}.comp-preview{flex:auto;width:100%}}
@media print{body{background:#fff}.comp-preview{border-color:#ccc}}
</style>
</head>
<body>

<nav class="lib-nav">
  <a href="#">🏭 组件库</a>
  ${navLinks}
  <a href="#tokens">🎨 Token</a>
</nav>

<header class="cover">
  <h1>游戏 UI 组件库</h1>
  <p>造化坊 · 720×1280 竖版手游 · ${components.length} 个组件</p>
  <div class="meta">
    <span>画布: ${gridConfig?.canvas_width || 720}×${gridConfig?.canvas_height || 1280}</span>
    <span>网格: ${gridConfig?.grid_base || 8}px · ${gridConfig?.grid_columns || 6}列</span>
    <span>零依赖 · 自包含</span>
  </div>
</header>

<div class="page">
${Array.from(grouped.entries()).map(([cat, comps]) => `
<section class="cat-section" id="cat-${cat}">
  <h2>${CATEGORY_LABELS[cat] || cat} <span style="font-size:14px;color:var(--muted);font-weight:400">(${comps.length})</span></h2>
  ${comps.map((c) => renderComponentCard(c)).join("\n")}
</section>`).join("\n")}

<section class="cat-section" id="tokens">
  <h2>Design Token 速查</h2>
  ${renderTokenTable()}
</section>
</div>

<footer>
  <p>此页面由 <code>tools/build-component-lib.ts</code> 自动生成</p>
  <p style="margin-top:4px;">数据源: <code>components/*.md</code> + <code>tokens/base.css</code></p>
</footer>

</body>
</html>`;
}

function renderComponentCard(c: ComponentSpec): string {
  const hasSpec = c.specSection.length > 10;
  const variants = c.meta.variants || [];
  const sizes = c.meta.sizes || [];
  const states = c.meta.states || [];

  return `
<div class="comp-card" id="comp-${c.meta.component}">
  <h3>${esc(c.title)} <span class="tag">${c.file}</span></h3>
  <div class="comp-meta">
    ${variants.length ? `<span>变体: ${variants.join(" / ")}</span>` : ""}
    ${sizes.length ? `<span>尺寸: ${sizes.join(" / ")}</span>` : ""}
    ${states.length ? `<span>状态: ${states.join(" / ")}</span>` : ""}
  </div>
  <div class="comp-body">
    <div class="comp-preview">
      ${c.htmlCode ? c.htmlCode : `<span style="color:var(--muted)">(无 HTML 预览)</span>`}
    </div>
    <div class="comp-code">
      ${c.htmlCode ? `<span class="code-label">HTML</span><pre>${esc(c.htmlCode)}</pre>` : ""}
      ${c.cssCode ? `<span class="code-label">CSS</span><pre>${esc(c.cssCode)}</pre>` : ""}
    </div>
  </div>
  ${hasSpec ? `
  <div class="comp-spec">
    <div class="spec-markdown">${simpleMDToHTML(c.specSection)}</div>
  </div>` : ""}
</div>`;
}

/** 简单 Markdown → HTML（只转换表格/列表/标题/加粗/代码） */
function simpleMDToHTML(md: string): string {
  let html = md;
  // 表格
  html = html.replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/g, (_, header, rows) => {
    const hCells = header.split("|").map((s: string) => s.trim()).filter(Boolean);
    const th = hCells.map((c: string) => `<th>${c}</th>`).join("");
    const trs = rows.trim().split("\n").map((row: string) => {
      const cells = row.split("|").map((s: string) => s.trim()).filter(Boolean);
      return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join("")}</tr>`;
    }).join("");
    return `<table>${th ? `<thead><tr>${th}</tr></thead>` : ""}<tbody>${trs}</tbody></table>`;
  });
  // ### 小标题
  html = html.replace(/^### (.+)$/gm, "<h4>$1</h4>");
  // **加粗**
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // `代码`
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  // 无序列表
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");
  // 段落
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;
  return html;
}

function renderTokenTable(): string {
  const rows = [
    ["--bg / --bg-2 / --bg-3 / --bg-4", "背景色阶 (白→浅灰)"],
    ["--ink / --ink-2 / --muted / --muted-2", "文字色阶 (深→浅)"],
    ["--accent / --accent-hover / --accent-pressed", "品牌色 (默认/悬停/按下)"],
    ["--success / --warning / --danger / --info", "功能色 (成功/警告/危险/信息)"],
    ["--q-common / --q-rare / --q-epic / --q-legendary / --q-myth", "品质色 (普通→神话)"],
    ["--space-1 ~ --space-8", "间距 (4px ~ 64px, 8px 基线)"],
    ["--radius-xs ~ --radius-full", "圆角 (2px ~ 9999px)"],
    ["--shadow-xs ~ --shadow-modal", "阴影 (6 级)"],
    ["--z-base / --z-hud / --z-panel / --z-modal / --z-top", "z-index 层级"],
    ["--ease-out / --ease-spring / --dur-fast / --dur-base / --dur-slow", "动效缓动 + 时长"],
    ["--font-heading / --font-body / --font-mono", "字体栈"],
  ];
  return `
<table style="width:100%;border-collapse:collapse;font-size:12px">
  <thead><tr><th>Token</th><th>用途</th></tr></thead>
  <tbody>${rows.map(([token, desc]) => `<tr><td style="font-family:var(--font-mono);font-size:11px">${token}</td><td>${desc}</td></tr>`).join("")}</tbody>
</table>`;
}
