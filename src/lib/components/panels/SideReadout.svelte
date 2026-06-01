<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		value,
		tone = 'cyan',
		size = 'md',
		children
	}: {
		value: string;
		tone?: 'cyan' | 'green';
		size?: 'md' | 'lg';
		children: Snippet;
	} = $props();
</script>

<div class="readout">
	<div class="big" class:green={tone === 'green'} class:lg={size === 'lg'}>{value}</div>
	<div class="sub">
		{@render children()}
	</div>
</div>

<style>
	.big {
		font-size: 2.4rem;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		color: var(--accent-cyan);
		text-shadow: 0 0 16px rgba(0, 212, 255, 0.35);
	}
	.big.lg {
		font-size: 3rem;
		text-shadow: 0 0 18px rgba(0, 212, 255, 0.4);
	}
	.big.green {
		color: var(--accent-green);
		text-shadow: 0 0 16px rgba(57, 255, 20, 0.35);
	}
	.sub {
		margin-top: 0.35rem;
		font-size: 0.74rem;
		color: #9fc6e0;
		line-height: 1.4;
	}
	.big.lg + .sub {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		line-height: 1.5;
		max-width: 32ch;
	}
	.sub :global(b) {
		color: #e6f1ff;
	}
	.sub :global(.muted) {
		color: #6f8aa3;
	}
</style>
