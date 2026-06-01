<script lang="ts">
	import { countryName } from '$lib/relay-stats';
	import { compactNumber, last } from '$lib/chart';
	import ChartSwatch from '$lib/components/charts/ChartSwatch.svelte';

	let {
		countries,
		valuesForCountry,
		seriesColor
	}: {
		countries: string[];
		valuesForCountry: (country: string) => number[];
		seriesColor: (index: number, count: number) => string;
	} = $props();
</script>

<ul class="ckey">
	{#each countries as cc, i (cc)}
		<li>
			<ChartSwatch color={seriesColor(i, countries.length)} />
			<span>{countryName(cc)}</span>
			<b>{compactNumber(last(valuesForCountry(cc)) ?? 0)}</b>
		</li>
	{/each}
</ul>

<style>
	.ckey {
		list-style: none;
		margin: 0.8rem 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.2rem;
		font-size: 0.68rem;
		color: #9fc6e0;
	}
	.ckey li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.ckey b {
		color: #e6f1ff;
		font-variant-numeric: tabular-nums;
	}
</style>
