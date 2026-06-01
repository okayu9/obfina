<script lang="ts">
	import type { LorenzPoint } from '$lib/analysis/concentration';
	import {
		providerCountFromFraction,
		topProviderMarker,
		type CentralizationScope
	} from '$lib/analysis/hosting';
	import { areaPath, curvePath, pointerMappedValue } from '$lib/chart';
	import ChartCursorDot from '$lib/components/charts/ChartCursorDot.svelte';
	import ChartCursorLine from '$lib/components/charts/ChartCursorLine.svelte';
	import PlotFrame from '$lib/components/charts/PlotFrame.svelte';

	let {
		scope,
		all,
		exit,
		providerCount,
		selectedCount,
		selectedShare,
		startLabel,
		endLabel,
		onpick
	}: {
		scope: CentralizationScope;
		all: LorenzPoint[];
		exit: LorenzPoint[];
		providerCount: number;
		selectedCount: number;
		selectedShare: number;
		startLabel: string;
		endLabel: string;
		onpick: (count: number) => void;
	} = $props();

	const marker = $derived(topProviderMarker(providerCount, selectedCount, selectedShare));

	let svgEl = $state<SVGSVGElement | undefined>();
	let dragging = $state(false);

	function setFromEvent(e: PointerEvent) {
		if (providerCount === 0) return;
		const count = pointerMappedValue(e, svgEl, (fraction) =>
			providerCountFromFraction(fraction, providerCount)
		);
		if (count !== null) onpick(count);
	}
	function onDown(e: PointerEvent) {
		dragging = true;
		svgEl?.setPointerCapture(e.pointerId);
		setFromEvent(e);
	}
	function onMove(e: PointerEvent) {
		if (dragging) setFromEvent(e);
	}
	function onUp() {
		dragging = false;
	}
</script>

<PlotFrame {startLabel} {endLabel} width="min(48vh, 440px)" maxHeight="100%">
	<svg
		bind:this={svgEl}
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
		role="img"
		aria-label="Lorenz curves"
		onpointerdown={onDown}
		onpointermove={onMove}
		onpointerup={onUp}
		onpointerleave={onUp}
	>
		<line x1="0" y1="100" x2="100" y2="0" class="equality" vector-effect="non-scaling-stroke" />
		<path d={areaPath(scope === 'all' ? all : exit)} class="fill {scope}" />
		<path
			d={curvePath(all)}
			class="line all"
			class:dim={scope !== 'all'}
			vector-effect="non-scaling-stroke"
		/>
		<path
			d={curvePath(exit)}
			class="line exit"
			class:dim={scope !== 'exit'}
			vector-effect="non-scaling-stroke"
		/>

		{#if providerCount > 0}
			<ChartCursorLine x={marker.x} height={100} />
			<ChartCursorDot x={marker.x} y={marker.y} tone={scope === 'all' ? 'cyan' : 'green'} />
		{/if}
	</svg>
</PlotFrame>

<style>
	.equality {
		stroke: #3a5266;
		stroke-width: 1;
		stroke-dasharray: 3 3;
	}
	.line {
		fill: none;
		stroke-width: 2;
	}
	.line.all {
		stroke: var(--accent-cyan);
	}
	.line.exit {
		stroke: var(--accent-green);
	}
	.line.dim {
		opacity: 0.3;
		stroke-width: 1.2;
	}
	.fill {
		opacity: 0.12;
	}
	.fill.all {
		fill: var(--accent-cyan);
	}
	.fill.exit {
		fill: var(--accent-green);
	}
</style>
