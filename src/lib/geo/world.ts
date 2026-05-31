import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath, geoCentroid, geoContains, geoBounds } from 'd3-geo';
import isoCountries from 'i18n-iso-countries';
import worldData from 'world-atlas/countries-110m.json';

/**
 * Shared world geometry so every view places countries identically. The map
 * view (ValueByAlphaMap) and the circuit view both project with the same
 * height-fitted, horizontally-centred equirectangular setup.
 */

const topology = worldData as unknown as Parameters<typeof feature>[0];
const fc = feature(topology, topology.objects.countries as never) as unknown as {
	features: { id?: string | number; properties: Record<string, unknown> }[];
};

export const countryFeatures = fc.features;
export const SPHERE = { type: 'Sphere' } as const;

export function codeForId(id?: string | number): string | null {
	if (id == null) return null;
	const a2 = isoCountries.numericToAlpha2(String(id));
	return a2 ? a2.toLowerCase() : null;
}

/** lowercase alpha-2 → GeoJSON feature (for containment tests). */
const featureByCode = new Map<string, (typeof countryFeatures)[number]>();

/** lowercase alpha-2 → [lon, lat] geographic centroid. */
export const centroidByCode = new Map<string, [number, number]>();
for (const f of countryFeatures) {
	const code = codeForId(f.id);
	if (!code) continue;
	const c = geoCentroid(f as never) as [number, number];
	if (Number.isFinite(c[0]) && Number.isFinite(c[1])) centroidByCode.set(code, c);
	featureByCode.set(code, f);
}

/**
 * Return a random [lon, lat] that lies strictly inside the country polygon.
 * Uses rejection sampling within the geographic bounding box; falls back to
 * the centroid if the feature is not found or sampling fails.
 *
 * @param code  lowercase alpha-2 country code
 * @param maxTries  maximum rejection-sampling attempts before falling back
 */
export function randomPointInCountry(
	code: string,
	maxTries = 40
): [number, number] | null {
	const f = featureByCode.get(code);
	if (!f) return centroidByCode.get(code) ?? null;

	const [[lonMin, latMin], [lonMax, latMax]] = geoBounds(f as never) as [
		[number, number],
		[number, number]
	];
	const dLon = lonMax - lonMin;
	const dLat = latMax - latMin;

	for (let i = 0; i < maxTries; i++) {
		const pt: [number, number] = [
			lonMin + Math.random() * dLon,
			latMin + Math.random() * dLat
		];
		if (geoContains(f as never, pt)) return pt;
	}

	// Fallback: centroid is always inside by definition
	return centroidByCode.get(code) ?? null;
}

// Bounding box that clips Antarctica — fits the projection to the area
// between 60°S and 90°N so the visible world fills the available height.
const BOUNDS_NO_ANTARCTICA = {
	type: 'Feature',
	geometry: {
		type: 'Polygon',
		coordinates: [[[-180, -60], [180, -60], [180, 90], [-180, 90], [-180, -60]]]
	},
	properties: {}
} as const;

/**
 * Equirectangular projection fitted to height and horizontally centred —
 * identical to ValueByAlphaMap so the poles sit at the top/bottom edges.
 * Antarctica (below −60°) is excluded from the fit so it doesn't waste space.
 */
export function makeProjection(width: number, height: number) {
	const p = geoEquirectangular();
	p.fitSize([width, height], BOUNDS_NO_ANTARCTICA as never);
	return p;
}
