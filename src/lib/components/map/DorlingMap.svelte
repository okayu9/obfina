<script lang="ts">
	import { geoNaturalEarth1, geoPath } from 'd3-geo';
	import { forceCollide, forceSimulation, forceX, forceY } from 'd3-force';
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

	// Settle bubbles with a collision force so none overlap, pulled toward each
	// country's true projected position.
	const nodes = $derived.by(() => {
		const proj = projection;
		if (!proj) return [];
		type N = {
			code: string;
			x: number;
			y: number;
			x0: number;
			y0: number;
			r: number;
			fill: string;
			opacity: number;
			count: number;
		};
		const data: N[] = [];
		for (const [code, stats] of byCountry) {
			const c = COUNTRY_CENTROIDS[code];
			if (!c) continue;
			const xy = proj([c[1], c[0]]);
			if (!xy) continue;
			data.push({
				code,
				x: xy[0],
				y: xy[1],
				x0: xy[0],
				y0: xy[1],
				r: radius(stats.count),
				fill: roleColor(stats),
				opacity: opacity(stats.bandwidth),
				count: stats.count
			});
		}
		const sim = forceSimulation(data)
			.force('x', forceX<N>((d) => d.x0).strength(0.25))
			.force('y', forceY<N>((d) => d.y0).strength(0.25))
			.force('collide', forceCollide<N>((d) => d.r + 1.2).strength(0.9))
			.stop();
		for (let i = 0; i < 160; i++) sim.tick();
		return data.sort((a, b) => b.r - a.r);
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

			{#each nodes as n (n.code)}
				<g
					class="bubble"
					class:selected={selection.country === n.code}
					onclick={() => selectCountry(n.code)}
					onkeydown={(e) => onKey(e, n.code)}
					onpointerenter={(e) =>
						(hover = { code: n.code, count: n.count, x: e.clientX, y: e.clientY })}
					onpointermove={(e) => hover && (hover = { ...hover, x: e.clientX, y: e.clientY })}
					onpointerleave={() => (hover = null)}
					role="button"
					tabindex="0"
					aria-label={`${n.code}: ${n.count} relays`}
				>
					<circle cx={n.x} cy={n.y} r={n.r} fill={n.fill} fill-opacity={n.opacity} />
					{#if n.r >= 7}
						<text
							class="label"
							x={n.x}
							y={n.y}
							font-size={Math.min(n.r * 0.9, 15)}
							dominant-baseline="central"
							text-anchor="middle">{n.code.toUpperCase()}</text
						>
					{/if}
				</g>
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
	.bubble {
		cursor: pointer;
	}
	.bubble circle {
		stroke: rgba(255, 255, 255, 0.25);
		stroke-width: 0.5;
		filter: drop-shadow(0 0 4px currentColor);
	}
	.bubble:hover circle {
		stroke: #ffffff;
	}
	.bubble.selected circle {
		stroke: #ffffff;
		stroke-width: 1.5;
	}
	.label {
		fill: #03121d;
		font-weight: 700;
		letter-spacing: 0.02em;
		pointer-events: none;
		paint-order: stroke;
		stroke: rgba(255, 255, 255, 0.35);
		stroke-width: 0.4;
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
