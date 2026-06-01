<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		value,
		label,
		wide = false,
		children
	}: {
		value: string;
		label: string;
		wide?: boolean;
		children: Snippet;
	} = $props();
</script>

<section class="panel" class:wide>
	<div class="head">
		<div class="big">{value}</div>
		<div class="cap">{label}</div>
	</div>
	{@render children()}
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border: 1px solid rgba(58, 93, 120, 0.3);
		border-radius: 8px;
		padding: 1rem;
		background: rgba(8, 20, 31, 0.4);
		min-height: 180px;
	}
	.panel.wide {
		grid-column: 1 / -1;
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.big {
		font-size: 2.2rem;
		line-height: 1;
		color: var(--accent-cyan);
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 16px rgba(0, 212, 255, 0.35);
	}
	.cap {
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		color: #6f8aa3;
	}
</style>
