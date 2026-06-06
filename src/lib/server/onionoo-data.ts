import type { Relay, RelayCountrySummary, RelaysResponse, RelaySummaryResponse } from '$lib/types';

export const ONIONOO_FIELDS = [
	'nickname',
	'as',
	'as_name',
	'observed_bandwidth',
	'consensus_weight',
	'guard_probability',
	'middle_probability',
	'exit_probability',
	'country',
	'flags',
	'first_seen'
] as const;

export const ONIONOO_DETAILS_URL = `https://onionoo.torproject.org/details?running=true&fields=${ONIONOO_FIELDS.join(',')}`;

export const ONIONOO_SUMMARY_FIELDS = [
	'country',
	'observed_bandwidth',
	'guard_probability',
	'middle_probability',
	'exit_probability',
	'flags'
] as const;

export const ONIONOO_SUMMARY_URL = `https://onionoo.torproject.org/details?running=true&fields=${ONIONOO_SUMMARY_FIELDS.join(',')}`;

export interface OnionooRelay {
	nickname?: string;
	as?: string;
	as_name?: string;
	observed_bandwidth?: number;
	consensus_weight?: number;
	guard_probability?: number;
	middle_probability?: number;
	exit_probability?: number;
	country?: string;
	flags?: string[];
	first_seen?: string;
}

export interface OnionooDetails {
	relays_published?: string;
	relays?: OnionooRelay[];
}

export function normalizeOnionooDetails(data: OnionooDetails): RelaysResponse {
	// Onionoo no longer returns lat/long; keep only relays with a country code,
	// which the client maps to a centroid for placement.
	const relays: Relay[] = (data.relays ?? [])
		.filter(
			(relay): relay is OnionooRelay & { country: string } => typeof relay.country === 'string'
		)
		.map((relay) => ({
			nickname: relay.nickname ?? 'unnamed',
			bandwidth: relay.observed_bandwidth ?? 0,
			consensusWeight: relay.consensus_weight ?? 0,
			guardProb: relay.guard_probability ?? 0,
			middleProb: relay.middle_probability ?? 0,
			exitProb: relay.exit_probability ?? 0,
			as: relay.as ?? null,
			asName: relay.as_name ?? null,
			country: relay.country,
			flags: relay.flags ?? [],
			firstSeen: relay.first_seen ?? null
		}));

	return {
		publishedAt: data.relays_published ?? null,
		count: relays.length,
		relays
	};
}

export function normalizeOnionooSummary(data: OnionooDetails): RelaySummaryResponse {
	const countries = new Map<string, RelayCountrySummary>();
	let totalBandwidth = 0;
	let count = 0;

	for (const relay of data.relays ?? []) {
		if (typeof relay.country !== 'string') continue;
		const bandwidth = relay.observed_bandwidth ?? 0;
		let stats = countries.get(relay.country);
		if (!stats) {
			stats = {
				country: relay.country,
				count: 0,
				bandwidth: 0,
				guard: 0,
				exit: 0,
				middle: 0
			};
			countries.set(relay.country, stats);
		}
		stats.count++;
		stats.bandwidth += bandwidth;
		totalBandwidth += bandwidth;
		count++;

		const flags = relay.flags ?? [];
		if (flags.includes('Exit')) stats.exit++;
		else if (flags.includes('Guard')) stats.guard++;
		else stats.middle++;
	}

	return {
		publishedAt: data.relays_published ?? null,
		count,
		totalBandwidth,
		countries: [...countries.values()]
	};
}
