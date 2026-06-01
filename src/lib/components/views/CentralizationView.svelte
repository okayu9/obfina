<script lang="ts">
	import { relayStore } from '$lib/stores/relays.svelte';
	import type { Group } from '$lib/analysis/concentration';
	import { getMessages } from '$lib/i18n/index.svelte';
	import {
		centralizationModel,
		type CentralizationScope,
		selectedProvider
	} from '$lib/analysis/hosting';
	import CentralizationLorenzChart from '$lib/components/charts/CentralizationLorenzChart.svelte';
	import type { PresetOption } from '$lib/components/controls/PresetButtons.svelte';
	import CentralizationSidePanel from '$lib/components/panels/CentralizationSidePanel.svelte';
	import ProviderDetailPanel from '$lib/components/panels/ProviderDetailPanel.svelte';
	import ViewShell from '$lib/components/layout/ViewShell.svelte';

	const t = $derived(getMessages());
	let scope = $state<CentralizationScope>('all');
	let pickM = $state(6);

	const model = $derived(centralizationModel(relayStore.relays, scope, pickM));
	const presets = [1, 5, 10, 25];
	const presetOptions = $derived<PresetOption[]>([
		...presets.map((value) => ({
			key: String(value),
			label: `${t.hosting.top} ${value}`,
			active: model.selectedCount === value,
			disabled: value >= model.providerCount
		})),
		{
			key: String(model.providerCount),
			label: `${t.hosting.all} ${model.providerCount}`,
			active: model.selectedCount === model.providerCount
		}
	]);

	// Provider detail panel
	let selectedAsKey = $state<string | null>(null);
	const selected = $derived(selectedProvider(relayStore.relays, model.groupsAll, selectedAsKey));

	function selectProvider(g: Group) {
		if (selectedAsKey === g.key) {
			selectedAsKey = null;
		} else {
			selectedAsKey = g.key;
		}
	}

	function closePanel() {
		selectedAsKey = null;
	}

	function selectPreset(key: string) {
		pickM = Number(key);
	}

	function selectScope(nextScope: CentralizationScope) {
		scope = nextScope;
	}

	function pickProviderCount(count: number) {
		pickM = count;
	}
</script>

<ViewShell
	title={t.hosting.title}
	description={t.hosting.description}
	maxWidth="1180px"
	descriptionWidth="52ch"
>
	<div class="body">
		<div class="chart-slot">
			<CentralizationLorenzChart
				{scope}
				all={model.lorenzAll}
				exit={model.lorenzExit}
				providerCount={model.providerCount}
				selectedCount={model.selectedCount}
				selectedShare={model.selectedShare}
				startLabel={t.hosting.fewerAses}
				endLabel={t.hosting.cumulativeShare}
				onpick={pickProviderCount}
			/>
		</div>

		<CentralizationSidePanel
			{scope}
			giniAll={model.giniAll}
			giniExit={model.giniExit}
			providerCount={model.providerCount}
			selectedCount={model.selectedCount}
			selectedShare={model.selectedShare}
			marginal={model.marginal}
			{presetOptions}
			groups={model.listed}
			totalWeight={model.totalWeight}
			{selectedAsKey}
			tailCount={model.tailCount}
			tailShare={model.tailShare}
			t={t.hosting}
			onscope={selectScope}
			onpreset={selectPreset}
			onselect={selectProvider}
		/>

		{#if selectedAsKey !== null && selected !== null}
			<ProviderDetailPanel
				asKey={selectedAsKey}
				label={selected.group.label}
				relays={selected.relays}
				stats={selected.stats}
				t={t.hosting}
				onclose={closePanel}
			/>
		{/if}
	</div>
</ViewShell>

<style>
	.body {
		display: flex;
		gap: 2.5rem;
		align-items: stretch;
		flex: 1;
		min-height: 0;
	}
	/* The Lorenz plot is a fixed square; the rank list flexes to fill the rest. */
	.chart-slot {
		flex: 0 0 auto;
		display: flex;
		min-height: 0;
	}
	/* Narrow viewports: stack the chart above the list and let the page scroll. */
	@media (max-width: 880px) {
		.body {
			flex-wrap: wrap;
		}
		.chart-slot {
			flex: 1 1 100%;
		}
	}
</style>
