<script lang="ts">
	import { onMount } from 'svelte';
	import { countryFeaturePaths, randomPointInCountry, makeProjection } from '$lib/geo/world';
	import {
		buildSamplers,
		cullLiveCircuits,
		latestLiveCircuit,
		spawnLiveCircuit,
		type LiveCircuit,
		type Point
	} from '$lib/analysis/circuit';
	import CircuitReadout from '$lib/components/circuit/CircuitReadout.svelte';
	import CircuitWorldMap from '$lib/components/circuit/CircuitWorldMap.svelte';
	import { relayStore } from '$lib/stores/relays.svelte';
	import { getMessages } from '$lib/i18n/index.svelte';

	const MAX = 7;
	const LIFE = 5600; // ms a circuit is animated before it fades out
	const SPAWN = 1100; // ms between new circuits

	let width = $state(0);
	let height = $state(0);
	let now = $state(0);

	const projection = $derived(width && height ? makeProjection(width, height) : null);
	const landPaths = $derived(projection ? countryFeaturePaths(projection) : []);

	const samplers = $derived(buildSamplers(relayStore.relays));

	let circuits = $state<LiveCircuit[]>([]);
	let seq = 0;

	function spawn() {
		if (relayStore.relays.length === 0) return;
		const next = spawnLiveCircuit(circuits, samplers, {
			max: MAX,
			nextId: seq,
			now: performance.now(),
			pointForRelay: (relay) => randomPointInCountry(relay.country)
		});
		circuits = next.circuits;
		seq = next.nextId;
	}

	onMount(() => {
		let raf = 0;
		const tick = () => {
			now = performance.now();
			circuits = cullLiveCircuits(circuits, now, LIFE);
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

	function project(co: Point): Point | null {
		const p = projection?.(co);
		return p ? [p[0], p[1]] : null;
	}

	const t = $derived(getMessages());
	// Newest active circuit drives the live readout.
	const latest = $derived(latestLiveCircuit(circuits));
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
	<CircuitWorldMap {width} {height} {landPaths} {circuits} {now} lifeMs={LIFE} {project} />

	<div class="hud">
		<div class="title">{t.circuits.title}</div>
		<div class="sub">{t.circuits.subtitle}</div>
	</div>

	{#if latest}
		<CircuitReadout circuit={latest.c} t={t.circuits} />
	{/if}
</div>

<style>
	.map {
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at 50% 40%, #122436 0%, #0a141f 70%, #070d16 100%);
	}
	.hud {
		position: absolute;
		bottom: 1.5rem;
		left: 1.5rem;
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
</style>
