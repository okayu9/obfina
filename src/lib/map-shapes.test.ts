import { describe, expect, it } from 'vitest';
import { buildCountryMapShapes, countryShapeKey, maxCountryRelayCount } from './map-shapes';

describe('countryShapeKey', () => {
	it('prefers stable country codes when available', () => {
		expect(countryShapeKey('de', 'M0 0 L1 1')).toBe('de');
	});

	it('falls back to a path prefix for features without country codes', () => {
		expect(countryShapeKey(null, 'M123456789012345')).toBe('M12345678901');
	});
});

describe('maxCountryRelayCount', () => {
	it('keeps a non-zero floor for empty country maps', () => {
		expect(maxCountryRelayCount([])).toBe(1);
	});

	it('returns the largest country relay count', () => {
		expect(
			maxCountryRelayCount([
				{ country: 'de', count: 2, bandwidth: 0, guard: 1, exit: 1, middle: 0 },
				{ country: 'nl', count: 8, bandwidth: 0, guard: 4, exit: 2, middle: 2 }
			])
		).toBe(8);
	});
});

describe('buildCountryMapShapes', () => {
	it('combines feature geometry, country stats, color, and opacity', () => {
		const shapes = buildCountryMapShapes(
			[{ id: 276 }, { id: 528 }, { id: 'unknown' }],
			(feature) => `M${feature.id}`,
			new Map([['de', { country: 'de', count: 4, bandwidth: 0, guard: 1, exit: 3, middle: 0 }]]),
			(id) => (id === 276 ? 'de' : id === 528 ? 'nl' : null)
		);

		expect(shapes[0]).toMatchObject({
			code: 'de',
			key: 'de',
			d: 'M276',
			glow: 'rgb(43, 244, 79)'
		});
		expect(shapes[0].opacity).toBeGreaterThan(0);
		expect(shapes[1]).toMatchObject({ code: 'nl', key: 'nl', d: 'M528', stats: null });
		expect(shapes[1].opacity).toBe(0);
		expect(shapes[2].key).toBe('Munknown');
	});
});
