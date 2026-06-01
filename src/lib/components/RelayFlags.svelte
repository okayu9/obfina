<script lang="ts">
	import { hasFlag, isMiddleRelay } from '$lib/relay-stats';
	import type { Relay } from '$lib/types';

	let { relay, compact = false }: { relay: Pick<Relay, 'flags'>; compact?: boolean } = $props();
</script>

{#if hasFlag(relay, 'Guard')}
	<span class="flag guard" class:compact>G</span>
{/if}
{#if hasFlag(relay, 'Middle') || isMiddleRelay(relay)}
	<span class="flag middle" class:compact>M</span>
{/if}
{#if hasFlag(relay, 'Exit')}
	<span class="flag exit" class:compact>E</span>
{/if}

<style>
	.flag {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
	}
	.flag.compact {
		font-size: 0.56rem;
		padding: 0.08rem 0.28rem;
	}
	.flag.guard {
		color: var(--accent-cyan);
		background: rgba(0, 212, 255, 0.12);
	}
	.flag.middle {
		color: #9fc6e0;
		background: rgba(159, 198, 224, 0.1);
	}
	.flag.exit {
		color: var(--accent-green);
		background: rgba(57, 255, 20, 0.1);
	}
</style>
