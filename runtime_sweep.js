import { chromium } from 'playwright';

async function checkView(page) {
  const bodyText = await page.locator('body').innerText();
  return {
    title: await page.title(),
    url: page.url(),
    bodySnippet: bodyText.slice(0, 400),
    isBlank: bodyText.trim().length < 100,
    hasErrorText: /error|failed|unable|not found|invalid/i.test(bodyText),
    hasLoadingText: /loading|please wait|fetching|spinner|retry/i.test(bodyText),
  };
}

async function runUser(email, password, label) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  const responses = [];
  const requests = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.message, stack: err.stack }));
  page.on('response', res => {
    if (res.status() >= 400) responses.push({ url: res.url(), status: res.status(), statusText: res.statusText() });
  });
  page.on('requestfailed', req => requests.push({ url: req.url(), error: req.failure()?.errorText }));

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(6000);

  const loginState = await checkView(page);
  const logoutVisible = await page.locator('button:has-text("Logout"), button:has-text("Log out")').count();

  const navNodes = await page.locator('button.sidebar-link, a.sidebar-link, button, a').evaluateAll(nodes =>
    nodes.map((node: any) => ({ text: node.textContent?.trim() || '', disabled: node.disabled }))
  );
  const navLabels = Array.from(new Set(navNodes.map(item => item.text).filter(text => !!text && !/logout|sign out/i.test(text)))).filter(text => /dashboard|academic|financial|users|attendance|notices|settings|system support|download backup|backup|support/i.test(text));

  const pages = [];
  for (const label of navLabels) {
    const locator = page.locator(`button:has-text("${label}"), a:has-text("${label}")`).first();
    if (!await locator.count()) continue;
    await locator.click();
    await page.waitForTimeout(2500);
    const view = await checkView(page);
    pages.push({ label, ...view });
  }

  await browser.close();
  return { label, email, loginState, logoutVisible, navLabels, pages, logs, responses, requests };
}

(async () => {
  const admin = await runUser('admin@arrupecollege.edu', 'Admin@arrupecollege.edu123', 'Admin');
  const teacher = await runUser('teacher@arrupecollege.edu', 'Demo@1234', 'Teacher');
  console.log(JSON.stringify({ admin, teacher }, null, 2));
})();
