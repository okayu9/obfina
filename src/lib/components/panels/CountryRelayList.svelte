<script lang="ts">
	import {
		filterRelaysByRole,
		maxRelayBandwidth,
		type RelayRoleFilter
	} from '$lib/analysis/hosting';
	import CountryRelayRow from '$lib/components/panels/CountryRelayRow.svelte';
	import RelayRoleFilterButtons from '$lib/components/panels/RelayRoleFilterButtons.svelte';
	import SelectedRelayDetail from '$lib/components/panels/SelectedRelayDetail.svelte';
	import type { Relay } from '$lib/types';

	let {
		relays,
		title
	}: {
		relays: Relay[];
		title: string;
	} = $props();

	let selectedRelay = $state<Relay | null>(null);
	let roleFilter = $state<RelayRoleFilter>('all');

	const filteredRelays = $derived(filterRelaysByRole(relays, roleFilter));
	const visibleRelays = $derived(filteredRelays.slice(0, 10));
	const hiddenRelayCount = $derived(Math.max(0, filteredRelays.length - visibleRelays.length));
	const maxRelayBw = $derived(maxRelayBandwidth(filteredRelays));

	function setFilter(filter: RelayRoleFilter) {
		roleFilter = filter;
		selectedRelay = null;
	}

	function toggleRelay(relay: Relay) {
		selectedRelay = selectedRelay === relay ? null : relay;
	}
</script>

{#if relays.length > 0}
	<div class="section-title">{title}</div>
	<RelayRoleFilterButtons value={roleFilter} onselect={setFilter} />
	<ul class="relay-list scroll-area">
		{#each visibleRelays as relay, i (relay.nickname + relay.bandwidth)}
			<CountryRelayRow
				{relay}
				rank={i + 1}
				maxBandwidth={maxRelayBw}
				selected={selectedRelay === relay}
				ontoggle={toggleRelay}
			/>
		{/each}
	</ul>
	{#if hiddenRelayCount > 0}
		<div class="more-relays">...and {hiddenRelayCount} more</div>
	{/if}

	{#if selectedRelay}
		<SelectedRelayDetail relay={selectedRelay} />
	{/if}
{/if}

<style>
	.section-title {
		font-size: 0.62rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #3a5266;
		margin-bottom: -0.4rem;
	}
	.relay-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		max-height: 260px;
		overflow-y: auto;
		border: 1px solid rgba(58, 93, 120, 0.25);
		border-radius: 6px;
		background: rgba(4, 12, 20, 0.4);
	}
	.more-relays {
		font-size: 0.62rem;
		color: #3a5266;
		text-align: center;
		padding: 0.25rem 0;
	}
</style>
