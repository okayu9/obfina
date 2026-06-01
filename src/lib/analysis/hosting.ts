import type { Group } from '$lib/analysis/concentration';
import { gini, groupBy, lorenz, type LorenzPoint } from '$lib/analysis/concentration';
import { hasFlag, isMiddleRelay } from '$lib/relay-stats';
import type { Relay } from '$lib/types';

export type RelayRoleFilter = 'all' | 'guard' | 'middle' | 'exit';
export type CentralizationScope = 'all' | 'exit';

export interface ProviderBandwidth {
	key: string;
	name: string;
	bw: number;
	count: number;
	share: number;
}

export interface ProviderDetailStats {
	bandwidthShare: number;
	consensusShare: number;
}

export interface ProviderGroups {
	all: Group[];
	exit: Group[];
}

export interface RankedProviders {
	ranked: Group[];
	totalWeight: number;
	cumulativeShares: number[];
	listed: Group[];
	tailCount: number;
	tailShare: number;
}

export interface SelectedProvider {
	group: Group;
	relays: Relay[];
	stats: ProviderDetailStats;
}

export interface CountryPanelModel {
	relays: Relay[];
	bandwidthShare: number;
	uniqueAS: number;
	topProviders: ProviderBandwidth[];
}

export interface TopProviderMarker {
	x: number;
	y: number;
}

export interface CentralizationModel {
	groups: ProviderGroups;
	groupsAll: Group[];
	groupsExit: Group[];
	lorenzAll: LorenzPoint[];
	lorenzExit: LorenzPoint[];
	giniAll: number;
	giniExit: number;
	ranked: Group[];
	ranking: RankedProviders;
	providerCount: number;
	selectedCount: number;
	totalWeight: number;
	cumulativeShares: number[];
	selectedShare: number;
	marginal: Group | undefined;
	listed: Group[];
	tailCount: number;
	tailShare: number;
}

export function hasExitProbability(relays: Relay[]): boolean {
	return relays.some((relay) => relay.exitProb > 0);
}

export function providerGroupsByScope(relays: Relay[]): ProviderGroups {
	const exitProbabilityAvailable = hasExitProbability(relays);
	return {
		all: groupBy(
			relays,
			(relay) => relay.as,
			(relay) => relay.asName || relay.as || 'Unknown',
			(relay) => relay.consensusWeight
		),
		exit: groupBy(
			relays.filter((relay) => hasFlag(relay, 'Exit')),
			(relay) => relay.as,
			(relay) => relay.asName || relay.as || 'Unknown',
			exitProbabilityAvailable ? (relay) => relay.exitProb : (relay) => relay.bandwidth
		)
	};
}

export function cumulativeTopShares(groups: Pick<Group, 'weight'>[]): number[] {
	const total = groups.reduce((sum, group) => sum + group.weight, 0);
	const out = [0];
	let cumulative = 0;
	for (const group of groups) {
		cumulative += group.weight;
		out.push(total > 0 ? cumulative / total : 0);
	}
	return out;
}

export function shareOfTotal(weight: number, total: number): number {
	return total > 0 ? weight / total : 0;
}

export function clampProviderCount(value: number, total: number): number {
	return Math.max(1, Math.min(value, Math.max(1, total)));
}

export function providerCountFromFraction(fraction: number, total: number): number {
	return clampProviderCount(total - Math.round(fraction * total), total);
}

export function topProviderMarker(
	total: number,
	selectedCount: number,
	selectedShare: number
): TopProviderMarker {
	if (total <= 0) return { x: 0, y: 0 };
	return {
		x: ((total - selectedCount) / total) * 100,
		y: selectedShare * 100
	};
}

export function rankedProviders(groups: Group[], listLimit = 24): RankedProviders {
	const totalWeight = groups.reduce((sum, group) => sum + group.weight, 0);
	const cumulativeShares = cumulativeTopShares(groups);
	const listedCount = Math.min(listLimit, groups.length);
	const listed = groups.slice(0, listedCount);
	const tailCount = groups.length - listedCount;
	const tailShare = 1 - (cumulativeShares[listedCount] ?? 0);
	return { ranked: groups, totalWeight, cumulativeShares, listed, tailCount, tailShare };
}

export function centralizationModel(
	relays: Relay[],
	scope: CentralizationScope,
	pickCount: number
): CentralizationModel {
	const groups = providerGroupsByScope(relays);
	const groupsAll = groups.all;
	const groupsExit = groups.exit;
	const ranked = scope === 'all' ? groupsAll : groupsExit;
	const ranking = rankedProviders(ranked);
	const providerCount = ranked.length;
	const selectedCount = clampProviderCount(pickCount, providerCount);
	const selectedShare = ranking.cumulativeShares[selectedCount] ?? 0;

	return {
		groups,
		groupsAll,
		groupsExit,
		lorenzAll: lorenz(groupsAll.map((group) => group.weight)),
		lorenzExit: lorenz(groupsExit.map((group) => group.weight)),
		giniAll: gini(groupsAll.map((group) => group.weight)),
		giniExit: gini(groupsExit.map((group) => group.weight)),
		ranked,
		ranking,
		providerCount,
		selectedCount,
		totalWeight: ranking.totalWeight,
		cumulativeShares: ranking.cumulativeShares,
		selectedShare,
		marginal: ranked[selectedCount - 1],
		listed: ranking.listed,
		tailCount: ranking.tailCount,
		tailShare: ranking.tailShare
	};
}

export function filterRelaysByRole(relays: Relay[], filter: RelayRoleFilter): Relay[] {
	if (filter === 'all') return relays;
	if (filter === 'guard') return relays.filter((relay) => hasFlag(relay, 'Guard'));
	if (filter === 'exit') return relays.filter((relay) => hasFlag(relay, 'Exit'));
	return relays.filter(isMiddleRelay);
}

export function relaysForCountry(relays: Relay[], country: string): Relay[] {
	return relays
		.filter((relay) => relay.country === country)
		.sort((a, b) => b.bandwidth - a.bandwidth);
}

export function maxRelayBandwidth(relays: Pick<Relay, 'bandwidth'>[]): number {
	return relays.length > 0 ? Math.max(...relays.map((relay) => relay.bandwidth)) : 1;
}

export function uniqueAsCount(relays: Relay[]): number {
	return new Set(relays.map((relay) => relay.as).filter(Boolean)).size;
}

export function topProvidersByBandwidth(
	relays: Relay[],
	totalBandwidth: number,
	limit = 5
): ProviderBandwidth[] {
	const byAs: Record<string, ProviderBandwidth> = {};
	for (const relay of relays) {
		const key = relay.as ?? 'unknown';
		const name = relay.asName ?? relay.as ?? 'Unknown';
		const existing = byAs[key];
		if (existing) {
			existing.bw += relay.bandwidth;
			existing.count++;
		} else {
			byAs[key] = { key, name, bw: relay.bandwidth, count: 1, share: 0 };
		}
	}
	return Object.values(byAs)
		.sort((a, b) => b.bw - a.bw)
		.slice(0, limit)
		.map((entry) => ({
			...entry,
			share: totalBandwidth > 0 ? (entry.bw / totalBandwidth) * 100 : 0
		}));
}

export function countryPanelModel(
	relays: Relay[],
	country: string,
	countryBandwidth: number,
	totalBandwidth: number
): CountryPanelModel {
	const countryRelays = relaysForCountry(relays, country);
	return {
		relays: countryRelays,
		bandwidthShare: totalBandwidth > 0 ? (countryBandwidth / totalBandwidth) * 100 : 0,
		uniqueAS: uniqueAsCount(countryRelays),
		topProviders: topProvidersByBandwidth(countryRelays, countryBandwidth)
	};
}

export function providerDetailStats(
	relays: Relay[],
	groupWeight: number,
	totalBandwidth: number,
	totalConsensus: number
): ProviderDetailStats {
	const bandwidth = relays.reduce((sum, relay) => sum + relay.bandwidth, 0);
	return {
		bandwidthShare: totalBandwidth > 0 ? bandwidth / totalBandwidth : 0,
		consensusShare: totalConsensus > 0 ? groupWeight / totalConsensus : 0
	};
}

export function selectedProvider(
	relays: Relay[],
	groups: Group[],
	asKey: string | null
): SelectedProvider | null {
	if (asKey === null) return null;
	const group = groups.find((entry) => entry.key === asKey);
	if (!group) return null;
	const providerRelays = relays
		.filter((relay) => relay.as === asKey)
		.sort((a, b) => b.bandwidth - a.bandwidth);
	const totalBandwidth = relays.reduce((sum, relay) => sum + relay.bandwidth, 0);
	const totalConsensus = relays.reduce((sum, relay) => sum + relay.consensusWeight, 0);
	return {
		group,
		relays: providerRelays,
		stats: providerDetailStats(providerRelays, group.weight, totalBandwidth, totalConsensus)
	};
}
