import { describe, expect, it } from 'vitest';
import { ApiFetchError, fetchJson } from './api-client';

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
	new Response(JSON.stringify(body), {
		...init,
		headers: {
			'content-type': 'application/json',
			...(init.headers ?? {})
		}
	});

describe('fetchJson', () => {
	it('returns parsed JSON for successful JSON responses', async () => {
		const fetcher = (async () => jsonResponse({ ok: true })) as typeof fetch;

		await expect(fetchJson<{ ok: boolean }>('/api/test', undefined, fetcher)).resolves.toEqual({
			ok: true
		});
	});

	it('throws with status for non-OK responses', async () => {
		const fetcher = (async () => jsonResponse({ error: 'no' }, { status: 503 })) as typeof fetch;

		await expect(fetchJson('/api/test', undefined, fetcher)).rejects.toMatchObject({
			name: 'ApiFetchError',
			status: 503
		});
	});

	it('throws for non-JSON responses', async () => {
		const fetcher = (async () =>
			new Response('<h1>error</h1>', {
				headers: { 'content-type': 'text/html' }
			})) as typeof fetch;

		await expect(fetchJson('/api/test', undefined, fetcher)).rejects.toBeInstanceOf(ApiFetchError);
	});
});
