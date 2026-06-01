<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		startLabel,
		endLabel,
		width,
		maxHeight = 'none',
		children
	}: {
		startLabel: string;
		endLabel: string;
		width: string;
		maxHeight?: string;
		children: Snippet;
	} = $props();
</script>

<figure
	class="plot-frame"
	style:--plot-frame-width={width}
	style:--plot-frame-max-height={maxHeight}
>
	{@render children()}
	<figcaption>
		<span>{startLabel}</span>
		<span>{endLabel}</span>
	</figcaption>
</figure>

<style>
	.plot-frame {
		position: relative;
		margin: 0;
		flex: 0 0 auto;
		align-self: flex-start;
		/* min(…, 100%) keeps the square chart within the inline width on narrow phones */
		width: min(var(--plot-frame-width), 100%);
		max-height: var(--plot-frame-max-height);
		aspect-ratio: 1;
		border: 1px solid rgba(58, 93, 120, 0.35);
		border-radius: 8px;
		background: rgba(8, 20, 31, 0.4);
	}
	.plot-frame :global(svg) {
		width: 100%;
		height: 100%;
		display: block;
		cursor: ew-resize;
		touch-action: none;
	}
	figcaption {
		position: absolute;
		inset: auto 0 -1.3rem 0;
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.6rem;
		letter-spacing: 0.08em;
		color: #6f8aa3;
	}
	figcaption span:last-child {
		text-align: right;
	}
</style>
