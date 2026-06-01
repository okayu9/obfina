<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import RelayFlags from '$lib/components/RelayFlags.svelte';
	import { countryName, formatBandwidth } from '$lib/relay-stats';
	import type { Relay } from '$lib/types';

	let { relay }: { relay: Relay } = $props();
</script>

<div class="relay-detail" transition:slide={{ duration: 180, easing: cubicOut }}>
	<div class="rd-nickname">{relay.nickname}</div>
	<div class="rd-flags">
		<RelayFlags {relay} compact />
	</div>
	<div class="rd-row">
		<span class="rd-lbl">Bandwidth</span>
		<span class="rd-val">{formatBandwidth(relay.bandwidth)}</span>
	</div>
	<div class="rd-row">
		<span class="rd-lbl">Provider</span>
		<span class="rd-val">{relay.asName ?? relay.as ?? '-'}</span>
	</div>
	<div class="rd-row">
		<span class="rd-lbl">Country</span>
		<span class="rd-val">{countryName(relay.country ?? '')}</span>
	</div>
	<div class="rd-row">
		<span class="rd-lbl">First seen</span>
		<span class="rd-val">{relay.firstSeen?.slice(0, 10) ?? '-'}</span>
	</div>
	<div class="rd-row">
		<span class="rd-lbl">Role prob.</span>
		<span class="rd-val"
			>G {(relay.guardProb * 100).toFixed(1)}% / M {(relay.middleProb * 100).toFixed(1)}% / E {(
				relay.exitProb * 100
			).toFixed(1)}%</span
		>
	</div>
</div>

<style>
	.relay-detail {
		margin-top: 0.6rem;
		padding: 0.75rem;
		background: rgba(0, 212, 255, 0.04);
		border: 1px solid rgba(0, 212, 255, 0.2);
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.rd-nickname {
		font-size: 0.85rem;
		color: var(--accent-cyan);
		font-variant-numeric: tabular-nums;
	}
	.rd-flags {
		display: flex;
		gap: 0.15rem;
		margin-bottom: 0.1rem;
	}
	.rd-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
	}
	.rd-lbl {
		font-size: 0.58rem;
		color: #3a5266;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		flex-shrink: 0;
	}
	.rd-val {
		font-size: 0.72rem;
		color: #9fc6e0;
		text-align: right;
		word-break: break-word;
	}
</style>
