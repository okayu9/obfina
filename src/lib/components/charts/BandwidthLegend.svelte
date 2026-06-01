<script lang="ts">
	import { formatBandwidth } from '$lib/relay-stats';
	import { last } from '$lib/chart';
	import ChartSwatch from '$lib/components/charts/ChartSwatch.svelte';

	let {
		advertised,
		consumed,
		advertisedLabel,
		consumedLabel
	}: {
		advertised: number[];
		consumed: number[];
		advertisedLabel: string;
		consumedLabel: string;
	} = $props();
</script>

<div class="legend">
	<span><ChartSwatch tone="cyan" />{formatBandwidth(last(advertised) ?? 0)} {advertisedLabel}</span>
	<span><ChartSwatch tone="green" />{formatBandwidth(last(consumed) ?? 0)} {consumedLabel}</span>
</div>

<style>
	.legend {
		display: flex;
		gap: 1rem;
		margin-top: 0.4rem;
		font-size: 0.68rem;
		color: #9fc6e0;
	}
	.legend span {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
</style>
