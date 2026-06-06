type RelayCache = NonNullable<NonNullable<App.Platform['env']>['RELAY_CACHE']>;

export interface JsonCache {
	kv?: RelayCache;
	waitUntil?: (promise: Promise<unknown>) => void;
}

interface CacheEnvelope<T> {
	payload: T;
	cachedAt: string;
	freshUntil: string;
	staleUntil: string;
}

export interface CacheReadOptions {
	allowStale?: boolean;
	now?: Date;
}

export interface CacheWriteOptions {
	staleTtlSeconds?: number;
	now?: Date;
}

export function jsonCache(platform: App.Platform | undefined): JsonCache {
	return {
		kv: platform?.env?.RELAY_CACHE,
		waitUntil: platform?.context?.waitUntil?.bind(platform.context)
	};
}

function isCacheEnvelope<T>(value: unknown): value is CacheEnvelope<T> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'payload' in value &&
		'freshUntil' in value &&
		'staleUntil' in value
	);
}

export async function getCachedJson<T>(
	cache: JsonCache,
	key: string,
	options: CacheReadOptions = {}
): Promise<T | null> {
	const cached = await cache.kv?.get(key);
	if (!cached) return null;
	try {
		const parsed = JSON.parse(cached) as unknown;
		if (!isCacheEnvelope<T>(parsed)) return parsed as T;

		const now = options.now ?? new Date();
		const readableUntil = options.allowStale ? parsed.staleUntil : parsed.freshUntil;
		return Date.parse(readableUntil) > now.getTime() ? parsed.payload : null;
	} catch (error: unknown) {
		console.warn(`Failed to parse cache key "${key}"`, error);
		return null;
	}
}

export function putCachedJson<T>(
	cache: JsonCache,
	key: string,
	payload: T,
	ttlSeconds: number,
	options: CacheWriteOptions = {}
): void {
	if (!cache.kv) return;
	const now = options.now ?? new Date();
	const staleTtlSeconds = options.staleTtlSeconds ?? ttlSeconds;
	const envelope: CacheEnvelope<T> = {
		payload,
		cachedAt: now.toISOString(),
		freshUntil: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
		staleUntil: new Date(now.getTime() + staleTtlSeconds * 1000).toISOString()
	};
	const write = cache.kv
		.put(key, JSON.stringify(envelope), { expirationTtl: staleTtlSeconds })
		.catch((error: unknown) => {
			console.warn(`Failed to write cache key "${key}"`, error);
		});
	if (cache.waitUntil) cache.waitUntil(write);
	else void write;
}
