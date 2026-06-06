import { describe, expect, it, vi } from 'vitest';
import { getCachedJson, type JsonCache } from './kv-cache';

const kvWithValue = (value: string): JsonCache => ({
	kv: {
		get: async () => value
	} as unknown as JsonCache['kv']
});

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
});
