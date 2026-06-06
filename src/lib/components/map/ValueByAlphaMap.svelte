<script lang="ts">
	import { geoPath } from 'd3-geo';
	import { select } from 'd3-selection';
	import { zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
	import { aggregateByCountry, type CountryStats } from '$lib/relay-stats';
	import {
		countryHover,
		movedBeyondClickThreshold,
		type CountryHover,
		type PointerPosition
	} from '$lib/map-interaction';
	import { buildCountryMapShapes } from '$lib/map-shapes';
	import MapWorldCopy from '$lib/components/map/MapWorldCopy.svelte';
	import MapSimulationLayer from '$lib/components/map/MapSimulationLayer.svelte';
	import MapTooltip from '$lib/components/map/MapTooltip.svelte';
	import { selection } from '$lib/stores/selection.svelte';
	import type { Relay, RelaySimulationEntry } from '$lib/types';
	import {
		codeForId,
		constrainedMapPanY,
		countryBorders,
		countryFeatures,
		makeProjection,
		pathForCountryFeature,
		visibleMapYBounds,
		worldPixelWidth,
		wrappedRootTransform
	} from '$lib/geo/world';

	let {
		relays,
		countryStats = [],
		simulationRelays = relays
	}: {
		relays: Relay[];
		countryStats?: CountryStats[];
		simulationRelays?: RelaySimulationEntry[];
	} = $props();

	let width = $state(0);
	let height = $state(0);
	let svgEl = $state<SVGSVGElement | undefined>();
	let hover = $state<CountryHover | null>(null);
	let zt = $state({ x: 0, y: 0, k: 1 });

	const byCountry = $derived(
		countryStats.length
			? new Map(countryStats.map((stats) => [stats.country, stats]))
			: aggregateByCountry(relays)
	);

	const projection = $derived.by(() => {
		if (!width || !height) return null;
		return makeProjection(width, height);
	});
	const path = $derived(projection ? geoPath(projection) : null);
	const bordersPath = $derived(path ? (path(countryBorders) ?? '') : '');

	// One world's pixel width (a full 360° of longitude) at scale 1.
	const worldW = $derived(projection ? worldPixelWidth(projection) : 0);
	const mapYBounds = $derived(projection ? visibleMapYBounds(projection) : [0, 0]);
	const mapTop = $derived(mapYBounds[0]);
	const mapBottom = $derived(mapYBounds[1]);

	// Side copies left/right of the centre so horizontal panning never shows an edge.
	const COPIES = [-1, 0, 1, 2];

	// Horizontal position wrapped into one period; vertical taken as-is (already
	// clamped by the zoom constraint below).
	const rootTransform = $derived(wrappedRootTransform(zt, worldW));

	const shapes = $derived.by(() => {
		if (!path) return [];
		return buildCountryMapShapes(
			countryFeatures,
			(feature) => pathForCountryFeature(path, feature),
			byCountry,
			codeForId
		);
	});

	function selectCountry(code: string | null) {
		if (code) selection.country = selection.country === code ? null : code;
	}
	// Clicking a country selects it without bubbling to the background deselect.
	function onCountryClick(e: MouseEvent, code: string | null) {
		e.stopPropagation();
		selectCountry(code);
	}
	function onEnter(e: PointerEvent, code: string | null, stats: CountryStats | null) {
		hover = stats ? countryHover(code, stats.count, { x: e.clientX, y: e.clientY }) : null;
	}
	function onEnterEmpty(e: PointerEvent, code: string | null) {
		hover = countryHover(code, 0, { x: e.clientX, y: e.clientY });
	}
	function moveHover(e: PointerEvent) {
		if (hover) hover = { ...hover, x: e.clientX, y: e.clientY };
	}

	// Background click (ocean or a country with no data) deselects — but not when
	// the click was actually a pan/drag.
	let downAt: PointerPosition | null = null;
	function onBackgroundPointerDown(e: PointerEvent) {
		downAt = { x: e.clientX, y: e.clientY };
	}
	function onBackgroundClick(e: MouseEvent) {
		const moved = movedBeyondClickThreshold(downAt, { x: e.clientX, y: e.clientY });
		downAt = null;
		if (!moved) selection.country = null;
	}
	function onKey(e: KeyboardEvent, code: string | null) {
		if (code && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			selectCountry(code);
		}
	}

	$effect(() => {
		if (!svgEl) return;
		const z = zoom<SVGSVGElement, unknown>()
			.scaleExtent([1, 8])
			// Clamp vertical pan so you cannot scroll past either pole; leave
			// horizontal free (it wraps via rootTransform).
			.constrain((t) => {
				const y = constrainedMapPanY(t.y, t.k, height, mapTop, mapBottom);
				return y === t.y ? t : zoomIdentity.translate(t.x, y).scale(t.k);
			})
			.on('zoom', (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
				zt = { x: e.transform.x, y: e.transform.y, k: e.transform.k };
			});
		select(svgEl).call(z);
	});
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
	<svg
		bind:this={svgEl}
		{width}
		{height}
		role="presentation"
		style:--inv-k={1 / zt.k}
		onpointerdown={onBackgroundPointerDown}
		onclick={onBackgroundClick}
	>
		<g transform={rootTransform}>
			{#each COPIES as offset (offset)}
				<MapWorldCopy
					{offset}
					worldWidth={worldW}
					{shapes}
					{bordersPath}
					selectedCountry={selection.country}
					onemptyenter={onEnterEmpty}
					ondataenter={onEnter}
					onmove={moveHover}
					onleave={() => (hover = null)}
					oncountryclick={onCountryClick}
					onkey={onKey}
				/>
			{/each}
		</g>
	</svg>

	<MapSimulationLayer
		relays={simulationRelays}
		{width}
		{height}
		{rootTransform}
		worldWidth={worldW}
		copies={COPIES}
	/>

	{#if hover}
		<MapTooltip {hover} />
	{/if}
</div>

<style>
	.map {
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at 50% 40%, #122436 0%, #0a141f 70%, #070d16 100%);
	}
	svg {
		display: block;
	}
</style>
