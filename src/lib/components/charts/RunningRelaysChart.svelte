<script lang="ts">
	import {
		chartXAt,
		chartYAt,
		compactNumber,
		hoverIndexForElement,
		last,
		seriesLinePath,
		xPercent
	} from '$lib/chart';
	import ChartCursorDot from '$lib/components/charts/ChartCursorDot.svelte';
	import ChartCursorLine from '$lib/components/charts/ChartCursorLine.svelte';
	import ChartTooltip from '$lib/components/charts/ChartTooltip.svelte';
	import MetricPanel from '$lib/components/charts/MetricPanel.svelte';
	import TrendChartFrame from '$lib/components/charts/TrendChartFrame.svelte';

	let {
		points,
		valueLabel,
		relayLabel
	}: {
		points: { date: string; relays: number }[];
		valueLabel: string;
		relayLabel: string;
	} = $props();

	let width = $state(0);
	let height = $state(0);
	let hover = $state<number | null>(null);

	const values = $derived(points.map((point) => point.relays));
	const max = $derived(Math.max(1, ...values));

	function onMove(e: PointerEvent) {
		hover = hoverIndexForElement(e.clientX, e.currentTarget as HTMLElement, values.length);
	}
</script>

<MetricPanel value={compactNumber(last(values) ?? 0)} label={valueLabel}>
	<TrendChartFrame
		bind:width
		bind:height
		hasData={values.length > 1}
		startLabel={points[0]?.date}
		endLabel={last(points)?.date}
	>
		<svg
			{width}
			{height}
			role="img"
			aria-label="running relays over time"
			onpointermove={onMove}
			onpointerleave={() => (hover = null)}
		>
			<path d={seriesLinePath(values, max, width, height)} class="line cyan" />
			{#if hover !== null}
				<ChartCursorLine x={chartXAt(hover, values.length, width)} {height} />
				<ChartCursorDot
					x={chartXAt(hover, values.length, width)}
					y={chartYAt(values[hover], max, height)}
					tone="cyan"
				/>
			{/if}
		</svg>
		{#if hover !== null}
			<ChartTooltip left={`${xPercent(hover, values.length)}%`}>
				<span class="tip-d">{points[hover].date}</span>
				<span class="tip-v">{compactNumber(values[hover])} {relayLabel}</span>
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
</style>
