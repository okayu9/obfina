import type { RelaySimulationEntry } from '$lib/types';

/**
 * Weighted sampling of real relays for the three circuit positions, mirroring
 * how Tor itself picks relays (proportional to per-position probability). Used
 * by the circuit view to animate plausible Guard → Middle → Exit paths.
 */

export interface Circuit {
	guard: RelaySimulationEntry;
	middle: RelaySimulationEntry;
	exit: RelaySimulationEntry;
}

export type Point = [number, number];

export interface LiveCircuit {
	id: number;
	c: Circuit;
	born: number;
	coords: Point[];
}

export type RelayPoint = (relay: RelaySimulationEntry) => Point | null;

/** A prefix-sum table over a relay list for O(log n) weighted draws. */
export interface Sampler {
	items: RelaySimulationEntry[];
	cumulative: number[];
	total: number;
}

export function buildSampler(
	relays: RelaySimulationEntry[],
	weightFn: (r: RelaySimulationEntry) => number
): Sampler {
	const items: RelaySimulationEntry[] = [];
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
	exclude?: Set<RelaySimulationEntry>
): RelaySimulationEntry | null {
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
	return s.items.find((item) => !exclude?.has(item)) ?? null;
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
export function buildSamplers(relays: RelaySimulationEntry[]): Samplers {
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
	const used = new Set<RelaySimulationEntry>([guard]);
	const middle = sampleFrom(s.middle, rng, used);
	if (!middle) return null;
	used.add(middle);
	const exit = sampleFrom(s.exit, rng, used);
	if (!exit) return null;
	return { guard, middle, exit };
}

export function liveCircuit(
	id: number,
	circuit: Circuit,
	born: number,
	pointForRelay: RelayPoint
): LiveCircuit | null {
	const guard = pointForRelay(circuit.guard);
	const middle = pointForRelay(circuit.middle);
	const exit = pointForRelay(circuit.exit);
	if (!guard || !middle || !exit) return null;
	return { id, c: circuit, born, coords: [guard, middle, exit] };
}

export function spawnLiveCircuit(
	current: LiveCircuit[],
	samplers: Samplers,
	options: {
		max: number;
		nextId: number;
		now: number;
		pointForRelay: RelayPoint;
		rng?: () => number;
	}
): { circuits: LiveCircuit[]; nextId: number; spawned: boolean } {
	if (current.length >= options.max) {
		return { circuits: current, nextId: options.nextId, spawned: false };
	}
	const circuit = sampleCircuit(samplers, options.rng);
	if (!circuit) return { circuits: current, nextId: options.nextId, spawned: false };
	const live = liveCircuit(options.nextId, circuit, options.now, options.pointForRelay);
	if (!live) return { circuits: current, nextId: options.nextId, spawned: false };
	return { circuits: [...current, live], nextId: options.nextId + 1, spawned: true };
}

export function cullLiveCircuits(
	circuits: LiveCircuit[],
	now: number,
	lifeMs: number
): LiveCircuit[] {
	const cutoff = now - lifeMs;
	return circuits.filter((circuit) => circuit.born >= cutoff);
}

export function latestLiveCircuit(circuits: LiveCircuit[]): LiveCircuit | null {
	return circuits.at(-1) ?? null;
}

export function circuitProgress(now: number, born: number, lifeMs: number): number {
	return Math.min(1, Math.max(0, (now - born) / lifeMs));
}

export function circuitFade(progress: number): number {
	if (progress < 0.1) return progress / 0.1;
	if (progress > 0.85) return (1 - progress) / 0.15;
	return 1;
}

export function pulseRadius(now: number): number {
	return 2.6 + Math.sin(now / 260) * 0.7;
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/** Position of the travelling packet along guard -> middle -> exit. */
export function packetPosition(points: (Point | null)[], progress: number): Point | null {
	const segment = progress < 0.5 ? 0 : 1;
	const localT = segment === 0 ? progress / 0.5 : (progress - 0.5) / 0.5;
	const start = points[segment];
	const end = points[segment + 1];
	if (!start || !end) return null;
	return [lerp(start[0], end[0], localT), lerp(start[1], end[1], localT)];
}
