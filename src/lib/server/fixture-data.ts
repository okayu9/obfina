import type { Relay, RelaysResponse, RelaySummaryResponse, TrendsResponse } from '$lib/types';
import { aggregateByCountry, totalRelayBandwidth } from '$lib/relay-stats';

const publishedAt = '2026-01-01 00:00:00';

const relays: Relay[] = [
	{
		nickname: 'atlas-guard',
		bandwidth: 180_000_000,
		consensusWeight: 1800,
		guardProb: 0.23,
		middleProb: 0.07,
		exitProb: 0,
		as: 'AS64501',
		asName: 'Northern Transit',
		country: 'de',
		flags: ['Fast', 'Guard', 'Stable'],
		firstSeen: '2025-01-01 00:00:00'
	},
	{
		nickname: 'delta-exit',
		bandwidth: 165_000_000,
		consensusWeight: 1650,
		guardProb: 0.02,
		middleProb: 0.06,
		exitProb: 0.2,
		as: 'AS64502',
		asName: 'Harbor Networks',
		country: 'nl',
		flags: ['Exit', 'Fast', 'Stable'],
		firstSeen: '2025-02-01 00:00:00'
	},
	{
		nickname: 'cedar-middle',
		bandwidth: 120_000_000,
		consensusWeight: 1200,
		guardProb: 0,
		middleProb: 0.18,
		exitProb: 0,
		as: 'AS64503',
		asName: 'Cedar Hosting',
		country: 'us',
		flags: ['Fast', 'Stable'],
		firstSeen: '2025-03-01 00:00:00'
	},
	{
		nickname: 'kumo-exit',
		bandwidth: 98_000_000,
		consensusWeight: 980,
		guardProb: 0,
		middleProb: 0.03,
		exitProb: 0.12,
		as: 'AS64504',
		asName: 'Kumo Fiber',
		country: 'jp',
		flags: ['Exit', 'Fast'],
		firstSeen: '2025-04-01 00:00:00'
	},
	{
		nickname: 'maple-guard',
		bandwidth: 86_000_000,
		consensusWeight: 860,
		guardProb: 0.12,
		middleProb: 0.05,
		exitProb: 0,
		as: 'AS64505',
		asName: 'Maple Relay Co',
		country: 'ca',
		flags: ['Guard', 'Stable'],
		firstSeen: '2025-05-01 00:00:00'
	},
	{
		nickname: 'seine-exit',
		bandwidth: 75_000_000,
		consensusWeight: 750,
		guardProb: 0.01,
		middleProb: 0.04,
		exitProb: 0.09,
		as: 'AS64502',
		asName: 'Harbor Networks',
		country: 'fr',
		flags: ['Exit', 'Fast'],
		firstSeen: '2025-06-01 00:00:00'
	},
	{
		nickname: 'thames-middle',
		bandwidth: 70_000_000,
		consensusWeight: 700,
		guardProb: 0,
		middleProb: 0.1,
		exitProb: 0,
		as: 'AS64506',
		asName: 'Thames Compute',
		country: 'gb',
		flags: ['Fast'],
		firstSeen: '2025-07-01 00:00:00'
	},
	{
		nickname: 'rhein-guard',
		bandwidth: 64_000_000,
		consensusWeight: 640,
		guardProb: 0.1,
		middleProb: 0.02,
		exitProb: 0,
		as: 'AS64501',
		asName: 'Northern Transit',
		country: 'de',
		flags: ['Guard', 'Fast'],
		firstSeen: '2025-08-01 00:00:00'
	},
	{
		nickname: 'pacific-middle',
		bandwidth: 52_000_000,
		consensusWeight: 520,
		guardProb: 0,
		middleProb: 0.08,
		exitProb: 0,
		as: 'AS64503',
		asName: 'Cedar Hosting',
		country: 'us',
		flags: ['Stable'],
		firstSeen: '2025-09-01 00:00:00'
	},
	{
		nickname: 'fjord-exit',
		bandwidth: 44_000_000,
		consensusWeight: 440,
		guardProb: 0,
		middleProb: 0.02,
		exitProb: 0.06,
		as: 'AS64507',
		asName: 'Fjord Systems',
		country: 'no',
		flags: ['Exit'],
		firstSeen: '2025-10-01 00:00:00'
	}
];

const countrySummaries = [...aggregateByCountry(relays).values()]
	.map((stats) => ({
		country: stats.country,
		count: stats.count,
		bandwidth: stats.bandwidth,
		guard: stats.guard,
		exit: stats.exit,
		middle: stats.middle
	}))
	.sort((a, b) => b.count - a.count || b.bandwidth - a.bandwidth);

export const fixtureRelaySummaryResponse = (): RelaySummaryResponse => ({
	publishedAt,
	count: relays.length,
	totalBandwidth: totalRelayBandwidth(relays),
	countries: countrySummaries
});

export const fixtureRelaysResponse = (): RelaysResponse => ({
	publishedAt,
	count: relays.length,
	relays
});

export const fixtureTrendsResponse = (): TrendsResponse => ({
	updatedAt: '2026-01-01T00:00:00.000Z',
	networkSize: [
		{ date: '2025-10-01', relays: 9400 },
		{ date: '2025-11-01', relays: 9600 },
		{ date: '2025-12-01', relays: 9791 }
	],
	bandwidth: [
		{ date: '2025-10-01', advertised: 8_000_000_000, consumed: 4_300_000_000 },
		{ date: '2025-11-01', advertised: 8_400_000_000, consumed: 4_700_000_000 },
		{ date: '2025-12-01', advertised: 8_800_000_000, consumed: 5_000_000_000 }
	],
	users: {
		countries: ['us', 'de', 'fr'],
		series: [
			{ date: '2025-10-01', values: { us: 120_000, de: 90_000, fr: 70_000 } },
			{ date: '2025-11-01', values: { us: 130_000, de: 94_000, fr: 74_000 } },
			{ date: '2025-12-01', values: { us: 136_000, de: 98_000, fr: 79_000 } }
		]
	}
});
