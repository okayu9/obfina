import type { Relay } from '$lib/types';

/**
 * Weighted sampling of real relays for the three circuit positions, mirroring
 * how Tor itself picks relays (proportional to per-position probability). Used
 * by the circuit view to animate plausible Guard → Middle → Exit paths.
 */

export interface Circuit {
	guard: Relay;
	middle: Relay;
	exit: Relay;
}

/** A prefix-sum table over a relay list for O(log n) weighted draws. */
export interface Sampler {
	items: Relay[];
	cumulative: number[];
	total: number;
}

export function buildSampler(relays: Relay[], weightFn: (r: Relay) => number): Sampler {
	const items: Relay[] = [];
	const cumulative: number[] = [];
	let total = 0;
	for (const r of relays) {
		const w = weightFn(r);
		if (!(w > 0)) continue;
		total += w;
		items.push(r);
		cumulative.push(total);
	}
	return { items, cumulative, total };
}

/** Draw one relay proportional to its weight, optionally avoiding `exclude`. */
export function sampleFrom(
	s: Sampler,
	rng: () => number = Math.random,
	exclude?: Set<Relay>
): Relay | null {
	if (s.items.length === 0 || s.total <= 0) return null;
	for (let attempt = 0; attempt < 8; attempt++) {
		const target = rng() * s.total;
		let lo = 0;
		let hi = s.cumulative.length - 1;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (s.cumulative[mid] < target) lo = mid + 1;
			else hi = mid;
		}
		const pick = s.items[lo];
		if (!exclude || !exclude.has(pick)) return pick;
	}
	return s.items[s.items.length - 1] ?? null;
}

export interface Samplers {
	guard: Sampler;
	middle: Sampler;
	exit: Sampler;
}

/**
 * Build position samplers. Prefers Onionoo's per-position probabilities; when
 * they are unavailable (all zero) it approximates from flags + bandwidth so the
 * animation still works against degraded data.
 */
export function buildSamplers(relays: Relay[]): Samplers {
	const hasProbs = relays.some((r) => r.guardProb + r.middleProb + r.exitProb > 0);
	if (hasProbs) {
		return {
			guard: buildSampler(relays, (r) => r.guardProb),
			middle: buildSampler(relays, (r) => r.middleProb),
			exit: buildSampler(relays, (r) => r.exitProb)
		};
	}
	return {
		guard: buildSampler(relays, (r) => (r.flags.includes('Guard') ? r.bandwidth : 0)),
		middle: buildSampler(relays, (r) => r.bandwidth),
		exit: buildSampler(relays, (r) => (r.flags.includes('Exit') ? r.bandwidth : 0))
	};
}

/** Sample a full Guard → Middle → Exit circuit with three distinct relays. */
export function sampleCircuit(s: Samplers, rng: () => number = Math.random): Circuit | null {
	const guard = sampleFrom(s.guard, rng);
	if (!guard) return null;
	const used = new Set<Relay>([guard]);
	const middle = sampleFrom(s.middle, rng, used);
	if (!middle) return null;
	used.add(middle);
	const exit = sampleFrom(s.exit, rng, used);
	if (!exit) return null;
	return { guard, middle, exit };
}
