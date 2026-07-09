import { chromium } from 'playwright';

const baseUrl = 'http://localhost:5173';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log(`[console:${msg.type()}] ${msg.text()}`));

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    const body = await page.locator('body').textContent();
    console.log('BODY_START', body.slice(0, 1200));
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
