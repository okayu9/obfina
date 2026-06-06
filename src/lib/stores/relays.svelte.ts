import type { Relay, RelayCountrySummary, RelaysResponse, RelaySummaryResponse } from '$lib/types';
import { fetchJson } from '$lib/api-client';

/**
 * Shared relay dataset. Fetched once and consumed by every view that works off
 * live relay data (map, hosting, paths).
 */
export const relayStore = $state<{
	relays: Relay[];
	countries: RelayCountrySummary[];
	count: number;
	totalBandwidth: number;
	publishedAt: string | null;
	stale: boolean;
	loading: boolean;
	failed: boolean;
	error: string | null;
	loaded: boolean;
	detailsLoading: boolean;
	detailsFailed: boolean;
	detailsError: string | null;
	detailsStale: boolean;
	detailsLoaded: boolean;
}>({
	relays: [],
	countries: [],
	count: 0,
	totalBandwidth: 0,
	publishedAt: null,
	stale: false,
	loading: true,
	failed: false,
	error: null,
	loaded: false,
	detailsLoading: false,
	detailsFailed: false,
	detailsError: null,
	detailsStale: false,
	detailsLoaded: false
});

let summaryInflight: Promise<void> | null = null;
let detailsInflight: Promise<void> | null = null;

export function applyRelaySummary(data: RelaySummaryResponse): void {
	relayStore.countries = data.countries;
	relayStore.count = data.count;
	relayStore.totalBandwidth = data.totalBandwidth;
	relayStore.publishedAt = data.publishedAt;
	relayStore.stale = !!data.stale;
	relayStore.loaded = true;
}

export function applyRelayDetails(data: RelaysResponse): void {
	relayStore.relays = data.relays;
	relayStore.count = data.count;
	relayStore.publishedAt = data.publishedAt;
	relayStore.totalBandwidth = data.relays.reduce((sum, relay) => sum + relay.bandwidth, 0);
	relayStore.detailsStale = !!data.stale;
	relayStore.stale = !!data.stale;
	relayStore.detailsLoaded = true;
	if (!relayStore.loaded) {
		relayStore.countries = [];
		relayStore.loaded = true;
	}
}

export function loadRelaySummary(): Promise<void> {
	if (relayStore.loaded) return Promise.resolve();
	if (summaryInflight) return summaryInflight;

	relayStore.loading = true;
	relayStore.failed = false;
	relayStore.error = null;

	summaryInflight = (async () => {
		try {
			const data = await fetchJson<RelaySummaryResponse>('/api/relays?summary=1');
			if (data.unavailable) {
				relayStore.failed = true;
				relayStore.error = 'unavailable';
			} else {
				applyRelaySummary(data);
			}
		} catch (error: unknown) {
			relayStore.failed = true;
			relayStore.error = error instanceof Error ? error.message : 'Unknown relay summary error';
		} finally {
			relayStore.loading = false;
			summaryInflight = null;
		}
	})();

	return summaryInflight;
}

export function loadRelays(): Promise<void> {
	if (relayStore.detailsLoaded) return Promise.resolve();
	if (detailsInflight) return detailsInflight;

	relayStore.detailsLoading = true;
	relayStore.detailsFailed = false;
	relayStore.detailsError = null;

	detailsInflight = (async () => {
		try {
			const data = await fetchJson<RelaysResponse>('/api/relays');
			if (data.unavailable) {
				relayStore.detailsFailed = true;
				relayStore.detailsError = 'unavailable';
				if (!relayStore.loaded) relayStore.failed = true;
			} else {
				applyRelayDetails(data);
			}
		} catch (error: unknown) {
			relayStore.detailsFailed = true;
			relayStore.detailsError =
				error instanceof Error ? error.message : 'Unknown relay details error';
			if (!relayStore.loaded) relayStore.failed = true;
		} finally {
			relayStore.detailsLoading = false;
			detailsInflight = null;
		}
	})();

	return detailsInflight;
}
