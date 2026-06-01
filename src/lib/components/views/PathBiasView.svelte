<script lang="ts">
	import { relayStore } from '$lib/stores/relays.svelte';
	import { getMessages } from '$lib/i18n/index.svelte';
	import { percent } from '$lib/chart';
	import { pathBiasMarker, pathBiasMarkerPoint, pathBiasModel } from '$lib/analysis/path-bias';
	import PathBiasChart from '$lib/components/charts/PathBiasChart.svelte';
	import type { PresetOption } from '$lib/components/controls/PresetButtons.svelte';
	import ViewShell from '$lib/components/layout/ViewShell.svelte';
	import PathBiasSidePanel from '$lib/components/panels/PathBiasSidePanel.svelte';

	const model = $derived(pathBiasModel(relayStore.relays));

	let frac = $state(0.01);
	const marker = $derived(pathBiasMarker(model.weights.consensus, frac));
	const markerPoint = $derived(pathBiasMarkerPoint(marker));

	const presets = [0.01, 0.05, 0.1, 0.25];
	const t = $derived(getMessages());

	const pct = percent;
	const presetOptions = $derived<PresetOption[]>(
		presets.map((value) => ({
			key: String(value),
			label: `${t.paths.top} ${pct(value, value < 0.1 ? 1 : 0)}`,
			active: Math.abs(frac - value) < 1e-6
		}))
	);

	function selectPreset(key: string) {
		frac = Number(key);
	}

	function selectFraction(nextFraction: number) {
		frac = nextFraction;
	}
</script>

<ViewShell title={t.paths.title} description={t.paths.description} maxWidth="960px">
	<div class="body">
		<PathBiasChart
			curves={model.curves}
			{markerPoint}
			startLabel={t.paths.topRelays}
			endLabel={t.paths.shareOfTraffic}
			onfraction={selectFraction}
		/>

		<PathBiasSidePanel
			{marker}
			activeRelays={model.activeRelays}
			giniConsensus={model.giniConsensus}
			{presetOptions}
			t={t.paths}
			onpreset={selectPreset}
		/>
	</div>
</ViewShell>

<style>
	.body {
		display: flex;
		gap: 2.5rem;
		flex-wrap: wrap;
		flex: 1;
		min-height: 0;
	}
</style>
