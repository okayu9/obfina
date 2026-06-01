<script lang="ts">
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
	<aside class="panel scroll-area" class:panel--expanded={expanded}>
		<button class="close-btn" onclick={close} aria-label="Close panel">&#x2715;</button>

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
		animation: slide-in 0.18s ease-out;
	}
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(12px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.close-btn {
		position: absolute;
		top: 0.6rem;
		right: 0.8rem;
		flex: 0 0 auto;
		background: none;
		border: 1px solid rgba(58, 93, 120, 0.4);
		border-radius: 5px;
		color: #6f8aa3;
		font-size: 0.75rem;
		width: 1.6rem;
		height: 1.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition:
			color 0.12s,
			border-color 0.12s;
	}
	.close-btn:hover {
		color: #e6f1ff;
		border-color: rgba(230, 241, 255, 0.4);
	}
</style>
