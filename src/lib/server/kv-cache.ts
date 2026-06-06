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
	if (!cached) return null;
	try {
		return JSON.parse(cached) as T;
	} catch (error: unknown) {
		console.warn(`Failed to parse cache key "${key}"`, error);
		return null;
	}
}

export function putCachedJson<T>(
	cache: JsonCache,
	key: string,
	payload: T,
	ttlSeconds: number
): void {
	if (!cache.kv) return;
	const write = cache.kv
		.put(key, JSON.stringify(payload), { expirationTtl: ttlSeconds })
		.catch((error: unknown) => {
			console.warn(`Failed to write cache key "${key}"`, error);
		});
	if (cache.waitUntil) cache.waitUntil(write);
	else void write;
}
