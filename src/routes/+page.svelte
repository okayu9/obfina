<script lang="ts">
	import { onMount } from 'svelte';
	import ViewNav from '$lib/components/nav/ViewNav.svelte';
	import MapView from '$lib/components/views/MapView.svelte';
	import CentralizationView from '$lib/components/views/CentralizationView.svelte';
	import PathBiasView from '$lib/components/views/PathBiasView.svelte';
	import TrendsView from '$lib/components/views/TrendsView.svelte';
	import CircuitView from '$lib/components/views/CircuitView.svelte';
	import AboutView from '$lib/components/views/AboutView.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import KonamiEgg from '$lib/components/KonamiEgg.svelte';
	import { relayStore, loadRelays } from '$lib/stores/relays.svelte';
	import { selection } from '$lib/stores/selection.svelte';
	import { getMessages } from '$lib/i18n/index.svelte';
	import { viewKeyAction, viewNeedsRelays } from '$lib/navigation';
	import {
		viewState,
		setView,
		cycleView,
		initViewFromUrl,
		syncViewToUrl
	} from '$lib/stores/view.svelte';

	const t = $derived(getMessages());

	const needsRelays = $derived(viewNeedsRelays(viewState.id));
	const showLoading = $derived(needsRelays && relayStore.loading);
	const showFailed = $derived(needsRelays && relayStore.failed);

	function onKeydown(e: KeyboardEvent) {
		const action = viewKeyAction(e);
		if (!action) return;
		if (action.type === 'clear-selection') {
			selection.country = null;
			return;
		}
		if (action.type === 'set-view') setView(action.view);
		else cycleView(action.direction);
	}

	onMount(() => {
		initViewFromUrl();
		loadRelays();
	});

	// Keep the URL in step with the active view, and drop any stale selection
	// when leaving the map.
	$effect(() => {
		syncViewToUrl(viewState.id);
		if (viewState.id !== 'map') selection.country = null;
	});
</script>

<svelte:window onkeydown={onKeydown} />
<KonamiEgg />

<div class="scene">
	{#if viewState.id === 'about'}
		<AboutView />
	{:else if showLoading}
		<LoadingScreen message={t.loading.default} />
	{:else if showFailed}
		<LoadingScreen message={t.loading.unavailable} />
	{:else if viewState.id === 'map'}
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

	{#if !showLoading}
		<ViewNav />
	{/if}
</div>

<style>
	.scene {
		position: fixed;
		top: 48px;
		left: 0;
		right: 0;
		bottom: 0;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	:global(.scene > *) {
		animation: fade-in 0.15s ease-out;
	}
</style>
