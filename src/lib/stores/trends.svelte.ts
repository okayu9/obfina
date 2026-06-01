import type { TrendsResponse } from '$lib/types';
import { createLoadOnce } from './load-once';

/**
 * Cached trends dataset. Fetched once on first visit to the growth view;
 * subsequent visits reuse the cached data without hitting the network again.
 */
export const trendsStore = $state<{
	data: TrendsResponse | null;
	loading: boolean;
	failed: boolean;
	loaded: boolean;
}>({
	data: null,
	loading: true,
	failed: false,
	loaded: false
});

export const loadTrends = createLoadOnce(trendsStore, {
	fetchData: async () => {
		const res = await fetch('/api/trends');
		return (await res.json()) as TrendsResponse;
	},
	isUnavailable: (data) => !!data.unavailable,
	applyData: (data) => {
		trendsStore.data = data;
	}
});
