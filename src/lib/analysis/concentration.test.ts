import { describe, it, expect } from 'vitest';
import {
	gini,
	lorenz,
	concentrationFromTop,
	topShare,
	hhi,
	groupBy,
	topBreakdown
} from './concentration';
import type { Relay } from '$lib/types';

const relay = (over: Partial<Relay>): Relay => ({
	nickname: 'r',
	bandwidth: 0,
	consensusWeight: 0,
	guardProb: 0,
	middleProb: 0,
	exitProb: 0,
	as: null,
	asName: null,
	country: 'xx',
	flags: [],
	firstSeen: null,
	...over
});

describe('gini', () => {
	it('is 0 for a perfectly even distribution', () => {
		expect(gini([5, 5, 5, 5])).toBe(0);
	});

	it('approaches (n-1)/n as one member dominates', () => {
		const g = gini([1, 1, 1, 1, 1, 1, 1, 1, 1, 1_000_000]);
		expect(g).toBeGreaterThan(0.85);
		expect(g).toBeLessThanOrEqual(1);
	});

	it('rises as inequality grows', () => {
		expect(gini([1, 2, 3, 4])).toBeLessThan(gini([1, 1, 1, 100]));
	});

	it('is 0 for empty or all-zero input', () => {
		expect(gini([])).toBe(0);
		expect(gini([0, 0, 0])).toBe(0);
	});
});

describe('lorenz', () => {
	it('runs from (0,0) to (1,1) and is monotonic', () => {
		const pts = lorenz([1, 2, 3, 4]);
		expect(pts[0]).toEqual({ x: 0, y: 0 });
		expect(pts[pts.length - 1].x).toBeCloseTo(1);
		expect(pts[pts.length - 1].y).toBeCloseTo(1);
		for (let i = 1; i < pts.length; i++) {
			expect(pts[i].x).toBeGreaterThanOrEqual(pts[i - 1].x);
			expect(pts[i].y).toBeGreaterThanOrEqual(pts[i - 1].y);
		}
	});

	it('lies on the diagonal for an even distribution', () => {
		const pts = lorenz([1, 1, 1, 1]);
		for (const p of pts) expect(p.y).toBeCloseTo(p.x);
	});
});

describe('concentrationFromTop & topShare', () => {
	it('bows above the diagonal (top members hold more than their headcount)', () => {
		const pts = concentrationFromTop([1, 1, 1, 7]);
		const mid = pts.find((p) => Math.abs(p.x - 0.25) < 1e-9);
		expect(mid?.y).toBeGreaterThan(0.25);
	});

	it('topShare returns the share held by the top fraction', () => {
		// top 1 of 4 (25%) holds 70 of 100
		expect(topShare([10, 10, 10, 70], 0.25)).toBeCloseTo(0.7);
	});

	it('topShare clamps to at least one member', () => {
		expect(topShare([10, 90], 0.0001)).toBeCloseTo(0.9);
	});
});

describe('hhi', () => {
	it('is 1 for a monopoly and 1/n for even shares', () => {
		expect(hhi([1])).toBeCloseTo(1);
		expect(hhi([1, 1, 1, 1])).toBeCloseTo(0.25);
	});
});

describe('groupBy & topBreakdown', () => {
	const relays = [
		relay({ as: 'AS1', asName: 'One', consensusWeight: 100 }),
		relay({ as: 'AS1', asName: 'One', consensusWeight: 50 }),
		relay({ as: 'AS2', asName: 'Two', consensusWeight: 30 }),
		relay({ as: null, consensusWeight: 999 }) // dropped: no key
	];

	it('aggregates weight and count per key, sorted desc, skipping null keys', () => {
		const groups = groupBy(
			relays,
			(r) => r.as,
			(r) => r.asName ?? '?',
			(r) => r.consensusWeight
		);
		expect(groups.map((g) => g.key)).toEqual(['AS1', 'AS2']);
		expect(groups[0]).toMatchObject({ weight: 150, count: 2, label: 'One' });
		expect(groups[1]).toMatchObject({ weight: 30, count: 1 });
	});

	it('topBreakdown splits top N from the rest', () => {
		const groups = groupBy(
			relays,
			(r) => r.as,
			(r) => r.asName ?? '?',
			(r) => r.consensusWeight
		);
		const b = topBreakdown(groups, 1);
		expect(b.total).toBe(180);
		expect(b.top).toHaveLength(1);
		expect(b.rest).toBe(30);
	});
});
