import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import type { RelaysResponse, RelaySummaryResponse } from '$lib/types';
import { getCachedJson, jsonCache, putCachedJson } from '$lib/server/kv-cache';
import {
	fetchRelays,
	fetchRelaySummary,
	unavailableRelaysResponse,
	unavailableRelaySummaryResponse
} from '$lib/server/relays-service';

const CACHE_KEY = 'relays:v2';
const SUMMARY_CACHE_KEY = 'relays:summary:v1';
const TTL_SECONDS = 60 * 10; // 10 min, per docs/architecture.md caching strategy
const STALE_TTL_SECONDS = 60 * 60 * 6; // Onionoo can lag several hours; keep outage fallback around.

export const GET: RequestHandler = async ({ platform, url }) => {
	// KV is optional: present under `wrangler dev` / production, absent under plain `vite dev`.
	const cache = jsonCache(platform);
	const noCache = dev && url.searchParams.get('nocache') === '1';
	const summary = url.searchParams.get('summary') === '1';

	if (summary) {
		if (cache.kv && !noCache) {
			const cached = await getCachedJson<RelaySummaryResponse>(cache, SUMMARY_CACHE_KEY);
			if (cached) return json(cached);
		}

		const payload = await fetchRelaySummary();
		if (payload) {
			putCachedJson(cache, SUMMARY_CACHE_KEY, payload, TTL_SECONDS, {
				staleTtlSeconds: STALE_TTL_SECONDS
			});
			return json(payload);
		}

		if (cache.kv) {
			const stale = await getCachedJson<RelaySummaryResponse>(cache, SUMMARY_CACHE_KEY, {
				allowStale: true
			});
			if (stale) return json({ ...stale, stale: true });
		}
		return json(unavailableRelaySummaryResponse(), { status: 503 });
	}

	if (cache.kv && !noCache) {
		const cached = await getCachedJson<RelaysResponse>(cache, CACHE_KEY);
		if (cached) return json(cached);
	}

	const payload = await fetchRelays();
	if (payload) {
		// Background write so the response is not blocked on KV.
		putCachedJson(cache, CACHE_KEY, payload, TTL_SECONDS, {
			staleTtlSeconds: STALE_TTL_SECONDS
		});
		return json(payload);
	}

	// Upstream failure: serve stale cache if we have any, else a degraded response.
	if (cache.kv) {
		const stale = await getCachedJson<RelaysResponse>(cache, CACHE_KEY, { allowStale: true });
		if (stale) return json({ ...stale, stale: true });
	}
	return json(unavailableRelaysResponse(), { status: 503 });
};
