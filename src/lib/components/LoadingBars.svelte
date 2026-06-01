<script lang="ts">
	import { LOADING_BARS } from '$lib/components/loading-animation';
</script>

<div class="bars">
	{#each LOADING_BARS as bar, i (`bar-${i}`)}
		<span class="bar" style:height={bar.height} style:animation-delay={bar.delay}></span>
	{/each}
</div>

<style>
	.bars {
		display: flex;
		align-items: flex-end;
		gap: 3px;
		height: 18px;
	}
	.bar {
		display: block;
		width: 4px;
		border-radius: 2px;
		background: var(--accent-cyan);
		opacity: 0.6;
		animation: eq 1.1s ease-in-out infinite;
	}
	@keyframes eq {
		0%,
		100% {
			transform: scaleY(0.3);
		}
		50% {
			transform: scaleY(1);
		}
	}
</style>
