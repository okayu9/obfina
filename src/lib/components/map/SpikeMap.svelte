<script lang="ts">
	import { geoNaturalEarth1, geoPath } from 'd3-geo';
	import { scaleSqrt } from 'd3-scale';
	import { select } from 'd3-selection';
	import { zoom, type D3ZoomEvent } from 'd3-zoom';
	import { feature, mesh } from 'topojson-client';
	import worldData from 'world-atlas/countries-110m.json';
	import { COUNTRY_CENTROIDS } from '$lib/country-centroids';
	import { aggregateByCountry, flagEmoji } from '$lib/relay-stats';
	import { makeOpacityScale, roleColor } from '$lib/map-encoding';
	import { selection } from '$lib/stores/selection.svelte';
	import type { Relay } from '$lib/types';

	let { relays }: { relays: Relay[] } = $props();

	let width = $state(0);
	let height = $state(0);
	let transform = $state('');
	let svgEl = $state<SVGSVGElement | undefined>();
	let hover = $state<{ code: string; count: number; x: number; y: number } | null>(null);

	const topology = worldData as unknown as Parameters<typeof feature>[0];
	const land = feature(topology, topology.objects.land as never);
	const borders = mesh(topology, topology.objects.countries as never);

	const byCountry = $derived(aggregateByCountry(relays));
	const maxCount = $derived(Math.max(1, ...[...byCountry.values()].map((s) => s.count)));
	const maxBw = $derived(Math.max(1, ...[...byCountry.values()].map((s) => s.bandwidth)));
	// Spike height encodes relay count (sqrt so the US doesn't dwarf everything).
	const heightScale = $derived(scaleSqrt().domain([1, maxCount]).range([6, 150]).clamp(true));
	const opacity = $derived(makeOpacityScale(maxBw));

	const projection = $derived.by(() => {
		if (!width || !height) return null;
		return geoNaturalEarth1().fitExtent(
			[
				[10, 10],
				[width - 10, height - 10]
			],
			land as never
		);
	});
	const path = $derived(projection ? geoPath(projection) : null);
	const landPath = $derived(path ? (path(land as never) ?? '') : '');
	const bordersPath = $derived(path ? (path(borders) ?? '') : '');

	const HALF_W = 3.5;
	const spikes = $derived.by(() => {
		const proj = projection;
		if (!proj) return [];
		const out: {
			code: string;
			x: number;
			y: number;
			h: number;
			fill: string;
			opacity: number;
			count: number;
		}[] = [];
		for (const [code, stats] of byCountry) {
			const c = COUNTRY_CENTROIDS[code];
			if (!c) continue;
			const xy = proj([c[1], c[0]]);
			if (!xy) continue;
			out.push({
				code,
				x: xy[0],
				y: xy[1],
				h: heightScale(stats.count),
				fill: roleColor(stats),
				opacity: opacity(stats.bandwidth),
				count: stats.count
			});
		}
		// Render shorter spikes first so taller ones overlap on top.
		return out.sort((a, b) => a.h - b.h);
	});

	function selectCountry(code: string) {
		selection.country = selection.country === code ? null : code;
	}
	function onKey(e: KeyboardEvent, code: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			selectCountry(code);
		}
	}

	$effect(() => {
		if (!svgEl) return;
		const z = zoom<SVGSVGElement, unknown>()
			.scaleExtent([1, 8])
			.on('zoom', (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
				transform = e.transform.toString();
			});
		select(svgEl).call(z);
	});
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
	<svg bind:this={svgEl} {width} {height} role="presentation">
		<g {transform}>
			<path class="land" d={landPath} />
			<path class="borders" d={bordersPath} />

			{#each spikes as s (s.code)}
				<path
					class="spike"
					class:selected={selection.country === s.code}
					d={`M${s.x - HALF_W},${s.y} L${s.x},${s.y - s.h} L${s.x + HALF_W},${s.y} Z`}
					fill={s.fill}
					fill-opacity={s.opacity}
					onclick={() => selectCountry(s.code)}
					onkeydown={(e) => onKey(e, s.code)}
					onpointerenter={(e) =>
						(hover = { code: s.code, count: s.count, x: e.clientX, y: e.clientY })}
					onpointermove={(e) => hover && (hover = { ...hover, x: e.clientX, y: e.clientY })}
					onpointerleave={() => (hover = null)}
					role="button"
					tabindex="0"
					aria-label={`${s.code}: ${s.count} relays`}
				/>
			{/each}
		</g>
	</svg>

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
	.spike {
		cursor: pointer;
		stroke: rgba(255, 255, 255, 0.15);
		stroke-width: 0.4;
		vector-effect: non-scaling-stroke;
		filter: drop-shadow(0 0 3px currentColor);
	}
	.spike:hover {
		stroke: #ffffff;
		stroke-width: 1;
	}
	.spike.selected {
		stroke: #ffffff;
		stroke-width: 1.25;
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
