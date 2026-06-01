<script lang="ts">
	import type { PathBiasCurves, PathBiasMarkerPoint } from '$lib/analysis/path-bias';
	import { clampPathFraction } from '$lib/analysis/path-bias';
	import { curvePath, pointerMappedValue } from '$lib/chart';
	import PlotFrame from '$lib/components/charts/PlotFrame.svelte';

	let {
		curves,
		markerPoint,
		startLabel,
		endLabel,
		onfraction
	}: {
		curves: PathBiasCurves;
		markerPoint: PathBiasMarkerPoint;
		startLabel: string;
		endLabel: string;
		onfraction: (fraction: number) => void;
	} = $props();

	let svgEl = $state<SVGSVGElement | undefined>();
	let dragging = $state(false);

	function setFromEvent(e: PointerEvent) {
		const fraction = pointerMappedValue(e, svgEl, clampPathFraction);
		if (fraction !== null) onfraction(fraction);
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

<PlotFrame {startLabel} {endLabel} width="min(38vh, 360px)">
	<svg
		bind:this={svgEl}
		viewBox="0 0 100 100"
		preserveAspectRatio="none"
		role="img"
		aria-label="relay concentration curve"
		onpointerdown={onDown}
		onpointermove={onMove}
		onpointerup={onUp}
		onpointerleave={onUp}
	>
		<line x1="0" y1="100" x2="100" y2="0" class="equality" vector-effect="non-scaling-stroke" />
		<path d={curvePath(curves.guard)} class="line guard" vector-effect="non-scaling-stroke" />
		<path d={curvePath(curves.exit)} class="line exit" vector-effect="non-scaling-stroke" />
		<path d={curvePath(curves.consensus)} class="line main" vector-effect="non-scaling-stroke" />

		<line
			x1={markerPoint.x}
			y1="0"
			x2={markerPoint.x}
			y2="100"
			class="marker"
			vector-effect="non-scaling-stroke"
		/>
		<circle cx={markerPoint.x} cy={markerPoint.y} r="2.4" class="dot" />
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
	}
	.line.main {
		stroke: #e6f1ff;
		stroke-width: 2.4;
	}
	.line.guard {
		stroke: var(--accent-cyan);
		stroke-width: 1.4;
		opacity: 0.55;
	}
	.line.exit {
		stroke: var(--accent-green);
		stroke-width: 1.4;
		opacity: 0.55;
	}
	.marker {
		stroke: rgba(230, 241, 255, 0.5);
		stroke-width: 1;
	}
	.dot {
		fill: #fff;
	}
</style>
