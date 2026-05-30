<script lang="ts">
	import { geoNaturalEarth1, geoPath } from 'd3-geo';
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
	const bordersPath = $derived(path ? (path(borders) ?? '') : '');

	// Pointy-top hex grid sized so Europe has room to spread.
	const R = $derived(Math.max(8, Math.min(width, height) / 42));
	const hexW = $derived(Math.sqrt(3) * R);
	const rowH = $derived(1.5 * R);

	function hexCenter(col: number, row: number): [number, number] {
		return [col * hexW + (row & 1 ? hexW / 2 : 0), row * rowH + R];
	}

	const hexes = $derived.by(() => {
		const proj = projection;
		if (!proj || !width) return [];
		// Bigger countries claim their ideal cell first.
		const entries = [...byCountry.entries()]
			.filter(([code]) => COUNTRY_CENTROIDS[code])
			.sort((a, b) => b[1].count - a[1].count);

		// Local to this computation, not reactive state.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const occupied = new Set<string>();
		const out: {
			code: string;
			cx: number;
			cy: number;
			fill: string;
			opacity: number;
			count: number;
		}[] = [];

		for (const [code, stats] of entries) {
			const c = COUNTRY_CENTROIDS[code];
			const xy = proj([c[1], c[0]]);
			if (!xy) continue;
			const row0 = Math.round((xy[1] - R) / rowH);
			const col0 = Math.round((xy[0] - (row0 & 1 ? hexW / 2 : 0)) / hexW);

			// Spiral out to the nearest free cell.
			let best: [number, number] | null = null;
			for (let d = 0; d < 12 && !best; d++) {
				let bestDist = Infinity;
				for (let dr = -d; dr <= d; dr++) {
					for (let dc = -d; dc <= d; dc++) {
						if (Math.max(Math.abs(dr), Math.abs(dc)) !== d) continue;
						const col = col0 + dc;
						const row = row0 + dr;
						const key = `${col},${row}`;
						if (occupied.has(key)) continue;
						const [hx, hy] = hexCenter(col, row);
						const dist = (hx - xy[0]) ** 2 + (hy - xy[1]) ** 2;
						if (dist < bestDist) {
							bestDist = dist;
							best = [col, row];
						}
					}
				}
			}
			if (!best) continue;
			occupied.add(`${best[0]},${best[1]}`);
			const [cx, cy] = hexCenter(best[0], best[1]);
			out.push({
				code,
				cx,
				cy,
				fill: roleColor(stats),
				opacity: 0.25 + (Math.sqrt(stats.count) / Math.sqrt(maxCount)) * 0.75,
				count: stats.count
			});
		}
		return out;
	});

	function hexPath(cx: number, cy: number): string {
		let p = '';
		for (let i = 0; i < 6; i++) {
			const a = (Math.PI / 180) * (60 * i - 90);
			p += `${i ? 'L' : 'M'}${(cx + R * 0.92 * Math.cos(a)).toFixed(1)},${(cy + R * 0.92 * Math.sin(a)).toFixed(1)}`;
		}
		return p + 'Z';
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
			<path class="borders" d={bordersPath} />

			{#each hexes as h (h.code)}
				<path
					class="hex"
					class:selected={selection.country === h.code}
					d={hexPath(h.cx, h.cy)}
					fill={h.fill}
					fill-opacity={h.opacity}
					onclick={() => selectCountry(h.code)}
					onkeydown={(e) => onKey(e, h.code)}
					onpointerenter={(e) =>
						(hover = { code: h.code, count: h.count, x: e.clientX, y: e.clientY })}
					onpointermove={(e) => hover && (hover = { ...hover, x: e.clientX, y: e.clientY })}
					onpointerleave={() => (hover = null)}
					role="button"
					tabindex="0"
					aria-label={`${h.code}: ${h.count} relays`}
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
		stroke: #142434;
		stroke-width: 0.4;
		vector-effect: non-scaling-stroke;
		pointer-events: none;
	}
	.hex {
		cursor: pointer;
		stroke: rgba(8, 14, 22, 0.8);
		stroke-width: 1;
		filter: drop-shadow(0 0 3px currentColor);
	}
	.hex:hover {
		stroke: #ffffff;
		stroke-width: 1.25;
	}
	.hex.selected {
		stroke: #ffffff;
		stroke-width: 1.5;
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
