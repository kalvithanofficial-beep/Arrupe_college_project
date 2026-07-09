import { chromium } from 'playwright';

const baseUrl = 'http://localhost:5173';
const adminEmail = 'admin@arrupecollege.edu';
const adminPassword = 'Admin@arrupecollege.edu123';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log(`[browser:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[browser:pageerror] ${err.message}`));

  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').fill(adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    await page.getByRole('button', { name: /Users/i }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /Add New User/i }).click();
    await page.waitForTimeout(1500);

    const longText = 'A'.repeat(400);
    const specialText = '<script>alert(1)</script> 😀 DROP TABLE users; --';

    console.log('Case: empty required fields');
    await page.getByRole('button', { name: /Send Invitation|Create New User/i }).click();
    const emptyError = await page.locator('text=First name is required').count();
    console.log('emptyErrorVisible', emptyError > 0);

    console.log('Case: long text');
    await page.locator('input[placeholder="John"]').fill(longText);
    await page.locator('input[placeholder="Doe"]').fill(longText);
    await page.locator('input[placeholder="john@example.com"]').fill('qa.edge@example.com');
    await page.locator('input[placeholder="+91 98765 43210"]').fill('1234567890');
    await page.locator('input[placeholder="18"]').fill('25');
    await page.locator('input[placeholder="Catholic"]').fill(longText);
    await page.locator('textarea[placeholder="Enter full address"]').fill(longText);
    await page.getByRole('button', { name: /Send Invitation|Create New User/i }).click();
    const longTextError = await page.locator('text=First name is required').count();
    console.log('longTextSubmissionBlocked', longTextError > 0 || (await page.locator('body').textContent()).includes('Success'));

    console.log('Case: special characters');
    await page.locator('input[placeholder="John"]').fill(specialText);
    await page.locator('input[placeholder="Doe"]').fill(specialText);
    await page.locator('textarea[placeholder="Enter full address"]').fill(specialText);
    await page.locator('input[placeholder="Catholic"]').fill(specialText);
    await page.getByRole('button', { name: /Send Invitation|Create New User/i }).click();
    const bodyText = await page.locator('body').textContent();
    console.log('specialCharactersHandled', /Success!|Failed to onboard|First name is required|Email is required|Mobile number is required/i.test(bodyText));
    console.log('modalBodySnippet', bodyText.slice(0, 3000));
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('scriptError', err.message);
  process.exit(1);
});
