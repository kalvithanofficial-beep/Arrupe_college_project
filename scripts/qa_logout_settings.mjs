import { chromium } from 'playwright';

const baseUrl = 'http://localhost:5173';
const adminEmail = 'admin@arrupecollege.edu';
const adminPassword = 'Admin@arrupecollege.edu123';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  const requests = [];

  page.on('console', msg => logs.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('request', req => requests.push(`REQ ${req.method()} ${req.url()}`));
  page.on('response', res => requests.push(`RES ${res.status()} ${res.url()}`));

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').first().fill(adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(5000);
    console.log('urlAfterLogin', page.url());
    console.log('bodyAfterLogin', (await page.locator('body').textContent()).slice(0, 400));

    const dashboardVisible = await page.locator('text=Dashboard').first().isVisible().catch(() => false);
    console.log('dashboardVisible', dashboardVisible);

    const authKeysBeforeLogout = await page.evaluate(() => Object.keys(localStorage).filter(k => k.includes('sb-')));
    console.log('authKeysBeforeLogout', authKeysBeforeLogout);

    const logoutButton = page.getByRole('button', { name: /Logout/i }).first();
    await logoutButton.click();
    await page.waitForTimeout(4000);
    console.log('urlAfterLogout', page.url());
    console.log('bodyAfterLogout', (await page.locator('body').textContent()).slice(0, 400));
    const loginVisible = await page.locator('text=Welcome back').isVisible().catch(() => false);
    console.log('afterLogoutLoginVisible', loginVisible);

    const authKeysAfterLogout = await page.evaluate(() => Object.keys(localStorage).filter(k => k.includes('sb-')));
    console.log('authKeysAfterLogout', authKeysAfterLogout);

    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').first().fill(adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(5000);
    console.log('urlAfterRelogin', page.url());
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.waitForTimeout(2000);
    const settingsTitle = await page.locator('h1').filter({ hasText: 'Settings' }).first().textContent().catch(() => '');
    console.log('settingsTitleAfterRelogin', settingsTitle);

    const notificationsToggle = page.getByText('Grade Updates').locator('..').locator('button').last();
    const beforeToggleClass = await notificationsToggle.getAttribute('class');
    console.log('beforeToggleClass', beforeToggleClass);
    await notificationsToggle.click();
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.waitForTimeout(1000);
    const saveNotice = await page.locator('text=Settings saved successfully!').isVisible().catch(() => false);
    console.log('settingsSaveNoticeVisible', saveNotice);

    await logoutButton.click();
    await page.waitForTimeout(4000);
    console.log('urlAfterSecondLogout', page.url());
    const loginVisibleAgain = await page.locator('text=Welcome back').isVisible().catch(() => false);
    console.log('afterSecondLogoutLoginVisible', loginVisibleAgain);

    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').first().fill(adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(5000);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.waitForTimeout(2000);
    const settingsBody = (await page.locator('body').textContent()).slice(0, 600);
    console.log('settingsBodyAfterRelogin', settingsBody);
  } finally {
    console.log('--- CONSOLE LOGS ---');
    console.log(logs.join('\n'));
    console.log('--- REQUESTS/RESPONSES ---');
    console.log(requests.slice(0, 80).join('\n'));
    await browser.close();
  }
}

run().catch(err => {
  console.error('PLAYWRIGHT_ERROR', err);
  process.exit(1);
});
