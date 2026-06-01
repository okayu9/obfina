export interface LoadOnceState {
	loading: boolean;
	failed: boolean;
	loaded: boolean;
}

export interface LoadOnceOptions<TData> {
	fetchData: () => Promise<TData>;
	applyData: (data: TData) => void;
	isUnavailable?: (data: TData) => boolean;
}

export function createLoadOnce<TState extends LoadOnceState, TData>(
	store: TState,
	{ fetchData, applyData, isUnavailable = () => false }: LoadOnceOptions<TData>
): () => Promise<void> {
	let inflight: Promise<void> | null = null;

	return function loadOnce(): Promise<void> {
		if (store.loaded) return Promise.resolve();
		if (inflight) return inflight;

		store.loading = true;
		store.failed = false;

		inflight = (async () => {
			try {
				const data = await fetchData();
				if (isUnavailable(data)) {
					store.failed = true;
				} else {
					applyData(data);
					store.loaded = true;
				}
			} catch {
				store.failed = true;
			} finally {
				store.loading = false;
				inflight = null;
			}
		})();

		return inflight;
	};
}
