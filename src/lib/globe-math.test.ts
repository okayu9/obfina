import { describe, it, expect } from 'vitest';
import { latLonToVector3, vector3ToLatLon, nearestCountry, discOffset } from './globe-math';

describe('latLonToVector3 / vector3ToLatLon', () => {
	it('round-trips representative coordinates', () => {
		const cases: [number, number][] = [
			[0, 0],
			[51, 9], // Germany
			[-29, 24], // South Africa
			[37, 127.5], // South Korea
			[-42, 174] // New Zealand
		];
		for (const [lat, lon] of cases) {
			const [lat2, lon2] = vector3ToLatLon(latLonToVector3(lat, lon, 1));
			expect(lat2).toBeCloseTo(lat, 4);
			expect(lon2).toBeCloseTo(lon, 4);
		}
	});

	it('places points on the sphere of the given radius', () => {
		const v = latLonToVector3(33, -84, 2.5);
		expect(v.length()).toBeCloseTo(2.5, 6);
	});
});

describe('nearestCountry', () => {
	const centroids: Record<string, [number, number]> = {
		de: [51, 9],
		us: [39.5, -98],
		jp: [36, 138]
	};

	it('returns the closest centroid', () => {
		expect(nearestCountry(50, 10, centroids)).toBe('de');
		expect(nearestCountry(40, -100, centroids)).toBe('us');
	});

	it('returns null when nothing is within range', () => {
		// Middle of the South Atlantic, far from all three.
		expect(nearestCountry(-40, -20, centroids)).toBeNull();
	});
});

describe('discOffset', () => {
	it('stays within the spread radius (with longitude scaling)', () => {
		const spread = 5;
		const lat = 60;
		for (let i = 1; i < 50; i++) {
			const [dLat, dLon] = discOffset(i, spread, lat);
			expect(Math.abs(dLat)).toBeLessThanOrEqual(spread + 1e-9);
			// dLon is scaled by 1/cos(lat); bound accordingly.
			const cos = Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
			expect(Math.abs(dLon)).toBeLessThanOrEqual(spread / cos + 1e-9);
		}
	});

	it('is deterministic for a given seed', () => {
		expect(discOffset(7, 5, 40)).toEqual(discOffset(7, 5, 40));
	});
});
