import isoCountries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import type { Relay, RelaySimulationEntry } from './types';

isoCountries.registerLocale(enLocale);

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

export type RelayRole = 'guard' | 'middle' | 'exit';

export interface CountryRoleBreakdown {
	key: RelayRole;
	count: number;
	share: number;
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

export function countryRoleBreakdown(
	stats: Pick<CountryStats, 'count' | RelayRole>
): CountryRoleBreakdown[] {
	const total = Math.max(stats.count, 1);
	return [
		{ key: 'guard', count: stats.guard, share: stats.guard / total },
		{ key: 'middle', count: stats.middle, share: stats.middle / total },
		{ key: 'exit', count: stats.exit, share: stats.exit / total }
	];
}

export function totalRelayBandwidth(relays: Pick<Relay, 'bandwidth'>[]): number {
	return relays.reduce((sum, relay) => sum + relay.bandwidth, 0);
}

export function simulationRelaysFromCountries(countries: CountryStats[]): RelaySimulationEntry[] {
	const entries: RelaySimulationEntry[] = [];
	for (const country of countries) {
		const totalRoles = Math.max(country.count, 1);
		const roleBandwidth = (roleCount: number) => country.bandwidth * (roleCount / totalRoles);
		if (country.guard > 0) {
			const bandwidth = roleBandwidth(country.guard);
			entries.push({
				bandwidth,
				guardProb: bandwidth,
				middleProb: 0,
				exitProb: 0,
				country: country.country,
				flags: ['Guard']
			});
		}
		if (country.middle > 0) {
			const bandwidth = roleBandwidth(country.middle);
			entries.push({
				bandwidth,
				guardProb: 0,
				middleProb: bandwidth,
				exitProb: 0,
				country: country.country,
				flags: []
			});
		}
		if (country.exit > 0) {
			const bandwidth = roleBandwidth(country.exit);
			entries.push({
				bandwidth,
				guardProb: 0,
				middleProb: 0,
				exitProb: bandwidth,
				country: country.country,
				flags: ['Exit']
			});
		}
	}
	return entries;
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

export function hasFlag(relay: Pick<Relay, 'flags'>, flag: string): boolean {
	return relay.flags.includes(flag);
}

export function isExitRelay(relay: Pick<Relay, 'exitProb' | 'flags'>): boolean {
	return relay.exitProb > 0 || relay.flags.includes('Exit');
}

export function isMiddleRelay(relay: Pick<Relay, 'flags'>): boolean {
	return !relay.flags.includes('Guard') && !relay.flags.includes('Exit');
}

export function bandwidthColor(bandwidth: number, maxBandwidth: number): string {
	const t = maxBandwidth > 0 ? bandwidth / maxBandwidth : 0;
	const r = Math.round(0x3a + t * (0x00 - 0x3a));
	const g = Math.round(0x52 + t * (0xd4 - 0x52));
	const b = Math.round(0x66 + t * (0xff - 0x66));
	return `rgb(${r},${g},${b})`;
}

/** Convert an ISO alpha-2 country code to its flag emoji. */
export function flagEmoji(code: string): string {
	if (code.length !== 2) return '🏴';
	const base = 0x1f1e6;
	const upper = code.toUpperCase();
	return String.fromCodePoint(base + (upper.charCodeAt(0) - 65), base + (upper.charCodeAt(1) - 65));
}

/** Full English country name for an ISO alpha-2 code (falls back to the code). */
export function countryName(code: string): string {
	return isoCountries.getName(code.toUpperCase(), 'en', { select: 'alias' }) ?? code.toUpperCase();
}
