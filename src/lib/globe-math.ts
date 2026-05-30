import { Vector3 } from 'three';

/**
 * Convert latitude/longitude (degrees) to a point on a sphere of the given
 * radius, in Three.js world coordinates.
 */
export function latLonToVector3(lat: number, lon: number, radius: number): Vector3 {
	const phi = ((90 - lat) * Math.PI) / 180;
	const theta = ((lon + 180) * Math.PI) / 180;
	return new Vector3(
		-radius * Math.sin(phi) * Math.cos(theta),
		radius * Math.cos(phi),
		radius * Math.sin(phi) * Math.sin(theta)
	);
}

/** Inverse of {@link latLonToVector3}: world position to [lat, lon] in degrees. */
export function vector3ToLatLon(v: Vector3): [number, number] {
	const r = v.length();
	const lat = 90 - (Math.acos(v.y / r) * 180) / Math.PI;
	let lon = (Math.atan2(v.z, -v.x) * 180) / Math.PI - 180;
	if (lon < -180) lon += 360;
	return [lat, lon];
}

/**
 * Find the country whose centroid is nearest to the given lat/lon, using
 * angular (great-circle) distance. Returns null if nothing is within
 * `maxDeg` degrees.
 */
export function nearestCountry(
	lat: number,
	lon: number,
	centroids: Record<string, [number, number]>,
	maxDeg = 18
): string | null {
	const target = latLonToVector3(lat, lon, 1);
	let best: string | null = null;
	let bestDot = Math.cos((maxDeg * Math.PI) / 180);
	for (const [code, [cLat, cLon]] of Object.entries(centroids)) {
		const dot = latLonToVector3(cLat, cLon, 1).dot(target);
		if (dot > bestDot) {
			bestDot = dot;
			best = code;
		}
	}
	return best;
}

/** Deterministic pseudo-random in [0, 1) from an integer seed. */
function hash(seed: number): number {
	const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
}

/**
 * A deterministic offset within a disc around a country centroid, returned as
 * [dLat, dLon] in degrees. Uses uniform-disc sampling (sqrt radius) for an even
 * spread, and scales the longitude component by 1/cos(lat) so clusters stay
 * roughly circular on the globe instead of stretching near the poles.
 */
export function discOffset(seed: number, spreadDeg: number, lat: number): [number, number] {
	const angle = hash(seed * 2.1) * Math.PI * 2;
	const r = Math.sqrt(hash(seed * 3.7)) * spreadDeg;
	const cos = Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
	return [r * Math.cos(angle), (r * Math.sin(angle)) / cos];
}
