<script lang="ts">
	import { onMount } from 'svelte';
	import { makeProjection, randomPointInCountry } from '$lib/geo/world';
	import {
		buildSamplers,
		cullLiveCircuits,
		spawnLiveCircuit,
		type LiveCircuit,
		type Point
	} from '$lib/analysis/circuit';
	import CircuitWorldMap from '$lib/components/circuit/CircuitWorldMap.svelte';
	import type { Relay } from '$lib/types';

	let { relays }: { relays: Relay[] } = $props();

	const MAX = 7;
	const LIFE = 5600;
	const SPAWN = 1100;

	let width = $state(0);
	let height = $state(0);
	let now = $state(0);
	let circuits = $state<LiveCircuit[]>([]);
	let seq = 0;

	const projection = $derived(width && height ? makeProjection(width, height) : null);
	const samplers = $derived(buildSamplers(relays));

	function spawn() {
		if (relays.length === 0) return;
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
		const seed = setInterval(() => {
			if (relays.length > 0) {
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
</script>

<div class="simulation" bind:clientWidth={width} bind:clientHeight={height}>
	<CircuitWorldMap {width} {height} landPaths={[]} {circuits} {now} lifeMs={LIFE} {project} />
</div>

<style>
	.simulation {
		position: absolute;
		inset: 0;
		pointer-events: none;
		mix-blend-mode: screen;
		opacity: 0.72;
	}
</style>
