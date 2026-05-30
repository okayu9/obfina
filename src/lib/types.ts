/**
 * A relay normalized for client-side rendering.
 *
 * Note: Onionoo no longer exposes per-relay latitude/longitude (removed for
 * privacy). Geolocation is country-level only; views map `country` to a country
 * centroid for placement. See docs/data-sources.md.
 */
export interface Relay {
	/** Relay nickname. */
	nickname: string;
	/** Observed bandwidth in bytes/sec — the relay's measured capacity. */
	bandwidth: number;
	/**
	 * Consensus weight (integer). The directory authorities' weight that drives
	 * path selection; the network picks relays roughly in proportion to this.
	 */
	consensusWeight: number;
	/** Probability this relay is chosen for the guard position (0..1). */
	guardProb: number;
	/** Probability this relay is chosen for the middle position (0..1). */
	middleProb: number;
	/** Probability this relay is chosen for the exit position (0..1). */
	exitProb: number;
	/** Autonomous System number, e.g. "AS24940", or null when unknown. */
	as: string | null;
	/** Autonomous System name (hosting provider), or null when unknown. */
	asName: string | null;
	/** ISO 3166-1 alpha-2 country code, lowercase. */
	country: string;
	/** Relay flags, e.g. ["Guard", "Exit"]. */
	flags: string[];
	/** Date the relay was first seen, "YYYY-MM-DD HH:MM:SS", or null. */
	firstSeen: string | null;
}

export interface RelaysResponse {
	/** ISO 8601 timestamp of the consensus this data is derived from. */
	publishedAt: string | null;
	/** Number of relays in the payload. */
	count: number;
	relays: Relay[];
	/** True when upstream was unreachable and no cached data exists. */
	unavailable?: boolean;
	/** True when served from cache past its TTL during an upstream outage. */
	stale?: boolean;
}

/** Aggregate time-series for the GROWTH view, proxied from Tor Metrics. */
export interface TrendsResponse {
	updatedAt: string | null;
	/** Running relays over time. */
	networkSize: { date: string; relays: number }[];
	/** Advertised (capacity) vs. consumed (actual) bandwidth, bytes/sec. */
	bandwidth: { date: string; advertised: number; consumed: number }[];
	/** Estimated daily users for the top countries. */
	users: {
		countries: string[];
		series: { date: string; values: Record<string, number> }[];
	};
	/** True when at least one section could not be fetched. */
	partial?: boolean;
	/** True when no section could be fetched at all. */
	unavailable?: boolean;
	stale?: boolean;
}
