// Browser smoke test (dev only). Run: npm run smoke  (needs Playwright with Chromium installed)
// Optional: SHOT_DIR=/some/folder saves a screenshot of each screen.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');

const root = fileURLToPath(new URL('..', import.meta.url));
const port = 8765;
const server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: root, stdio: 'ignore' });
const shotDir = process.env.SHOT_DIR;

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try { await fetch(`http://localhost:${port}/`); return; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  throw new Error('server did not start');
}

const browser = await chromium.launch();
try {
  await waitForServer();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}/index.html`);
  const shot = async (name) => shotDir && page.screenshot({ path: `${shotDir}/${name}.png`, fullPage: true });

  // Autonomy: seed statuses
  const statusOf = (id) => page.locator('tr', { hasText: id }).locator('.badge').innerText();
  assert.equal(await statusOf('C-TK-3'), 'Critical');
  assert.equal(await statusOf('C-TK-1'), 'Attention');
  await shot('1-autonomy');

  // Equipment: validation keeps typed values
  await page.click('[data-tab="equipment"]');
  await page.fill('#tank-id', 'C-TK-5');
  await page.click('form[data-form="tank"] button[type="submit"]');
  assert.equal(await page.inputValue('#tank-id'), 'C-TK-5');
  assert.ok(await page.locator('form[data-form="tank"] .error').count() > 0);
  await shot('2-equipment');

  // Associations: A + C blocked on Well-2
  await page.click('[data-tab="associations"]');
  await page.selectOption('#well-pick', 'Well-2');
  await page.selectOption('#tank-pick', 'C-TK-1');
  assert.match(await page.locator('.notice.blocked').innerText(), /BR-05/);
  assert.equal(await page.locator('[data-action="link"]').isDisabled(), true);
  await shot('3-associations');

  // Consumption: Well-1 conflict from Figure 1
  await page.click('[data-tab="consumption"]');
  assert.match(await page.locator('tr', { hasText: 'Well-1' }).innerText(), /Conflict BR-05/);
  await shot('4-consumption');

  // Field Technician: no Equipment tab
  await page.selectOption('#profile-select', 'field');
  assert.equal(await page.locator('[data-tab="equipment"]').count(), 0);
  await page.selectOption('#profile-select', 'sales');

  // Typing a capital O in a field does not open the Oz panel
  await page.click('[data-tab="equipment"]');
  await page.click('#well-id');
  await page.keyboard.type('OO');
  assert.equal(await page.locator('#oz').isHidden(), true);

  // Oz: +7 days moves C-TK-1 from Attention to Critical; refill brings C-TK-3 back
  await page.click('[data-tab="autonomy"]');
  await page.keyboard.press('Shift+O');
  assert.equal(await page.locator('#oz').isVisible(), true);
  await page.click('[data-action="advance"][data-hours="168"]');
  assert.equal(await statusOf('C-TK-1'), 'Critical');
  await page.selectOption('#oz select[data-change="oz-tank"]', 'C-TK-3');
  await page.click('[data-action="refill"]');
  await page.click('[data-action="advance"][data-hours="1"]');
  assert.equal(await statusOf('C-TK-3'), 'OK');
  await shot('5-behind-the-curtain');

  await page.click('[data-tab="guide"]');
  await page.keyboard.press('Shift+O');
  await shot('6-guide');

  assert.deepEqual(errors, []);
  console.log('Smoke test passed');
} finally {
  await browser.close();
  server.kill();
}
