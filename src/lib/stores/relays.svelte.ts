import type { Relay, RelaysResponse } from '$lib/types';

/**
 * Shared relay dataset. Fetched once and consumed by every view that works off
 * live relay data (map, hosting, paths, circuits).
 */
export const relayStore = $state<{
	relays: Relay[];
	count: number;
	publishedAt: string | null;
	loading: boolean;
	failed: boolean;
	loaded: boolean;
}>({
	relays: [],
	count: 0,
	publishedAt: null,
	loading: true,
	failed: false,
	loaded: false
});

let inflight: Promise<void> | null = null;

export function loadRelays(): Promise<void> {
	if (relayStore.loaded) return Promise.resolve();
	if (inflight) return inflight;
	inflight = (async () => {
		try {
			const res = await fetch('/api/relays');
			const data = (await res.json()) as RelaysResponse;
			if (data.unavailable) {
				relayStore.failed = true;
			} else {
				relayStore.relays = data.relays;
				relayStore.count = data.count;
				relayStore.publishedAt = data.publishedAt;
				relayStore.loaded = true;
			}
		} catch {
			relayStore.failed = true;
		} finally {
			relayStore.loading = false;
		}
	})();
	return inflight;
}
