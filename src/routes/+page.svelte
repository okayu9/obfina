<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import WorldMap from '$lib/components/map/WorldMap.svelte';
	import ChoroplethMap from '$lib/components/map/ChoroplethMap.svelte';
	import DorlingMap from '$lib/components/map/DorlingMap.svelte';
	import SpikeMap from '$lib/components/map/SpikeMap.svelte';
	import HexMap from '$lib/components/map/HexMap.svelte';
	import LeaderMap from '$lib/components/map/LeaderMap.svelte';
	import DotDensityMap from '$lib/components/map/DotDensityMap.svelte';
	import InsetMap from '$lib/components/map/InsetMap.svelte';
	import RadialMap from '$lib/components/map/RadialMap.svelte';
	import CountryPanel from '$lib/components/panels/CountryPanel.svelte';
	import { aggregateByCountry, formatBandwidth } from '$lib/relay-stats';
	import { selection } from '$lib/stores/selection.svelte';
	import type { Relay, RelaysResponse } from '$lib/types';

	// Temporary visualization switch for design comparison: ?viz=bubble|choropleth|dorling
	const viz = $derived(page.url.searchParams.get('viz') ?? 'bubble');

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
	{#if viz === 'choropleth'}
		<ChoroplethMap {relays} />
	{:else if viz === 'dorling'}
		<DorlingMap {relays} />
	{:else if viz === 'spike'}
		<SpikeMap {relays} />
	{:else if viz === 'hex'}
		<HexMap {relays} />
	{:else if viz === 'leader'}
		<LeaderMap {relays} />
	{:else if viz === 'dots'}
		<DotDensityMap {relays} />
	{:else if viz === 'inset'}
		<InsetMap {relays} />
	{:else if viz === 'radial'}
		<RadialMap {relays} />
	{:else}
		<WorldMap {relays} />
	{/if}

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
				<span class="enc"><i class="size"></i>size = relays</span>
				<span class="enc"><i class="ramp"></i>cyan→green = exit share</span>
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
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		color: #6f8aa3;
	}
	.enc {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.size {
		width: 14px;
		height: 8px;
		display: inline-block;
		border-radius: 999px;
		background:
			radial-gradient(circle at 30% 50%, #9fc6e0 0 2px, transparent 2px),
			radial-gradient(circle at 75% 50%, #9fc6e0 0 4px, transparent 4px);
	}
	.ramp {
		width: 28px;
		height: 8px;
		display: inline-block;
		border-radius: 999px;
		background: linear-gradient(90deg, #00d4ff, #39ff14);
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
