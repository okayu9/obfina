import { describe, expect, it } from 'vitest';
import {
	fetchRelays,
	fetchRelaySummary,
	unavailableRelaysResponse,
	unavailableRelaySummaryResponse
} from './relays-service';

const jsonResponse = (body: unknown, ok = true): Response =>
	new Response(JSON.stringify(body), { status: ok ? 200 : 500 });

describe('fetchRelays', () => {
	it('normalizes successful Onionoo responses', async () => {
		const fetcher = async () =>
			jsonResponse({
				relays_published: '2026-01-01 00:00:00',
				relays: [
					{
						nickname: 'r',
						country: 'de',
						observed_bandwidth: 10,
						consensus_weight: 0.2,
						flags: ['Guard'],
						as: 'AS1',
						as_name: 'One',
						first_seen: '2025-01-01'
					}
				]
			});

		const response = await fetchRelays(fetcher as typeof fetch);
		expect(response?.count).toBe(1);
		expect(response?.relays[0]).toMatchObject({ nickname: 'r', country: 'de', as: 'AS1' });
	});

	it('returns null for failed responses and thrown fetches', async () => {
		await expect(
			fetchRelays((async () => jsonResponse({}, false)) as typeof fetch)
		).resolves.toBeNull();
		await expect(
			fetchRelays((async () => {
				throw new Error('offline');
			}) as typeof fetch)
		).resolves.toBeNull();
	});
});

describe('fetchRelaySummary', () => {
	it('normalizes successful Onionoo summary responses', async () => {
		const fetcher = async () =>
			jsonResponse({
				relays_published: '2026-01-01 00:00:00',
				relays: [{ country: 'de', observed_bandwidth: 10, flags: ['Guard'] }]
			});

		const response = await fetchRelaySummary(fetcher as typeof fetch);
		expect(response).toMatchObject({
			count: 1,
			totalBandwidth: 10,
			countries: [{ country: 'de', count: 1, bandwidth: 10, guard: 1, exit: 0, middle: 0 }]
		});
	});

	it('returns null for failed summary responses and thrown fetches', async () => {
		await expect(
			fetchRelaySummary((async () => jsonResponse({}, false)) as typeof fetch)
		).resolves.toBeNull();
		await expect(
			fetchRelaySummary((async () => {
				throw new Error('offline');
			}) as typeof fetch)
		).resolves.toBeNull();
	});
});

describe('unavailableRelaysResponse', () => {
	it('builds the degraded relay payload', () => {
		expect(unavailableRelaysResponse()).toEqual({
			publishedAt: null,
			count: 0,
			relays: [],
			unavailable: true
		});
	});
});

describe('unavailableRelaySummaryResponse', () => {
	it('builds the degraded summary payload', () => {
		expect(unavailableRelaySummaryResponse()).toEqual({
			publishedAt: null,
			count: 0,
			totalBandwidth: 0,
			countries: [],
			unavailable: true
		});
	});
});
