import { describe, expect, it } from 'vitest';
import {
	columnIndex,
	downsample,
	numeric,
	parseBandwidthCsv,
	parseCsv,
	parseNetworkSizeCsv,
	parseUsersCsv,
	userStatsUrl,
	ymd
} from './trends-data';

describe('trends csv helpers', () => {
	it('parses headers, skips comments, and finds columns by exact or partial name', () => {
		const table = parseCsv('# comment\ndate, relays_extra\n2026-01-01,7000\n');
		expect(table.header).toEqual(['date', 'relays_extra']);
		expect(table.rows).toEqual([['2026-01-01', '7000']]);
		expect(columnIndex(table.header, 'relays')).toBe(1);
		expect(columnIndex(table.header, 'missing')).toBe(-1);
	});

	it('normalizes invalid numbers to zero', () => {
		expect(numeric(' 42 ')).toBe(42);
		expect(numeric('nope')).toBe(0);
		expect(numeric(undefined)).toBe(0);
	});

	it('downsamples while preserving the final point', () => {
		const rows = Array.from({ length: 10 }, (_, i) => i);
		expect(downsample(rows, 4)).toEqual([0, 3, 6, 9]);
	});

	it('parses network size rows', () => {
		const rows = parseNetworkSizeCsv('date,relays\n2026-01-01,7012.4\n2026-01-02,\n');
		expect(rows).toEqual([{ date: '2026-01-01', relays: 7012 }]);
	});

	it('parses bandwidth Mbps into bytes per second and drops incomplete pairs', () => {
		const rows = parseBandwidthCsv(
			'date,advbw,bwhist\n2026-01-01,10,5\n2026-01-02,12,0\n2026-01-03,0,4\n'
		);
		expect(rows).toEqual([{ date: '2026-01-01', advertised: 1_250_000, consumed: 625_000 }]);
	});

	it('parses top-country user series and aggregates duplicate rows per date', () => {
		const rows = parseUsersCsv(
			[
				'date,country,users',
				'2026-01-01,de,10',
				'2026-01-01,de,5',
				'2026-01-01,us,20',
				'2026-01-02,de,7',
				'2026-01-02,??,999',
				'2026-01-02,us,30'
			].join('\n')
		);
		expect(rows.countries).toEqual(['us', 'de']);
		expect(rows.series).toEqual([
			{ date: '2026-01-01', values: { de: 15, us: 20 } },
			{ date: '2026-01-02', values: { de: 7, us: 30 } }
		]);
	});

	it('formats metrics dates and bounded userstats URLs', () => {
		const date = new Date('2026-02-03T12:34:56.000Z');
		expect(ymd(date)).toBe('2026-02-03');
		expect(userStatsUrl(date)).toBe(
			'https://metrics.torproject.org/userstats-relay-country.csv?start=2026-02-03'
		);
	});
});
