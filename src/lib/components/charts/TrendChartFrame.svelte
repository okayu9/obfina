<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getMessages } from '$lib/i18n/index.svelte';

	const t = $derived(getMessages());

	let {
		width = $bindable(0),
		height = $bindable(0),
		hasData,
		startLabel,
		endLabel,
		children
	}: {
		width: number;
		height: number;
		hasData: boolean;
		startLabel?: string;
		endLabel?: string;
		children: Snippet;
	} = $props();
</script>

<div class="chart" bind:clientWidth={width} bind:clientHeight={height}>
	{#if hasData}
		{@render children()}
		<span class="t0">{startLabel}</span>
		<span class="t1">{endLabel}</span>
	{:else}
		<div class="empty">
			<span class="empty-mark">—</span>
			<span class="empty-text">{t.growth.noData}</span>
		</div>
	{/if}
</div>

<style>
	.chart {
		position: relative;
		flex: 1;
		min-height: 90px;
		touch-action: none;
	}
	.chart :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
		cursor: crosshair;
	}
	.t0,
	.t1 {
		position: absolute;
		bottom: -1.1rem;
		font-size: 0.58rem;
		color: var(--text-faint, #5f7d98);
	}
	.t0 {
		left: 0;
	}
	.t1 {
		right: 0;
	}
	.empty {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		color: var(--text-faint, #5f7d98);
	}
	.empty-mark {
		font-size: 1.4rem;
		line-height: 1;
	}
	.empty-text {
		font-size: 0.62rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
</style>
