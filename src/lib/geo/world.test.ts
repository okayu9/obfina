import { describe, expect, it } from 'vitest';
import { geoPath } from 'd3-geo';
import {
	codeForId,
	constrainedMapPanY,
	countryFeatures,
	countryFeaturePaths,
	makeProjection,
	pathForCountryFeature,
	visibleMapYBounds,
	worldPixelWidth,
	wrappedRootTransform
} from './world';

describe('world geometry helpers', () => {
	it('maps numeric country ids to lowercase alpha-2 codes', () => {
		expect(codeForId(840)).toBe('us');
		expect(codeForId('276')).toBe('de');
		expect(codeForId()).toBeNull();
	});

	it('builds a height-fitted projection with finite dimensions', () => {
		const projection = makeProjection(1000, 500);
		expect(worldPixelWidth(projection)).toBeGreaterThan(0);
		const [top, bottom] = visibleMapYBounds(projection);
		expect(Number.isFinite(top)).toBe(true);
		expect(Number.isFinite(bottom)).toBe(true);
		expect(bottom).toBeGreaterThan(top);
	});

	it('encapsulates country feature SVG path generation', () => {
		const projection = makeProjection(1000, 500);
		const paths = countryFeaturePaths(projection);
		expect(paths.length).toBeGreaterThan(100);
		expect(paths.some((path) => path.length > 0)).toBe(true);
		expect(pathForCountryFeature(geoPath(projection), countryFeatures[0])).toBe(paths[0]);
	});

	it('wraps horizontal map transforms into one world period', () => {
		expect(wrappedRootTransform({ x: 50, y: 10, k: 2 }, 100)).toBe('translate(-150 10) scale(2)');
		expect(wrappedRootTransform({ x: -250, y: 10, k: 2 }, 100)).toBe('translate(-50 10) scale(2)');
	});

	it('clamps vertical pan to the visible map bounds', () => {
		expect(constrainedMapPanY(10, 2, 500, 0, 300)).toBe(0);
		expect(constrainedMapPanY(-200, 2, 500, 0, 300)).toBe(-100);
		expect(constrainedMapPanY(20, 1, 500, -30, 600)).toBe(20);
		expect(constrainedMapPanY(100, 1, 500, -30, 600)).toBe(30);
	});
});
