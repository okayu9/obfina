<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		maxWidth = 'none',
		descriptionWidth = '50ch',
		children
	}: {
		title: string;
		description: string;
		maxWidth?: string;
		descriptionWidth?: string;
		children: Snippet;
	} = $props();
</script>

<div class="view scroll-area">
	<div class="content" style:--view-shell-max-width={maxWidth}>
		<header>
			<h1>{title}</h1>
			<p style:--view-shell-description-width={descriptionWidth}>{description}</p>
		</header>

		{@render children()}
	</div>
</div>

<style>
	.view {
		position: fixed;
		inset: 0;
		overflow: auto;
	}
	.content {
		box-sizing: border-box;
		width: 100%;
		max-width: var(--view-shell-max-width);
		margin-left: auto;
		margin-right: auto;
		display: flex;
		flex-direction: column;
		padding: 4.5rem 2rem calc(2rem + var(--footer-height)) 2rem;
		gap: 1.2rem;
		min-height: 100%;
	}
	header h1 {
		margin: 0;
		font-size: 1.1rem;
		letter-spacing: 0.12em;
		color: #e6f1ff;
		text-transform: uppercase;
	}
	header p {
		margin: 0.4rem 0 0;
		max-width: var(--view-shell-description-width);
		font-size: 0.74rem;
		line-height: 1.5;
		color: #6f8aa3;
	}
</style>
