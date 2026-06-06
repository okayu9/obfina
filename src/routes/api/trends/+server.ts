import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import type { TrendsResponse } from '$lib/types';
import { getCachedJson, jsonCache, putCachedJson } from '$lib/server/kv-cache';
import { fixtureTrendsResponse } from '$lib/server/fixture-data';
import { fetchTrendsSections, trendsAvailability } from '$lib/server/trends-service';

/**
 * Aggregate time-series for the GROWTH view, proxied from Tor Metrics CSV
 * endpoints (network size, advertised vs. consumed bandwidth, per-country
 * users). Cached in KV for 30 min, per docs/architecture.md. Each section
 * degrades independently: a failed CSV yields an empty array plus `partial`.
 */

const CACHE_KEY = 'trends:v2';
const TTL_SECONDS = 60 * 30;
const STALE_TTL_SECONDS = 60 * 60 * 24 * 3;

export const GET: RequestHandler = async ({ platform, url }) => {
	const cache = jsonCache(platform);
	const noCache = dev && url.searchParams.get('nocache') === '1';
	const fixtureData = env.OBFINA_FIXTURE_DATA === '1' || env.OBFINA_FIXTURE_DATA === 'true';

	if (fixtureData) {
		return json(fixtureTrendsResponse());
	}

	if (cache.kv && !noCache) {
		const cached = await getCachedJson<TrendsResponse>(cache, CACHE_KEY);
		if (cached) return json(cached);
	}

	const sections = await fetchTrendsSections();
	const { networkSize, bandwidth, users } = sections;
	const { gotAny, gotAll } = trendsAvailability(sections);

	if (!gotAny) {
		// Serve stale cache during a full outage if we have any.
		if (cache.kv) {
			const stale = await getCachedJson<TrendsResponse>(cache, CACHE_KEY, { allowStale: true });
			if (stale) return json({ ...stale, stale: true });
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

	putCachedJson(cache, CACHE_KEY, payload, TTL_SECONDS, { staleTtlSeconds: STALE_TTL_SECONDS });
	return json(payload);
};
