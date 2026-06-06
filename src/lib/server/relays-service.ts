import type { RelaysResponse, RelaySummaryResponse } from '$lib/types';
import {
	normalizeOnionooDetails,
	normalizeOnionooSummary,
	ONIONOO_DETAILS_URL,
	ONIONOO_SUMMARY_URL,
	type OnionooDetails
} from '$lib/server/onionoo-data';
import { fetchUpstream } from '$lib/server/upstream-fetch';

export async function fetchRelays(fetcher: typeof fetch = fetch): Promise<RelaysResponse | null> {
	const res = await fetchUpstream(ONIONOO_DETAILS_URL, { fetcher, label: 'Onionoo relay details' });
	if (!res) return null;
	try {
		return normalizeOnionooDetails((await res.json()) as OnionooDetails);
	} catch (error: unknown) {
		console.warn('Failed to parse Onionoo relay details', error);
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
	const res = await fetchUpstream(ONIONOO_SUMMARY_URL, { fetcher, label: 'Onionoo relay summary' });
	if (!res) return null;
	try {
		return normalizeOnionooSummary((await res.json()) as OnionooDetails);
	} catch (error: unknown) {
		console.warn('Failed to parse Onionoo relay summary', error);
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
