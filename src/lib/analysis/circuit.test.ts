import { describe, it, expect } from 'vitest';
import {
	buildSampler,
	cullLiveCircuits,
	sampleFrom,
	buildSamplers,
	sampleCircuit,
	circuitFade,
	circuitProgress,
	latestLiveCircuit,
	liveCircuit,
	packetPosition,
	pulseRadius,
	spawnLiveCircuit
} from './circuit';
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
		const c = sampleCircuit(buildSamplers(relays), seq([0, 0, 0, 0.6, 0]));
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

describe('live circuit helpers', () => {
	const circuit = {
		guard: relay({ nickname: 'g', country: 'de', guardProb: 1 }),
		middle: relay({ nickname: 'm', country: 'nl', middleProb: 1 }),
		exit: relay({ nickname: 'e', country: 'us', exitProb: 1 })
	};

	it('builds a live circuit only when every hop has coordinates', () => {
		expect(liveCircuit(3, circuit, 1000, () => [1, 2])).toEqual({
			id: 3,
			c: circuit,
			born: 1000,
			coords: [
				[1, 2],
				[1, 2],
				[1, 2]
			]
		});
		expect(
			liveCircuit(3, circuit, 1000, (relay) => (relay.country === 'nl' ? null : [1, 2]))
		).toBeNull();
	});

	it('spawns, caps, culls, and returns the latest live circuit', () => {
		const spawned = spawnLiveCircuit([], buildSamplers(Object.values(circuit)), {
			max: 2,
			nextId: 0,
			now: 100,
			pointForRelay: () => [5, 6],
			rng: seq([0, 0, 0])
		});

		expect(spawned.spawned).toBe(true);
		expect(spawned.nextId).toBe(1);
		expect(spawned.circuits).toHaveLength(1);
		expect(latestLiveCircuit(spawned.circuits)?.id).toBe(0);

		const capped = spawnLiveCircuit(spawned.circuits, buildSamplers(Object.values(circuit)), {
			max: 1,
			nextId: spawned.nextId,
			now: 200,
			pointForRelay: () => [5, 6]
		});
		expect(capped).toEqual({ circuits: spawned.circuits, nextId: 1, spawned: false });

		expect(cullLiveCircuits(spawned.circuits, 5700, 5600)).toHaveLength(1);
		expect(cullLiveCircuits(spawned.circuits, 5701, 5600)).toHaveLength(0);
		expect(latestLiveCircuit([])).toBeNull();
	});
});

describe('circuit animation helpers', () => {
	it('normalizes progress into the animation lifetime', () => {
		expect(circuitProgress(1050, 1000, 1000)).toBe(0.05);
		expect(circuitProgress(500, 1000, 1000)).toBe(0);
		expect(circuitProgress(2500, 1000, 1000)).toBe(1);
	});

	it('fades in, holds, and fades out', () => {
		expect(circuitFade(0.05)).toBeCloseTo(0.5);
		expect(circuitFade(0.5)).toBe(1);
		expect(circuitFade(0.925)).toBeCloseTo(0.5);
	});

	it('interpolates packet position across two hops', () => {
		const points: [number, number][] = [
			[0, 0],
			[10, 0],
			[10, 10]
		];
		expect(packetPosition(points, 0.25)).toEqual([5, 0]);
		expect(packetPosition(points, 0.75)).toEqual([10, 5]);
	});

	it('returns null when a hop endpoint is missing', () => {
		expect(packetPosition([[0, 0], null, [10, 10]], 0.25)).toBeNull();
		expect(packetPosition([[0, 0], null, [10, 10]], 0.75)).toBeNull();
	});

	it('keeps pulse radius in the intended range', () => {
		expect(pulseRadius(0)).toBeCloseTo(2.6);
		expect(pulseRadius((Math.PI / 2) * 260)).toBeCloseTo(3.3);
	});
});
