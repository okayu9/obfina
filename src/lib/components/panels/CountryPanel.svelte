<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { flagEmoji, formatBandwidth, type CountryStats } from '$lib/relay-stats';
	import { selection } from '$lib/stores/selection.svelte';

	let { stats }: { stats: CountryStats | null } = $props();

	function close() {
		selection.country = null;
	}

	const total = $derived(stats ? Math.max(stats.count, 1) : 1);
</script>

{#if stats}
	<aside class="panel" transition:fly={{ x: 320, duration: 350, easing: cubicOut }}>
		<button class="close" onclick={close} aria-label="close">×</button>

		<div class="flag">{flagEmoji(stats.country)}</div>
		<div class="code">{stats.country.toUpperCase()}</div>

		<div class="count">{stats.count.toLocaleString()}</div>
		<div class="label">relays</div>

		<div class="bw">{formatBandwidth(stats.bandwidth)}</div>

		<!-- Flag composition as a stacked bar (Guard / Exit / Middle) -->
		<div class="bar" role="img" aria-label="relay flag composition">
			<div class="seg guard" style:width="{(stats.guard / total) * 100}%"></div>
			<div class="seg exit" style:width="{(stats.exit / total) * 100}%"></div>
			<div class="seg middle" style:width="{(stats.middle / total) * 100}%"></div>
		</div>
		<div class="legend">
			<span><i class="dot guard"></i>{stats.guard}</span>
			<span><i class="dot exit"></i>{stats.exit}</span>
			<span><i class="dot middle"></i>{stats.middle}</span>
		</div>
	</aside>
{/if}

<style>
	.panel {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		width: 240px;
		padding: 1.5rem;
		background: rgba(8, 14, 22, 0.82);
		border: 1px solid rgba(0, 212, 255, 0.2);
		border-radius: 12px;
		backdrop-filter: blur(12px);
		box-shadow: 0 0 40px rgba(0, 212, 255, 0.08);
		color: #e6f1ff;
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

	.flag {
		font-size: 2.4rem;
	}
	.code {
		color: #6f8aa3;
		letter-spacing: 0.2em;
		font-size: 0.85rem;
		margin-top: 0.2rem;
	}

	.count {
		margin-top: 1rem;
		font-size: 2.6rem;
		font-variant-numeric: tabular-nums;
		color: var(--accent-cyan);
		text-shadow: 0 0 16px rgba(0, 212, 255, 0.5);
		line-height: 1;
	}
	.label {
		color: #6f8aa3;
		font-size: 0.8rem;
		letter-spacing: 0.15em;
	}

	.bw {
		margin-top: 0.8rem;
		font-size: 1.1rem;
		color: #9fc6e0;
	}

	.bar {
		margin-top: 1.2rem;
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
	}
	.seg.guard {
		background: #00d4ff;
	}
	.seg.exit {
		background: #39ff14;
	}
	.seg.middle {
		background: #5a7a99;
	}

	.legend {
		margin-top: 0.6rem;
		display: flex;
		gap: 1rem;
		font-size: 0.8rem;
		color: #9fc6e0;
		font-variant-numeric: tabular-nums;
	}
	.legend span {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}
	.dot.guard {
		background: #00d4ff;
	}
	.dot.exit {
		background: #39ff14;
	}
	.dot.middle {
		background: #5a7a99;
	}
</style>
