import { describe, expect, it, vi } from 'vitest';
import { getCachedJson, putCachedJson, type JsonCache } from './kv-cache';

const kvWithValue = (value: string): JsonCache => ({
	kv: {
		get: async () => value
	} as unknown as JsonCache['kv']
});

const writableKv = () => {
	let value: string | null = null;
	let expirationTtl: number | undefined;
	const cache: JsonCache = {
		kv: {
			get: async () => value,
			put: async (_key: string, nextValue: string, options?: { expirationTtl?: number }) => {
				value = nextValue;
				expirationTtl = options?.expirationTtl;
			}
		} as unknown as JsonCache['kv']
	};
	return {
		cache,
		getStored: () => value,
		getExpirationTtl: () => expirationTtl
	};
};

describe('getCachedJson', () => {
	it('parses cached JSON values', async () => {
		await expect(getCachedJson<{ ok: boolean }>(kvWithValue('{"ok":true}'), 'cache:key')).resolves
			.toEqual({
				ok: true
			});
	});

	it('treats corrupt cached JSON as a cache miss', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		await expect(getCachedJson(kvWithValue('{broken'), 'cache:key')).resolves.toBeNull();
		expect(warn).toHaveBeenCalledWith(
			'Failed to parse cache key "cache:key"',
			expect.any(SyntaxError)
		);

		warn.mockRestore();
	});

	it('reads fresh envelope entries and hides stale entries by default', async () => {
		const { cache } = writableKv();
		const now = new Date('2026-06-01T00:00:00Z');

		putCachedJson(cache, 'cache:key', { ok: true }, 60, { staleTtlSeconds: 600, now });

		await expect(
			getCachedJson(cache, 'cache:key', { now: new Date('2026-06-01T00:00:30Z') })
		).resolves.toEqual({ ok: true });
		await expect(
			getCachedJson(cache, 'cache:key', { now: new Date('2026-06-01T00:02:00Z') })
		).resolves.toBeNull();
	});

	it('can read stale envelope entries when requested', async () => {
		const { cache, getExpirationTtl } = writableKv();
		const now = new Date('2026-06-01T00:00:00Z');

		putCachedJson(cache, 'cache:key', { ok: true }, 60, { staleTtlSeconds: 600, now });

		await expect(
			getCachedJson(cache, 'cache:key', {
				allowStale: true,
				now: new Date('2026-06-01T00:02:00Z')
			})
		).resolves.toEqual({ ok: true });
		await expect(
			getCachedJson(cache, 'cache:key', {
				allowStale: true,
				now: new Date('2026-06-01T00:11:00Z')
			})
		).resolves.toBeNull();
		expect(getExpirationTtl()).toBe(600);
	});
});
