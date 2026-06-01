<script lang="ts">
	import {
		maxUserValue,
		seriesColorIndex,
		totalLatestUsers,
		userSeries,
		type UsersData
	} from '$lib/analysis/trends';
	import {
		chartXAt,
		chartYAt,
		compactNumber,
		cyanGreenRamp,
		hoverIndexForElement,
		last,
		seriesLinePath,
		xPercent
	} from '$lib/chart';
	import { countryName } from '$lib/relay-stats';
	import ChartCursorDot from '$lib/components/charts/ChartCursorDot.svelte';
	import ChartCursorLine from '$lib/components/charts/ChartCursorLine.svelte';
	import ChartSwatch from '$lib/components/charts/ChartSwatch.svelte';
	import ChartTooltip from '$lib/components/charts/ChartTooltip.svelte';
	import MetricPanel from '$lib/components/charts/MetricPanel.svelte';
	import TrendChartFrame from '$lib/components/charts/TrendChartFrame.svelte';
	import UserCountryLegend from '$lib/components/charts/UserCountryLegend.svelte';

	let {
		users,
		valueLabel
	}: {
		users: UsersData;
		valueLabel: string;
	} = $props();

	let width = $state(0);
	let height = $state(0);
	let hover = $state<number | null>(null);

	const max = $derived(maxUserValue(users));
	const total = $derived(totalLatestUsers(users));
	const valuesForCountry = (country: string) => userSeries(users, country);
	const seriesColor = (index: number, count: number) =>
		cyanGreenRamp(seriesColorIndex(index, count));

	function onMove(e: PointerEvent) {
		hover = hoverIndexForElement(e.clientX, e.currentTarget as HTMLElement, users.series.length);
	}
</script>

<MetricPanel wide value={compactNumber(total)} label={valueLabel}>
	<TrendChartFrame
		bind:width
		bind:height
		hasData={users.series.length > 1}
		startLabel={users.series[0]?.date}
		endLabel={last(users.series)?.date}
	>
		<svg
			{width}
			{height}
			role="img"
			aria-label="estimated daily users by country over time"
			onpointermove={onMove}
			onpointerleave={() => (hover = null)}
		>
			{#each users.countries as country, i (country)}
				<path
					d={seriesLinePath(valuesForCountry(country), max, width, height)}
					class="line"
					style:stroke={seriesColor(i, users.countries.length)}
				/>
			{/each}
			{#if hover !== null}
				<ChartCursorLine x={chartXAt(hover, users.series.length, width)} {height} />
				{#each users.countries as country, i (country)}
					<ChartCursorDot
						x={chartXAt(hover, users.series.length, width)}
						y={chartYAt(valuesForCountry(country)[hover], max, height)}
						color={seriesColor(i, users.countries.length)}
					/>
				{/each}
			{/if}
		</svg>
		{#if hover !== null}
			<ChartTooltip wide left={`${xPercent(hover, users.series.length)}%`}>
				<span class="tip-d">{users.series[hover].date}</span>
				{#each users.countries as country, i (country)}
					<span class="tip-row">
						<ChartSwatch color={seriesColor(i, users.countries.length)} />
						<span>{countryName(country)}</span>
						<b>{compactNumber(valuesForCountry(country)[hover] ?? 0)}</b>
					</span>
				{/each}
			</ChartTooltip>
		{/if}
	</TrendChartFrame>
	<UserCountryLegend countries={users.countries} {valuesForCountry} {seriesColor} />
</MetricPanel>

<style>
	.tip-d {
		color: #6f8aa3;
		letter-spacing: 0.04em;
	}
	.tip-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-variant-numeric: tabular-nums;
	}
	.tip-row span {
		color: #9fc6e0;
	}
	.tip-row b {
		margin-left: auto;
		color: #e6f1ff;
	}
	.line {
		fill: none;
		stroke-width: 1.8;
	}
</style>
