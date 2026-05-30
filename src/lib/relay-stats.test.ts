import { describe, it, expect } from 'vitest';
import { aggregateByCountry, formatBandwidth, flagEmoji } from './relay-stats';
import type { Relay } from './types';

const relay = (country: string, bandwidth: number, flags: string[]): Relay => ({
	nickname: 'r',
	country,
	bandwidth,
	flags
});

describe('aggregateByCountry', () => {
	it('groups counts, bandwidth, and flag breakdown by country', () => {
		const relays = [
			relay('de', 100, ['Guard', 'Fast']),
			relay('de', 200, ['Exit']),
			relay('de', 50, ['Fast']),
			relay('us', 300, ['Guard', 'Exit']) // Exit takes precedence over Guard
		];
		const map = aggregateByCountry(relays);

		const de = map.get('de')!;
		expect(de.count).toBe(3);
		expect(de.bandwidth).toBe(350);
		expect(de.guard).toBe(1);
		expect(de.exit).toBe(1);
		expect(de.middle).toBe(1);

		const us = map.get('us')!;
		expect(us.count).toBe(1);
		expect(us.exit).toBe(1);
		expect(us.guard).toBe(0);
	});

	it('returns an empty map for no relays', () => {
		expect(aggregateByCountry([]).size).toBe(0);
	});
});

describe('formatBandwidth', () => {
	it('scales into human-readable units', () => {
		expect(formatBandwidth(500)).toBe('500 B/s');
		expect(formatBandwidth(2_000)).toBe('2.0 KB/s');
		expect(formatBandwidth(34_528_269)).toBe('35 MB/s');
		expect(formatBandwidth(5_000_000_000)).toBe('5.0 GB/s');
	});
});

describe('flagEmoji', () => {
	it('maps ISO codes to regional indicator pairs', () => {
		expect(flagEmoji('de')).toBe('🇩🇪');
		expect(flagEmoji('US')).toBe('🇺🇸');
	});

	it('falls back for invalid codes', () => {
		expect(flagEmoji('xyz')).toBe('🏴');
	});
});
