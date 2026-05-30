import type { Relay } from '$lib/types';

/**
 * Concentration / inequality measures shared by the centralization (per-AS) and
 * path-bias (per-relay) views. All functions take a list of non-negative
 * weights; zero-weight members are dropped (a relay that cannot fill a position
 * is not part of that population).
 */

export interface LorenzPoint {
	/** Cumulative population fraction (0..1), least-weighted first. */
	x: number;
	/** Cumulative weight fraction (0..1). */
	y: number;
}

function positiveSorted(weights: number[]): number[] {
	return weights.filter((v) => v > 0).sort((a, b) => a - b);
}

/**
 * Gini coefficient (0 = perfectly even, →1 = one member holds everything).
 * Uses the standard mean-absolute-difference form on ascending-sorted weights.
 */
export function gini(weights: number[]): number {
	const w = positiveSorted(weights);
	const n = w.length;
	if (n === 0) return 0;
	let total = 0;
	for (const v of w) total += v;
	if (total === 0) return 0;
	let acc = 0;
	for (let i = 0; i < n; i++) acc += (2 * (i + 1) - n - 1) * w[i];
	return acc / (n * total);
}

/** Lorenz curve points from (0,0) to (1,1), least-weighted first. */
export function lorenz(weights: number[]): LorenzPoint[] {
	const w = positiveSorted(weights);
	const n = w.length;
	const pts: LorenzPoint[] = [{ x: 0, y: 0 }];
	let total = 0;
	for (const v of w) total += v;
	if (n === 0 || total === 0) {
		pts.push({ x: 1, y: 1 });
		return pts;
	}
	let cum = 0;
	for (let i = 0; i < n; i++) {
		cum += w[i];
		pts.push({ x: (i + 1) / n, y: cum / total });
	}
	return pts;
}

/**
 * "Concentration curve" read from the top: x = fraction of the population taken
 * from the most-weighted downward, y = cumulative weight share. Bows far above
 * the diagonal when a few members dominate. Returned ascending in x.
 */
export function concentrationFromTop(weights: number[]): LorenzPoint[] {
	const w = weights.filter((v) => v > 0).sort((a, b) => b - a); // desc
	const n = w.length;
	const pts: LorenzPoint[] = [{ x: 0, y: 0 }];
	let total = 0;
	for (const v of w) total += v;
	if (n === 0 || total === 0) {
		pts.push({ x: 1, y: 1 });
		return pts;
	}
	let cum = 0;
	for (let i = 0; i < n; i++) {
		cum += w[i];
		pts.push({ x: (i + 1) / n, y: cum / total });
	}
	return pts;
}

/** Share of total weight held by the top `fraction` of the population. */
export function topShare(weights: number[], fraction: number): number {
	const w = weights.filter((v) => v > 0).sort((a, b) => b - a);
	const n = w.length;
	if (n === 0) return 0;
	let total = 0;
	for (const v of w) total += v;
	if (total === 0) return 0;
	const k = Math.min(n, Math.max(1, Math.round(n * fraction)));
	let cum = 0;
	for (let i = 0; i < k; i++) cum += w[i];
	return cum / total;
}

/**
 * Herfindahl–Hirschman index over shares (0..1). 1 = a single member holds the
 * whole network. Equivalent to the inverse of the "effective number" of members.
 */
export function hhi(weights: number[]): number {
	let total = 0;
	for (const v of weights) if (v > 0) total += v;
	if (total === 0) return 0;
	let sum = 0;
	for (const v of weights) {
		if (v <= 0) continue;
		const s = v / total;
		sum += s * s;
	}
	return sum;
}

export interface Group {
	key: string;
	label: string;
	weight: number;
	count: number;
}

/** Aggregate relays into groups (e.g. by AS), summing a chosen weight. */
export function groupBy(
	relays: Relay[],
	keyFn: (r: Relay) => string | null,
	labelFn: (r: Relay) => string,
	weightFn: (r: Relay) => number
): Group[] {
	const map = new Map<string, Group>();
	for (const r of relays) {
		const key = keyFn(r);
		if (!key) continue;
		const wgt = weightFn(r);
		if (!(wgt > 0)) continue;
		let g = map.get(key);
		if (!g) {
			g = { key, label: labelFn(r), weight: 0, count: 0 };
			map.set(key, g);
		}
		g.weight += wgt;
		g.count += 1;
	}
	return [...map.values()].sort((a, b) => b.weight - a.weight);
}

export interface TopBreakdown {
	top: Group[];
	/** Combined weight of everything outside the top N. */
	rest: number;
	total: number;
}

export function topBreakdown(groups: Group[], n: number): TopBreakdown {
	let total = 0;
	for (const g of groups) total += g.weight;
	const top = groups.slice(0, n);
	let topSum = 0;
	for (const g of top) topSum += g.weight;
	return { top, rest: Math.max(0, total - topSum), total };
}
