import { describe, expect, it } from 'vitest';
import { countryHover, movedBeyondClickThreshold } from './map-interaction';

describe('countryHover', () => {
	it('builds hover state only for known countries', () => {
		expect(countryHover('de', 12, { x: 1, y: 2 })).toEqual({ code: 'de', count: 12, x: 1, y: 2 });
		expect(countryHover(null, 12, { x: 1, y: 2 })).toBeNull();
	});
});

describe('movedBeyondClickThreshold', () => {
	it('keeps small pointer drift as a click', () => {
		expect(movedBeyondClickThreshold({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(false);
	});

	it('treats drags and missing starts as non-clicks', () => {
		expect(movedBeyondClickThreshold({ x: 0, y: 0 }, { x: 7, y: 0 })).toBe(true);
		expect(movedBeyondClickThreshold(null, { x: 0, y: 0 })).toBe(true);
	});
});
