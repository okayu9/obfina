<script lang="ts">
	import type { PathBiasMarker } from '$lib/analysis/path-bias';
	import { percent } from '$lib/chart';
	import type { Messages } from '$lib/i18n/index.svelte';
	import ChartSwatch from '$lib/components/charts/ChartSwatch.svelte';
	import PresetButtons, { type PresetOption } from '$lib/components/controls/PresetButtons.svelte';
	import GiniMetric from '$lib/components/panels/GiniMetric.svelte';
	import SideReadout from '$lib/components/panels/SideReadout.svelte';

	let {
		marker,
		activeRelays,
		giniConsensus,
		presetOptions,
		t,
		onpreset
	}: {
		marker: PathBiasMarker;
		activeRelays: number;
		giniConsensus: number;
		presetOptions: PresetOption[];
		t: Messages['paths'];
		onpreset: (key: string) => void;
	} = $props();
</script>

<div class="side">
	<SideReadout value={percent(marker.share)} size="lg">
		{t.ofTrafficRidesOn}
		<b>{percent(marker.fraction, marker.fraction < 0.1 ? 1 : 0)}</b>
		{t.ofRelays}
		<span class="muted">(~{marker.count.toLocaleString()} of {activeRelays.toLocaleString()})</span>
	</SideReadout>

	<PresetButtons options={presetOptions} onselect={onpreset} />

	<GiniMetric value={giniConsensus} label={t.giniConsensus} />

	<ul class="key">
		<li><ChartSwatch color="#e6f1ff" width="18px" />{t.legendConsensus}</li>
		<li><ChartSwatch color="var(--accent-cyan)" width="18px" />{t.legendGuard}</li>
		<li><ChartSwatch color="var(--accent-green)" width="18px" />{t.legendExit}</li>
		<li><ChartSwatch color="#3a5266" width="18px" />{t.legendEquality}</li>
	</ul>
</div>

<style>
	.side {
		flex: 1;
		min-width: 240px;
		max-width: 420px;
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}
	.key {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.72rem;
		color: #9fc6e0;
	}
	.key li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
