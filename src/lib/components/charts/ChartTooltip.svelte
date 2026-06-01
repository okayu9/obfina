<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		left,
		wide = false,
		children
	}: {
		left: string;
		wide?: boolean;
		children: Snippet;
	} = $props();
</script>

<div class="tip" class:wide style:left>
	{@render children()}
</div>

<style>
	.tip {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.35rem 0.5rem;
		background: rgba(8, 20, 31, 0.92);
		border: 1px solid rgba(58, 93, 120, 0.5);
		border-radius: 6px;
		font-size: 0.64rem;
		color: #e6f1ff;
		white-space: nowrap;
		pointer-events: none;
		z-index: 2;
	}
	.tip.wide {
		gap: 0.15rem;
	}
</style>
