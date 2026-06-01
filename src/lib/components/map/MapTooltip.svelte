<script lang="ts">
	import { countryName, flagEmoji } from '$lib/relay-stats';
	import type { CountryHover } from '$lib/map-interaction';

	let { hover }: { hover: CountryHover } = $props();
</script>

<div class="tooltip" style:left="{hover.x}px" style:top="{hover.y}px">
	<span>{flagEmoji(hover.code)}</span>
	<span class="t-name">{countryName(hover.code)}</span>
	{#if hover.count > 0}<span class="t-count">{hover.count.toLocaleString()}</span>{/if}
</div>

<style>
	.tooltip {
		position: fixed;
		transform: translate(14px, -50%);
		pointer-events: none;
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.3rem 0.6rem;
		background: rgba(8, 14, 22, 0.9);
		border: 1px solid rgba(0, 212, 255, 0.25);
		border-radius: 6px;
		font-size: 0.8rem;
		white-space: nowrap;
		backdrop-filter: blur(6px);
	}
	.t-name {
		color: #e6f1ff;
	}
	.t-count {
		color: var(--accent-cyan);
		font-variant-numeric: tabular-nums;
	}
</style>
