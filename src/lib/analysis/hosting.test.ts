import { describe, expect, it } from 'vitest';
import {
	centralizationModel,
	clampProviderCount,
	cumulativeTopShares,
	countryPanelModel,
	filterRelaysByRole,
	hasExitProbability,
	maxRelayBandwidth,
	providerCountFromFraction,
	providerGroupsByScope,
	providerDetailStats,
	rankedProviders,
	relaysForCountry,
	selectedProvider,
	shareOfTotal,
	topProviderMarker,
	topProvidersByBandwidth,
	uniqueAsCount
} from './hosting';
import type { Relay } from '$lib/types';

const relay = (overrides: Partial<Relay>): Relay => ({
	nickname: 'r',
	bandwidth: 0,
	consensusWeight: 0,
	guardProb: 0,
	middleProb: 0,
	exitProb: 0,
	as: null,
	asName: null,
	country: 'xx',
	flags: [],
	firstSeen: null,
	...overrides
});

describe('hosting analysis helpers', () => {
	const relays = [
		relay({
			nickname: 'g',
			country: 'de',
			bandwidth: 300,
			consensusWeight: 30,
			as: 'AS1',
			asName: 'One',
			flags: ['Guard']
		}),
		relay({
			nickname: 'e',
			country: 'de',
			bandwidth: 200,
			consensusWeight: 20,
			as: 'AS1',
			asName: 'One',
			flags: ['Exit']
		}),
		relay({
			nickname: 'm',
			country: 'de',
			bandwidth: 100,
			consensusWeight: 10,
			as: 'AS2',
			asName: 'Two',
			flags: ['Fast']
		}),
		relay({
			nickname: 'u',
			country: 'us',
			bandwidth: 400,
			consensusWeight: 40,
			as: null,
			flags: ['Exit']
		})
	];

	it('computes cumulative top shares and safe shares', () => {
		expect(cumulativeTopShares([{ weight: 60 }, { weight: 30 }, { weight: 10 }])).toEqual([
			0, 0.6, 0.9, 1
		]);
		expect(shareOfTotal(3, 12)).toBe(0.25);
		expect(shareOfTotal(3, 0)).toBe(0);
	});

	it('builds AS groups for centralization scopes', () => {
		expect(hasExitProbability(relays)).toBe(false);

		const groups = providerGroupsByScope(relays);
		expect(groups.all.map((group) => [group.key, group.weight])).toEqual([
			['AS1', 50],
			['AS2', 10]
		]);
		expect(groups.exit.map((group) => [group.key, group.weight])).toEqual([['AS1', 200]]);

		const withExitProbability = [
			relay({ as: 'AS1', asName: 'One', bandwidth: 1_000, exitProb: 0.1, flags: ['Exit'] }),
			relay({ as: 'AS2', asName: 'Two', bandwidth: 2_000, exitProb: 0.3, flags: ['Exit'] })
		];
		expect(providerGroupsByScope(withExitProbability).exit.map((group) => group.weight)).toEqual([
			0.3, 0.1
		]);
	});

	it('summarizes ranked providers with a bounded visible list', () => {
		const groups = [
			{ key: 'a', label: 'A', weight: 60, count: 1 },
			{ key: 'b', label: 'B', weight: 30, count: 1 },
			{ key: 'c', label: 'C', weight: 10, count: 1 }
		];
		expect(clampProviderCount(10, 3)).toBe(3);
		expect(clampProviderCount(-1, 3)).toBe(1);
		expect(providerCountFromFraction(0, 10)).toBe(10);
		expect(providerCountFromFraction(0.5, 10)).toBe(5);
		expect(providerCountFromFraction(1, 10)).toBe(1);
		expect(topProviderMarker(10, 3, 0.75)).toEqual({ x: 70, y: 75 });
		expect(topProviderMarker(0, 3, 0.75)).toEqual({ x: 0, y: 0 });
		const ranking = rankedProviders(groups, 2);
		expect(ranking).toMatchObject({
			totalWeight: 100,
			listed: groups.slice(0, 2),
			tailCount: 1
		});
		expect(ranking.tailShare).toBeCloseTo(0.1);
	});

	it('builds the centralization view model for the selected scope', () => {
		const model = centralizationModel(relays, 'all', 10);

		expect(model.groupsAll.map((group) => group.key)).toEqual(['AS1', 'AS2']);
		expect(model.groupsExit.map((group) => group.key)).toEqual(['AS1']);
		expect(model.providerCount).toBe(2);
		expect(model.selectedCount).toBe(2);
		expect(model.totalWeight).toBe(60);
		expect(model.selectedShare).toBe(1);
		expect(model.marginal?.key).toBe('AS2');
		expect(model.lorenzAll.at(0)).toEqual({ x: 0, y: 0 });
		expect(model.giniAll).toBeGreaterThan(0);

		const exitModel = centralizationModel(relays, 'exit', 1);
		expect(exitModel.ranked.map((group) => group.key)).toEqual(['AS1']);
		expect(exitModel.selectedShare).toBe(1);
	});

	it('filters relays by role', () => {
		expect(filterRelaysByRole(relays, 'all')).toHaveLength(4);
		expect(filterRelaysByRole(relays, 'guard').map((r) => r.nickname)).toEqual(['g']);
		expect(filterRelaysByRole(relays, 'exit').map((r) => r.nickname)).toEqual(['e', 'u']);
		expect(filterRelaysByRole(relays, 'middle').map((r) => r.nickname)).toEqual(['m']);
	});

	it('sorts relays for a country and counts unique ASes', () => {
		const countryRelays = relaysForCountry(relays, 'de');
		expect(countryRelays.map((r) => r.nickname)).toEqual(['g', 'e', 'm']);
		expect(uniqueAsCount(countryRelays)).toBe(2);
		expect(maxRelayBandwidth(countryRelays)).toBe(300);
		expect(maxRelayBandwidth([])).toBe(1);
	});

	it('aggregates top providers by bandwidth', () => {
		expect(topProvidersByBandwidth(relaysForCountry(relays, 'de'), 600)).toEqual([
			{ key: 'AS1', name: 'One', bw: 500, count: 2, share: 83.33333333333334 },
			{ key: 'AS2', name: 'Two', bw: 100, count: 1, share: 16.666666666666664 }
		]);
	});

	it('builds the country detail panel model', () => {
		expect(countryPanelModel(relays, 'de', 600, 1_000)).toMatchObject({
			bandwidthShare: 60,
			uniqueAS: 2,
			topProviders: [
				{ key: 'AS1', name: 'One', bw: 500, count: 2, share: 83.33333333333334 },
				{ key: 'AS2', name: 'Two', bw: 100, count: 1, share: 16.666666666666664 }
			]
		});
		expect(
			countryPanelModel(relays, 'de', 600, 1_000).relays.map((relay) => relay.nickname)
		).toEqual(['g', 'e', 'm']);
		expect(countryPanelModel(relays, 'de', 600, 0).bandwidthShare).toBe(0);
	});

	it('computes provider detail shares', () => {
		expect(providerDetailStats(relays.slice(0, 2), 500, 1000, 2000)).toEqual({
			bandwidthShare: 0.5,
			consensusShare: 0.25
		});
	});

	it('returns sorted relays and stats for a selected provider', () => {
		const selected = selectedProvider(
			[
				relay({ nickname: 'slow', as: 'AS1', bandwidth: 10, consensusWeight: 1 }),
				relay({ nickname: 'fast', as: 'AS1', bandwidth: 30, consensusWeight: 3 }),
				relay({ nickname: 'other', as: 'AS2', bandwidth: 60, consensusWeight: 6 })
			],
			[{ key: 'AS1', label: 'One', weight: 4, count: 2 }],
			'AS1'
		);
		expect(selected?.relays.map((relay) => relay.nickname)).toEqual(['fast', 'slow']);
		expect(selected?.stats).toEqual({ bandwidthShare: 0.4, consensusShare: 0.4 });
		expect(selectedProvider(relays, [], 'missing')).toBeNull();
		expect(selectedProvider(relays, [], null)).toBeNull();
	});
});
