<script lang="ts">
	import LoadingAnimation from '$lib/components/LoadingAnimation.svelte';

	let { message = 'Fetching relay data…' }: { message?: string } = $props();
</script>

<div class="loading-screen">
	<div class="stage">
		<LoadingAnimation />
		<p class="message">{message}</p>
	</div>
</div>

<style>
	.loading-screen {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		background: radial-gradient(ellipse at 50% 40%, #0d1f2e 0%, #080b0f 70%);
	}

	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.6rem;
	}

	.message {
		margin: 0;
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		color: #6f8aa3;
		text-transform: uppercase;
	}
</style>
