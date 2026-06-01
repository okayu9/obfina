<script lang="ts">
	import { percent } from '$lib/chart';
	import type { Group } from '$lib/analysis/concentration';
	import { shareOfTotal } from '$lib/analysis/hosting';
	import ProviderRankRow from '$lib/components/panels/ProviderRankRow.svelte';
	import ProviderRankTailRow from '$lib/components/panels/ProviderRankTailRow.svelte';

	let {
		groups,
		totalWeight,
		selectedCount,
		selectedAsKey,
		tailCount,
		tailShare,
		moreProvidersLabel,
		exit = false,
		onselect
	}: {
		groups: Group[];
		totalWeight: number;
		selectedCount: number;
		selectedAsKey: string | null;
		tailCount: number;
		tailShare: number;
		moreProvidersLabel: string;
		exit?: boolean;
		onselect: (group: Group) => void;
	} = $props();

	const share = (group: Group) => percent(shareOfTotal(group.weight, totalWeight));
</script>

<ul class="bars scroll-area">
	{#each groups as group, i (group.key)}
		<ProviderRankRow
			{group}
			rank={i + 1}
			share={share(group)}
			selected={i < selectedCount}
			active={selectedAsKey === group.key}
			{exit}
			{onselect}
		/>
	{/each}
	{#if tailCount > 0}
		<ProviderRankTailRow
			count={tailCount}
			share={percent(tailShare)}
			label={moreProvidersLabel}
			selected={selectedCount > groups.length}
			{exit}
		/>
	{/if}
</ul>

<style>
	.bars {
		list-style: none;
		margin: 0;
		padding: 0.2rem 0.5rem 0.2rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		flex: 1;
		min-height: 4rem;
		overflow-y: auto;
	}
</style>
