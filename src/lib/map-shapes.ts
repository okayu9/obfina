import type { CountryStats } from '$lib/relay-stats';
import { scaleSqrt } from 'd3-scale';
import { roleColor } from '$lib/map-encoding';

export interface CountryMapShape {
	key: string;
	code: string | null;
	d: string;
	stats: CountryStats | null;
	glow: string | null;
	opacity: number;
}

export function countryShapeKey(code: string | null, pathData: string): string {
	return code ?? pathData.slice(0, 12);
}

export interface CountryFeatureLike {
	id?: string | number;
}

export function maxCountryRelayCount(stats: Iterable<CountryStats>): number {
	return Math.max(1, ...[...stats].map((s) => s.count));
}

export function buildCountryMapShapes<TFeature extends CountryFeatureLike>(
	features: TFeature[],
	pathForFeature: (feature: TFeature) => string | null | undefined,
	byCountry: Map<string, CountryStats>,
	codeForFeatureId: (id?: string | number) => string | null
): CountryMapShape[] {
	const maxCount = maxCountryRelayCount(byCountry.values());
	const opacityForCount = scaleSqrt().domain([1, maxCount]).range([0.18, 1]).clamp(true);

	return features.map((feature) => {
		const code = codeForFeatureId(feature.id);
		const stats = code ? (byCountry.get(code) ?? null) : null;
		const d = pathForFeature(feature) ?? '';

		return {
			code,
			key: countryShapeKey(code, d),
			d,
			stats,
			glow: stats ? roleColor(stats) : null,
			opacity: stats ? opacityForCount(stats.count) : 0
		};
	});
}
