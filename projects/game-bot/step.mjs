// 单步执行：截图 → OCR → 打印 → 等待 AI 决策
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { MumuCtl } from './lib/mumuctl.mjs';
import { ocrImage, parseOcrText, detectUIState } from './lib/ocr.mjs';

const config = JSON.parse(readFileSync(join(import.meta.dirname, 'config.json'), 'utf8'));
const mumu = new MumuCtl(config.mumu);

// 使用 Windows 反斜杠路径
const SHOT = 'J:\\ceshi\\game-bot\\step_shot.png';
const OCR_OUT = 'J:\\ceshi\\game-bot\\step_ocr.txt';
const RESULT = 'J:\\ceshi\\game-bot\\step_result.json';

// 截图
await mumu.screenshot(SHOT);
console.log('截图完成');

// OCR
const ocrR = await ocrImage(SHOT, OCR_OUT);
if (!ocrR.ok) {
  console.log('OCR 失败:', ocrR.error);
  process.exit(1);
}

console.log('OCR 行数:', ocrR.lines.length);
ocrR.lines.forEach(l => console.log('  ', l));

const parsed = parseOcrText(ocrR.lines);
const states = detectUIState(ocrR.lines);

console.log('\n解析:', JSON.stringify(parsed, null, 2));
console.log('状态:', states.map(s => `${s.state}(${Math.round(s.confidence*100)}%)`).join(', '));

// 保存结果供外部 AI 读取
writeFileSync(RESULT, JSON.stringify({
  ocrLines: ocrR.lines,
  parsed,
  states,
  screenshot: SHOT,
  screenSize: await mumu.getScreenSize(),
  currentApp: await mumu.getCurrentApp()
}, null, 2), 'utf8');

console.log('\n结果已保存到 step_result.json');
console.log('屏幕:', (await mumu.getScreenSize()).width + 'x' + (await mumu.getScreenSize()).height);
console.log('当前App:', await mumu.getCurrentApp());
