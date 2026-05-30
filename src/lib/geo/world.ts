import { feature } from 'topojson-client';
import { geoEquirectangular, geoPath, geoCentroid } from 'd3-geo';
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

/** lowercase alpha-2 → [lon, lat] geographic centroid. */
export const centroidByCode = new Map<string, [number, number]>();
for (const f of countryFeatures) {
	const code = codeForId(f.id);
	if (!code) continue;
	const c = geoCentroid(f as never) as [number, number];
	if (Number.isFinite(c[0]) && Number.isFinite(c[1])) centroidByCode.set(code, c);
}

/**
 * Equirectangular projection fitted to height and horizontally centred —
 * identical to ValueByAlphaMap so the poles sit at the top/bottom edges.
 */
export function makeProjection(width: number, height: number) {
	const p = geoEquirectangular();
	p.fitHeight(height, SPHERE);
	const b = geoPath(p).bounds(SPHERE);
	const mapW = b[1][0] - b[0][0];
	const t = p.translate();
	p.translate([t[0] + (width - mapW) / 2 - b[0][0], t[1]]);
	return p;
}
