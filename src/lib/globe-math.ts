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
