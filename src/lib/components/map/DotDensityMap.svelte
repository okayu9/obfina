<script lang="ts">
	import { geoBounds, geoContains, geoNaturalEarth1, geoPath } from 'd3-geo';
	import { select } from 'd3-selection';
	import { zoom, type D3ZoomEvent } from 'd3-zoom';
	import isoCountries from 'i18n-iso-countries';
	import { feature, mesh } from 'topojson-client';
	import worldData from 'world-atlas/countries-110m.json';
	import { aggregateByCountry, flagEmoji } from '$lib/relay-stats';
	import { roleColor } from '$lib/map-encoding';
	import { selection } from '$lib/stores/selection.svelte';
	import type { Relay } from '$lib/types';

	let { relays }: { relays: Relay[] } = $props();

	// 1 dot ≈ this many relays.
	const RELAYS_PER_DOT = 12;

	let width = $state(0);
	let height = $state(0);
	let transform = $state('');
	let svgEl = $state<SVGSVGElement | undefined>();
	let hover = $state<{ code: string; count: number; x: number; y: number } | null>(null);

	const topology = worldData as unknown as Parameters<typeof feature>[0];
	const countriesFc = feature(topology, topology.objects.countries as never) as unknown as {
		features: { id?: string | number; geometry: unknown; properties: Record<string, unknown> }[];
	};
	const borders = mesh(topology, topology.objects.countries as never);

	function codeFor(id?: string | number): string | null {
		if (id == null) return null;
		const a2 = isoCountries.numericToAlpha2(String(id));
		return a2 ? a2.toLowerCase() : null;
	}

	// Seeded RNG so dots are stable across re-renders.
	function rng(seed: number) {
		let s = seed >>> 0;
		return () => {
			s = (s * 1664525 + 1013904223) >>> 0;
			return s / 4294967296;
		};
	}

	const byCountry = $derived(aggregateByCountry(relays));

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

	const dots = $derived.by(() => {
		const proj = projection;
		if (!proj) return [];
		const out: { code: string; x: number; y: number; fill: string }[] = [];
		for (const f of countriesFc.features) {
			const code = codeFor(f.id);
			if (!code) continue;
			const stats = byCountry.get(code);
			if (!stats) continue;
			const n = Math.max(1, Math.round(stats.count / RELAYS_PER_DOT));
			const fill = roleColor(stats);
			const feat = f as never;
			const [[w, s], [e, nn]] = geoBounds(feat);
			const rand = rng(code.charCodeAt(0) * 131 + code.charCodeAt(1));
			let placed = 0;
			let attempts = 0;
			while (placed < n && attempts < n * 40) {
				attempts++;
				const lon = w + rand() * (e - w);
				const lat = s + rand() * (nn - s);
				if (!geoContains(feat, [lon, lat])) continue;
				const xy = proj([lon, lat]);
				if (!xy) continue;
				out.push({ code, x: xy[0], y: xy[1], fill });
				placed++;
			}
		}
		return out;
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

	// Hit layer: invisible country shapes so hover/click still works per country.
	const shapes = $derived.by(() => {
		if (!path) return [];
		return countriesFc.features
			.map((f) => {
				const code = codeFor(f.id);
				const stats = code ? byCountry.get(code) : undefined;
				return code && stats ? { code, d: path(f as never) ?? '', count: stats.count } : null;
			})
			.filter((s): s is { code: string; d: string; count: number } => s !== null);
	});

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
			<path class="borders" d={bordersPath} />

			{#each dots as d, i (i)}
				<circle class="dot" cx={d.x} cy={d.y} r="1.4" fill={d.fill} />
			{/each}

			{#each shapes as s (s.code)}
				<path
					class="hit"
					class:selected={selection.country === s.code}
					d={s.d}
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
	.borders {
		fill: none;
		stroke: #16293a;
		stroke-width: 0.4;
		vector-effect: non-scaling-stroke;
		pointer-events: none;
	}
	.dot {
		pointer-events: none;
		filter: drop-shadow(0 0 1.5px currentColor);
	}
	.hit {
		fill: transparent;
		cursor: pointer;
		stroke: none;
	}
	.hit:hover {
		fill: rgba(255, 255, 255, 0.04);
		stroke: rgba(255, 255, 255, 0.5);
		stroke-width: 0.75;
		vector-effect: non-scaling-stroke;
	}
	.hit.selected {
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
