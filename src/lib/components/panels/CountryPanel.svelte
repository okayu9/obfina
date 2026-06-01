<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { CountryStats } from '$lib/relay-stats';
	import { selection } from '$lib/stores/selection.svelte';
	import type { Relay } from '$lib/types';
	import { getMessages } from '$lib/i18n/index.svelte';
	import CountryDetailPanel from '$lib/components/panels/CountryDetailPanel.svelte';
	import CountryPanelSummary from '$lib/components/panels/CountryPanelSummary.svelte';
	import PanelExpandButton from '$lib/components/panels/PanelExpandButton.svelte';
	import { countryPanelModel } from '$lib/analysis/hosting';

	let {
		stats,
		relays = [],
		totalBandwidth = 0
	}: { stats: CountryStats | null; relays?: Relay[]; totalBandwidth?: number } = $props();

	let expanded = $state(false);
	const t = $derived(getMessages());

	function close() {
		selection.country = null;
		expanded = false;
	}
	function toggleExpanded() {
		expanded = !expanded;
	}

	// Reset expanded state and selected relay when country changes
	$effect(() => {
		if (stats?.country) {
			expanded = false;
		}
	});

	const detail = $derived(
		stats ? countryPanelModel(relays, stats.country, stats.bandwidth, totalBandwidth) : null
	);
</script>

{#if stats}
	<aside
		class="panel scroll-area"
		class:panel--expanded={expanded}
		transition:fly={{ x: 320, duration: 350, easing: cubicOut }}
	>
		<button class="close" onclick={close} aria-label="close">×</button>

		<CountryPanelSummary {stats} t={t.countryPanel} />

		<PanelExpandButton
			{expanded}
			moreLabel={t.countryPanel.moreDetails}
			lessLabel={t.countryPanel.showLess}
			ontoggle={toggleExpanded}
		/>

		<!-- Expanded detail section -->
		{#if expanded && detail}
			<CountryDetailPanel
				relays={detail.relays}
				topProviders={detail.topProviders}
				bandwidthShare={detail.bandwidthShare}
				uniqueAS={detail.uniqueAS}
				t={t.countryPanel}
			/>
		{/if}
	</aside>
{/if}

<style>
	.panel {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		width: 260px;
		padding: 1.5rem;
		background: rgba(8, 14, 22, 0.82);
		border: 1px solid rgba(0, 212, 255, 0.2);
		border-radius: 12px;
		backdrop-filter: blur(12px);
		box-shadow: 0 0 40px rgba(0, 212, 255, 0.08);
		color: #e6f1ff;
		/* Allow panel to grow when expanded */
		max-height: calc(100vh - 3rem);
		overflow-y: auto;
		overflow-x: hidden;
	}

	.close {
		position: absolute;
		top: 0.6rem;
		right: 0.8rem;
		background: none;
		border: none;
		color: #6f8aa3;
		font-size: 1.4rem;
		line-height: 1;
		cursor: pointer;
	}
	.close:hover {
		color: var(--accent-cyan);
	}
</style>
