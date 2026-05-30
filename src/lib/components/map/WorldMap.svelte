<script lang="ts">
	import { geoNaturalEarth1, geoPath } from 'd3-geo';
	import { select } from 'd3-selection';
	import { zoom, type D3ZoomEvent } from 'd3-zoom';
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
	let transform = $state('');
	let svgEl = $state<SVGSVGElement | undefined>();
	let hover = $state<{ code: string; count: number; x: number; y: number } | null>(null);

	// Base map geometry (land fill + country borders).
	type World = Parameters<typeof feature>[0] & {
		objects: { land: Parameters<typeof feature>[1]; countries: Parameters<typeof mesh>[1] };
	};
	const topology = worldData as unknown as World;
	const land = feature(topology, topology.objects.land);
	const borders = mesh(topology, topology.objects.countries);

	const byCountry = $derived(aggregateByCountry(relays));
	const maxCount = $derived(Math.max(1, ...[...byCountry.values()].map((s) => s.count)));
	const maxBw = $derived(Math.max(1, ...[...byCountry.values()].map((s) => s.bandwidth)));
	const radius = $derived(makeRadiusScale(maxCount));
	const opacity = $derived(makeOpacityScale(maxBw));

	const projection = $derived.by(() => {
		if (!width || !height) return null;
		return geoNaturalEarth1().fitExtent(
			[
				[10, 10],
				[width - 10, height - 10]
			],
			land
		);
	});

	const path = $derived(projection ? geoPath(projection) : null);
	const landPath = $derived(path ? (path(land) ?? '') : '');
	const bordersPath = $derived(path ? (path(borders) ?? '') : '');

	// One marker per country that has relays and a known centroid.
	const markers = $derived.by(() => {
		if (!projection) return [];
		const out: {
			code: string;
			x: number;
			y: number;
			r: number;
			fill: string;
			opacity: number;
			count: number;
		}[] = [];
		for (const [code, stats] of byCountry) {
			const centroid = COUNTRY_CENTROIDS[code];
			if (!centroid) continue;
			const xy = projection([centroid[1], centroid[0]]);
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
		// Draw larger markers first so small ones stay clickable on top.
		return out.sort((a, b) => b.r - a.r);
	});

	function selectCountry(code: string) {
		selection.country = selection.country === code ? null : code;
	}

	function onMarkerKey(e: KeyboardEvent, code: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			selectCountry(code);
		}
	}

	// Pan/zoom.
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

			{#each markers as m (m.code)}
				<circle
					class="marker"
					class:selected={selection.country === m.code}
					cx={m.x}
					cy={m.y}
					r={m.r}
					fill={m.fill}
					fill-opacity={m.opacity}
					onclick={() => selectCountry(m.code)}
					onkeydown={(e) => onMarkerKey(e, m.code)}
					onpointerenter={(e) =>
						(hover = { code: m.code, count: m.count, x: e.clientX, y: e.clientY })}
					onpointermove={(e) => hover && (hover = { ...hover, x: e.clientX, y: e.clientY })}
					onpointerleave={() => (hover = null)}
					role="button"
					tabindex="0"
					aria-label={`${m.code}: ${m.count} relays`}
				/>
			{/each}
		</g>
	</svg>

	{#if hover}
		<div class="tooltip" style:left="{hover.x}px" style:top="{hover.y}px">
			<span class="t-flag">{flagEmoji(hover.code)}</span>
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

	svg {
		display: block;
	}

	.land {
		fill: #0d1825;
		stroke: none;
	}

	.borders {
		fill: none;
		stroke: #1d3a52;
		stroke-width: 0.5;
		vector-effect: non-scaling-stroke;
	}

	.marker {
		stroke: rgba(255, 255, 255, 0.25);
		stroke-width: 0.5;
		cursor: pointer;
		transition: stroke 0.15s;
		filter: drop-shadow(0 0 4px currentColor);
	}

	.marker:hover {
		stroke: #ffffff;
	}

	.marker.selected {
		stroke: #ffffff;
		stroke-width: 1.5;
	}
</style>
