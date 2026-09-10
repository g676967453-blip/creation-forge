#!/usr/bin/env node
/**
 * collect-dsh-env.mjs — 采集本机 DeepSeek Harness 环境「硬事实」。
 *
 * 设计原则：
 *   1) 零依赖：只用 Node 内置模块，仓库根没有 package.json / markdown 库。
 *   2) 只读 + 容错：任何网络或子进程失败都只记进 errors[]，脚本仍然 exit 0，
 *      保证离线时日报仍能产出「环境快照」兜底内容。
 *   3) 零密钥输出：只报密钥「是否存在」的布尔值，永不读取/回显密钥内容。
 *   4) 不 spawn 也能跑：子进程默认用管道 stdio，在受限沙箱下可能 EPERM，
 *      因此所有 spawn 都 try/catch，并有纯 fs 的降级路径。
 *
 * 用法：
 *   node 造化仪表盘/tools/dsh-report/collect-dsh-env.mjs [--date YYYY-MM-DD] [--quiet]
 *
 * 输出：
 *   stdout          → JSON（--quiet 时不打印）
 *   reports/dsh-daily/_data/<date>.json  ← 同一份 JSON
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from 'node:fs'
import { homedir, release as osRelease } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

// ---------- 路径定位（不硬编码盘符，随仓库移动） ----------

const HERE = dirname(fileURLToPath(import.meta.url)) // <repo>/造化仪表盘/tools/dsh-report
const REPO_ROOT = resolve(HERE, '..', '..', '..') // 上溯 3 级到仓库根
const OUT_DIR = join(REPO_ROOT, '造化仪表盘', 'reports', 'dsh-daily')
const DATA_DIR = join(OUT_DIR, '_data')

const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const WORKTABLE_REPO = 'Aisland-SJL/dsh-worktable'
const NPM_PKG = '@deepseek-ai/dsh'

// ---------- 小工具 ----------

const errors = []

/**
 * 记录一条采集异常。
 * severity: 'error' = 真失败（联网/IO）；'warn' = 降级但预期（如沙箱内 git 不可用）。
 */
function note(kind, detail, severity = 'error') {
  errors.push({ kind, severity, detail: String(detail).slice(0, 400) })
}

function readJsonSafe(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function readTextSafe(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

function listDirSafe(path) {
  try {
    return readdirSync(path)
  } catch {
    return []
  }
}

function isDir(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

/** spawn 包装：默认管道 stdio 在受限沙箱可能 EPERM，一律降级为 {ok:false} */
function run(cmd, args, cwd) {
  try {
    const res = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 10000, windowsHide: true })
    if (res.error) return { ok: false, err: String(res.error.message || res.error) }
    if (res.status !== 0) return { ok: false, err: (res.stderr || '').trim() || 'exit ' + res.status }
    return { ok: true, out: (res.stdout || '').trim() }
  } catch (e) {
    return { ok: false, err: String(e && e.message ? e.message : e) }
  }
}

/** 本地日期 YYYY-MM-DD（不用 UTC，避免跨日错位） */
function localDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function localIso(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const oh = p(Math.floor(Math.abs(off) / 60))
  const om = p(Math.abs(off) % 60)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${sign}${oh}:${om}`
}

async function fetchJson(url, ms = 15000) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(ms),
    headers: { accept: 'application/json', 'user-agent': 'dsh-daily-report' },
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return await res.json()
}

// ---------- 各采集块 ----------

/** DSH CLI 包：优先 APPDATA 下的全局 npm 安装位置 */
function collectDshCli() {
  const candidates = [
    process.env.APPDATA ? join(process.env.APPDATA, 'npm', 'node_modules', '@deepseek-ai', 'dsh') : null,
    join(homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', '@deepseek-ai', 'dsh'),
    join(process.env.PREFIX || '/usr/local', 'lib', 'node_modules', '@deepseek-ai', 'dsh'),
    join('/usr', 'lib', 'node_modules', '@deepseek-ai', 'dsh'),
  ].filter(Boolean)

  for (const dir of candidates) {
    const pkg = readJsonSafe(join(dir, 'package.json'))
    if (pkg && pkg.name === NPM_PKG) {
      return { version: pkg.version || null, path: dir, found: true }
    }
  }
  note('dsh-cli', '未在已知全局 npm 路径找到 @deepseek-ai/dsh')
  return { version: null, path: null, found: false }
}

/** settings.yaml：不引入 YAML 依赖，按缩进取顶层键与 agent-default-model 块 */
function parseSettings(text) {
  const sections = []
  const model = {}
  if (!text) return { sections, model }

  let inBlock = false
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue
    const indent = raw.match(/^\s*/)[0].length
    const m = raw.match(/^\s*([A-Za-z0-9_.-]+)\s*:\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    const val = m[2].trim().replace(/^["']|["']$/g, '')

    if (indent === 0) {
      sections.push(key)
      inBlock = key === 'agent-default-model'
      continue
    }
    if (inBlock && val) model[key] = val
  }
  return { sections, model }
}

/** 密钥存在性：只报布尔，绝不读值 */
function credentialPresent() {
  if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim()) return true
  return existsSync(join(DSH_HOME, '.credentials.yaml'))
}

function collectProfiles() {
  const dir = join(DSH_HOME, 'profiles')
  return listDirSafe(dir)
    .filter((name) => !name.startsWith('.') && name !== 'node_modules' && isDir(join(dir, name)))
    .map((name) => {
      const pkg = readJsonSafe(join(dir, name, 'package.json'))
      const bundles = (pkg && pkg.dsh && pkg.dsh.profile && pkg.dsh.profile.bundles) || []
      return { name, bundles: Array.isArray(bundles) ? bundles : [] }
    })
}

/** 插件清单：仓库内 dsh-worktable 便携包 + profile 已装插件 */
function collectPlugins() {
  const out = []

  // 仓库便携包里的 worktable（git 跟踪的权威副本）
  const packPkgPath = join(REPO_ROOT, '造化仪表盘', 'tools', 'dsh-harness', 'plugins', 'dsh-worktable', 'package.json')
  const packPkg = readJsonSafe(packPkgPath)
  if (packPkg) {
    out.push({
      name: packPkg.name || 'dsh-worktable',
      version: packPkg.version || null,
      source: '造化仪表盘/tools/dsh-harness/plugins/dsh-worktable',
      upstreamLatest: null,
      updateAvailable: null,
    })
  }

  // 各 profile 已安装的目录（只列非 @deepseek-ai 的第三方插件，避免噪声）
  const profilesDir = join(DSH_HOME, 'profiles')
  for (const prof of listDirSafe(profilesDir)) {
    const nm = join(profilesDir, prof, 'node_modules')
    if (!isDir(nm)) continue
    for (const entry of listDirSafe(nm)) {
      const dirs = entry.startsWith('@')
        ? listDirSafe(join(nm, entry)).map((s) => entry + '/' + s)
        : [entry]
      for (const full of dirs) {
        if (full.startsWith('@deepseek-ai/')) continue
        const pkg = readJsonSafe(join(nm, ...full.split('/'), 'package.json'))
        if (!pkg || !pkg.name) continue
        if (out.some((p) => p.name === pkg.name)) continue
        out.push({
          name: pkg.name,
          version: pkg.version || null,
          source: `profile:${prof}`,
          upstreamLatest: null,
          updateAvailable: null,
        })
      }
    }
  }
  return out
}

function collectRepo() {
  const info = {
    root: REPO_ROOT,
    branch: null,
    head: null,
    headSubject: null,
    headDate: null,
    dirtyCount: null,
  }

  const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], REPO_ROOT)
  if (branch.ok) info.branch = branch.out
  const head = run('git', ['log', '-1', '--format=%h\t%ad\t%s', '--date=short'], REPO_ROOT)
  if (head.ok) {
    const [h, d, ...rest] = head.out.split('\t')
    info.head = h || null
    info.headDate = d || null
    info.headSubject = rest.join('\t') || null
  }
  const dirty = run('git', ['status', '--porcelain'], REPO_ROOT)
  if (dirty.ok) {
    info.dirtyCount = dirty.out ? dirty.out.split(/\r?\n/).filter(Boolean).length : 0
  }

  if (!branch.ok || !head.ok) note('git', '子进程不可用，仓库信息降级（沙箱内属预期）', 'warn')

  // 纯 fs 降级：至少拿到分支名
  if (!info.branch) {
    const headFile = readTextSafe(join(REPO_ROOT, '.git', 'HEAD'))
    if (headFile && headFile.startsWith('ref:')) {
      info.branch = headFile.slice(4).trim().replace('refs/heads/', '')
    }
  }
  return info
}

/** 上一份报告的日期，用于确定「本周期」窗口 */
function previousReportDate(today) {
  const files = listDirSafe(OUT_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
    .map((f) => f.replace(/\.md$/, ''))
    .filter((d) => d < today)
    .sort()
  return files.length ? files[files.length - 1] : null
}

// ---------- 主流程 ----------

async function main() {
  const argv = process.argv.slice(2)
  const quiet = argv.includes('--quiet')
  const dateArgIdx = argv.indexOf('--date')
  const today = dateArgIdx >= 0 && argv[dateArgIdx + 1] ? argv[dateArgIdx + 1] : localDate()

  const settingsText = readTextSafe(join(DSH_HOME, 'settings.yaml'))
  const { sections, model } = parseSettings(settingsText)

  const cli = collectDshCli()
  const plugins = collectPlugins()
  const repo = collectRepo()

  // ---- 联网：npm 最新版 ----
  let npmLatest = null
  let distTags = null
  try {
    const meta = await fetchJson(`https://registry.npmjs.org/${NPM_PKG.replace('/', '%2f')}`)
    distTags = meta['dist-tags'] || null
    npmLatest = distTags ? distTags.latest || null : null
  } catch (e) {
    note('npm-registry', e && e.message ? e.message : e)
  }

  // ---- 联网：worktable 上游最新版 ----
  try {
    const rel = await fetchJson(`https://api.github.com/repos/${WORKTABLE_REPO}/releases/latest`)
    const latest = String(rel.tag_name || '').replace(/^v/, '')
    const wt = plugins.find((p) => p.name === 'dsh-worktable')
    if (wt && latest) {
      wt.upstreamLatest = latest
      wt.updateAvailable = wt.version ? wt.version !== latest : null
      wt.releaseUrl = rel.html_url || null
      wt.releaseName = rel.name || null
      wt.publishedAt = rel.published_at || null
    }
  } catch (e) {
    note('github-releases', e && e.message ? e.message : e)
  }

  const hardErrors = errors.filter((e) => e.severity === 'error')

  const result = {
    collectedAt: localIso(),
    date: today,
    ok: hardErrors.length === 0,
    errors,
    dshCli: {
      version: cli.version,
      path: cli.path,
      found: cli.found,
      npmLatest,
      distTags,
      updateAvailable: cli.version && npmLatest ? cli.version !== npmLatest : null,
    },
    runtime: {
      node: process.version,
      os: `${process.platform} ${process.arch}`,
      osRelease: osRelease(),
      execPath: process.execPath,
    },
    dshHome: {
      path: DSH_HOME,
      exists: isDir(DSH_HOME),
      profiles: collectProfiles(),
      sessionCount: listDirSafe(join(DSH_HOME, 'sessions')).length,
      storages: listDirSafe(join(DSH_HOME, 'storages')),
    },
    model: {
      default: {
        provider: model.provider || null,
        model: model.model || null,
        reasoningEffort: model.reasoningEffort || null,
      },
      settingsSections: sections,
      credentialPresent: credentialPresent(),
    },
    plugins,
    repo,
    previousReportDate: previousReportDate(today),
  }

  mkdirSync(DATA_DIR, { recursive: true })
  const outFile = join(DATA_DIR, `${today}.json`)
  writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf8')

  if (!quiet) process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  else process.stdout.write(`[collect-dsh-env] -> ${outFile}\n`)

  process.exit(0)
}

main().catch((e) => {
  // 连主流程都崩了也要 exit 0？不 —— 这是真正的 bug，非 0 退出让编排脚本感知
  process.stderr.write('[collect-dsh-env] fatal: ' + (e && e.message ? e.message : e) + '\n')
  process.exit(1)
})
