import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Geographic distribution data for the circuit view.
 *
 * Returns:
 *   - `users`: country → estimated daily users (for User point weighting)
 *   - `exits`: country → summed exit probability weights (for Destination point weighting)
 *
 * Users data comes from Tor Metrics userstats-relay-country.csv (latest day).
 * Exit distribution is derived from Onionoo exit relay exit_probability per country.
 *
 * Both are cached in KV for 30 min.
 */

const CACHE_KEY = 'geodist:v1';
const TTL_SECONDS = 60 * 30;

const USERSTATS = 'https://metrics.torproject.org/userstats-relay-country.csv';
const ONIONOO_EXIT =
	'https://onionoo.torproject.org/details?running=true&fields=country,exit_probability';

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

/** Parse the userstats CSV and return a country→users map for the latest date. */
function parseUserStats(text: string): Record<string, number> {
	const lines = text.split(/\r?\n/).filter((l) => l.length > 0 && !l.startsWith('#'));
	if (lines.length < 2) return {};

	// header: date,country,users,lower,upper,frac
	const header = lines[0].split(',').map((s) => s.trim().toLowerCase());
	const di = header.indexOf('date');
	const ci = header.indexOf('country');
	const ui = header.indexOf('users');
	if (di < 0 || ci < 0 || ui < 0) return {};

	// Collect all rows, find the latest date
	const parsed: { date: string; cc: string; users: number }[] = [];
	for (const line of lines.slice(1)) {
		const cols = line.split(',');
		const date = (cols[di] ?? '').trim();
		const cc = (cols[ci] ?? '').trim().toLowerCase();
		const users = Number((cols[ui] ?? '').trim());
		if (!date || !cc || cc === '' || cc === '??' || !Number.isFinite(users) || users <= 0) continue;
		// Skip rows with no country code (aggregate total — empty string or single char)
		if (cc.length < 2) continue;
		parsed.push({ date, cc, users });
	}
	if (parsed.length === 0) return {};

	const latestDate = parsed.reduce((a, b) => (a > b.date ? a : b.date), '');
	const out: Record<string, number> = {};
	for (const { date, cc, users } of parsed) {
		if (date !== latestDate) continue;
		out[cc] = (out[cc] ?? 0) + users;
	}
	return out;
}

/** Fetch exit probability weights by country from Onionoo. */
async function fetchExitByCountry(): Promise<Record<string, number>> {
	try {
		const res = await fetch(ONIONOO_EXIT, {
			headers: { 'user-agent': 'obfina (https://github.com/obfina)' }
		});
		if (!res.ok) return {};
		const data = (await res.json()) as {
			relays?: { country?: string; exit_probability?: number }[];
		};
		const out: Record<string, number> = {};
		for (const r of data.relays ?? []) {
			const cc = (r.country ?? '').toLowerCase();
			const p = r.exit_probability ?? 0;
			if (!cc || !(p > 0)) continue;
			out[cc] = (out[cc] ?? 0) + p;
		}
		return out;
	} catch {
		return {};
	}
}

export interface GeodistResponse {
	/** country (alpha-2 lowercase) → estimated daily users */
	users: Record<string, number>;
	/** country (alpha-2 lowercase) → summed exit probability */
	exits: Record<string, number>;
	updatedAt: string | null;
	partial?: boolean;
	unavailable?: boolean;
	stale?: boolean;
}

export const GET: RequestHandler = async ({ platform, url }) => {
	const kv = platform?.env?.RELAY_CACHE;
	const noCache = url.searchParams.get('nocache') === '1';

	if (kv && !noCache) {
		const cached = await kv.get(CACHE_KEY);
		if (cached) return json(JSON.parse(cached) as GeodistResponse);
	}

	const [userText, exits] = await Promise.all([fetchText(USERSTATS), fetchExitByCountry()]);

	const users = userText ? parseUserStats(userText) : {};
	const hasUsers = Object.keys(users).length > 0;
	const hasExits = Object.keys(exits).length > 0;

	if (!hasUsers && !hasExits) {
		if (kv) {
			const stale = await kv.get(CACHE_KEY);
			if (stale) return json({ ...(JSON.parse(stale) as GeodistResponse), stale: true });
		}
		return json(
			{ users: {}, exits: {}, updatedAt: null, unavailable: true } satisfies GeodistResponse,
			{ status: 503 }
		);
	}

	const payload: GeodistResponse = {
		users,
		exits,
		updatedAt: new Date().toISOString(),
		...(!hasUsers || !hasExits ? { partial: true } : {})
	};

	if (kv) {
		platform?.context?.waitUntil?.(
			kv.put(CACHE_KEY, JSON.stringify(payload), { expirationTtl: TTL_SECONDS })
		);
	}
	return json(payload);
};
