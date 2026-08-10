// 快速功能测试
import { readFileSync } from 'fs';
import { join } from 'path';
import { MumuCtl } from './lib/mumuctl.mjs';
import { ocrImage, parseOcrText, detectUIState } from './lib/ocr.mjs';

const config = JSON.parse(readFileSync(join(import.meta.dirname, 'config.json'), 'utf8'));
const mumu = new MumuCtl(config.mumu);

console.log('=== 核心功能测试 ===\n');

// 1. 截图
console.log('1. 截图...');
const r = await mumu.screenshot('J:/ceshi/game-bot/test_shot.png');
console.log('   结果:', r.ok ? '✓ OK' : '✗ ' + r.error);

// 2. OCR
console.log('2. OCR...');
const ocr = await ocrImage('J:/ceshi/game-bot/test_shot.png', 'J:/ceshi/game-bot/test_ocr.txt');
if (ocr.ok) {
  console.log('   行数:', ocr.lines.length);
  ocr.lines.slice(0, 5).forEach(l => console.log('   ', l));
  console.log('   解析:', JSON.stringify(parseOcrText(ocr.lines)));
  console.log('   状态:', detectUIState(ocr.lines).map(s => s.state).join(', '));
} else {
  console.log('   ✗', ocr.error);
}

// 3. 分辨率
console.log('3. 屏幕信息...');
const size = await mumu.getScreenSize();
console.log('   分辨率:', size.width + 'x' + size.height);
const app = await mumu.getCurrentApp();
console.log('   当前 App:', app);

console.log('\n=== 测试完成 ===');
