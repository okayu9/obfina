type RelayCache = NonNullable<NonNullable<App.Platform['env']>['RELAY_CACHE']>;

export interface JsonCache {
	kv?: RelayCache;
	waitUntil?: (promise: Promise<unknown>) => void;
}

export function jsonCache(platform: App.Platform | undefined): JsonCache {
	return {
		kv: platform?.env?.RELAY_CACHE,
		waitUntil: platform?.context?.waitUntil?.bind(platform.context)
	};
}

export async function getCachedJson<T>(cache: JsonCache, key: string): Promise<T | null> {
	const cached = await cache.kv?.get(key);
	return cached ? (JSON.parse(cached) as T) : null;
}

export function putCachedJson<T>(
	cache: JsonCache,
	key: string,
	payload: T,
	ttlSeconds: number
): void {
	if (!cache.kv) return;
	const write = cache.kv.put(key, JSON.stringify(payload), { expirationTtl: ttlSeconds });
	cache.waitUntil?.(write);
}
