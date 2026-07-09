import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('dialog', async dialog => {
  console.log('dialog:', dialog.message());
  await dialog.dismiss();
});

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await page.getByPlaceholder('you@arrupecollege.edu').fill('admin@arrupecollege.edu');
await page.getByRole('button', { name: 'Forgot Password?' }).click();

await page.waitForTimeout(2000);

const message = page.locator('text=/reset|sent|error|unable/i');
const hasMessage = await message.first().isVisible().catch(() => false);

console.log('hasInlineMessage:', hasMessage);

await browser.close();

if (!hasMessage) {
  process.exit(1);
}
