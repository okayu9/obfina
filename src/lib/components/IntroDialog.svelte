<script lang="ts">
	import { onMount } from 'svelte';

	let {
		title,
		body,
		dismissLabel,
		ondismiss
	}: {
		title: string;
		body: string;
		dismissLabel: string;
		ondismiss: () => void;
	} = $props();

	let dialogElement: HTMLDivElement;

	onMount(() => {
		dialogElement.focus();
	});
</script>

<div
	bind:this={dialogElement}
	class="overlay"
	role="dialog"
	aria-modal="true"
	aria-labelledby="intro-title"
	tabindex="-1"
	onkeydown={(event) => {
		if (event.key === 'Escape') ondismiss();
	}}
>
	<div class="panel">
		<div class="eyebrow">OBFINA</div>
		<h1 id="intro-title">{title}</h1>
		<p>{body}</p>
		<button type="button" onclick={ondismiss}>{dismissLabel}</button>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: rgba(4, 10, 16, 0.38);
		backdrop-filter: blur(1.5px);
		animation: appear 0.18s ease-out;
	}

	.panel {
		width: min(560px, 100%);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		border: 1px solid rgba(0, 212, 255, 0.26);
		border-radius: 8px;
		background: linear-gradient(180deg, rgba(10, 26, 39, 0.96), rgba(8, 20, 31, 0.96)), #08141f;
		box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
	}

	.eyebrow {
		font-size: 0.6rem;
		letter-spacing: 0.24em;
		color: var(--accent-cyan);
	}

	h1 {
		margin: 0;
		font-size: clamp(1.15rem, 2.2vw, 1.75rem);
		line-height: 1.35;
		font-weight: 600;
		color: #e6f1ff;
		letter-spacing: 0;
	}

	p {
		margin: 0;
		font-size: 0.86rem;
		line-height: 1.75;
		color: #b8cde0;
	}

	button {
		align-self: flex-start;
		min-height: 36px;
		padding: 0 0.9rem;
		border: 1px solid rgba(0, 212, 255, 0.42);
		border-radius: 4px;
		background: rgba(0, 212, 255, 0.1);
		color: #e6f1ff;
		font: inherit;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		cursor: pointer;
	}

	button:hover {
		border-color: rgba(0, 212, 255, 0.7);
		background: rgba(0, 212, 255, 0.16);
	}

	@keyframes appear {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.overlay {
			align-items: flex-start;
			padding-top: 4.5rem;
		}

		.panel {
			padding: 1.15rem;
		}

		button {
			width: 100%;
		}
	}
</style>
