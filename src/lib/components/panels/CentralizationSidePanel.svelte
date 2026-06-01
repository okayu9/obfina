<script lang="ts">
	import type { Group } from '$lib/analysis/concentration';
	import type { CentralizationScope } from '$lib/analysis/hosting';
	import { percent } from '$lib/chart';
	import type { Messages } from '$lib/i18n/index.svelte';
	import GiniMetric from '$lib/components/panels/GiniMetric.svelte';
	import PresetButtons, { type PresetOption } from '$lib/components/controls/PresetButtons.svelte';
	import ProviderRankList from '$lib/components/panels/ProviderRankList.svelte';
	import SideReadout from '$lib/components/panels/SideReadout.svelte';

	let {
		scope,
		giniAll,
		giniExit,
		providerCount,
		selectedCount,
		selectedShare,
		marginal,
		presetOptions,
		groups,
		totalWeight,
		selectedAsKey,
		tailCount,
		tailShare,
		t,
		onscope,
		onpreset,
		onselect
	}: {
		scope: CentralizationScope;
		giniAll: number;
		giniExit: number;
		providerCount: number;
		selectedCount: number;
		selectedShare: number;
		marginal: Group | undefined;
		presetOptions: PresetOption[];
		groups: Group[];
		totalWeight: number;
		selectedAsKey: string | null;
		tailCount: number;
		tailShare: number;
		t: Messages['hosting'];
		onscope: (scope: CentralizationScope) => void;
		onpreset: (key: string) => void;
		onselect: (group: Group) => void;
	} = $props();
</script>

<div class="side">
	<div class="toggle" role="tablist">
		<button class:on={scope === 'all'} onclick={() => onscope('all')} role="tab">
			{t.allRelays}
		</button>
		<button class:on={scope === 'exit'} onclick={() => onscope('exit')} role="tab">
			{t.exitOnly}
		</button>
	</div>

	<div class="ginis">
		<GiniMetric value={giniAll} label={t.giniAll} tone="cyan" active={scope === 'all'} />
		<GiniMetric value={giniExit} label={t.giniExit} tone="green" active={scope === 'exit'} />
	</div>

	{#if providerCount > 0}
		<SideReadout value={percent(selectedShare)} tone={scope === 'exit' ? 'green' : 'cyan'}>
			{t.heldByTop} <b>{selectedCount}</b>
			{t.of}
			{providerCount.toLocaleString()}
			{t.providers}
			{#if marginal}<span class="muted">· #{selectedCount} {marginal.label}</span>{/if}
		</SideReadout>

		<PresetButtons options={presetOptions} onselect={onpreset} />

		<ProviderRankList
			{groups}
			{totalWeight}
			{selectedCount}
			{selectedAsKey}
			{tailCount}
			{tailShare}
			moreProvidersLabel={t.moreProviders}
			exit={scope === 'exit'}
			{onselect}
		/>
	{/if}
</div>

<style>
	.side {
		flex: 1;
		min-width: 240px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-height: 0;
	}
	.toggle {
		display: flex;
		gap: 0.3rem;
	}
	.toggle button {
		flex: 1;
		padding: 0.4rem;
		background: rgba(8, 20, 31, 0.6);
		border: 1px solid rgba(58, 93, 120, 0.35);
		border-radius: 6px;
		color: #6f8aa3;
		font-family: inherit;
		font-size: 0.72rem;
		letter-spacing: 0.06em;
		cursor: pointer;
	}
	.toggle button.on {
		color: #e6f1ff;
		border-color: rgba(0, 212, 255, 0.5);
	}
	.ginis {
		display: flex;
		gap: 1rem;
	}
</style>
