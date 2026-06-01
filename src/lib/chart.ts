import type { LorenzPoint } from '$lib/analysis/concentration';

export interface ChartPadding {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

export const DEFAULT_CHART_PADDING: ChartPadding = {
	left: 4,
	right: 4,
	top: 4,
	bottom: 4
};

export function curvePath(points: LorenzPoint[]): string {
	return points
		.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x * 100} ${(1 - point.y) * 100}`)
		.join(' ');
}

export function areaPath(points: LorenzPoint[]): string {
	return `${curvePath(points)} L 100 100 L 0 100 Z`;
}

export function percent(value: number, digits = value > 0 && value < 0.1 ? 1 : 0): string {
	return `${(value * 100).toFixed(digits)}%`;
}

export function pointerFraction(
	event: PointerEvent,
	element: Pick<SVGSVGElement, 'getBoundingClientRect'>
): number {
	const rect = element.getBoundingClientRect();
	if (rect.width <= 0) return 0;
	return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
}

export function pointerMappedValue<T>(
	event: PointerEvent,
	element: Pick<SVGSVGElement, 'getBoundingClientRect'> | undefined,
	mapFraction: (fraction: number) => T
): T | null {
	return element ? mapFraction(pointerFraction(event, element)) : null;
}

export function chartXAt(
	index: number,
	count: number,
	width: number,
	padding: ChartPadding = DEFAULT_CHART_PADDING
): number {
	return count > 1
		? padding.left + (index / (count - 1)) * (width - padding.left - padding.right)
		: padding.left;
}

export function chartYAt(
	value: number,
	max: number,
	height: number,
	padding: ChartPadding = DEFAULT_CHART_PADDING
): number {
	return max > 0
		? padding.top + (1 - value / max) * (height - padding.top - padding.bottom)
		: height - padding.bottom;
}

export function xPercent(index: number, count: number): number {
	return count > 1 ? (index / (count - 1)) * 100 : 0;
}

export function hoverIndex(
	clientX: number,
	left: number,
	width: number,
	count: number
): number | null {
	if (count < 2 || width <= 0) return null;
	const fraction = Math.min(1, Math.max(0, (clientX - left) / width));
	return Math.round(fraction * (count - 1));
}

export function hoverIndexForElement(
	clientX: number,
	element: Pick<Element, 'getBoundingClientRect'>,
	count: number
): number | null {
	const rect = element.getBoundingClientRect();
	return hoverIndex(clientX, rect.left, rect.width, count);
}

export function seriesLinePath(
	values: number[],
	max: number,
	width: number,
	height: number,
	padding: ChartPadding = DEFAULT_CHART_PADDING
): string {
	if (values.length < 2 || max <= 0 || width <= 0 || height <= 0) return '';
	return values
		.map(
			(value, index) =>
				`${index === 0 ? 'M' : 'L'} ${chartXAt(index, values.length, width, padding)} ${chartYAt(value, max, height, padding)}`
		)
		.join(' ');
}

export function seriesAreaPath(
	top: number[],
	bottom: number[],
	max: number,
	width: number,
	height: number,
	padding: ChartPadding = DEFAULT_CHART_PADDING
): string {
	const count = Math.min(top.length, bottom.length);
	if (count < 2 || max <= 0 || width <= 0 || height <= 0) return '';
	const up = top
		.slice(0, count)
		.map(
			(value, index) =>
				`${index === 0 ? 'M' : 'L'} ${chartXAt(index, count, width, padding)} ${chartYAt(value, max, height, padding)}`
		);
	const down = bottom
		.slice(0, count)
		.map((_, index) => {
			const reversedIndex = count - 1 - index;
			return `L ${chartXAt(reversedIndex, count, width, padding)} ${chartYAt(bottom[reversedIndex], max, height, padding)}`;
		})
		.slice(1);
	return `${up.join(' ')} ${down.join(' ')} Z`;
}

export function compactNumber(value: number): string {
	if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
	if (value >= 1e3) return `${(value / 1e3).toFixed(value < 1e4 ? 1 : 0)}k`;
	return `${Math.round(value)}`;
}

export function cyanGreenRamp(value: number): string {
	const t = Math.min(1, Math.max(0, value));
	const cyan = [0, 212, 255];
	const green = [57, 255, 20];
	const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
	return `rgb(${mix(cyan[0], green[0])}, ${mix(cyan[1], green[1])}, ${mix(cyan[2], green[2])})`;
}

export const last = <T>(values: T[]): T | undefined => values[values.length - 1];
