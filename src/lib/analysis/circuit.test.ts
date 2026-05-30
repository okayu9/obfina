import { describe, it, expect } from 'vitest';
import { buildSampler, sampleFrom, buildSamplers, sampleCircuit } from './circuit';
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

/** Deterministic rng cycling through given values in [0,1). */
function seq(values: number[]): () => number {
	let i = 0;
	return () => values[i++ % values.length];
}

describe('buildSampler / sampleFrom', () => {
	const relays = [
		relay({ nickname: 'a', bandwidth: 1 }),
		relay({ nickname: 'b', bandwidth: 0 }), // excluded (zero weight)
		relay({ nickname: 'c', bandwidth: 3 })
	];
	const s = buildSampler(relays, (r) => r.bandwidth);

	it('drops zero-weight items and builds a prefix sum', () => {
		expect(s.items.map((r) => r.nickname)).toEqual(['a', 'c']);
		expect(s.total).toBe(4);
		expect(s.cumulative).toEqual([1, 4]);
	});

	it('maps the rng draw onto the right item via cumulative weight', () => {
		// target = 0.1*4 = 0.4 < 1 -> 'a'
		expect(sampleFrom(s, seq([0.1]))?.nickname).toBe('a');
		// target = 0.5*4 = 2.0 -> falls in (1,4] -> 'c'
		expect(sampleFrom(s, seq([0.5]))?.nickname).toBe('c');
	});

	it('returns null for an empty sampler', () => {
		expect(sampleFrom(buildSampler([], (r) => r.bandwidth))).toBeNull();
	});
});

describe('sampleCircuit', () => {
	const relays = [
		relay({ nickname: 'g', guardProb: 1, middleProb: 0.1, exitProb: 0 }),
		relay({ nickname: 'm', guardProb: 0.1, middleProb: 1, exitProb: 0.1 }),
		relay({ nickname: 'e', guardProb: 0, middleProb: 0.1, exitProb: 1 })
	];

	it('returns three distinct relays for the three positions', () => {
		const c = sampleCircuit(buildSamplers(relays));
		expect(c).not.toBeNull();
		if (!c) return;
		const ids = new Set([c.guard, c.middle, c.exit]);
		expect(ids.size).toBe(3);
	});

	it('falls back to flags + bandwidth when probabilities are absent', () => {
		const flagged = [
			relay({ nickname: 'g', flags: ['Guard'], bandwidth: 10 }),
			relay({ nickname: 'm', bandwidth: 10 }),
			relay({ nickname: 'e', flags: ['Exit'], bandwidth: 10 })
		];
		const s = buildSamplers(flagged);
		expect(s.guard.items.map((r) => r.nickname)).toEqual(['g']);
		expect(s.exit.items.map((r) => r.nickname)).toEqual(['e']);
		expect(s.middle.items).toHaveLength(3);
	});

	it('returns null when no relays can fill a position', () => {
		expect(sampleCircuit(buildSamplers([]))).toBeNull();
	});
});
