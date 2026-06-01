<script lang="ts">
	import type { ProviderDetailStats } from '$lib/analysis/hosting';
	import MetricStat from '$lib/components/panels/MetricStat.svelte';
	import type { Messages } from '$lib/i18n/index.svelte';

	let {
		relayCount,
		stats,
		t
	}: {
		relayCount: number;
		stats: ProviderDetailStats;
		t: Messages['hosting'];
	} = $props();
</script>

<div class="detail-stats">
	<MetricStat value={relayCount} label={t.relays} />
	<MetricStat value={`${(stats.bandwidthShare * 100).toFixed(1)}%`} label={t.bandwidthShare} />
	<MetricStat value={`${(stats.consensusShare * 100).toFixed(1)}%`} label={t.consensusShare} />
</div>

<style>
	.detail-stats {
		display: flex;
		gap: 1.4rem;
	}
</style>
