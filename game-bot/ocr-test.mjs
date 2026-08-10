// OCR-only test
import { ocrImage, parseOcrText, detectUIState } from './lib/ocr.mjs';

const r = await ocrImage('J:/ceshi/game-bot/screen_test.png', 'J:/ceshi/game-bot/screen_ocr.txt');
if (r.ok) {
  console.log('OCR OK, lines:', r.lines.length);
  r.lines.forEach(l => console.log(' ', l));
  console.log('Parsed:', JSON.stringify(parseOcrText(r.lines)));
  console.log('States:', detectUIState(r.lines).map(s => s.state).join(', '));
} else {
  console.log('OCR FAILED:', r.error);
}
