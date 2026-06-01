<script lang="ts">
	import type { Snippet } from 'svelte';

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
		<span class="empty">—</span>
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
		color: #3a5266;
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
		display: grid;
		place-items: center;
		color: #3a5266;
		font-size: 1.4rem;
	}
</style>
