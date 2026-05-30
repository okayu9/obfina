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

// Click several points around the globe centre until a country panel opens.
const canvas = page.locator('canvas');
const box = await canvas.boundingBox();
const cx = box.x + box.width / 2;
const cy = box.y + box.height / 2;
const offsets = [
	[0, 0],
	[-120, -40],
	[120, -40],
	[-80, 80],
	[80, 80]
];
let opened = false;
for (const [dx, dy] of offsets) {
	await page.mouse.click(cx + dx, cy + dy);
	await page.waitForTimeout(700);
	if (await page.locator('.panel').count()) {
		opened = true;
		break;
	}
}

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
await browser.close();

console.log('panel opened:', opened);
console.log('country:', code, '| relays:', count);
console.log('console errors:', errors.length ? JSON.stringify(errors) : 'none');
