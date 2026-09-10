#!/usr/bin/env node
/**
 * render-dsh-daily.mjs — 把 DSH 日报 Markdown 渲染为可在仪表盘直读的 HTML。
 *
 * 为什么自写渲染：仓库根没有 package.json，也没有 markdown-it（已核实），
 * 且板块1 明确禁止 npm i —— 所以这里只实现日报模板真正用到的 Markdown 子集。
 *
 * 支持：h1–h6 / 表格 / 有序·无序列表 / 围栏代码 / 引用 / 分隔线 / 段落
 *       行内：**粗体**、`行内码`、[链接](url)
 * 未识别结构降级为转义段落，永不抛异常。
 *
 * 用法：
 *   node 造化仪表盘/tools/dsh-report/render-dsh-daily.mjs [<YYYY-MM-DD>|--all]
 *   （不带参数 = 渲染最新一期，并刷新 index.html / latest.md）
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url)) // <repo>/造化仪表盘/tools/dsh-report
const REPO_ROOT = resolve(HERE, '..', '..', '..')
const OUT_DIR = join(REPO_ROOT, '造化仪表盘', 'reports', 'dsh-daily')
const CSS_PATH = join(REPO_ROOT, '造化仪表盘', 'tools', '_dshell_tpl.css')

// ---------- 转义与行内 ----------

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** 只允许安全链接协议，挡住 javascript: / data: */
function safeUrl(url) {
  const u = String(url).trim()
  if (/^(https?:|mailto:|#|\.{1,2}\/|\/)/i.test(u)) return u
  return null
}

/** 行内标记：输入必须是「已转义」的文本 */
function inline(text) {
  let s = escapeHtml(text)

  // 行内码优先占位，避免内部内容被后续规则改写
  const codes = []
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c)
    return `\u0000CODE${codes.length - 1}\u0000`
  })

  // 链接
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label, url) => {
    const safe = safeUrl(url)
    return safe ? `<a href="${safe}" target="_blank" rel="noreferrer">${label}</a>` : whole
  })

  // 粗体
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // 还原行内码
  s = s.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`)
  return s
}

// ---------- 块级解析 ----------

const RE = {
  heading: /^(#{1,6})\s+(.*)$/,
  hr: /^\s*([-*_])\1{2,}\s*$/,
  fence: /^\s*```/,
  ul: /^\s*[-*+]\s+(.*)$/,
  ol: /^\s*\d+[.)]\s+(.*)$/,
  quote: /^\s*>\s?(.*)$/,
  tableRow: /^\s*\|.*\|\s*$/,
  tableSep: /^\s*\|[\s:|-]+\|\s*$/,
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

function renderMarkdown(md) {
  const lines = String(md ?? '').replace(/\r\n?/g, '\n').split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 围栏代码
    if (RE.fence.test(line)) {
      const lang = line.replace(/^\s*```/, '').trim()
      i++
      const buf = []
      while (i < lines.length && !RE.fence.test(lines[i])) buf.push(lines[i++])
      i++ // 跳过收尾围栏
      out.push(
        `<pre class="dshell-code"><code${lang ? ` class="lang-${escapeHtml(lang)}"` : ''}>${escapeHtml(buf.join('\n'))}</code></pre>`,
      )
      continue
    }

    // 空行
    if (!line.trim()) {
      i++
      continue
    }

    // 分隔线
    if (RE.hr.test(line)) {
      out.push('<hr class="dshell-divider" />')
      i++
      continue
    }

    // 标题
    const h = line.match(RE.heading)
    if (h) {
      const level = Math.min(h[1].length, 6)
      out.push(`<h${level} class="dsh-h dsh-h${level}">${inline(h[2])}</h${level}>`)
      i++
      continue
    }

    // 表格：当前行像表格行，且下一行是分隔行
    if (RE.tableRow.test(line) && i + 1 < lines.length && RE.tableSep.test(lines[i + 1])) {
      const head = splitRow(line)
      i += 2
      const body = []
      while (i < lines.length && RE.tableRow.test(lines[i])) body.push(splitRow(lines[i++]))
      const thead = '<tr>' + head.map((c) => `<th>${inline(c)}</th>`).join('') + '</tr>'
      const tbody = body
        .map((r) => '<tr>' + head.map((_, k) => `<td>${inline(r[k] ?? '')}</td>`).join('') + '</tr>')
        .join('')
      out.push(
        `<table class="dshell-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`,
      )
      continue
    }

    // 引用
    if (RE.quote.test(line)) {
      const buf = []
      while (i < lines.length && RE.quote.test(lines[i])) buf.push(lines[i++].match(RE.quote)[1])
      out.push(`<blockquote class="dsh-quote">${inline(buf.join(' '))}</blockquote>`)
      continue
    }

    // 无序列表
    if (RE.ul.test(line)) {
      const buf = []
      while (i < lines.length && RE.ul.test(lines[i])) buf.push(lines[i++].match(RE.ul)[1])
      out.push('<ul>' + buf.map((t) => `<li>${inline(t)}</li>`).join('') + '</ul>')
      continue
    }

    // 有序列表
    if (RE.ol.test(line)) {
      const buf = []
      while (i < lines.length && RE.ol.test(lines[i])) buf.push(lines[i++].match(RE.ol)[1])
      out.push('<ol>' + buf.map((t) => `<li>${inline(t)}</li>`).join('') + '</ol>')
      continue
    }

    // 段落（连续非空、且不是其它块起始）
    const buf = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !RE.heading.test(lines[i]) &&
      !RE.fence.test(lines[i]) &&
      !RE.ul.test(lines[i]) &&
      !RE.ol.test(lines[i]) &&
      !RE.quote.test(lines[i]) &&
      !RE.hr.test(lines[i]) &&
      !(RE.tableRow.test(lines[i]) && i + 1 < lines.length && RE.tableSep.test(lines[i + 1]))
    ) {
      buf.push(lines[i++])
    }
    out.push(`<p>${inline(buf.join(' '))}</p>`)
  }

  return out.join('\n')
}

// ---------- 页面外壳 ----------

function inlineCss() {
  try {
    return readFileSync(CSS_PATH, 'utf8')
  } catch {
    return ''
  }
}

const REPORT_CSS = `
.dsh-report { max-width: 1040px; margin: 0 auto; }
.dsh-report .dsh-h { margin: 22px 0 10px; line-height: 1.35; }
.dsh-report .dsh-h1 { font-size: 22px; border-bottom: 1px solid var(--dsw-alias-border-l1, #262b36); padding-bottom: 8px; }
.dsh-report .dsh-h2 { font-size: 17px; color: var(--dsw-alias-state-accent-primary, #4f8ef7); }
.dsh-report .dsh-h3 { font-size: 14.5px; }
.dsh-report p, .dsh-report li { font-size: 13px; line-height: 1.75; color: var(--dsw-alias-label-secondary, #9aa4b2); }
.dsh-report strong { color: var(--dsw-alias-label-primary, #e6e8eb); }
.dsh-report code { background: var(--dsw-alias-fill-l1, rgba(255,255,255,.05)); padding: 1px 5px; border-radius: 4px; font-size: 12px; }
.dsh-report .dshell-code { background: var(--dsw-alias-fill-l1, rgba(255,255,255,.04)); border: 1px solid var(--dsw-alias-border-l1, #262b36); border-radius: 8px; padding: 10px 12px; overflow-x: auto; }
.dsh-report .dsh-quote { margin: 10px 0; padding: 8px 14px; border-left: 3px solid var(--dsw-alias-state-accent-primary, #4f8ef7); background: var(--dsw-alias-fill-l1, rgba(255,255,255,.03)); border-radius: 0 8px 8px 0; }
.dsh-report a { color: var(--dsw-alias-state-accent-primary, #4f8ef7); text-decoration: none; }
.dsh-report a:hover { text-decoration: underline; }
.dsh-report table { margin: 10px 0 16px; }
.dsh-report ul, .dsh-report ol { margin: 8px 0; padding-left: 22px; }
.dsh-report hr.dshell-divider { margin: 18px 0; }
.dsh-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 4px 0 14px; }
.dsh-nav { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.dsh-nav a { font-size: 11.5px; padding: 2px 9px; border: 1px solid var(--dsw-alias-border-l1, #262b36); border-radius: 999px; }
.dsh-alert { border: 1px solid #d29922; border-left-width: 3px; border-radius: 8px; padding: 10px 14px; margin: 12px 0; font-size: 12.5px; color: #d29922; background: rgba(210,153,34,.06); }
.dsh-alert.ok { border-color: #3fb950; color: #3fb950; background: rgba(63,185,80,.06); }
`

function listReports() {
  let files = []
  try {
    files = readdirSync(OUT_DIR)
  } catch {
    return []
  }
  return files
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .map((f) => f.replace(/\.md$/, ''))
    .sort()
    .reverse()
}

function navHtml(currentDate, all) {
  const recent = all.slice(0, 14)
  if (!recent.length) return ''
  const chips = recent
    .map((d) => {
      const label = d === currentDate ? `${d}（本期）` : d
      const href = d + '.html'
      return `<a href="${href}">${label}</a>`
    })
    .join('')
  return `<nav class="dsh-nav">${chips}</nav>`
}

function pageHtml({ title, date, bodyHtml, isIndex, all, errorCount, warnCount }) {
  const status =
    errorCount > 0
      ? `<div class="dsh-alert">⚠️ 本次采集有 ${errorCount} 项失败（详见报告附录），硬事实仍已产出。</div>`
      : `<div class="dsh-alert ok">✅ 数据源全部正常${warnCount ? `（${warnCount} 项降级警告）` : ''}</div>`

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>${inlineCss()}
${REPORT_CSS}</style>
</head>
<body>
<div class="dshell dsh-report">
  <h1 class="dshell-title">🧪 DSH 信息日报</h1>
  <p class="dshell-sub">${escapeHtml(date)}${isIndex ? " · 最新一期" : ""} · 自动生成于 ${escapeHtml(new Date().toLocaleString("zh-CN"))}</p>
  <div class="dsh-meta">
    <span class="dshell-badge">📄 原始 Markdown：<a href="${date}.md">${date}.md</a></span>
  </div>
  ${status}
  ${bodyHtml}
  ${navHtml(date, all)}
</div>
</body>
</html>
`
}

// ---------- 主流程 ----------

function readMetaWarnings(jsonPath) {
  try {
    const j = JSON.parse(readFileSync(jsonPath, 'utf8'))
    const errs = Array.isArray(j.errors) ? j.errors : []
    return {
      errorCount: errs.filter((e) => e.severity !== 'warn').length,
      warnCount: errs.filter((e) => e.severity === 'warn').length,
    }
  } catch {
    return { errorCount: 0, warnCount: 0 }
  }
}

function renderOne(date, all) {
  const mdPath = join(OUT_DIR, `${date}.md`)
  if (!existsSync(mdPath)) throw new Error(`未找到日报：${mdPath}`)
  const md = readFileSync(mdPath, 'utf8')
  const body = renderMarkdown(md)
  const { errorCount, warnCount } = readMetaWarnings(join(OUT_DIR, '_data', `${date}.json`))

  writeFileSync(
    join(OUT_DIR, `${date}.html`),
    pageHtml({
      title: `DSH 日报 ${date}`,
      date,
      bodyHtml: body,
      isIndex: false,
      all,
      errorCount,
      warnCount,
    }),
    'utf8',
  )
  return { date, body, errorCount, warnCount }
}

function main() {
  const argv = process.argv.slice(2)
  mkdirSync(OUT_DIR, { recursive: true })

  const all = listReports()
  if (!all.length) {
    process.stderr.write('[render-dsh-daily] reports/dsh-daily/ 下没有任何 YYYY-MM-DD.md\n')
    process.exit(1)
  }

  const arg = argv.find((a) => !a.startsWith('--'))
  const renderAll = argv.includes('--all')
  const targets = renderAll ? all : [arg || all[0]]

  for (const d of targets) renderOne(d, all)

  // index.html = 最新一期（重渲染以带上正确的历史导航）
  const latest = all[0]
  const { body, errorCount, warnCount } = renderOne(latest, all)
  writeFileSync(
    join(OUT_DIR, 'index.html'),
    pageHtml({
      title: `DSH 日报 · 最新 ${latest}`,
      date: latest,
      bodyHtml: body,
      isIndex: true,
      all,
      errorCount,
      warnCount,
    }),
    'utf8',
  )

  // latest.md 稳定路径镜像
  copyFileSync(join(OUT_DIR, `${latest}.md`), join(OUT_DIR, 'latest.md'))

  process.stdout.write(
    `[render-dsh-daily] 渲染 ${targets.length} 期；最新=${latest}；index.html 已刷新\n`,
  )
}

main()
