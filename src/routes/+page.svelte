<script lang="ts">
	import { onMount } from 'svelte';
	import ViewNav from '$lib/components/nav/ViewNav.svelte';
	import MapView from '$lib/components/views/MapView.svelte';
	import CentralizationView from '$lib/components/views/CentralizationView.svelte';
	import PathBiasView from '$lib/components/views/PathBiasView.svelte';
	import TrendsView from '$lib/components/views/TrendsView.svelte';
	import CircuitView from '$lib/components/views/CircuitView.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import { relayStore, loadRelays } from '$lib/stores/relays.svelte';
	import { selection } from '$lib/stores/selection.svelte';
	import {
		VIEWS,
		viewState,
		setView,
		cycleView,
		initViewFromUrl,
		syncViewToUrl
	} from '$lib/stores/view.svelte';

	// Views that render off live relay data; GROWTH fetches its own time-series.
	const needsRelays = $derived(viewState.id !== 'growth');
	const showLoading = $derived(needsRelays && relayStore.loading);
	const showFailed = $derived(needsRelays && relayStore.failed);

	function onKeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key === 'Escape') {
			selection.country = null;
			return;
		}
		const n = Number(e.key);
		if (n >= 1 && n <= VIEWS.length) {
			setView(VIEWS[n - 1].id);
			return;
		}
		if (e.key === 'ArrowRight' || e.key === ']') cycleView(1);
		else if (e.key === 'ArrowLeft' || e.key === '[') cycleView(-1);
	}

	onMount(() => {
		initViewFromUrl();
		loadRelays();
	});

	// Keep the URL in step with the active view, and drop any stale selection
	// when leaving the map.
	$effect(() => {
		syncViewToUrl();
		if (viewState.id !== 'map') selection.country = null;
	});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="scene">
	{#if showLoading}
		<LoadingScreen />
	{:else if showFailed}
		<LoadingScreen message="Relay data unavailable" />
	{:else}
		{#if viewState.id === 'map'}
			<MapView />
		{:else if viewState.id === 'hosting'}
			<CentralizationView />
		{:else if viewState.id === 'paths'}
			<PathBiasView />
		{:else if viewState.id === 'growth'}
			<TrendsView />
		{:else if viewState.id === 'circuits'}
			<CircuitView />
		{/if}
	{/if}

	{#if !showLoading}
		<ViewNav />
	{/if}
</div>

<style>
	.scene {
		position: fixed;
		inset: 0;
	}
</style>
