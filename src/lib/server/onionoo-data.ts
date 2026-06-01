import type { Relay, RelaysResponse } from '$lib/types';

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
