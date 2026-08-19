#!/usr/bin/env node
// 游戏识别工具 —— 逐个启动候选 App，截图+OCR，帮助识别「点兵成将」
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { MumuCtl } from './lib/mumuctl.mjs';
import { ocrImage, parseOcrText, detectUIState } from './lib/ocr.mjs';

const config = JSON.parse(readFileSync(join(import.meta.dirname, 'config.json'), 'utf8'));
const mumu = new MumuCtl(config.mumu);

const outDir = join(import.meta.dirname, 'identify');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function identify() {
  console.log('=== 游戏识别工具 ===\n');

  // 确保 MuMu 在桌面
  await mumu.goHome();
  await sleep(1000);

  const results = [];

  for (const candidate of config.game.candidates) {
    console.log(`\n--- 测试: ${candidate.pkg} ---`);

    // 启动
    const startR = mumu.startApp(candidate.pkg, candidate.act);
    console.log(`启动: ${startR.output?.trim() || startR.error || 'ok'}`);
    await sleep(4000); // 等加载

    // 截图
    const shotPath = join(outDir, `${candidate.pkg.replace(/\./g, '_')}.png`);
    const ocrPath = join(outDir, `${candidate.pkg.replace(/\./g, '_')}.txt`);

    await mumu.screenshot(shotPath);
    console.log(`截图: ${shotPath}`);

    // OCR
    const ocrR = await ocrImage(shotPath, ocrPath);
    if (ocrR.ok) {
      console.log(`OCR (${ocrR.lines.length}行):`);
      ocrR.lines.slice(0, 8).forEach(l => console.log(`  ${l}`));
    }

    const states = ocrR.ok ? detectUIState(ocrR.lines) : [];
    const parsed = ocrR.ok ? parseOcrText(ocrR.lines) : {};

    results.push({
      pkg: candidate.pkg,
      ocrLines: ocrR.ok ? ocrR.lines : [],
      states,
      parsed,
      screenshot: shotPath
    });

    // 回到桌面
    await mumu.goHome();
    await sleep(1500);
  }

  // 汇总报告
  console.log('\n\n═══════════════════════════════════');
  console.log('  识别报告 —— 请找到「点兵成将」');
  console.log('═══════════════════════════════════\n');

  results.forEach((r, i) => {
    console.log(`[${i}] ${r.pkg}`);
    console.log(`    OCR: ${r.ocrLines.slice(0, 3).join(' | ') || '(无文字)'}`);
    console.log(`    状态: ${r.states.map(s => s.state).join(', ') || 'unknown'}`);
    console.log(`    截图: ${r.screenshot}`);
    console.log('');
  });

  // 保存报告
  writeFileSync(join(outDir, 'report.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log('报告已保存到 identify/report.json');

  return results;
}

identify().catch(e => { console.error(e); process.exit(1); });
