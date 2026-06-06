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
		{#if data.stale || data.partial}
			<div class="notes">
				{#if data.stale}
					<p class="note">{t.growth.stale}</p>
				{/if}
				{#if data.partial}
					<p class="note">{t.growth.partial}</p>
				{/if}
			</div>
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
	.notes {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.note {
		margin: 0;
		font-size: 0.66rem;
		color: #6f8aa3;
	}

	@media (max-width: 640px) {
		.panels {
			grid-template-columns: 1fr;
		}
	}
</style>
