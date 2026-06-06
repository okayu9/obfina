import type { Relay, RelayCountrySummary, RelaysResponse, RelaySummaryResponse } from '$lib/types';

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
	loading: boolean;
	failed: boolean;
	loaded: boolean;
	detailsLoading: boolean;
	detailsFailed: boolean;
	detailsLoaded: boolean;
}>({
	relays: [],
	countries: [],
	count: 0,
	totalBandwidth: 0,
	publishedAt: null,
	loading: true,
	failed: false,
	loaded: false,
	detailsLoading: false,
	detailsFailed: false,
	detailsLoaded: false
});

let summaryInflight: Promise<void> | null = null;
let detailsInflight: Promise<void> | null = null;

export function applyRelaySummary(data: RelaySummaryResponse): void {
	relayStore.countries = data.countries;
	relayStore.count = data.count;
	relayStore.totalBandwidth = data.totalBandwidth;
	relayStore.publishedAt = data.publishedAt;
	relayStore.loaded = true;
}

export function applyRelayDetails(data: RelaysResponse): void {
	relayStore.relays = data.relays;
	relayStore.count = data.count;
	relayStore.publishedAt = data.publishedAt;
	relayStore.totalBandwidth = data.relays.reduce((sum, relay) => sum + relay.bandwidth, 0);
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

	summaryInflight = (async () => {
		try {
			const res = await fetch('/api/relays?summary=1');
			const data = (await res.json()) as RelaySummaryResponse;
			if (data.unavailable) {
				relayStore.failed = true;
			} else {
				applyRelaySummary(data);
			}
		} catch {
			relayStore.failed = true;
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

	detailsInflight = (async () => {
		try {
			const res = await fetch('/api/relays');
			const data = (await res.json()) as RelaysResponse;
			if (data.unavailable) {
				relayStore.detailsFailed = true;
				if (!relayStore.loaded) relayStore.failed = true;
			} else {
				applyRelayDetails(data);
			}
		} catch {
			relayStore.detailsFailed = true;
			if (!relayStore.loaded) relayStore.failed = true;
		} finally {
			relayStore.detailsLoading = false;
			detailsInflight = null;
		}
	})();

	return detailsInflight;
}
