<script lang="ts">
	import { maxRelayBandwidth } from '$lib/analysis/hosting';
	import ProviderRelayRow from '$lib/components/panels/ProviderRelayRow.svelte';
	import type { Messages } from '$lib/i18n/index.svelte';
	import type { Relay } from '$lib/types';

	let {
		relays,
		t
	}: {
		relays: Relay[];
		t: Messages['hosting'];
	} = $props();

	const maxRelayBw = $derived(maxRelayBandwidth(relays));
</script>

<ul class="relay-list scroll-area">
	<li class="relay-header">
		<span class="rn">{t.nickname}</span>
		<span class="rc">{t.cc}</span>
		<span class="rb">{t.bandwidth}</span>
		<span class="rf">{t.flags}</span>
	</li>
	{#each relays as relay (relay.nickname + relay.bandwidth)}
		<ProviderRelayRow {relay} maxBandwidth={maxRelayBw} />
	{/each}
</ul>

<style>
	.relay-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		flex: 1;
		overflow-y: auto;
		max-height: 340px;
		border: 1px solid rgba(58, 93, 120, 0.25);
		border-radius: 6px;
		background: rgba(4, 12, 20, 0.4);
	}
	.relay-header {
		display: grid;
		grid-template-columns: 1fr 2.2rem 5.5rem 3.5rem;
		gap: 0.4rem;
		padding: 0.35rem 0.7rem;
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		color: #3a5266;
		text-transform: uppercase;
		border-bottom: 1px solid rgba(58, 93, 120, 0.2);
		position: sticky;
		top: 0;
		background: rgba(4, 12, 20, 0.9);
	}
	.relay-header .rb {
		display: block;
		text-align: right;
	}
	.rn {
		color: #9fc6e0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.rc {
		color: #6f8aa3;
		font-size: 0.62rem;
		letter-spacing: 0.06em;
	}
	.rb {
		font-variant-numeric: tabular-nums;
	}
</style>
