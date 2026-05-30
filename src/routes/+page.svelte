<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas } from '@threlte/core';
	import Scene from '$lib/components/globe/Scene.svelte';
	import CountryPanel from '$lib/components/panels/CountryPanel.svelte';
	import { aggregateByCountry, formatBandwidth } from '$lib/relay-stats';
	import { selection } from '$lib/stores/selection.svelte';
	import { initMotion } from '$lib/stores/motion.svelte';
	import type { Relay, RelaysResponse } from '$lib/types';

	let relays = $state<Relay[]>([]);
	let count = $state(0);
	let loading = $state(true);
	let failed = $state(false);

	const byCountry = $derived(aggregateByCountry(relays));
	const selectedStats = $derived(
		selection.country ? (byCountry.get(selection.country) ?? null) : null
	);
	const totalBandwidth = $derived(relays.reduce((sum, r) => sum + r.bandwidth, 0));

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') selection.country = null;
	}

	onMount(async () => {
		initMotion();
		try {
			const res = await fetch('/api/relays');
			const data = (await res.json()) as RelaysResponse;
			if (data.unavailable) {
				failed = true;
			} else {
				relays = data.relays;
				count = data.count;
			}
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="scene">
	<Canvas>
		<Scene {relays} />
	</Canvas>

	{#if loading}
		<div class="status pulse" aria-label="loading"></div>
	{:else if failed}
		<div class="status err" aria-label="unavailable"></div>
	{:else}
		<div class="hud">
			<div class="metric">
				<span class="count">{count.toLocaleString()}</span>
				<span class="unit">relays</span>
			</div>
			<div class="metric">
				<span class="bw">{formatBandwidth(totalBandwidth)}</span>
			</div>
			<div class="legend">
				<span><i class="dot guard"></i>guard</span>
				<span><i class="dot exit"></i>exit</span>
				<span><i class="dot middle"></i>middle</span>
			</div>
		</div>
	{/if}

	<CountryPanel stats={selectedStats} />
</div>

<style>
	.scene {
		position: fixed;
		inset: 0;
	}

	.hud {
		position: fixed;
		bottom: 1.5rem;
		left: 1.5rem;
		pointer-events: none;
	}

	.metric {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.count {
		font-size: 2rem;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.05em;
		color: var(--accent-cyan);
		text-shadow: 0 0 12px rgba(0, 212, 255, 0.6);
	}

	.unit {
		font-size: 0.8rem;
		letter-spacing: 0.15em;
		color: #6f8aa3;
	}

	.bw {
		font-size: 1rem;
		color: #9fc6e0;
		font-variant-numeric: tabular-nums;
	}

	.legend {
		margin-top: 0.7rem;
		display: flex;
		gap: 0.9rem;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		color: #6f8aa3;
	}
	.legend span {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		display: inline-block;
	}
	.dot.guard {
		background: #00d4ff;
	}
	.dot.exit {
		background: #39ff14;
	}
	.dot.middle {
		background: #5a7a99;
	}

	.status {
		position: fixed;
		top: 50%;
		left: 50%;
		width: 14px;
		height: 14px;
		margin: -7px 0 0 -7px;
		border-radius: 50%;
		background: var(--accent-cyan);
	}

	.status.err {
		background: #ff3b3b;
	}

	.pulse {
		animation: pulse 1.4s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.2;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1.3);
		}
	}
</style>
