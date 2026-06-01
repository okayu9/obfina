import { describe, it, expect } from 'vitest';
import {
	aggregateByCountry,
	bandwidthColor,
	countryName,
	countryRoleBreakdown,
	formatBandwidth,
	flagEmoji,
	hasFlag,
	isExitRelay,
	isMiddleRelay,
	totalRelayBandwidth
} from './relay-stats';
import type { Relay } from './types';

const relay = (country: string, bandwidth: number, flags: string[]): Relay => ({
	nickname: 'r',
	country,
	bandwidth,
	flags,
	consensusWeight: 0,
	guardProb: 0,
	middleProb: 0,
	exitProb: 0,
	as: null,
	asName: null,
	firstSeen: null
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

describe('countryRoleBreakdown', () => {
	it('returns role counts and safe shares', () => {
		expect(
			countryRoleBreakdown({
				count: 4,
				guard: 1,
				middle: 2,
				exit: 1
			})
		).toEqual([
			{ key: 'guard', count: 1, share: 0.25 },
			{ key: 'middle', count: 2, share: 0.5 },
			{ key: 'exit', count: 1, share: 0.25 }
		]);

		expect(
			countryRoleBreakdown({
				count: 0,
				guard: 0,
				middle: 0,
				exit: 0
			}).map((role) => role.share)
		).toEqual([0, 0, 0]);
	});
});

describe('totalRelayBandwidth', () => {
	it('sums relay bandwidth', () => {
		expect(totalRelayBandwidth([{ bandwidth: 10 }, { bandwidth: 25 }])).toBe(35);
		expect(totalRelayBandwidth([])).toBe(0);
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

describe('relay helpers', () => {
	it('detects flags and relay roles', () => {
		const guard = relay('de', 100, ['Guard']);
		const exit = relay('de', 100, ['Exit']);
		const weightedExit = { ...relay('de', 100, []), exitProb: 0.2 };
		const middle = relay('de', 100, ['Fast']);

		expect(hasFlag(guard, 'Guard')).toBe(true);
		expect(isExitRelay(exit)).toBe(true);
		expect(isExitRelay(weightedExit)).toBe(true);
		expect(isMiddleRelay(middle)).toBe(true);
		expect(isMiddleRelay(guard)).toBe(false);
	});

	it('maps bandwidth to the shared cyan ramp', () => {
		expect(bandwidthColor(0, 100)).toBe('rgb(58,82,102)');
		expect(bandwidthColor(100, 100)).toBe('rgb(0,212,255)');
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

describe('countryName', () => {
	it('resolves ISO alpha-2 codes to English names', () => {
		expect(countryName('jp')).toBe('Japan');
		expect(countryName('de')).toBe('Germany');
		expect(countryName('US')).toMatch(/United States/);
	});

	it('falls back to the upper-cased code when unknown', () => {
		expect(countryName('zz')).toBe('ZZ');
	});
});
