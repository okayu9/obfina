<script lang="ts">
	import type { PrivacyQuote } from '$lib/content/privacy-quotes';

	let {
		quote,
		translation,
		hintText,
		ondismiss
	}: {
		quote: PrivacyQuote;
		translation: string | null;
		hintText: string;
		ondismiss: () => void;
	} = $props();
</script>

<div
	class="overlay"
	role="dialog"
	aria-modal="true"
	tabindex="-1"
	onclick={ondismiss}
	onkeydown={(event) => {
		if (event.key === 'Escape') ondismiss();
	}}
>
	<div class="card">
		<div class="quote">"{quote.text}"</div>
		{#if translation}
			<div class="quote translation">"{translation}"</div>
		{/if}
		<div class="attr">
			<span class="author">— {quote.author}</span>
			<span class="source">{quote.source}</span>
		</div>
		<div class="hint">{hintText}</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(4, 10, 18, 0.88);
		backdrop-filter: blur(4px);
		animation: fade-in 0.25s ease-out;
	}
	.card {
		max-width: 560px;
		padding: 2.5rem 3rem;
		border: 1px solid rgba(0, 212, 255, 0.25);
		border-radius: 8px;
		background: rgba(8, 20, 31, 0.95);
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
		text-align: center;
	}
	.quote {
		font-size: 1.05rem;
		line-height: 1.7;
		color: #e6f1ff;
		letter-spacing: 0.03em;
	}
	.quote.translation {
		font-size: 0.9rem;
		color: #9fc6e0;
		border-top: 1px solid rgba(58, 93, 120, 0.3);
		padding-top: 1rem;
	}
	.attr {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.author {
		font-size: 0.78rem;
		letter-spacing: 0.12em;
		color: var(--accent-cyan);
	}
	.source {
		font-size: 0.62rem;
		letter-spacing: 0.08em;
		color: #3a5266;
		text-transform: uppercase;
	}
	.hint {
		font-size: 0.58rem;
		letter-spacing: 0.2em;
		color: #3a5266;
		text-transform: uppercase;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
