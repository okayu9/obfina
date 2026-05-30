/**
 * Dev helper: load every view and report runtime/console errors plus a
 * per-view sanity selector. Verifies the multi-view app renders end to end.
 *
 * Usage: node scripts/smoke.mjs [baseUrl] [waitMs]
 *   (the dev server must already be running)
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5179/';
const waitMs = Number(process.argv[3] ?? 7000);

const views = [
	{ id: 'map', sel: '.hud .count' },
	{ id: 'hosting', sel: '.gbox .g' },
	{ id: 'paths', sel: '.readout .big' },
	{ id: 'growth', sel: '.panels, .status' },
	{ id: 'circuits', sel: '.map svg .land' }
];

const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

let failures = 0;
for (const v of views) {
	const errors = [];
	page.removeAllListeners('console');
	page.removeAllListeners('pageerror');
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

	const url = `${base}?view=${v.id}`;
	await page
		.goto(url, { waitUntil: 'networkidle' })
		.catch((e) => errors.push('GOTO: ' + e.message));
	await page.waitForTimeout(waitMs);

	let selOk;
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

await browser.close();
console.log(failures === 0 ? 'SMOKE_OK' : `SMOKE_FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
