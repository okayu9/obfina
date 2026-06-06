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
		<div class="actions">
			<button type="button" onclick={ondismiss}>{dismissLabel}</button>
		</div>
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

	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.25rem;
		padding-top: 0.9rem;
		border-top: 1px solid rgba(58, 93, 120, 0.28);
	}

	button {
		position: relative;
		min-height: 40px;
		padding: 0 2.1rem 0 1rem;
		border: 1px solid rgba(0, 212, 255, 0.58);
		border-radius: 4px;
		background: linear-gradient(180deg, rgba(0, 212, 255, 0.18), rgba(0, 212, 255, 0.08));
		color: #e6f1ff;
		font: inherit;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		cursor: pointer;
		box-shadow:
			0 0 0 1px rgba(0, 212, 255, 0.08) inset,
			0 0 18px rgba(0, 212, 255, 0.12);
		transition:
			border-color 0.14s ease,
			background 0.14s ease,
			box-shadow 0.14s ease,
			transform 0.14s ease;
	}

	button::after {
		content: '>';
		position: absolute;
		right: 0.95rem;
		top: 50%;
		color: var(--accent-cyan);
		transform: translateY(-50%);
	}

	button:hover {
		border-color: rgba(57, 255, 20, 0.62);
		background: linear-gradient(180deg, rgba(0, 212, 255, 0.24), rgba(57, 255, 20, 0.1));
		box-shadow:
			0 0 0 1px rgba(57, 255, 20, 0.12) inset,
			0 0 24px rgba(0, 212, 255, 0.18);
		transform: translateY(-1px);
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

		.actions {
			justify-content: stretch;
		}

		button {
			width: 100%;
		}
	}
</style>
