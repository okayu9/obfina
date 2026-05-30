import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Relay, RelaysResponse } from '$lib/types';

const ONIONOO_URL =
	'https://onionoo.torproject.org/details?running=true&fields=nickname,observed_bandwidth,country,flags';

const CACHE_KEY = 'relays:v1';
const TTL_SECONDS = 60 * 10; // 10 min, per docs/architecture.md caching strategy

interface OnionooRelay {
	nickname?: string;
	observed_bandwidth?: number;
	country?: string;
	flags?: string[];
}

interface OnionooDetails {
	relays_published?: string;
	relays?: OnionooRelay[];
}

function normalize(data: OnionooDetails): RelaysResponse {
	// Onionoo no longer returns lat/long; keep only relays with a country code,
	// which the client maps to a centroid for placement.
	const relays: Relay[] = (data.relays ?? [])
		.filter((r): r is OnionooRelay & { country: string } => typeof r.country === 'string')
		.map((r) => ({
			nickname: r.nickname ?? 'unnamed',
			bandwidth: r.observed_bandwidth ?? 0,
			country: r.country,
			flags: r.flags ?? []
		}));

	return {
		publishedAt: data.relays_published ?? null,
		count: relays.length,
		relays
	};
}

export const GET: RequestHandler = async ({ platform, url }) => {
	// KV is optional: present under `wrangler dev` / production, absent under plain `vite dev`.
	const kv = platform?.env?.RELAY_CACHE;
	const noCache = url.searchParams.get('nocache') === '1';

	if (kv && !noCache) {
		const cached = await kv.get(CACHE_KEY);
		if (cached) return json(JSON.parse(cached) as RelaysResponse);
	}

	try {
		const res = await fetch(ONIONOO_URL, {
			headers: { 'user-agent': 'obfina (https://github.com/obfina)' }
		});
		if (!res.ok) throw new Error(`Onionoo responded ${res.status}`);

		const payload = normalize((await res.json()) as OnionooDetails);

		if (kv) {
			// Background write so the response is not blocked on KV.
			platform?.context?.waitUntil?.(
				kv.put(CACHE_KEY, JSON.stringify(payload), { expirationTtl: TTL_SECONDS })
			);
		}
		return json(payload);
	} catch {
		// Upstream failure: serve stale cache if we have any, else a degraded response.
		if (kv) {
			const stale = await kv.get(CACHE_KEY);
			if (stale) {
				const parsed = JSON.parse(stale) as RelaysResponse;
				return json({ ...parsed, stale: true });
			}
		}
		return json({ publishedAt: null, count: 0, relays: [], unavailable: true } satisfies RelaysResponse, {
			status: 503
		});
	}
};
