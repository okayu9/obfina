<script lang="ts">
	import { onMount } from 'svelte';
	import ViewNav from '$lib/components/nav/ViewNav.svelte';
	import MapView from '$lib/components/views/MapView.svelte';
	import CentralizationView from '$lib/components/views/CentralizationView.svelte';
	import PathBiasView from '$lib/components/views/PathBiasView.svelte';
	import TrendsView from '$lib/components/views/TrendsView.svelte';
	import AboutView from '$lib/components/views/AboutView.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import ErrorScreen from '$lib/components/ErrorScreen.svelte';
	import KonamiEgg from '$lib/components/KonamiEgg.svelte';
	import IntroDialog from '$lib/components/IntroDialog.svelte';
	import { relayStore, loadRelaySummary, loadRelays } from '$lib/stores/relays.svelte';
	import { selection } from '$lib/stores/selection.svelte';
	import { getMessages } from '$lib/i18n/index.svelte';
	import { viewKeyAction } from '$lib/navigation';
	import {
		viewState,
		setView,
		cycleView,
		initViewFromUrl,
		syncViewToUrl
	} from '$lib/stores/view.svelte';

	const t = $derived(getMessages());

	const needsRelayDetails = $derived(viewState.id === 'hosting' || viewState.id === 'paths');
	const showLoading = $derived(
		viewState.id === 'map'
			? false
			: needsRelayDetails && !relayStore.detailsLoaded && !relayStore.detailsFailed
	);
	const showFailed = $derived(
		viewState.id === 'map'
			? relayStore.failed && !relayStore.loaded
			: needsRelayDetails && relayStore.detailsFailed && !relayStore.detailsLoaded
	);
	const INTRO_STORAGE_KEY = 'obfina:intro-dismissed:v1';

	let showIntro = $state(false);

	function onKeydown(e: KeyboardEvent) {
		if (showIntro) return;
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
		loadRelaySummary().then(loadRelayDetailsSoon);
		showIntro = localStorage.getItem(INTRO_STORAGE_KEY) !== '1';
	});

	function dismissIntro() {
		localStorage.setItem(INTRO_STORAGE_KEY, '1');
		showIntro = false;
	}

	// On failure the relevant loaded flag stays false, so retry re-runs the fetch.
	function retryRelays() {
		loadRelays();
	}

	function loadRelayDetailsSoon() {
		window.setTimeout(() => {
			if (!relayStore.detailsLoaded) loadRelays();
		}, 750);
	}

	// Keep the URL in step with the active view, and drop any stale selection
	// when leaving the map.
	$effect(() => {
		syncViewToUrl(viewState.id);
		if (viewState.id !== 'map') selection.country = null;
		if (needsRelayDetails) loadRelays();
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
		<ErrorScreen
			message={t.status.relaysFailed}
			retryLabel={t.status.retry}
			onRetry={retryRelays}
		/>
	{:else if viewState.id === 'map'}
		<MapView />
	{:else if viewState.id === 'hosting'}
		<CentralizationView />
	{:else if viewState.id === 'paths'}
		<PathBiasView />
	{:else if viewState.id === 'growth'}
		<TrendsView />
	{/if}

	{#if !showLoading}
		<ViewNav />
	{/if}

	{#if showIntro}
		<IntroDialog
			title={t.intro.title}
			body={t.intro.body}
			dismissLabel={t.intro.dismiss}
			ondismiss={dismissIntro}
		/>
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
