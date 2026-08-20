import { ocrImage, parseOcrText, detectUIState } from './lib/ocr.mjs';

const shotPath = 'J:\\ceshi\\game-bot\\after_tap.png';
const ocrPath = 'J:\\ceshi\\game-bot\\after2_ocr.txt';

const r = await ocrImage(shotPath, ocrPath);
if (r.ok) {
  console.log('OCR 行数:', r.lines.length);
  r.lines.forEach(l => console.log(l));
  console.log('---');
  console.log('解析:', JSON.stringify(parseOcrText(r.lines)));
  console.log('状态:', detectUIState(r.lines).map(s => s.state).join(', '));
} else {
  console.log('FAIL:', r.error);
}
