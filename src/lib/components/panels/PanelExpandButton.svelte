<script lang="ts">
	let {
		expanded,
		moreLabel,
		lessLabel,
		ontoggle
	}: {
		expanded: boolean;
		moreLabel: string;
		lessLabel: string;
		ontoggle: () => void;
	} = $props();
</script>

<button class="expand-btn" onclick={ontoggle} aria-expanded={expanded}>
	<span>{expanded ? lessLabel : moreLabel}</span>
	<svg
		class="chevron"
		class:chevron--up={expanded}
		width="12"
		height="12"
		viewBox="0 0 12 12"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
	>
		<path
			d="M2 4l4 4 4-4"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
</button>

<style>
	.expand-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		width: 100%;
		margin-top: 1rem;
		padding: 0.4rem 0.6rem;
		background: rgba(0, 212, 255, 0.06);
		border: 1px solid rgba(0, 212, 255, 0.18);
		border-radius: 6px;
		color: #9fc6e0;
		font-family: inherit;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}
	.expand-btn:hover {
		background: rgba(0, 212, 255, 0.12);
		border-color: rgba(0, 212, 255, 0.35);
		color: #e6f1ff;
	}
	.chevron {
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}
	.chevron--up {
		transform: rotate(180deg);
	}
</style>
