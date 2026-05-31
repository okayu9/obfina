<script lang="ts">
	import { onMount } from 'svelte';
	import { geoPath } from 'd3-geo';
	import { countryFeatures, randomPointInCountry, makeProjection } from '$lib/geo/world';
	import { buildSamplers, sampleCircuit, type Circuit } from '$lib/analysis/circuit';
	import { flagEmoji, countryName } from '$lib/relay-stats';
	import { relayStore } from '$lib/stores/relays.svelte';
	import type { Relay } from '$lib/types';
	import { getMessages } from '$lib/i18n/index.svelte';

	const MAX = 7;
	const LIFE = 5600; // ms a circuit is animated before it fades out
	const SPAWN = 1100; // ms between new circuits

	let width = $state(0);
	let height = $state(0);
	let now = $state(0);

	const projection = $derived(width && height ? makeProjection(width, height) : null);
	const path = $derived(projection ? geoPath(projection) : null);
	const landPaths = $derived(path ? countryFeatures.map((f) => path(f as never) ?? '') : []);

	const samplers = $derived(buildSamplers(relayStore.relays));

	interface Live {
		id: number;
		c: Circuit;
		born: number;
		// random point inside each relay's country polygon, so co-located relays don't stack
		coords: [number, number][];
	}
	let circuits = $state<Live[]>([]);
	let seq = 0;

	function coordOf(r: Relay): [number, number] | null {
		return randomPointInCountry(r.country);
	}

	function spawn() {
		if (relayStore.relays.length === 0) return;
		if (circuits.length >= MAX) return;
		const c = sampleCircuit(samplers);
		if (!c) return;
		const g = coordOf(c.guard);
		const m = coordOf(c.middle);
		const e = coordOf(c.exit);
		if (!g || !m || !e) return;
		circuits = [...circuits, { id: seq++, c, born: performance.now(), coords: [g, m, e] }];
	}

	onMount(() => {
		let raf = 0;
		const tick = () => {
			now = performance.now();
			// cull finished circuits
			const cutoff = now - LIFE;
			if (circuits.some((x) => x.born < cutoff)) {
				circuits = circuits.filter((x) => x.born >= cutoff);
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		const iv = setInterval(spawn, SPAWN);
		// seed a couple immediately once data is present
		const seed = setInterval(() => {
			if (relayStore.relays.length > 0) {
				spawn();
				if (circuits.length >= 3) clearInterval(seed);
			}
		}, 250);
		return () => {
			cancelAnimationFrame(raf);
			clearInterval(iv);
			clearInterval(seed);
		};
	});

	function project(co: [number, number]): [number, number] | null {
		const p = projection?.(co);
		return p ? [p[0], p[1]] : null;
	}
	function lerp(a: number, b: number, t: number): number {
		return a + (b - a) * t;
	}
	/** Position of the travelling packet along guard→middle→exit at progress t. */
	function packet(pts: ([number, number] | null)[], t: number): [number, number] | null {
		const seg = t < 0.5 ? 0 : 1;
		const lt = seg === 0 ? t / 0.5 : (t - 0.5) / 0.5;
		const a = pts[seg];
		const b = pts[seg + 1];
		if (!a || !b) return null;
		return [lerp(a[0], b[0], lt), lerp(a[1], b[1], lt)];
	}
	const progress = (born: number) => Math.min(1, (now - born) / LIFE);
	function fade(born: number): number {
		const t = progress(born);
		if (t < 0.1) return t / 0.1; // fade in
		if (t > 0.85) return (1 - t) / 0.15; // fade out
		return 1;
	}
	const pulse = $derived(2.6 + Math.sin(now / 260) * 0.7);

	const t = $derived(getMessages());
	// Newest active circuit drives the live readout.
	const latest = $derived(circuits.length ? circuits[circuits.length - 1] : null);
	const roles = $derived(
		latest
			? [
					{ key: 'guard', label: t.circuits.guardLabel, r: latest.c.guard },
					{ key: 'middle', label: t.circuits.middleLabel, r: latest.c.middle },
					{ key: 'exit', label: t.circuits.exitLabel, r: latest.c.exit }
				]
			: []
	);
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
	<svg {width} {height} role="presentation">
		{#each landPaths as d, i (i)}
			<path class="land" {d} />
		{/each}

		{#each circuits as live (live.id)}
			{@const pts = live.coords.map(project)}
			{@const op = fade(live.born)}
			{@const pk = packet(pts, progress(live.born))}
			<g style:opacity={op}>
				{#if pts[0] && pts[1]}
					<line x1={pts[0][0]} y1={pts[0][1]} x2={pts[1][0]} y2={pts[1][1]} class="hop a" />
				{/if}
				{#if pts[1] && pts[2]}
					<line x1={pts[1][0]} y1={pts[1][1]} x2={pts[2][0]} y2={pts[2][1]} class="hop b" />
				{/if}
				{#if pts[0]}<circle cx={pts[0][0]} cy={pts[0][1]} r={pulse} class="node guard" />{/if}
				{#if pts[1]}<circle cx={pts[1][0]} cy={pts[1][1]} r={pulse} class="node middle" />{/if}
				{#if pts[2]}<circle cx={pts[2][0]} cy={pts[2][1]} r={pulse} class="node exit" />{/if}
				{#if pk}<circle cx={pk[0]} cy={pk[1]} r="3" class="packet" />{/if}
			</g>
		{/each}
	</svg>

	<div class="hud">
		<div class="title">{t.circuits.title}</div>
		<div class="sub">{t.circuits.subtitle}</div>
	</div>

	{#if latest}
		<aside class="readout">
			{#each roles as role (role.key)}
				<div class="hop-row">
					<i class="dot {role.key}"></i>
					<div class="meta">
						<span class="rl">{role.label}</span>
						<span class="rc">{flagEmoji(role.r.country)} {countryName(role.r.country)}</span>
						<span class="ra">{role.r.asName ?? role.r.as ?? t.circuits.unknownAs}</span>
					</div>
				</div>
			{/each}
		</aside>
	{/if}
</div>

<style>
	.map {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 200px;
		background: radial-gradient(ellipse at 50% 40%, #122436 0%, #0a141f 70%, #070d16 100%);
	}
	svg {
		display: block;
	}
	.land {
		fill: #16293a;
		stroke: #24405a;
		stroke-width: 0.4;
	}
	.hop {
		stroke-width: 1.1;
		stroke-linecap: round;
	}
	.hop.a {
		stroke: rgba(0, 212, 255, 0.55);
	}
	.hop.b {
		stroke: rgba(57, 255, 20, 0.55);
	}
	.node {
		stroke: rgba(0, 0, 0, 0.4);
		stroke-width: 0.5;
	}
	.node.guard {
		fill: var(--accent-cyan);
	}
	.node.middle {
		fill: #9fc6e0;
	}
	.node.exit {
		fill: var(--accent-green);
	}
	.packet {
		fill: #fff;
		filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
	}
	.hud {
		position: fixed;
		bottom: 1.5rem;
		left: calc(200px + 1.5rem);
		pointer-events: none;
	}
	.title {
		font-size: 1.1rem;
		letter-spacing: 0.12em;
		color: #e6f1ff;
		text-transform: uppercase;
	}
	.sub {
		margin-top: 0.3rem;
		font-size: 0.72rem;
		color: #6f8aa3;
		max-width: 40ch;
	}
	.readout {
		position: fixed;
		bottom: 4rem;
		left: calc(200px + 1.5rem);
		width: 240px;
		padding: 1.2rem;
		background: rgba(8, 14, 22, 0.82);
		border: 1px solid rgba(0, 212, 255, 0.2);
		border-radius: 12px;
		backdrop-filter: blur(12px);
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.hop-row {
		display: grid;
		grid-template-columns: 10px 1fr;
		gap: 0.6rem;
		align-items: start;
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		margin-top: 0.2rem;
	}
	.dot.guard {
		background: var(--accent-cyan);
	}
	.dot.middle {
		background: #9fc6e0;
	}
	.dot.exit {
		background: var(--accent-green);
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.rl {
		font-size: 0.64rem;
		letter-spacing: 0.14em;
		color: #6f8aa3;
		text-transform: uppercase;
	}
	.rc {
		font-size: 0.86rem;
		color: #e6f1ff;
	}
	.ra {
		font-size: 0.68rem;
		color: #9fc6e0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
