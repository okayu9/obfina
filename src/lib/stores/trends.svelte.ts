import type { TrendsResponse } from '$lib/types';

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

let inflight: Promise<void> | null = null;

export function loadTrends(): Promise<void> {
	if (trendsStore.loaded) return Promise.resolve();
	if (inflight) return inflight;
	inflight = (async () => {
		try {
			const res = await fetch('/api/trends');
			const json = (await res.json()) as TrendsResponse;
			if (json.unavailable) {
				trendsStore.failed = true;
			} else {
				trendsStore.data = json;
				trendsStore.loaded = true;
			}
		} catch {
			trendsStore.failed = true;
		} finally {
			trendsStore.loading = false;
		}
	})();
	return inflight;
}
