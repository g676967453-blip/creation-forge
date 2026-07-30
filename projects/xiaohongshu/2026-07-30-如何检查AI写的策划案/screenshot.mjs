import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'index.html');
const outDir = __dirname;

const CARD_NAMES = [
  '卡片1-封面',
  '卡片2-根因',
  '卡片3-解法',
  '卡片4-流程',
  '卡片5-洞察',
  '卡片6-CTA',
];

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 1600 });

// Load HTML file
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });

// Wait for fonts to load
await page.evaluate(() => document.fonts.ready);

// Take screenshot of each card
const cards = await page.$$('.card');

for (let i = 0; i < cards.length; i++) {
  const name = CARD_NAMES[i] || `卡片${i + 1}`;
  const outPath = path.join(outDir, `${name}.png`);

  await cards[i].screenshot({ path: outPath, type: 'png' });

  const size = (await import('fs')).statSync(outPath).size;
  console.log(`✅ ${name}.png  (${(size / 1024).toFixed(0)} KB)`);
}

await browser.close();
console.log(`\n🎉 全部 6 张卡片截图完成 → ${outDir}`);
