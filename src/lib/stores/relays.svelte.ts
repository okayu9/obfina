import type { Relay, RelaysResponse } from '$lib/types';
import { createLoadOnce } from './load-once';

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

export const loadRelays = createLoadOnce(relayStore, {
	fetchData: async () => {
		const res = await fetch('/api/relays');
		return (await res.json()) as RelaysResponse;
	},
	isUnavailable: (data) => !!data.unavailable,
	applyData: (data) => {
		relayStore.relays = data.relays;
		relayStore.count = data.count;
		relayStore.publishedAt = data.publishedAt;
	}
});
