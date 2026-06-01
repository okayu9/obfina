<script lang="ts">
	import type { ProviderDetailStats } from '$lib/analysis/hosting';
	import ProviderDetailStatsBlock from '$lib/components/panels/ProviderDetailStats.svelte';
	import ProviderRelayTable from '$lib/components/panels/ProviderRelayTable.svelte';
	import type { Messages } from '$lib/i18n/index.svelte';
	import type { Relay } from '$lib/types';

	let {
		asKey,
		label,
		relays,
		stats,
		t,
		onclose
	}: {
		asKey: string;
		label: string;
		relays: Relay[];
		stats: ProviderDetailStats;
		t: Messages['hosting'];
		onclose: () => void;
	} = $props();
</script>

<div class="detail-panel">
	<div class="detail-header">
		<div class="detail-title">
			<span class="detail-as-key">{asKey}</span>
			<span class="detail-as-name">{label}</span>
		</div>
		<button class="close-btn" onclick={onclose} aria-label="Close panel">&#x2715;</button>
	</div>

	<ProviderDetailStatsBlock relayCount={relays.length} {stats} {t} />
	<ProviderRelayTable {relays} {t} />
</div>

<style>
	.detail-panel {
		flex: 0 0 auto;
		width: min(420px, 100%);
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		background: rgba(8, 20, 31, 0.7);
		border: 1px solid rgba(0, 212, 255, 0.25);
		border-radius: 10px;
		padding: 1.1rem 1.2rem;
		animation: slide-in 0.18s ease-out;
		overflow: hidden;
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
	.detail-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.detail-title {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}
	.detail-as-key {
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		color: var(--accent-cyan);
		text-transform: uppercase;
	}
	.detail-as-name {
		font-size: 0.95rem;
		color: #e6f1ff;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.close-btn {
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
