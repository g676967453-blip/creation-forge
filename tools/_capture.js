const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const htmlFile = path.join(__dirname, '..', 'projects/GAME-002/策划文档/03-功能规格/2026-07-27-开场黑幕/2026-07-27-开场黑幕-HTML原型.html');
  const outDir = path.join(__dirname, '..', 'projects/GAME-002/策划文档/03-功能规格/2026-07-27-开场黑幕');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('file:///' + htmlFile.replace(/\/g, '/'), { waitUntil: 'networkidle0' });
  
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '截图-01-第一段文字.png') });
  
  await page.click('body');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '截图-02-第二段文字.png') });
  
  await page.click('body');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '截图-03-第三段文字.png') });
  
  await page.click('body');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '截图-04-第四段文字.png') });
  
  await page.click('body');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '截图-05-结束态.png') });
  
  console.log('5 screenshots saved');
  await browser.close();
})();
