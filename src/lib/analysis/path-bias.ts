import {
	concentrationFromTop,
	gini,
	topShare,
	type LorenzPoint
} from '$lib/analysis/concentration';
import type { Relay } from '$lib/types';

export interface PathBiasWeights {
	consensus: number[];
	guard: number[];
	exit: number[];
}

export interface PathBiasCurves {
	consensus: LorenzPoint[];
	guard: LorenzPoint[];
	exit: LorenzPoint[];
}

export interface PathBiasModel {
	weights: PathBiasWeights;
	curves: PathBiasCurves;
	giniConsensus: number;
	activeRelays: number;
}

export interface PathBiasMarker {
	fraction: number;
	share: number;
	count: number;
}

export interface PathBiasMarkerPoint {
	x: number;
	y: number;
}

export function pathBiasWeights(relays: Relay[]): PathBiasWeights {
	return {
		consensus: relays.map((relay) => relay.consensusWeight),
		guard: relays.map((relay) => relay.guardProb),
		exit: relays.map((relay) => relay.exitProb)
	};
}

export function pathBiasModel(relays: Relay[]): PathBiasModel {
	const weights = pathBiasWeights(relays);
	return {
		weights,
		curves: {
			consensus: concentrationFromTop(weights.consensus),
			guard: concentrationFromTop(weights.guard),
			exit: concentrationFromTop(weights.exit)
		},
		giniConsensus: gini(weights.consensus),
		activeRelays: weights.consensus.filter((weight) => weight > 0).length
	};
}

export function clampPathFraction(fraction: number): number {
	return Math.max(0.001, Math.min(1, fraction));
}

export function pathBiasMarker(weights: number[], fraction: number): PathBiasMarker {
	const clamped = clampPathFraction(fraction);
	const activeRelays = weights.filter((weight) => weight > 0).length;
	return {
		fraction: clamped,
		share: topShare(weights, clamped),
		count: Math.max(1, Math.round(activeRelays * clamped))
	};
}

export function pathBiasMarkerPoint(
	marker: Pick<PathBiasMarker, 'fraction' | 'share'>
): PathBiasMarkerPoint {
	return {
		x: marker.fraction * 100,
		y: (1 - marker.share) * 100
	};
}
