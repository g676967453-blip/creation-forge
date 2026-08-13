// 小红书帖子逐卡截图脚本
// 用法：node _screenshot.mjs
// 依赖：puppeteer-core（项目根已安装）+ 系统 Chrome 浏览器

import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'index.html');
const outDir = __dirname;

// ⚠️ 每期帖子修改这里
const CARD_NAMES = [
  '卡片1-封面',
  '卡片2-根因',
  '卡片3-翻转',
  '卡片4-实测',
  '卡片5-公式',
  '卡片6-CTA',
];

// ---

if (!fs.existsSync(htmlPath)) {
  console.error('❌ 当前目录未找到 index.html，请在帖子目录下执行此脚本');
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 1600 });

await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);

const cards = await page.$$('.card');
console.log(`📸 找到 ${cards.length} 张卡片，开始截图...\n`);

for (let i = 0; i < cards.length; i++) {
  const name = CARD_NAMES[i] || `卡片${i + 1}`;
  const outPath = path.join(outDir, `${name}.png`);
  await cards[i].screenshot({ path: outPath, type: 'png' });
  const size = fs.statSync(outPath).size;
  console.log(`✅ ${name}.png  (${(size / 1024).toFixed(0)} KB)`);
}

await browser.close();
console.log(`\n🎉 全部 ${cards.length} 张卡片截图完成`);
