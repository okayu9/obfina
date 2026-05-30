<script lang="ts">
	import { geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
	import { feature, mesh } from 'topojson-client';
	import worldData from 'world-atlas/countries-110m.json';
	import { COUNTRY_CENTROIDS } from '$lib/country-centroids';
	import { aggregateByCountry, flagEmoji } from '$lib/relay-stats';
	import { makeOpacityScale, makeRadiusScale, roleColor } from '$lib/map-encoding';
	import { selection } from '$lib/stores/selection.svelte';
	import type { Relay } from '$lib/types';

	let { relays }: { relays: Relay[] } = $props();

	let width = $state(0);
	let height = $state(0);
	let hover = $state<{ code: string; count: number; x: number; y: number } | null>(null);

	const INSET_W = 360;
	const INSET_H = 300;
	// Europe bounding box [lon, lat].
	const EUROPE_BOX = {
		type: 'Polygon' as const,
		coordinates: [
			[
				[-12, 34],
				[42, 34],
				[42, 71],
				[-12, 71],
				[-12, 34]
			]
		]
	};

	const topology = worldData as unknown as Parameters<typeof feature>[0];
	const land = feature(topology, topology.objects.land as never);
	const borders = mesh(topology, topology.objects.countries as never);

	const byCountry = $derived(aggregateByCountry(relays));
	const maxCount = $derived(Math.max(1, ...[...byCountry.values()].map((s) => s.count)));
	const maxBw = $derived(Math.max(1, ...[...byCountry.values()].map((s) => s.bandwidth)));
	const radius = $derived(makeRadiusScale(maxCount));
	const opacity = $derived(makeOpacityScale(maxBw));

	const worldProj = $derived.by(() => {
		if (!width || !height) return null;
		return geoNaturalEarth1().fitExtent(
			[
				[10, 10],
				[width - 10, height - 10]
			],
			land as never
		);
	});
	const europeProj = $derived(
		geoMercator().fitExtent(
			[
				[8, 8],
				[INSET_W - 8, INSET_H - 8]
			],
			EUROPE_BOX
		)
	);

	function pathOf(proj: GeoProjection | null, obj: unknown): string {
		return proj ? (geoPath(proj)(obj as never) ?? '') : '';
	}

	type Marker = {
		code: string;
		x: number;
		y: number;
		r: number;
		fill: string;
		opacity: number;
		count: number;
	};
	function markersFor(proj: GeoProjection | null, europeOnly = false): Marker[] {
		if (!proj) return [];
		const out: Marker[] = [];
		for (const [code, stats] of byCountry) {
			const c = COUNTRY_CENTROIDS[code];
			if (!c) continue;
			if (europeOnly && !(c[1] >= -12 && c[1] <= 42 && c[0] >= 34 && c[0] <= 71)) continue;
			const xy = proj([c[1], c[0]]);
			if (!xy) continue;
			out.push({
				code,
				x: xy[0],
				y: xy[1],
				r: radius(stats.count),
				fill: roleColor(stats),
				opacity: opacity(stats.bandwidth),
				count: stats.count
			});
		}
		return out.sort((a, b) => b.r - a.r);
	}

	const worldMarkers = $derived(markersFor(worldProj));
	const europeMarkers = $derived(markersFor(europeProj, true));

	function selectCountry(code: string) {
		selection.country = selection.country === code ? null : code;
	}
	function onKey(e: KeyboardEvent, code: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			selectCountry(code);
		}
	}
	function setHover(e: PointerEvent, m: { code: string; count: number } | null) {
		hover = m ? { code: m.code, count: m.count, x: e.clientX, y: e.clientY } : null;
	}
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
	<svg {width} {height} role="presentation">
		<path class="land" d={pathOf(worldProj, land)} />
		<path class="borders" d={pathOf(worldProj, borders)} />
		{#each worldMarkers as m (m.code)}
			<circle
				class="bubble"
				class:selected={selection.country === m.code}
				cx={m.x}
				cy={m.y}
				r={m.r}
				fill={m.fill}
				fill-opacity={m.opacity}
				onclick={() => selectCountry(m.code)}
				onkeydown={(e) => onKey(e, m.code)}
				onpointerenter={(e) => setHover(e, m)}
				onpointermove={(e) => hover && (hover = { ...hover, x: e.clientX, y: e.clientY })}
				onpointerleave={() => (hover = null)}
				role="button"
				tabindex="0"
				aria-label={`${m.code}: ${m.count} relays`}
			/>
		{/each}
	</svg>

	<!-- Zoomed Europe inset -->
	<div class="inset" style:width="{INSET_W}px" style:height="{INSET_H}px">
		<div class="inset-label">EUROPE</div>
		<svg width={INSET_W} height={INSET_H} role="presentation">
			<path class="borders" d={pathOf(europeProj, borders)} />
			{#each europeMarkers as m (m.code)}
				<circle
					class="bubble"
					class:selected={selection.country === m.code}
					cx={m.x}
					cy={m.y}
					r={m.r}
					fill={m.fill}
					fill-opacity={m.opacity}
					onclick={() => selectCountry(m.code)}
					onkeydown={(e) => onKey(e, m.code)}
					onpointerenter={(e) => setHover(e, m)}
					onpointermove={(e) => hover && (hover = { ...hover, x: e.clientX, y: e.clientY })}
					onpointerleave={() => (hover = null)}
					role="button"
					tabindex="0"
					aria-label={`${m.code}: ${m.count} relays`}
				/>
			{/each}
		</svg>
	</div>

	{#if hover}
		<div class="tooltip" style:left="{hover.x}px" style:top="{hover.y}px">
			<span>{flagEmoji(hover.code)}</span>
			<span class="t-code">{hover.code.toUpperCase()}</span>
			<span class="t-count">{hover.count.toLocaleString()}</span>
		</div>
	{/if}
</div>

<style>
	.map {
		position: fixed;
		inset: 0;
	}
	svg {
		display: block;
	}
	.land {
		fill: #0b1521;
		stroke: none;
	}
	.borders {
		fill: none;
		stroke: #16293a;
		stroke-width: 0.4;
		vector-effect: non-scaling-stroke;
		pointer-events: none;
	}
	.bubble {
		stroke: rgba(255, 255, 255, 0.25);
		stroke-width: 0.5;
		cursor: pointer;
		filter: drop-shadow(0 0 4px currentColor);
	}
	.bubble:hover {
		stroke: #ffffff;
	}
	.bubble.selected {
		stroke: #ffffff;
		stroke-width: 1.5;
	}
	.inset {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		border: 1px solid rgba(0, 212, 255, 0.2);
		border-radius: 10px;
		background: rgba(6, 12, 20, 0.7);
		backdrop-filter: blur(6px);
		overflow: hidden;
	}
	.inset-label {
		position: absolute;
		top: 0.5rem;
		left: 0.7rem;
		font-size: 0.7rem;
		letter-spacing: 0.25em;
		color: #6f8aa3;
		pointer-events: none;
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
	.t-code {
		color: #6f8aa3;
		letter-spacing: 0.1em;
	}
	.t-count {
		color: var(--accent-cyan);
		font-variant-numeric: tabular-nums;
	}
</style>
