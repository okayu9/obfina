import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { TrendsResponse } from '$lib/types';

/**
 * Aggregate time-series for the GROWTH view, proxied from Tor Metrics CSV
 * endpoints (network size, advertised vs. consumed bandwidth, per-country
 * users). Cached in KV for 30 min, per docs/architecture.md. Each section
 * degrades independently: a failed CSV yields an empty array plus `partial`.
 */

const CACHE_KEY = 'trends:v2';
const TTL_SECONDS = 60 * 30;

const NETWORKSIZE = 'https://metrics.torproject.org/networksize.csv';
const BANDWIDTH = 'https://metrics.torproject.org/bandwidth.csv';
const USERSTATS = 'https://metrics.torproject.org/userstats-relay-country.csv';

function parseCsv(text: string): { header: string[]; rows: string[][] } {
	const lines = text.split(/\r?\n/).filter((l) => l.length > 0 && !l.startsWith('#'));
	if (lines.length === 0) return { header: [], rows: [] };
	const header = lines[0].split(',').map((s) => s.trim().toLowerCase());
	const rows = lines.slice(1).map((l) => l.split(','));
	return { header, rows };
}

/** First header index whose name equals or contains one of `names`. */
function col(header: string[], ...names: string[]): number {
	for (const n of names) {
		const i = header.indexOf(n);
		if (i >= 0) return i;
	}
	for (let i = 0; i < header.length; i++) {
		for (const n of names) if (header[i].includes(n)) return i;
	}
	return -1;
}

const num = (s: string | undefined): number => {
	const v = Number((s ?? '').trim());
	return Number.isFinite(v) ? v : 0;
};

/** Keep the series short by sampling at a stride that caps it near `max`. */
function downsample<T>(rows: T[], max = 160): T[] {
	if (rows.length <= max) return rows;
	const stride = Math.ceil(rows.length / max);
	const out: T[] = [];
	for (let i = 0; i < rows.length; i += stride) out.push(rows[i]);
	if (out[out.length - 1] !== rows[rows.length - 1]) out.push(rows[rows.length - 1]);
	return out;
}

function ymd(d: Date): string {
	return d.toISOString().slice(0, 10);
}

async function fetchText(url: string): Promise<string | null> {
	try {
		const res = await fetch(url, {
			headers: { 'user-agent': 'obfina (https://github.com/obfina)' }
		});
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}

async function fetchNetworkSize(): Promise<TrendsResponse['networkSize']> {
	const text = await fetchText(NETWORKSIZE);
	if (!text) return [];
	const { header, rows } = parseCsv(text);
	const di = col(header, 'date');
	const ri = col(header, 'relays', 'relay');
	if (di < 0 || ri < 0) return [];
	const out = rows
		.filter((r) => r[di] && r[ri] !== undefined && r[ri] !== '')
		.map((r) => ({ date: r[di].trim(), relays: Math.round(num(r[ri])) }));
	return downsample(out);
}

async function fetchBandwidth(): Promise<TrendsResponse['bandwidth']> {
	const text = await fetchText(BANDWIDTH);
	if (!text) return [];
	const { header, rows } = parseCsv(text);
	const di = col(header, 'date');
	const ai = col(header, 'advbw', 'bwadv', 'advertised', 'adv');
	const ci = col(header, 'bwhist', 'bwread', 'consumed', 'hist');
	if (di < 0 || (ai < 0 && ci < 0)) return [];
	const out = rows
		.filter((r) => r[di])
		.map((r) => ({
			date: r[di].trim(),
			// CSV values are in Mbps; multiply by 125000 (= 1_000_000 / 8) to get bytes/sec.
			advertised: ai >= 0 ? num(r[ai]) * 125000 : 0,
			consumed: ci >= 0 ? num(r[ci]) * 125000 : 0
		}))
		// Require both so the most recent days (where consumed history hasn't
		// landed yet) don't cliff the consumed line to zero.
		.filter((p) => p.advertised > 0 && p.consumed > 0);
	return downsample(out);
}

async function fetchUsers(): Promise<TrendsResponse['users']> {
	// Bound the request: last ~2 years keeps the payload sane.
	const start = new Date();
	start.setFullYear(start.getFullYear() - 2);
	const url = `${USERSTATS}?start=${ymd(start)}`;
	const text = (await fetchText(url)) ?? (await fetchText(USERSTATS));
	if (!text) return { countries: [], series: [] };
	const { header, rows } = parseCsv(text);
	const di = col(header, 'date');
	const ci = col(header, 'country');
	const ui = col(header, 'users', 'user');
	if (di < 0 || ci < 0 || ui < 0) return { countries: [], series: [] };

	// Rank countries by total users over the window; keep the top few.
	const totals = new Map<string, number>();
	for (const r of rows) {
		const cc = (r[ci] ?? '').trim().toLowerCase();
		if (!cc || cc === '??') continue;
		totals.set(cc, (totals.get(cc) ?? 0) + num(r[ui]));
	}
	const countries = [...totals.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 8)
		.map(([cc]) => cc);
	const keep = new Set(countries);

	const byDate = new Map<string, Record<string, number>>();
	for (const r of rows) {
		const cc = (r[ci] ?? '').trim().toLowerCase();
		if (!keep.has(cc)) continue;
		const date = (r[di] ?? '').trim();
		if (!date) continue;
		let rec = byDate.get(date);
		if (!rec) {
			rec = {};
			byDate.set(date, rec);
		}
		rec[cc] = (rec[cc] ?? 0) + num(r[ui]);
	}
	const series = [...byDate.entries()]
		.sort((a, b) => (a[0] < b[0] ? -1 : 1))
		.map(([date, values]) => ({ date, values }));
	return { countries, series: downsample(series) };
}

export const GET: RequestHandler = async ({ platform, url }) => {
	const kv = platform?.env?.RELAY_CACHE;
	const noCache = url.searchParams.get('nocache') === '1';

	if (kv && !noCache) {
		const cached = await kv.get(CACHE_KEY);
		if (cached) return json(JSON.parse(cached) as TrendsResponse);
	}

	const [networkSize, bandwidth, users] = await Promise.all([
		fetchNetworkSize(),
		fetchBandwidth(),
		fetchUsers()
	]);

	const sections = [networkSize.length, bandwidth.length, users.series.length];
	const gotAny = sections.some((n) => n > 0);
	const gotAll = sections.every((n) => n > 0);

	if (!gotAny) {
		// Serve stale cache during a full outage if we have any.
		if (kv) {
			const stale = await kv.get(CACHE_KEY);
			if (stale) return json({ ...(JSON.parse(stale) as TrendsResponse), stale: true });
		}
		return json(
			{
				updatedAt: null,
				networkSize: [],
				bandwidth: [],
				users: { countries: [], series: [] },
				unavailable: true
			} satisfies TrendsResponse,
			{ status: 503 }
		);
	}

	const payload: TrendsResponse = {
		updatedAt: new Date().toISOString(),
		networkSize,
		bandwidth,
		users,
		...(gotAll ? {} : { partial: true })
	};

	if (kv) {
		platform?.context?.waitUntil?.(
			kv.put(CACHE_KEY, JSON.stringify(payload), { expirationTtl: TTL_SECONDS })
		);
	}
	return json(payload);
};
