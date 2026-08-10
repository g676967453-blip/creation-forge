// Debug: isolate screenshot + OCR
import { MumuCtl } from './lib/mumuctl.mjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const config = JSON.parse(readFileSync(join(import.meta.dirname, 'config.json'), 'utf8'));
const m = new MumuCtl(config.mumu);

console.log('1. Taking screenshot...');
const winPath = (p) => p.replace(/\//g, '\\');
const shotPath = 'J:\\ceshi\\game-bot\\debug_shot.png';
const r = await m.screenshot(shotPath);
console.log('   Result:', r.ok ? 'OK' : 'FAIL: ' + r.error);

if (r.ok && existsSync(shotPath)) {
  const { size } = await import('fs').then(fs => fs.statSync(shotPath));
  console.log('   Size:', size, 'bytes');

  console.log('2. Running OCR via spawnSync...');
  console.log('   ImagePath:', shotPath);
  const ocrPath = 'J:\\ceshi\\game-bot\\debug_ocr.txt';
  const result = spawnSync('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', 'J:\\ceshi\\ocr.ps1',
    '-ImagePath', shotPath,
    '-OutFile', ocrPath
  ], { timeout: 20000, encoding: 'utf8', windowsHide: true });

  console.log('   Exit code:', result.status);
  console.log('   Stdout:', result.stdout?.slice(0, 300));
  if (result.stderr) console.log('   Stderr:', result.stderr.slice(0, 300));

  if (existsSync(ocrPath)) {
    const text = readFileSync(ocrPath, 'utf8');
    console.log('3. OCR result:');
    text.split('\n').filter(l => l.trim()).forEach(l => console.log('   ', l));
  } else {
    console.log('3. OCR file NOT created!');
  }
}
