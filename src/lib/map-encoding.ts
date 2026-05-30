import type { CountryStats } from './relay-stats';

/** Role-mix endpoints: guard-heavy (cyan) to exit-heavy (green). */
const GUARD_RGB = [0x00, 0xd4, 0xff] as const;
const EXIT_RGB = [0x39, 0xff, 0x14] as const;

/**
 * Color encodes the exit share of a country's relays: cyan when few relays can
 * act as exits, green when many can.
 */
export function roleColor(stats: CountryStats): string {
	const exitFraction = stats.count > 0 ? stats.exit / stats.count : 0;
	const mix = (a: number, b: number) => Math.round(a + (b - a) * exitFraction);
	const [r, g, b] = [
		mix(GUARD_RGB[0], EXIT_RGB[0]),
		mix(GUARD_RGB[1], EXIT_RGB[1]),
		mix(GUARD_RGB[2], EXIT_RGB[2])
	];
	return `rgb(${r}, ${g}, ${b})`;
}
