#!/usr/bin/env node
/**
 * 编码卫生检查工具（编码卫生 - 防乱码）
 *
 * 扫描项目文本文件，检测：
 * 1. 非 UTF-8 编码文件（GBK/GB2312 等）— 用 UTF-8 严格解码判定
 * 2. 带 UTF-8 BOM 的文件（建议去 BOM，统一无 BOM UTF-8）
 *
 * 用法：
 *   node tools/check-encoding.mjs            # 全项目扫描
 *   node tools/check-encoding.mjs <dir>      # 只扫指定目录
 *   node tools/check-encoding.mjs --json     # JSON 输出（供脚本/仪表盘用）
 *
 * 输出：检查总数、问题文件清单、BOM 文件数
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, extname, relative, resolve } from 'node:path';

const ROOT = process.argv[2] && !process.argv[2].startsWith('--')
  ? resolve(process.argv[2])
  : process.cwd();
const AS_JSON = process.argv.includes('--json');

// 视为文本的扩展名
const TEXT_EXTS = new Set([
  '.md', '.ts', '.js', '.mjs', '.cjs', '.json', '.html', '.htm', '.css',
  '.yml', '.yaml', '.ps1', '.txt', '.xml', '.svg', '.csv', '.ini', '.cfg',
  '.toml', '.py', '.bat', '.sh', '.tsx', '.jsx', '.vue', '.godot', '.tres',
  '.tscn', '.gd', '.editorconfig', '.gitignore', '.gitattributes', '.prettierrc',
]);

// 跳过目录（二进制/生成物/依赖/归档）
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'outputs', '.claude', '.workbuddy', 'tmp',
  'build', '_archive', '.godot', 'export', '.libtv', 'frames', 'game-bot',
  'frames', 'ui-prototypes', '.gitlab', '.github', '.vscode', '.idea',
]);

// 跳过文件（机器生成、体积大）
const SKIP_FILES = new Set(['package-lock.json', 'reviews.json', 'reviews_cn.json']);

const decoder = new TextDecoder('utf-8', { fatal: true });
let checked = 0;
let bomCount = 0;
const issues = [];

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(join(dir, e.name));
    } else if (e.isFile()) {
      const ext = extname(e.name).toLowerCase();
      if (!TEXT_EXTS.has(ext)) continue;
      if (SKIP_FILES.has(e.name)) continue;
      const p = join(dir, e.name);
      let buf;
      try { buf = readFileSync(p); } catch { continue; }
      if (buf.length === 0) continue;
      checked++;
      // BOM 检测
      if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) bomCount++;
      // UTF-8 严格解码
      try { decoder.decode(buf); }
      catch { issues.push(relative(ROOT, p)); }
    }
  }
}

walk(ROOT);

if (AS_JSON) {
  console.log(JSON.stringify({ checked, nonUtf8: issues.length, bom: bomCount, files: issues }, null, 2));
} else {
  console.log(`扫描目录: ${ROOT}`);
  console.log(`检查文本文件: ${checked}`);
  console.log(`非 UTF-8 文件: ${issues.length}`);
  for (const f of issues) console.log(`  ⚠ ${f}`);
  console.log(`带 BOM 文件: ${bomCount}`);
  if (issues.length === 0 && bomCount === 0) console.log('✅ 全部为无 BOM UTF-8，编码卫生合格');
  else console.log('💡 修复建议：GBK 文件用 tools/convert-encoding.mjs 转 UTF-8；BOM 用去 BOM 处理');
}
