/**
 * Dev helper: load the running app, capture a screenshot, and report the relay
 * count, how many data countries rendered, and any console errors. Used to
 * visually verify map changes without a manual browser.
 *
 * Usage: pnpm tsx scripts/screenshot.ts [url] [outPath] [waitMs] [WxH]
 *   (the dev server must already be running, e.g. `pnpm dev`)
 *   The optional WxH argument sets the viewport, e.g. 390x844 for mobile.
 */
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';

const url: string = process.argv[2] ?? 'http://localhost:5173/';
const out: string = process.argv[3] ?? '/tmp/obfina-map.png';
const waitMs: number = Number(process.argv[4] ?? 6000);
const sizeArg: string | undefined = process.argv[5];
const [vw, vh] = sizeArg ? sizeArg.split('x').map(Number) : [1280, 800];

const browser: Browser = await chromium.launch({ args: ['--ignore-gpu-blocklist'] });
const page: Page = await browser.newPage({ viewport: { width: vw, height: vh } });

const errors: string[] = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(waitMs);

const hud = await page
	.locator('.hud .count')
	.textContent()
	.catch(() => null);
const markers = await page.locator('.data').count();

await page.screenshot({ path: out });
await browser.close();

console.log('HUD count:', hud);
console.log('data paths (incl. tile copies):', markers);
console.log('console errors:', errors.length ? JSON.stringify(errors, null, 2) : 'none');
console.log('screenshot:', out);
