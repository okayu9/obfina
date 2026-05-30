/**
 * Dev helper: load the running app, capture a screenshot, and report the relay
 * count, how many country markers rendered, and any console errors. Used to
 * visually verify map changes without a manual browser.
 *
 * Usage: node scripts/screenshot.mjs [url] [outPath] [waitMs]
 *   (the dev server must already be running, e.g. `pnpm dev`)
 */
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173/';
const out = process.argv[3] ?? '/tmp/obfina-map.png';
const waitMs = Number(process.argv[4] ?? 6000);

const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(waitMs);

const hud = await page
	.locator('.hud .count')
	.textContent()
	.catch(() => null);
const markers = await page.locator('.marker').count();

await page.screenshot({ path: out });
await browser.close();

console.log('HUD count:', hud);
console.log('markers:', markers);
console.log('console errors:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
console.log('screenshot:', out);
