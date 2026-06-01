import { describe, expect, it } from 'vitest';
import {
	hoverIndex,
	maxUserValue,
	seriesColorIndex,
	totalLatestUsers,
	userSeries,
	utilization
} from './trends';
import type { TrendsResponse } from '$lib/types';

const users: TrendsResponse['users'] = {
	countries: ['de', 'us'],
	series: [
		{ date: '2026-01-01', values: { de: 10, us: 20 } },
		{ date: '2026-01-02', values: { de: 15, us: 25 } },
		{ date: '2026-01-03', values: { de: 0, us: 30 } }
	]
};

describe('trends analysis helpers', () => {
	it('computes latest utilization from advertised and consumed series', () => {
		expect(utilization([100, 200], [50, 80])).toBe(0.4);
		expect(utilization([], [50])).toBe(0);
	});

	it('extracts country user series and latest total users', () => {
		expect(userSeries(users, 'de')).toEqual([10, 15, 0]);
		expect(userSeries(users, 'fr')).toEqual([0, 0, 0]);
		expect(totalLatestUsers(users)).toBe(30);
	});

	it('finds the max user value with a safe minimum', () => {
		expect(maxUserValue(users)).toBe(30);
		expect(maxUserValue({ countries: [], series: [] })).toBe(1);
	});

	it('maps pointer x positions to bounded hover indices', () => {
		expect(hoverIndex(50, 0, 100, 5)).toBe(2);
		expect(hoverIndex(-10, 0, 100, 5)).toBe(0);
		expect(hoverIndex(110, 0, 100, 5)).toBe(4);
		expect(hoverIndex(50, 0, 0, 5)).toBeNull();
		expect(hoverIndex(50, 0, 100, 1)).toBeNull();
	});

	it('normalizes color positions across a series count', () => {
		expect(seriesColorIndex(0, 1)).toBe(0);
		expect(seriesColorIndex(1, 3)).toBe(0.5);
	});
});
