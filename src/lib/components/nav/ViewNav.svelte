<script lang="ts">
	import { VIEWS, viewState, setView } from '$lib/stores/view.svelte';
</script>

<nav class="rail" aria-label="visualizations">
	{#each VIEWS as v, i (v.id)}
		<button
			class="item"
			class:active={viewState.id === v.id}
			onclick={() => setView(v.id)}
			title={v.desc}
			aria-current={viewState.id === v.id ? 'page' : undefined}
		>
			<span class="num">{i + 1}</span>
			<span class="text">
				<span class="label">{v.label}</span>
				<span class="desc">{v.desc}</span>
			</span>
		</button>
	{/each}
	<div class="hint">1–6 · ← →</div>
</nav>

<style>
	.rail {
		position: fixed;
		top: 1.5rem;
		left: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		z-index: 20;
	}
	.item {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.35rem 0.55rem;
		background: none;
		border: none;
		border-left: 2px solid transparent;
		color: #6f8aa3;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition:
			color 0.18s,
			border-color 0.18s;
	}
	.item:hover {
		color: #9fc6e0;
	}
	.item.active {
		color: var(--accent-cyan);
		border-left-color: var(--accent-cyan);
	}
	.num {
		font-size: 0.7rem;
		opacity: 0.6;
		width: 0.8rem;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
	.text {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
	}
	.label {
		font-size: 0.8rem;
		letter-spacing: 0.12em;
	}
	.desc {
		font-size: 0.62rem;
		letter-spacing: 0.04em;
		opacity: 0;
		max-height: 0;
		overflow: hidden;
		transition:
			opacity 0.18s,
			max-height 0.18s;
	}
	.item.active .desc,
	.item:hover .desc {
		opacity: 0.65;
		max-height: 1.2rem;
	}
	.hint {
		margin: 0.5rem 0 0 0.55rem;
		font-size: 0.6rem;
		letter-spacing: 0.15em;
		color: #3a5266;
	}
</style>
