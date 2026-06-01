<script lang="ts">
	let {
		index,
		label,
		description,
		active,
		onselect
	}: {
		index: number;
		label: string;
		description: string;
		active: boolean;
		onselect: () => void;
	} = $props();
</script>

<button
	class="item"
	class:active
	onclick={onselect}
	title={description}
	aria-current={active ? 'page' : undefined}
>
	<span class="num">{index + 1}</span>
	<span class="label">{label}</span>
</button>

<style>
	.item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0 0.5rem;
		height: 100%;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: #6f8aa3;
		cursor: pointer;
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
		border-bottom-color: var(--accent-cyan);
		text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
	}
	.num {
		font-size: 0.7rem;
		color: rgba(0, 212, 255, 0.35);
		font-variant-numeric: tabular-nums;
	}
	.label {
		font-size: 0.75rem;
		letter-spacing: 0.1em;
	}
</style>
