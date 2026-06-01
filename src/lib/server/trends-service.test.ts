import { describe, expect, it } from 'vitest';
import { fetchText, fetchUsers, trendsAvailability } from './trends-service';

const response = (body: string, ok = true): Response =>
	new Response(body, { status: ok ? 200 : 500 });

describe('fetchText', () => {
	it('returns response text for successful requests', async () => {
		const fetcher = async () => response('ok');
		await expect(fetchText('https://example.test', fetcher as typeof fetch)).resolves.toBe('ok');
	});

	it('returns null for failed responses or thrown fetches', async () => {
		await expect(
			fetchText('https://example.test', (async () => response('', false)) as typeof fetch)
		).resolves.toBeNull();
		await expect(
			fetchText('https://example.test', (async () => {
				throw new Error('offline');
			}) as typeof fetch)
		).resolves.toBeNull();
	});
});

describe('fetchUsers', () => {
	it('falls back from bounded userstats URL to the default URL', async () => {
		const calls: string[] = [];
		const fetcher = (async (url: string) => {
			calls.push(url);
			return calls.length === 1
				? response('', false)
				: response('date,country,users\n2026-01-01,de,10\n');
		}) as typeof fetch;

		const users = await fetchUsers({ fetcher, now: new Date('2026-06-01T00:00:00Z') });
		expect(calls[0]).toContain('start=2024-06-01');
		expect(calls[1]).not.toContain('start=');
		expect(users.countries).toEqual(['de']);
	});
});

describe('trendsAvailability', () => {
	it('reports partial and total availability', () => {
		expect(
			trendsAvailability({
				networkSize: [{ date: '2026-01-01', relays: 1 }],
				bandwidth: [],
				users: { countries: [], series: [] }
			})
		).toEqual({ gotAny: true, gotAll: false });
		expect(
			trendsAvailability({
				networkSize: [],
				bandwidth: [],
				users: { countries: [], series: [] }
			})
		).toEqual({ gotAny: false, gotAll: false });
	});
});
