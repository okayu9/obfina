<script lang="ts">
	import { onMount } from 'svelte';
	import BandwidthTrendChart from '$lib/components/charts/BandwidthTrendChart.svelte';
	import RunningRelaysChart from '$lib/components/charts/RunningRelaysChart.svelte';
	import UserTrendChart from '$lib/components/charts/UserTrendChart.svelte';
	import ViewShell from '$lib/components/layout/ViewShell.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import { trendsStore, loadTrends } from '$lib/stores/trends.svelte';
	import { getMessages } from '$lib/i18n/index.svelte';

	const t = $derived(getMessages());
	const data = $derived(trendsStore.data);
	const loading = $derived(trendsStore.loading);
	const failed = $derived(trendsStore.failed);

	onMount(() => {
		loadTrends();
	});
</script>

<ViewShell title={t.growth.title} description={t.growth.description} descriptionWidth="56ch">
	{#if loading}
		<LoadingScreen message={t.loading.metrics} />
	{:else if failed}
		<LoadingScreen message={t.loading.historical} />
	{:else if data}
		<div class="panels">
			<RunningRelaysChart
				points={data.networkSize}
				valueLabel={t.growth.runningRelays}
				relayLabel={t.growth.relays}
			/>
			<BandwidthTrendChart
				points={data.bandwidth}
				valueLabel={t.growth.capacityUsed}
				advertisedLabel={t.growth.advertised}
				consumedLabel={t.growth.consumed}
			/>
			<UserTrendChart users={data.users} valueLabel={t.growth.dailyUsers} />
		</div>
		{#if data.partial}
			<p class="note">Some series were unavailable upstream and are omitted.</p>
		{/if}
	{/if}
</ViewShell>

<style>
	.panels {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.4rem;
		flex: 1;
		min-height: 0;
	}
	.note {
		font-size: 0.66rem;
		color: #6f8aa3;
	}
</style>
