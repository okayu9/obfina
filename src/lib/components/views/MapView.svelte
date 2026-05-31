<script lang="ts">
	import ValueByAlphaMap from '$lib/components/map/ValueByAlphaMap.svelte';
	import CountryPanel from '$lib/components/panels/CountryPanel.svelte';
	import { aggregateByCountry, formatBandwidth } from '$lib/relay-stats';
	import { selection } from '$lib/stores/selection.svelte';
	import { relayStore } from '$lib/stores/relays.svelte';

	const byCountry = $derived(aggregateByCountry(relayStore.relays));
	const selectedStats = $derived(
		selection.country ? (byCountry.get(selection.country) ?? null) : null
	);
	const totalBandwidth = $derived(relayStore.relays.reduce((sum, r) => sum + r.bandwidth, 0));
</script>

<ValueByAlphaMap relays={relayStore.relays} />

<div class="hud">
	<div class="metric">
		<span class="count">{relayStore.count.toLocaleString()}</span>
		<span class="unit">relays</span>
	</div>
	<div class="metric">
		<span class="bw">{formatBandwidth(totalBandwidth)}</span>
	</div>
	<div class="legend">
		<span class="enc"><i class="ramp"></i>cyan→green = exit share</span>
		<span class="enc"><i class="bright"></i>brighter = more relays</span>
	</div>
</div>

<CountryPanel stats={selectedStats} relays={relayStore.relays} totalBandwidth={totalBandwidth} />

<style>
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
	.bright {
		width: 28px;
		height: 8px;
		display: inline-block;
		border-radius: 999px;
		background: linear-gradient(90deg, #0e2230, #00d4ff);
	}
	.ramp {
		width: 28px;
		height: 8px;
		display: inline-block;
		border-radius: 999px;
		background: linear-gradient(90deg, #00d4ff, #39ff14);
	}
</style>
