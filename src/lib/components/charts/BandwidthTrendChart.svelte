<script lang="ts">
	import { utilization } from '$lib/analysis/trends';
	import {
		chartXAt,
		chartYAt,
		hoverIndexForElement,
		last,
		seriesAreaPath,
		seriesLinePath,
		xPercent
	} from '$lib/chart';
	import { formatBandwidth } from '$lib/relay-stats';
	import BandwidthLegend from '$lib/components/charts/BandwidthLegend.svelte';
	import ChartCursorDot from '$lib/components/charts/ChartCursorDot.svelte';
	import ChartCursorLine from '$lib/components/charts/ChartCursorLine.svelte';
	import ChartSwatch from '$lib/components/charts/ChartSwatch.svelte';
	import ChartTooltip from '$lib/components/charts/ChartTooltip.svelte';
	import MetricPanel from '$lib/components/charts/MetricPanel.svelte';
	import TrendChartFrame from '$lib/components/charts/TrendChartFrame.svelte';

	let {
		points,
		valueLabel,
		advertisedLabel,
		consumedLabel
	}: {
		points: { date: string; advertised: number; consumed: number }[];
		valueLabel: string;
		advertisedLabel: string;
		consumedLabel: string;
	} = $props();

	let width = $state(0);
	let height = $state(0);
	let hover = $state<number | null>(null);

	const advertised = $derived(points.map((point) => point.advertised));
	const consumed = $derived(points.map((point) => point.consumed));
	const max = $derived(Math.max(1, ...advertised, ...consumed));
	const used = $derived(utilization(advertised, consumed));

	function onMove(e: PointerEvent) {
		hover = hoverIndexForElement(e.clientX, e.currentTarget as HTMLElement, points.length);
	}
</script>

<MetricPanel value={`${(used * 100).toFixed(0)}%`} label={valueLabel}>
	<BandwidthLegend {advertised} {consumed} {advertisedLabel} {consumedLabel} />
	<TrendChartFrame
		bind:width
		bind:height
		hasData={points.length > 1}
		startLabel={points[0]?.date}
		endLabel={last(points)?.date}
	>
		<svg
			{width}
			{height}
			role="img"
			aria-label="advertised vs consumed bandwidth over time"
			onpointermove={onMove}
			onpointerleave={() => (hover = null)}
		>
			<path d={seriesAreaPath(advertised, consumed, max, width, height)} class="fill" />
			<path d={seriesLinePath(advertised, max, width, height)} class="line cyan" />
			<path d={seriesLinePath(consumed, max, width, height)} class="line green" />
			{#if hover !== null}
				<ChartCursorLine x={chartXAt(hover, points.length, width)} {height} />
				<ChartCursorDot
					x={chartXAt(hover, points.length, width)}
					y={chartYAt(advertised[hover], max, height)}
					tone="cyan"
				/>
				<ChartCursorDot
					x={chartXAt(hover, points.length, width)}
					y={chartYAt(consumed[hover], max, height)}
					tone="green"
				/>
			{/if}
		</svg>
		{#if hover !== null}
			<ChartTooltip left={`${xPercent(hover, points.length)}%`}>
				<span class="tip-d">{points[hover].date}</span>
				<span class="tip-v"><ChartSwatch tone="cyan" />{formatBandwidth(advertised[hover])}</span>
				<span class="tip-v"><ChartSwatch tone="green" />{formatBandwidth(consumed[hover])}</span>
			</ChartTooltip>
		{/if}
	</TrendChartFrame>
</MetricPanel>

<style>
	.tip-d {
		color: #6f8aa3;
		letter-spacing: 0.04em;
	}
	.tip-v {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-variant-numeric: tabular-nums;
	}
	.line {
		fill: none;
		stroke-width: 1.8;
	}
	.cyan {
		stroke: var(--accent-cyan);
	}
	.green {
		stroke: var(--accent-green);
	}
	.fill {
		fill: rgba(0, 212, 255, 0.08);
	}
</style>
