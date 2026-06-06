export interface LoadOnceState {
	loading: boolean;
	failed: boolean;
	loaded: boolean;
	error?: string | null;
}

export interface LoadOnceOptions<TData> {
	fetchData: () => Promise<TData>;
	applyData: (data: TData) => void;
	isUnavailable?: (data: TData) => boolean;
	onError?: (error: unknown) => void;
}

export function createLoadOnce<TState extends LoadOnceState, TData>(
	store: TState,
	{ fetchData, applyData, isUnavailable = () => false, onError }: LoadOnceOptions<TData>
): () => Promise<void> {
	let inflight: Promise<void> | null = null;

	return function loadOnce(): Promise<void> {
		if (store.loaded) return Promise.resolve();
		if (inflight) return inflight;

		store.loading = true;
		store.failed = false;
		store.error = null;

		inflight = (async () => {
			try {
				const data = await fetchData();
				if (isUnavailable(data)) {
					store.failed = true;
					store.error = 'unavailable';
				} else {
					applyData(data);
					store.loaded = true;
				}
			} catch (error: unknown) {
				store.failed = true;
				store.error = error instanceof Error ? error.message : 'Unknown load error';
				onError?.(error);
			} finally {
				store.loading = false;
				inflight = null;
			}
		})();

		return inflight;
	};
}
