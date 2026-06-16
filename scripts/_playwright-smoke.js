const { chromium } = require('playwright');
(async() => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  console.log(await page.title());
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
