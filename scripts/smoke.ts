/**
 * Dev helper: load every view and report runtime/console errors plus a
 * per-view sanity selector. Verifies the multi-view app renders end to end.
 *
 * Usage: pnpm test:smoke [baseUrl] [waitMs]
 *   (the dev server must already be running)
 */
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';

const base: string = process.argv[2] ?? 'http://localhost:5173/';
const waitMs: number = Number(process.argv[3] ?? 7000);

interface View {
	id: string;
	sel: string;
}

const views: View[] = [
	{ id: 'map', sel: '.hud .count' },
	{ id: 'hosting', sel: '.gbox .g' },
	{ id: 'paths', sel: '.readout .big' },
	{ id: 'growth', sel: '.panels, .status' }
];

const browser: Browser = await chromium.launch({ args: ['--ignore-gpu-blocklist'] });
const page: Page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

let failures = 0;

async function dismissIntro(page: Page): Promise<void> {
	const dialogButton = page.locator('button').filter({ hasText: /Start exploring|見てみる/ }).first();
	if (await dialogButton.isVisible().catch(() => false)) {
		await dialogButton.click();
	}
}

async function runInteractionChecks(page: Page): Promise<string[]> {
	const failures: string[] = [];

	await page.goto(`${base}?view=map`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(waitMs);
	await dismissIntro(page);
	const marker = page.locator('.data').first();
	await marker.click({ force: true });
	await page.waitForSelector('.panel .code', { timeout: 4000 }).catch(() => {
		failures.push('map panel did not open');
	});
	await page.keyboard.press('Escape');
	await page.waitForTimeout(300);
	if ((await page.locator('.panel').count()) !== 0) failures.push('map panel did not close on Esc');

	await page.goto(`${base}?view=hosting`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(waitMs);
	await dismissIntro(page);
	await page.locator('.bars button').first().click();
	await page.waitForSelector('.detail-panel', { timeout: 4000 }).catch(() => {
		failures.push('hosting detail panel did not open');
	});

	await page.goto(`${base}?view=paths`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(waitMs);
	await dismissIntro(page);
	const before = await page.locator('.readout .big').first().textContent();
	const chart = page.locator('svg[aria-label="relay concentration curve"]').first();
	const box = await chart.boundingBox();
	if (!box) {
		failures.push('path bias chart missing bounds');
	} else {
		await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
		await page.mouse.down();
		await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5);
		await page.mouse.up();
		await page.waitForTimeout(300);
		const after = await page.locator('.readout .big').first().textContent();
		if (before === after) failures.push('path bias drag did not update readout');
	}

	await page.setViewportSize({ width: 390, height: 760 });
	await page.goto(`${base}?view=map`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(waitMs);
	await dismissIntro(page);
	const menu = page.locator('button[aria-label="Menu"], button[aria-label="メニュー"]').first();
	await menu.click();
	await page.waitForSelector('#nav-drawer .item', { timeout: 4000 }).catch(() => {
		failures.push('mobile menu did not reveal nav items');
	});
	await page.setViewportSize({ width: 1280, height: 800 });

	return failures;
}

for (const v of views) {
	const errors: string[] = [];
	page.removeAllListeners('console');
	page.removeAllListeners('pageerror');
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

	const url = `${base}?view=${v.id}`;
	await page
		.goto(url, { waitUntil: 'networkidle' })
		.catch((e: Error) => errors.push('GOTO: ' + e.message));
	await page.waitForTimeout(waitMs);
	await dismissIntro(page);

	let selOk: boolean;
	try {
		await page.waitForSelector(v.sel, { timeout: 4000 });
		selOk = true;
	} catch {
		selOk = false;
	}
	const sampleText = await page
		.locator(v.sel)
		.first()
		.textContent()
		.catch(() => null);

	await page.screenshot({ path: `/tmp/obfina-${v.id}.png` });
	const ok = selOk && errors.length === 0;
	if (!ok) failures++;
	console.log(
		`[${ok ? 'OK ' : 'FAIL'}] ${v.id.padEnd(9)} sel=${selOk ? 'found' : 'MISSING'} ` +
			`text=${JSON.stringify((sampleText ?? '').trim().slice(0, 24))} ` +
			`errors=${errors.length ? JSON.stringify(errors) : 'none'}`
	);
}

const interactionFailures = await runInteractionChecks(page);
if (interactionFailures.length) failures += interactionFailures.length;
console.log(
	`[${interactionFailures.length === 0 ? 'OK ' : 'FAIL'}] interactions ` +
		`errors=${interactionFailures.length ? JSON.stringify(interactionFailures) : 'none'}`
);

await browser.close();
console.log(failures === 0 ? 'SMOKE_OK' : `SMOKE_FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
