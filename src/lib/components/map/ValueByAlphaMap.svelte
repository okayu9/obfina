<script lang="ts">
	import { geoNaturalEarth1, geoPath } from 'd3-geo';
	import { scaleSqrt } from 'd3-scale';
	import { select } from 'd3-selection';
	import { zoom, type D3ZoomEvent } from 'd3-zoom';
	import isoCountries from 'i18n-iso-countries';
	import { feature, mesh } from 'topojson-client';
	import worldData from 'world-atlas/countries-110m.json';
	import { aggregateByCountry, flagEmoji, type CountryStats } from '$lib/relay-stats';
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
	const countriesFc = feature(topology, topology.objects.countries as never) as unknown as {
		features: { id?: string | number; properties: Record<string, unknown> }[];
	};
	const borders = mesh(topology, topology.objects.countries as never);

	function codeFor(id?: string | number): string | null {
		if (id == null) return null;
		const a2 = isoCountries.numericToAlpha2(String(id));
		return a2 ? a2.toLowerCase() : null;
	}

	const byCountry = $derived(aggregateByCountry(relays));
	const maxCount = $derived(Math.max(1, ...[...byCountry.values()].map((s) => s.count)));
	// Value-by-alpha: opacity is the "weight" (relay count). Low-count countries
	// fade into the black background; hue (exit share) only reads where weight is high.
	const weight = $derived(scaleSqrt().domain([1, maxCount]).range([0.06, 1]).clamp(true));

	const projection = $derived.by(() => {
		if (!width || !height) return null;
		return geoNaturalEarth1().fitExtent(
			[
				[10, 10],
				[width - 10, height - 10]
			],
			borders
		);
	});
	const path = $derived(projection ? geoPath(projection) : null);
	const bordersPath = $derived(path ? (path(borders) ?? '') : '');

	const shapes = $derived.by(() => {
		if (!path) return [];
		return countriesFc.features.map((f) => {
			const code = codeFor(f.id);
			const stats = code ? byCountry.get(code) : undefined;
			return {
				code,
				d: path(f as never) ?? '',
				stats: stats ?? null,
				fill: stats ? roleColor(stats) : '#000000',
				opacity: stats ? weight(stats.count) : 0
			};
		});
	});

	function selectCountry(code: string | null) {
		if (code) selection.country = selection.country === code ? null : code;
	}
	function onEnter(e: PointerEvent, code: string | null, stats: CountryStats | null) {
		if (code && stats) hover = { code, count: stats.count, x: e.clientX, y: e.clientY };
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
			.on('zoom', (e: D3ZoomEvent<SVGSVGElement, unknown>) => {
				transform = e.transform.toString();
			});
		select(svgEl).call(z);
	});
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
	<svg bind:this={svgEl} {width} {height} role="presentation">
		<g {transform}>
			<path class="graticule" d={bordersPath} />
			{#each shapes as s (s.code ?? s.d.slice(0, 12))}
				<path
					class="country"
					class:has-data={!!s.stats}
					class:selected={s.code && selection.country === s.code}
					d={s.d}
					fill={s.fill}
					fill-opacity={s.opacity}
					onclick={() => selectCountry(s.code)}
					onkeydown={(e) => onKey(e, s.code)}
					onpointerenter={(e) => onEnter(e, s.code, s.stats)}
					onpointermove={(e) => hover && (hover = { ...hover, x: e.clientX, y: e.clientY })}
					onpointerleave={() => (hover = null)}
					role={s.stats ? 'button' : 'presentation'}
					tabindex={s.stats ? 0 : -1}
					aria-label={s.code && s.stats ? `${s.code}: ${s.stats.count} relays` : undefined}
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
		background: #000000;
	}
	svg {
		display: block;
	}
	.graticule {
		fill: none;
		stroke: #0e1a24;
		stroke-width: 0.4;
		vector-effect: non-scaling-stroke;
		pointer-events: none;
	}
	.country {
		stroke: none;
	}
	.country.has-data {
		cursor: pointer;
	}
	.country.has-data:hover {
		stroke: #ffffff;
		stroke-width: 0.75;
		vector-effect: non-scaling-stroke;
	}
	.country.selected {
		stroke: #ffffff;
		stroke-width: 1.25;
		vector-effect: non-scaling-stroke;
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
