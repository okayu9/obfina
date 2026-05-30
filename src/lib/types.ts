/**
 * A relay normalized for client-side rendering.
 *
 * Note: Onionoo no longer exposes per-relay latitude/longitude (removed for
 * privacy). Geolocation is country-level only; the client maps `country` to a
 * country centroid for globe placement. See docs/data-sources.md.
 */
export interface Relay {
	/** Relay nickname. */
	nickname: string;
	/** Observed bandwidth in bytes/sec, used for node sizing/brightness. */
	bandwidth: number;
	/** ISO 3166-1 alpha-2 country code, lowercase. */
	country: string;
	/** Relay flags, e.g. ["Guard", "Exit"]. */
	flags: string[];
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
