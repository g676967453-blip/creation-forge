const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const htmlFile = path.join(__dirname, '..', 'projects/GAME-002/策划文档/03-功能规格/2026-07-27-器灵选择/2026-07-27-器灵选择-HTML原型.html');
  const outFile = path.join(__dirname, '..', 'projects/GAME-002/策划文档/03-功能规格/2026-07-27-器灵选择/截图-器灵选择-HTML原型.png');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('file:///' + htmlFile.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: outFile });

  console.log('Screenshot saved:', outFile);
  await browser.close();
})();
