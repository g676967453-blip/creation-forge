// 快速端到端测试：启动游戏 → 截图 → OCR → AI决策 → 执行
import { readFileSync } from 'fs';
import { join } from 'path';
import { MumuCtl } from './lib/mumuctl.mjs';
import { ocrImage, parseOcrText, detectUIState } from './lib/ocr.mjs';
import { GameAI } from './lib/ai.mjs';

const config = JSON.parse(readFileSync(join(import.meta.dirname, 'config.json'), 'utf8'));
const mumu = new MumuCtl(config.mumu);
const ai = new GameAI(config.game);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== 端到端测试 ===\n');

  // 1. 获取屏幕信息
  const screenSize = await mumu.getScreenSize();
  console.log(`屏幕: ${screenSize.width}x${screenSize.height}`);

  // 2. 启动游戏
  console.log(`\n启动游戏: ${config.game.package}`);
  const r = mumu.startApp(config.game.package, config.game.activity);
  console.log(`  结果: ${r.output?.trim() || 'ok'}`);
  await sleep(5000);

  // 3. 截图 + OCR
  console.log('\n截图 + OCR...');
  const shot = 'J:/ceshi/game-bot/quick_test.png';
  const ocrOut = 'J:/ceshi/game-bot/quick_test.txt';

  await mumu.screenshot(shot);
  const ocrR = await ocrImage(shot, ocrOut);

  if (ocrR.ok) {
    console.log(`OCR 行数: ${ocrR.lines.length}`);
    ocrR.lines.forEach(l => console.log(`  ${l}`));
  } else {
    console.log(`OCR 失败: ${ocrR.error}`);
    return;
  }

  // 4. AI 决策
  const parsed = parseOcrText(ocrR.lines);
  const states = detectUIState(ocrR.lines);

  console.log('\n--- AI 决策 ---');
  console.log('界面状态:', states.map(s => `${s.state}(${Math.round(s.confidence*100)}%)`).join(', '));
  console.log('解析数据:', JSON.stringify(parsed));

  const decision = ai.analyze(ocrR.lines, parsed, states);
  console.log('决策:', decision.reason);
  console.log('动作:', decision.action);
  console.log('上下文状态:', decision.context?.state);

  // 5. 转为 ADB 动作
  const action = ai.toAction(decision, screenSize);
  console.log('\n--- ADB 动作 ---');
  console.log(JSON.stringify(action, null, 2));

  // 6. 执行 (如果是 tap 才执行，ask_ai 不执行)
  if (action.type === 'tap') {
    console.log('\n执行点击...');
    const execR = await mumu.tap(action.x, action.y);
    console.log(`  结果: ${execR.output?.trim() || 'ok'}`);

    // 等响应后再截图看看效果
    await sleep(2000);
    await mumu.screenshot('J:/ceshi/game-bot/after_tap.png');
    console.log('已截图 after_tap.png');
  } else if (action.type === 'key') {
    console.log('\n执行按键...');
    const keyMap = { 'BACK': 4, 'HOME': 3 };
    await mumu.keyEvent(keyMap[action.key] || action.key);
  }

  console.log('\n=== 测试完成 ===');
}

main().catch(e => { console.error(e); process.exit(1); });
