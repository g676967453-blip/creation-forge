// OCR-only test
import { ocrImage, parseOcrText, detectUIState } from './lib/ocr.mjs';
import { join } from 'path';

// 路径基于脚本所在目录 (game-bot/) 解析，不依赖 J: 盘
const r = await ocrImage(join(import.meta.dirname, 'screen_test.png'), join(import.meta.dirname, 'screen_ocr.txt'));
if (r.ok) {
  console.log('OCR OK, lines:', r.lines.length);
  r.lines.forEach(l => console.log(' ', l));
  console.log('Parsed:', JSON.stringify(parseOcrText(r.lines)));
  console.log('States:', detectUIState(r.lines).map(s => s.state).join(', '));
} else {
  console.log('OCR FAILED:', r.error);
}
