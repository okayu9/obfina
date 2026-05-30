<script lang="ts">
	import { geoNaturalEarth1, geoPath } from 'd3-geo';
	import { scaleSqrt } from 'd3-scale';
	import { select } from 'd3-selection';
	import { zoom, type D3ZoomEvent } from 'd3-zoom';
	import { feature, mesh } from 'topojson-client';
	import worldData from 'world-atlas/countries-110m.json';
	import { COUNTRY_CENTROIDS } from '$lib/country-centroids';
	import { aggregateByCountry, flagEmoji } from '$lib/relay-stats';
	import { roleColor } from '$lib/map-encoding';
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
	const lengthScale = $derived(scaleSqrt().domain([1, maxCount]).range([5, 46]).clamp(true));

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

	const bursts = $derived.by(() => {
		const proj = projection;
		if (!proj) return [];
		const out: {
			code: string;
			x: number;
			y: number;
			len: number;
			spokes: number;
			fill: string;
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
				len: lengthScale(stats.count),
				// More relays → denser burst.
				spokes: Math.max(5, Math.min(28, Math.round(Math.sqrt(stats.count) * 1.4))),
				fill: roleColor(stats),
				count: stats.count
			});
		}
		return out.sort((a, b) => a.len - b.len);
	});

	function spokeLines(b: { x: number; y: number; len: number; spokes: number }): string {
		let d = '';
		for (let i = 0; i < b.spokes; i++) {
			const a = (i / b.spokes) * Math.PI * 2;
			const inner = b.len * 0.18;
			d += `M${(b.x + inner * Math.cos(a)).toFixed(1)},${(b.y + inner * Math.sin(a)).toFixed(1)}`;
			d += `L${(b.x + b.len * Math.cos(a)).toFixed(1)},${(b.y + b.len * Math.sin(a)).toFixed(1)}`;
		}
		return d;
	}

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

			{#each bursts as b (b.code)}
				<g class="burst" class:selected={selection.country === b.code}>
					<path class="spokes" d={spokeLines(b)} stroke={b.fill} />
					<circle class="core" cx={b.x} cy={b.y} r="1.6" fill={b.fill} />
					<circle
						class="hit"
						cx={b.x}
						cy={b.y}
						r={Math.max(b.len, 6)}
						onclick={() => selectCountry(b.code)}
						onkeydown={(e) => onKey(e, b.code)}
						onpointerenter={(e) =>
							(hover = { code: b.code, count: b.count, x: e.clientX, y: e.clientY })}
						onpointermove={(e) => hover && (hover = { ...hover, x: e.clientX, y: e.clientY })}
						onpointerleave={() => (hover = null)}
						role="button"
						tabindex="0"
						aria-label={`${b.code}: ${b.count} relays`}
					/>
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
	.spokes {
		fill: none;
		stroke-width: 1;
		stroke-opacity: 0.75;
		stroke-linecap: round;
		pointer-events: none;
		filter: drop-shadow(0 0 2px currentColor);
	}
	.core {
		pointer-events: none;
	}
	.hit {
		fill: transparent;
		cursor: pointer;
	}
	.burst.selected .spokes {
		stroke-width: 1.6;
		stroke-opacity: 1;
	}
	.burst.selected .core {
		r: 2.4;
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
