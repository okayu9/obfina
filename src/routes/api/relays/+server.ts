import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { RelaysResponse } from '$lib/types';
import { getCachedJson, jsonCache, putCachedJson } from '$lib/server/kv-cache';
import { fetchRelays, unavailableRelaysResponse } from '$lib/server/relays-service';

const CACHE_KEY = 'relays:v2';
const TTL_SECONDS = 60 * 10; // 10 min, per docs/architecture.md caching strategy

export const GET: RequestHandler = async ({ platform, url }) => {
	// KV is optional: present under `wrangler dev` / production, absent under plain `vite dev`.
	const cache = jsonCache(platform);
	const noCache = url.searchParams.get('nocache') === '1';

	if (cache.kv && !noCache) {
		const cached = await getCachedJson<RelaysResponse>(cache, CACHE_KEY);
		if (cached) return json(cached);
	}

	const payload = await fetchRelays();
	if (payload) {
		// Background write so the response is not blocked on KV.
		putCachedJson(cache, CACHE_KEY, payload, TTL_SECONDS);
		return json(payload);
	}

	// Upstream failure: serve stale cache if we have any, else a degraded response.
	if (cache.kv) {
		const stale = await getCachedJson<RelaysResponse>(cache, CACHE_KEY);
		if (stale) return json({ ...stale, stale: true });
	}
	return json(unavailableRelaysResponse(), { status: 503 });
};
