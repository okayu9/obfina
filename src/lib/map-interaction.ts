export interface PointerPosition {
	x: number;
	y: number;
}

export interface CountryHover extends PointerPosition {
	code: string;
	count: number;
}

export function countryHover(
	code: string | null,
	count: number,
	position: PointerPosition
): CountryHover | null {
	return code ? { code, count, ...position } : null;
}

export function movedBeyondClickThreshold(
	start: PointerPosition | null,
	end: PointerPosition,
	threshold = 6
): boolean {
	if (!start) return true;
	return Math.hypot(end.x - start.x, end.y - start.y) > threshold;
}
