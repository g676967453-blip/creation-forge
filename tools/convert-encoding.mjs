#!/usr/bin/env node
/**
 * 编码转换工具（编码卫生 - 防乱码）
 *
 * 将项目文本文件统一转换为「无 BOM UTF-8」：
 * 1. UTF-16 LE/BE（带 BOM）→ UTF-8 无 BOM
 * 2. 带 UTF-8 BOM → 去 BOM
 * 3. GBK/GB2312（非 UTF-8）→ UTF-8 无 BOM（TextDecoder('gbk')）
 *
 * 用法：
 *   node tools/convert-encoding.mjs --dry-run   # 预览将转换的文件
 *   node tools/convert-encoding.mjs             # 执行转换
 *   node tools/convert-encoding.mjs <dir>       # 只处理指定目录
 *
 * 与 tools/check-encoding.mjs 配套：先 check 后 convert。
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname, relative, resolve } from 'node:path';

const ROOT = process.argv[2] && !process.argv[2].startsWith('--')
  ? resolve(process.argv[2])
  : process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');

const TEXT_EXTS = new Set([
  '.md', '.ts', '.js', '.mjs', '.cjs', '.json', '.html', '.htm', '.css',
  '.yml', '.yaml', '.ps1', '.txt', '.xml', '.svg', '.csv', '.ini', '.cfg',
  '.toml', '.py', '.bat', '.sh', '.tsx', '.jsx', '.vue', '.godot', '.tres',
  '.tscn', '.gd', '.editorconfig', '.gitignore', '.gitattributes', '.prettierrc',
]);

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'outputs', '.claude', '.workbuddy', 'tmp',
  'build', '_archive', '.godot', 'export', '.libtv', 'frames', 'game-bot',
  'ui-prototypes', '.gitlab', '.github', '.vscode', '.idea',
]);

const SKIP_FILES = new Set(['package-lock.json', 'reviews.json', 'reviews_cn.json']);

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
const utf16leDecoder = new TextDecoder('utf-16le');
const utf16beDecoder = new TextDecoder('utf-16be');
const gbkDecoder = new TextDecoder('gbk'); // WHATWG 支持，Node ≥ 18

let converted = 0, utf16Count = 0, bomStripped = 0, gbkCount = 0;
const log = [];

function save(p, text) {
  const rel = relative(ROOT, p);
  if (DRY_RUN) { log.push(`  [预览] ${rel}`); return; }
  writeFileSync(p, text, 'utf8'); // 无 BOM
  log.push(`  ✅ ${rel}`);
  converted++;
}

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

      // 1. UTF-16 LE/BE（带 BOM）
      if (buf[0] === 0xFF && buf[1] === 0xFE) {
        save(p, utf16leDecoder.decode(buf.subarray(2)));
        utf16Count++;
      } else if (buf[0] === 0xFE && buf[1] === 0xFF) {
        save(p, utf16beDecoder.decode(buf.subarray(2)));
        utf16Count++;
      } else {
        // 2. UTF-8 严格解码
        try {
          utf8Decoder.decode(buf);
          // 3. 去 UTF-8 BOM
          if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
            save(p, buf.subarray(3).toString('utf8'));
            bomStripped++;
          }
        } catch {
          // 4. GBK 尝试
          try {
            save(p, gbkDecoder.decode(buf));
            gbkCount++;
          } catch {
            console.log(`  ❌ 无法识别编码: ${relative(ROOT, p)}`);
          }
        }
      }
    }
  }
}

walk(ROOT);

console.log(`${DRY_RUN ? '【预览】将转换' : '【执行】转换完成'} ${converted} 个文件：`);
console.log(`  UTF-16 → UTF-8: ${utf16Count}`);
console.log(`  去 BOM: ${bomStripped}`);
console.log(`  GBK → UTF-8: ${gbkCount}`);
log.forEach((l) => console.log(l));
if (DRY_RUN) console.log('（加 --dry-run 预览；确认无误后去掉该参数执行）');
