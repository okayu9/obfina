import type { Relay } from './types';

export interface CountryStats {
	/** ISO 3166-1 alpha-2 country code, lowercase. */
	country: string;
	count: number;
	/** Total observed bandwidth in bytes/sec. */
	bandwidth: number;
	guard: number;
	exit: number;
	/** Relays that are neither Guard nor Exit. */
	middle: number;
}

/** Aggregate relays by country code. */
export function aggregateByCountry(relays: Relay[]): Map<string, CountryStats> {
	const map = new Map<string, CountryStats>();
	for (const r of relays) {
		let s = map.get(r.country);
		if (!s) {
			s = { country: r.country, count: 0, bandwidth: 0, guard: 0, exit: 0, middle: 0 };
			map.set(r.country, s);
		}
		s.count++;
		s.bandwidth += r.bandwidth;
		if (r.flags.includes('Exit')) s.exit++;
		else if (r.flags.includes('Guard')) s.guard++;
		else s.middle++;
	}
	return map;
}

/** Format bytes/sec into a compact human-readable string. */
export function formatBandwidth(bytesPerSec: number): string {
	const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
	let v = bytesPerSec;
	let i = 0;
	while (v >= 1000 && i < units.length - 1) {
		v /= 1000;
		i++;
	}
	return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Convert an ISO alpha-2 country code to its flag emoji. */
export function flagEmoji(code: string): string {
	if (code.length !== 2) return '🏴';
	const base = 0x1f1e6;
	const upper = code.toUpperCase();
	return String.fromCodePoint(base + (upper.charCodeAt(0) - 65), base + (upper.charCodeAt(1) - 65));
}
