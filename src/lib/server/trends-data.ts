import type { TrendsResponse } from '$lib/types';

export interface CsvTable {
	header: string[];
	rows: string[][];
}

export const METRICS_URLS = {
	networkSize: 'https://metrics.torproject.org/networksize.csv',
	bandwidth: 'https://metrics.torproject.org/bandwidth.csv',
	userStats: 'https://metrics.torproject.org/userstats-relay-country.csv'
} as const;

export function parseCsv(text: string): CsvTable {
	const lines = text.split(/\r?\n/).filter((line) => line.length > 0 && !line.startsWith('#'));
	if (lines.length === 0) return { header: [], rows: [] };
	const header = lines[0].split(',').map((value) => value.trim().toLowerCase());
	const rows = lines.slice(1).map((line) => line.split(','));
	return { header, rows };
}

/** First header index whose name equals or contains one of `names`. */
export function columnIndex(header: string[], ...names: string[]): number {
	for (const name of names) {
		const index = header.indexOf(name);
		if (index >= 0) return index;
	}
	for (let i = 0; i < header.length; i++) {
		for (const name of names) if (header[i].includes(name)) return i;
	}
	return -1;
}

export function numeric(value: string | undefined): number {
	const parsed = Number((value ?? '').trim());
	return Number.isFinite(parsed) ? parsed : 0;
}

/** Keep the series short by sampling at a stride that caps it near `max`. */
export function downsample<T>(rows: T[], max = 160): T[] {
	if (rows.length <= max) return rows;
	const stride = Math.ceil(rows.length / max);
	const out: T[] = [];
	for (let i = 0; i < rows.length; i += stride) out.push(rows[i]);
	if (out[out.length - 1] !== rows[rows.length - 1]) out.push(rows[rows.length - 1]);
	return out;
}

export function ymd(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function parseNetworkSizeCsv(text: string): TrendsResponse['networkSize'] {
	const { header, rows } = parseCsv(text);
	const dateIndex = columnIndex(header, 'date');
	const relayIndex = columnIndex(header, 'relays', 'relay');
	if (dateIndex < 0 || relayIndex < 0) return [];
	const out = rows
		.filter((row) => row[dateIndex] && row[relayIndex] !== undefined && row[relayIndex] !== '')
		.map((row) => ({ date: row[dateIndex].trim(), relays: Math.round(numeric(row[relayIndex])) }));
	return downsample(out);
}

export function parseBandwidthCsv(text: string): TrendsResponse['bandwidth'] {
	const { header, rows } = parseCsv(text);
	const dateIndex = columnIndex(header, 'date');
	const advertisedIndex = columnIndex(header, 'advbw', 'bwadv', 'advertised', 'adv');
	const consumedIndex = columnIndex(header, 'bwhist', 'bwread', 'consumed', 'hist');
	if (dateIndex < 0 || (advertisedIndex < 0 && consumedIndex < 0)) return [];
	const out = rows
		.filter((row) => row[dateIndex])
		.map((row) => ({
			date: row[dateIndex].trim(),
			// CSV values are in Mbps; multiply by 125000 (= 1_000_000 / 8) to get bytes/sec.
			advertised: advertisedIndex >= 0 ? numeric(row[advertisedIndex]) * 125000 : 0,
			consumed: consumedIndex >= 0 ? numeric(row[consumedIndex]) * 125000 : 0
		}))
		// Require both so the most recent days (where consumed history hasn't
		// landed yet) don't cliff the consumed line to zero.
		.filter((point) => point.advertised > 0 && point.consumed > 0);
	return downsample(out);
}

export function parseUsersCsv(text: string): TrendsResponse['users'] {
	const { header, rows } = parseCsv(text);
	const dateIndex = columnIndex(header, 'date');
	const countryIndex = columnIndex(header, 'country');
	const usersIndex = columnIndex(header, 'users', 'user');
	if (dateIndex < 0 || countryIndex < 0 || usersIndex < 0) return { countries: [], series: [] };

	// Rank countries by total users over the window; keep the top few.
	const totals = new Map<string, number>();
	for (const row of rows) {
		const country = (row[countryIndex] ?? '').trim().toLowerCase();
		if (!country || country === '??') continue;
		totals.set(country, (totals.get(country) ?? 0) + numeric(row[usersIndex]));
	}
	const countries = [...totals.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 8)
		.map(([country]) => country);
	const keep = new Set(countries);

	const byDate = new Map<string, Record<string, number>>();
	for (const row of rows) {
		const country = (row[countryIndex] ?? '').trim().toLowerCase();
		if (!keep.has(country)) continue;
		const date = (row[dateIndex] ?? '').trim();
		if (!date) continue;
		let record = byDate.get(date);
		if (!record) {
			record = {};
			byDate.set(date, record);
		}
		record[country] = (record[country] ?? 0) + numeric(row[usersIndex]);
	}
	const series = [...byDate.entries()]
		.sort((a, b) => (a[0] < b[0] ? -1 : 1))
		.map(([date, values]) => ({ date, values }));
	return { countries, series: downsample(series) };
}

export function userStatsUrl(start: Date): string {
	return `${METRICS_URLS.userStats}?start=${ymd(start)}`;
}
