<script lang="ts">
	import RelayBandwidthBar from '$lib/components/RelayBandwidthBar.svelte';
	import RelayFlags from '$lib/components/RelayFlags.svelte';
	import type { Relay } from '$lib/types';

	let {
		relay,
		rank,
		maxBandwidth,
		selected,
		ontoggle
	}: {
		relay: Relay;
		rank: number;
		maxBandwidth: number;
		selected: boolean;
		ontoggle: (relay: Relay) => void;
	} = $props();
</script>

<li class="relay-row" class:relay-row--selected={selected}>
	<button
		class="relay-row-btn"
		onclick={() => ontoggle(relay)}
		aria-pressed={selected}
		aria-label="Toggle details for {relay.nickname}"
	>
		<span class="rrank">{rank}</span>
		<span class="rname-flags" title="{relay.nickname}{relay.asName ? ' · ' + relay.asName : ''}">
			<span class="rn">{relay.nickname}</span>
			<span class="rf">
				<RelayFlags {relay} compact />
			</span>
		</span>
		<span class="rrank-empty"></span>
		<span class="rb">
			<RelayBandwidthBar bandwidth={relay.bandwidth} {maxBandwidth} variant="inline" />
		</span>
	</button>
</li>

<style>
	.relay-row {
		border-bottom: 1px solid rgba(58, 93, 120, 0.08);
	}
	.relay-row:last-child {
		border-bottom: none;
	}
	.relay-row--selected > .relay-row-btn {
		background: rgba(0, 212, 255, 0.1);
	}
	.relay-row-btn {
		display: grid;
		grid-template-columns: 1.2rem 1fr;
		grid-template-rows: auto auto;
		column-gap: 0.3rem;
		row-gap: 0.15rem;
		padding: 0.3rem 0.6rem;
		font-size: 0.68rem;
		width: 100%;
		background: none;
		border: none;
		color: inherit;
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		transition: background 0.1s;
	}
	.relay-row-btn:hover {
		background: rgba(0, 212, 255, 0.07);
	}
	.rrank {
		grid-column: 1;
		grid-row: 1;
		font-size: 0.58rem;
		color: #3a5266;
		font-variant-numeric: tabular-nums;
		text-align: right;
		padding-top: 0.1rem;
	}
	.rname-flags {
		grid-column: 2;
		grid-row: 1;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		min-width: 0;
		overflow: hidden;
	}
	.rn {
		color: #9fc6e0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex-shrink: 1;
		min-width: 0;
	}
	.rrank-empty {
		grid-column: 1;
		grid-row: 2;
	}
	.rb {
		grid-column: 2;
		grid-row: 2;
	}
	.rf {
		display: flex;
		gap: 0.15rem;
		flex-shrink: 0;
	}
</style>
