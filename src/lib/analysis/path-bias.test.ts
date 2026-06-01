import { describe, expect, it } from 'vitest';
import {
	clampPathFraction,
	pathBiasMarker,
	pathBiasMarkerPoint,
	pathBiasModel,
	pathBiasWeights
} from '$lib/analysis/path-bias';
import type { Relay } from '$lib/types';

const relay = (overrides: Partial<Relay>): Relay => ({
	nickname: 'relay',
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
	...overrides
});

describe('path-bias analysis', () => {
	const relays = [
		relay({ nickname: 'a', consensusWeight: 70, guardProb: 0.2, exitProb: 0.1 }),
		relay({ nickname: 'b', consensusWeight: 20, guardProb: 0.5, exitProb: 0.3 }),
		relay({ nickname: 'c', consensusWeight: 10, guardProb: 0.3, exitProb: 0.6 }),
		relay({ nickname: 'd', consensusWeight: 0, guardProb: 0, exitProb: 0 })
	];

	it('extracts position weights from relays', () => {
		expect(pathBiasWeights(relays)).toEqual({
			consensus: [70, 20, 10, 0],
			guard: [0.2, 0.5, 0.3, 0],
			exit: [0.1, 0.3, 0.6, 0]
		});
	});

	it('builds the full path-bias chart model', () => {
		const model = pathBiasModel(relays);
		expect(model.activeRelays).toBe(3);
		expect(model.giniConsensus).toBeGreaterThan(0);
		expect(model.curves.consensus[0]).toEqual({ x: 0, y: 0 });
		expect(model.curves.consensus.at(-1)).toEqual({ x: 1, y: 1 });
		expect(model.curves.guard.at(-1)).toEqual({ x: 1, y: 1 });
		expect(model.curves.exit.at(-1)).toEqual({ x: 1, y: 1 });
	});

	it('clamps cursor fractions into the chart range', () => {
		expect(clampPathFraction(-1)).toBe(0.001);
		expect(clampPathFraction(0.5)).toBe(0.5);
		expect(clampPathFraction(2)).toBe(1);
	});

	it('computes marker share and active relay count', () => {
		const marker = pathBiasMarker([70, 20, 10, 0], 0.25);
		expect(marker).toEqual({
			fraction: 0.25,
			share: 0.7,
			count: 1
		});

		expect(pathBiasMarker([0, 0], -1)).toEqual({
			fraction: 0.001,
			share: 0,
			count: 1
		});
	});

	it('converts marker values to SVG coordinates', () => {
		const point = pathBiasMarkerPoint({ fraction: 0.25, share: 0.7 });
		expect(point.x).toBe(25);
		expect(point.y).toBeCloseTo(30);
	});
});
