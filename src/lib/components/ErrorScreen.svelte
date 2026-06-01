<script lang="ts">
	let {
		message,
		retryLabel,
		onRetry
	}: { message: string; retryLabel: string; onRetry: () => void } = $props();
</script>

<div class="error-screen">
	<div class="stage">
		<div class="indicator" aria-hidden="true">
			<svg viewBox="0 0 64 64" width="64" height="64">
				<circle cx="32" cy="32" r="28" fill="none" stroke="#3a5266" stroke-width="2" />
				<line x1="20" y1="20" x2="44" y2="44" stroke="#ff5c5c" stroke-width="3" />
				<line x1="44" y1="20" x2="20" y2="44" stroke="#ff5c5c" stroke-width="3" />
			</svg>
		</div>
		<p class="message">{message}</p>
		<button class="retry" onclick={onRetry}>{retryLabel}</button>
	</div>
</div>

<style>
	.error-screen {
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

	.retry {
		font-family: inherit;
		font-size: 0.65rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--accent-cyan);
		background: rgba(8, 20, 31, 0.7);
		border: 1px solid rgba(0, 212, 255, 0.35);
		border-radius: 6px;
		padding: 0.55rem 1.4rem;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.retry:hover {
		background: rgba(0, 212, 255, 0.12);
		border-color: var(--accent-cyan);
	}
</style>
