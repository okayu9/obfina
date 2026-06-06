import { describe, expect, it } from 'vitest';
import {
	normalizeOnionooDetails,
	normalizeOnionooSummary,
	ONIONOO_DETAILS_URL,
	ONIONOO_FIELDS,
	ONIONOO_SUMMARY_URL,
	ONIONOO_SUMMARY_FIELDS
} from './onionoo-data';

describe('onionoo data helpers', () => {
	it('builds a details URL for the normalized fields', () => {
		for (const field of ONIONOO_FIELDS) {
			expect(ONIONOO_DETAILS_URL).toContain(field);
		}
		expect(ONIONOO_DETAILS_URL).toContain('running=true');
	});

	it('builds a summary URL for only the startup fields', () => {
		for (const field of ONIONOO_SUMMARY_FIELDS) {
			expect(ONIONOO_SUMMARY_URL).toContain(field);
		}
		expect(ONIONOO_SUMMARY_URL).toContain('running=true');
		expect(ONIONOO_SUMMARY_URL).not.toContain('nickname');
		expect(ONIONOO_SUMMARY_URL).not.toContain('as_name');
	});

	it('normalizes relay details and drops relays without country codes', () => {
		const response = normalizeOnionooDetails({
			relays_published: '2026-01-01T00:00:00Z',
			relays: [
				{
					nickname: 'alpha',
					as: 'AS1',
					as_name: 'Provider',
					observed_bandwidth: 123,
					consensus_weight: 456,
					guard_probability: 0.1,
					middle_probability: 0.2,
					exit_probability: 0.3,
					country: 'de',
					flags: ['Guard'],
					first_seen: '2025-01-01 00:00:00'
				},
				{ nickname: 'missing-country' }
			]
		});

		expect(response.publishedAt).toBe('2026-01-01T00:00:00Z');
		expect(response.count).toBe(1);
		expect(response.relays[0]).toEqual({
			nickname: 'alpha',
			as: 'AS1',
			asName: 'Provider',
			bandwidth: 123,
			consensusWeight: 456,
			guardProb: 0.1,
			middleProb: 0.2,
			exitProb: 0.3,
			country: 'de',
			flags: ['Guard'],
			firstSeen: '2025-01-01 00:00:00'
		});
	});

	it('fills missing optional relay fields with client-safe defaults', () => {
		const response = normalizeOnionooDetails({ relays: [{ country: 'us' }] });
		expect(response).toMatchObject({
			publishedAt: null,
			count: 1,
			relays: [
				{
					nickname: 'unnamed',
					bandwidth: 0,
					consensusWeight: 0,
					guardProb: 0,
					middleProb: 0,
					exitProb: 0,
					as: null,
					asName: null,
					country: 'us',
					flags: [],
					firstSeen: null
				}
			]
		});
	});

	it('normalizes country summaries for startup rendering', () => {
		const response = normalizeOnionooSummary({
			relays_published: '2026-01-01T00:00:00Z',
			relays: [
				{ country: 'de', observed_bandwidth: 10, flags: ['Guard'] },
				{ country: 'de', observed_bandwidth: 30, flags: ['Exit'] },
				{ country: 'us', observed_bandwidth: 20, flags: ['Fast'] },
				{ nickname: 'missing-country', observed_bandwidth: 999 }
			]
		});

		expect(response).toEqual({
			publishedAt: '2026-01-01T00:00:00Z',
			count: 3,
			totalBandwidth: 60,
			countries: [
				{ country: 'de', count: 2, bandwidth: 40, guard: 1, exit: 1, middle: 0 },
				{ country: 'us', count: 1, bandwidth: 20, guard: 0, exit: 0, middle: 1 }
			]
		});
	});
});
