import type { TrendsResponse } from '$lib/types';
import { fetchJson } from '$lib/api-client';
import { createLoadOnce } from './load-once';

/**
 * Cached trends dataset. Fetched once on first visit to the growth view;
 * subsequent visits reuse the cached data without hitting the network again.
 */
export const trendsStore = $state<{
	data: TrendsResponse | null;
	loading: boolean;
	failed: boolean;
	error: string | null;
	loaded: boolean;
}>({
	data: null,
	loading: true,
	failed: false,
	error: null,
	loaded: false
});

export const loadTrends = createLoadOnce(trendsStore, {
	fetchData: async () => {
		return fetchJson<TrendsResponse>('/api/trends');
	},
	isUnavailable: (data) => !!data.unavailable,
	applyData: (data) => {
		trendsStore.data = data;
	}
});
