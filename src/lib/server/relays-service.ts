import type { RelaysResponse, RelaySummaryResponse } from '$lib/types';
import {
	normalizeOnionooDetails,
	normalizeOnionooSummary,
	ONIONOO_DETAILS_URL,
	ONIONOO_SUMMARY_URL,
	type OnionooDetails
} from '$lib/server/onionoo-data';

export async function fetchRelays(fetcher: typeof fetch = fetch): Promise<RelaysResponse | null> {
	try {
		const res = await fetcher(ONIONOO_DETAILS_URL, {
			headers: { 'user-agent': 'obfina (https://github.com/obfina)' }
		});
		if (!res.ok) return null;
		return normalizeOnionooDetails((await res.json()) as OnionooDetails);
	} catch {
		return null;
	}
}

export const unavailableRelaysResponse = (): RelaysResponse => ({
	publishedAt: null,
	count: 0,
	relays: [],
	unavailable: true
});

export async function fetchRelaySummary(
	fetcher: typeof fetch = fetch
): Promise<RelaySummaryResponse | null> {
	try {
		const res = await fetcher(ONIONOO_SUMMARY_URL, {
			headers: { 'user-agent': 'obfina (https://github.com/obfina)' }
		});
		if (!res.ok) return null;
		return normalizeOnionooSummary((await res.json()) as OnionooDetails);
	} catch {
		return null;
	}
}

export const unavailableRelaySummaryResponse = (): RelaySummaryResponse => ({
	publishedAt: null,
	count: 0,
	totalBandwidth: 0,
	countries: [],
	unavailable: true
});
