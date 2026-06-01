<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import CountryRelayList from '$lib/components/panels/CountryRelayList.svelte';
	import MetricStat from '$lib/components/panels/MetricStat.svelte';
	import ProviderBandwidthBars from '$lib/components/panels/ProviderBandwidthBars.svelte';
	import type { ProviderBandwidth } from '$lib/analysis/hosting';
	import type { Messages } from '$lib/i18n/index.svelte';
	import type { Relay } from '$lib/types';

	let {
		relays,
		topProviders,
		bandwidthShare,
		uniqueAS,
		t
	}: {
		relays: Relay[];
		topProviders: ProviderBandwidth[];
		bandwidthShare: number;
		uniqueAS: number;
		t: Messages['countryPanel'];
	} = $props();
</script>

<div class="detail" transition:slide={{ duration: 220, easing: cubicOut }}>
	<div class="detail-stats">
		<MetricStat value={`${bandwidthShare.toFixed(1)}%`} label={t.networkBw} size="sm" />
		<MetricStat value={uniqueAS} label={t.uniqueAs} size="sm" />
	</div>

	<ProviderBandwidthBars providers={topProviders} title={t.topProviders} />
	<CountryRelayList {relays} title={t.relayList} />
</div>

<style>
	.detail {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.detail-stats {
		display: flex;
		gap: 1.2rem;
	}
</style>
