import { describe, expect, it } from 'vitest';
import {
	areaPath,
	chartXAt,
	chartYAt,
	cyanGreenRamp,
	compactNumber,
	curvePath,
	hoverIndex,
	hoverIndexForElement,
	last,
	percent,
	pointerMappedValue,
	seriesAreaPath,
	seriesLinePath,
	xPercent
} from './chart';

describe('chart helpers', () => {
	const points = [
		{ x: 0, y: 0 },
		{ x: 0.5, y: 0.2 },
		{ x: 1, y: 1 }
	];

	it('converts normalized points into SVG path coordinates', () => {
		expect(curvePath(points)).toBe('M 0 100 L 50 80 L 100 0');
	});

	it('closes an area path to the bottom edge', () => {
		expect(areaPath(points)).toBe('M 0 100 L 50 80 L 100 0 L 100 100 L 0 100 Z');
	});

	it('formats fractions as percentages', () => {
		expect(percent(0.153)).toBe('15%');
		expect(percent(0.015)).toBe('1.5%');
		expect(percent(0.015, 0)).toBe('2%');
	});

	it('projects series into padded pixel-space paths', () => {
		expect(chartXAt(1, 3, 104)).toBe(52);
		expect(chartYAt(50, 100, 104)).toBe(52);
		expect(xPercent(1, 3)).toBe(50);
		expect(seriesLinePath([0, 50, 100], 100, 104, 104)).toBe('M 4 100 L 52 52 L 100 4');
	});

	it('builds filled series areas from top and bottom lines', () => {
		expect(seriesAreaPath([100, 80, 60], [20, 10, 0], 100, 104, 104)).toBe(
			'M 4 4 L 52 23.199999999999996 L 100 42.400000000000006 L 52 90.4 L 4 80.80000000000001 Z'
		);
	});

	it('maps pointer x positions to bounded hover indices', () => {
		expect(hoverIndex(50, 0, 100, 5)).toBe(2);
		expect(hoverIndex(-10, 0, 100, 5)).toBe(0);
		expect(hoverIndex(110, 0, 100, 5)).toBe(4);
		expect(hoverIndex(50, 0, 0, 5)).toBeNull();
		expect(hoverIndex(50, 0, 100, 1)).toBeNull();
		expect(
			hoverIndexForElement(
				40,
				{
					getBoundingClientRect: () => ({ left: 20, width: 40 }) as DOMRect
				},
				3
			)
		).toBe(1);
	});

	it('maps pointer fractions through a caller-provided transform', () => {
		const event = { clientX: 40 } as PointerEvent;
		const element = { getBoundingClientRect: () => ({ left: 20, width: 40 }) as DOMRect };
		expect(pointerMappedValue(event, element, (fraction) => fraction * 10)).toBe(5);
		expect(pointerMappedValue(event, undefined, (fraction) => fraction * 10)).toBeNull();
	});

	it('formats compact numbers and shared color ramps', () => {
		expect(compactNumber(950)).toBe('950');
		expect(compactNumber(1_500)).toBe('1.5k');
		expect(compactNumber(12_500)).toBe('13k');
		expect(compactNumber(1_250_000)).toBe('1.3M');
		expect(cyanGreenRamp(0)).toBe('rgb(0, 212, 255)');
		expect(cyanGreenRamp(1)).toBe('rgb(57, 255, 20)');
	});

	it('returns the last item', () => {
		expect(last([1, 2, 3])).toBe(3);
		expect(last([])).toBeUndefined();
	});
});
