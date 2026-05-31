<script lang="ts">
	import { geoEquirectangular, geoPath } from 'd3-geo';
	import { scaleSqrt } from 'd3-scale';
	import { select } from 'd3-selection';
	import { zoom, zoomIdentity, type D3ZoomEvent } from 'd3-zoom';
	import isoCountries from 'i18n-iso-countries';
	import { feature, mesh } from 'topojson-client';
	import worldData from 'world-atlas/countries-110m.json';
	import { aggregateByCountry, countryName, flagEmoji, type CountryStats } from '$lib/relay-stats';
	import { roleColor } from '$lib/map-encoding';
	import { selection } from '$lib/stores/selection.svelte';
	import type { Relay } from '$lib/types';

	let { relays }: { relays: Relay[] } = $props();

	let width = $state(0);
	let height = $state(0);
	let svgEl = $state<SVGSVGElement | undefined>();
	let hover = $state<{ code: string; count: number; x: number; y: number } | null>(null);
	let zt = $state({ x: 0, y: 0, k: 1 });

	const topology = worldData as unknown as Parameters<typeof feature>[0];
	const countriesFc = feature(topology, topology.objects.countries as never) as unknown as {
		features: { id?: string | number; properties: Record<string, unknown> }[];
	};
	const borders = mesh(topology, topology.objects.countries as never);
	const SPHERE = { type: 'Sphere' } as const;

	function codeFor(id?: string | number): string | null {
		if (id == null) return null;
		const a2 = isoCountries.numericToAlpha2(String(id));
		return a2 ? a2.toLowerCase() : null;
	}

	const byCountry = $derived(aggregateByCountry(relays));
	const maxCount = $derived(Math.max(1, ...[...byCountry.values()].map((s) => s.count)));
	const weight = $derived(scaleSqrt().domain([1, maxCount]).range([0.18, 1]).clamp(true));

	// Clip Antarctica (below −60°) so it doesn't waste vertical space.
	const BOUNDS_NO_ANTARCTICA = {
		type: 'Feature',
		geometry: {
			type: 'Polygon',
			coordinates: [[[-180, -60], [180, -60], [180, 90], [-180, 90], [-180, -60]]]
		},
		properties: {}
	};

	// Equirectangular so the map is a clean rectangle that tiles horizontally.
	// fitSize against the clipped bounding box so the visible world fills the height.
	const projection = $derived.by(() => {
		if (!width || !height) return null;
		const p = geoEquirectangular();
		p.fitSize([width, height], BOUNDS_NO_ANTARCTICA as never);
		return p;
	});
	const path = $derived(projection ? geoPath(projection) : null);
	const bordersPath = $derived(path ? (path(borders) ?? '') : '');

	// One world's pixel width (a full 360° of longitude) at scale 1.
	const worldW = $derived(projection ? projection([180, 0])![0] - projection([-180, 0])![0] : 0);
	const mapTop = $derived(projection ? geoPath(projection).bounds(SPHERE)[0][1] : 0);
	const mapBottom = $derived(projection ? geoPath(projection).bounds(SPHERE)[1][1] : 0);

	// Side copies left/right of the centre so horizontal panning never shows an edge.
	const COPIES = [-1, 0, 1, 2];

	// Horizontal position wrapped into one period; vertical taken as-is (already
	// clamped by the zoom constraint below).
	const rootTransform = $derived.by(() => {
		const period = worldW * zt.k || 1;
		let x = zt.x % period;
		if (x > 0) x -= period;
		return `translate(${x} ${zt.y}) scale(${zt.k})`;
	});

	const shapes = $derived.by(() => {
		if (!path) return [];
		return countriesFc.features.map((f) => {
			const code = codeFor(f.id);
			const stats = code ? (byCountry.get(code) ?? null) : null;
			return {
				code,
				d: path(f as never) ?? '',
				stats,
				glow: stats ? roleColor(stats) : null,
				opacity: stats ? weight(stats.count) : 0
			};
		});
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
		if (code && stats) hover = { code, count: stats.count, x: e.clientX, y: e.clientY };
	}

	// Background click (ocean or a country with no data) deselects — but not when
	// the click was actually a pan/drag.
	let downAt: { x: number; y: number } | null = null;
	function onBackgroundPointerDown(e: PointerEvent) {
		downAt = { x: e.clientX, y: e.clientY };
	}
	function onBackgroundClick(e: MouseEvent) {
		if (!downAt) return;
		const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
		downAt = null;
		if (moved <= 6) selection.country = null;
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
				const minY = height - mapBottom * t.k;
				const maxY = -mapTop * t.k;
				const y = Math.max(minY, Math.min(maxY, t.y));
				return y === t.y ? t : zoomIdentity.translate(t.x, y).scale(t.k);
			})
			.on('zoom', (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
				zt = { x: e.transform.x, y: e.transform.y, k: e.transform.k };
			});
		select(svgEl).call(z);
	});
</script>

{#snippet world(offset: number)}
	<g transform="translate({offset * worldW} 0)">
		{#each shapes as s (s.code ?? s.d.slice(0, 12))}
			<path class="land" d={s.d} />
		{/each}
		<path class="borders" d={bordersPath} />
		{#each shapes as s (`g-${s.code ?? s.d.slice(0, 12)}`)}
			{#if s.stats && s.glow}
				<path
					class="data"
					class:selected={s.code && selection.country === s.code}
					d={s.d}
					fill={s.glow}
					fill-opacity={s.opacity}
					onclick={(e) => onCountryClick(e, s.code)}
					onkeydown={(e) => onKey(e, s.code)}
					onpointerenter={(e) => onEnter(e, s.code, s.stats)}
					onpointermove={(e) => hover && (hover = { ...hover, x: e.clientX, y: e.clientY })}
					onpointerleave={() => (hover = null)}
					role="button"
					tabindex="0"
					aria-label={`${s.code}: ${s.stats.count} relays`}
				/>
			{/if}
		{/each}
	</g>
{/snippet}

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
				{@render world(offset)}
			{/each}
		</g>
	</svg>

	{#if hover}
		<div class="tooltip" style:left="{hover.x}px" style:top="{hover.y}px">
			<span>{flagEmoji(hover.code)}</span>
			<span class="t-name">{countryName(hover.code)}</span>
			<span class="t-count">{hover.count.toLocaleString()}</span>
		</div>
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
	.land {
		fill: #20384c;
		stroke: none;
	}
	/* Stroke widths are divided by the zoom scale (var(--inv-k) = 1 / k) so they
	   keep a constant on-screen thickness regardless of zoom. */
	.borders {
		fill: none;
		stroke: #3a5d78;
		stroke-width: calc(0.5px * var(--inv-k, 1));
		stroke-opacity: 0.8;
		pointer-events: none;
	}
	.data {
		cursor: pointer;
		stroke: none;
	}
	/* Suppress the browser focus rectangle (it boxes the element's scaled bbox,
	   so it balloons when zoomed); use our own outline-stroke for keyboard focus. */
	.data:focus {
		outline: none;
	}
	.data:hover,
	.data:focus-visible {
		stroke: #ffffff;
		stroke-width: calc(0.75px * var(--inv-k, 1));
	}
	.data.selected {
		stroke: #ffffff;
		stroke-width: calc(1.25px * var(--inv-k, 1));
	}
	.tooltip {
		position: fixed;
		transform: translate(14px, -50%);
		pointer-events: none;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.3rem 0.6rem;
		background: rgba(8, 14, 22, 0.9);
		border: 1px solid rgba(0, 212, 255, 0.25);
		border-radius: 6px;
		font-size: 0.8rem;
		white-space: nowrap;
		backdrop-filter: blur(6px);
	}
	.t-name {
		color: #e6f1ff;
	}
	.t-count {
		color: var(--accent-cyan);
		font-variant-numeric: tabular-nums;
	}
</style>
