import { chromium } from 'playwright';

const browser = await chromium.launch({
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);

// Click a country with data and confirm a panel opens.
const marker = page.locator('.data').first();
await marker.click({ force: true });
await page.waitForTimeout(700);
let opened = (await page.locator('.panel').count()) > 0;

await page.waitForTimeout(500);
const code = await page
	.locator('.panel .code')
	.textContent()
	.catch(() => null);
const count = await page
	.locator('.panel .count')
	.textContent()
	.catch(() => null);
await page.screenshot({ path: '/tmp/shot-panel.png' });

// Escape should deselect and close the panel.
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
const closedAfterEsc = (await page.locator('.panel').count()) === 0;

await browser.close();

console.log('panel opened:', opened);
console.log('country:', code, '| relays:', count);
console.log('closed after Esc:', closedAfterEsc);
console.log('console errors:', errors.length ? JSON.stringify(errors) : 'none');
