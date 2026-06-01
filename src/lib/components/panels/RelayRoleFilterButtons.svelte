<script lang="ts">
	import type { RelayRoleFilter } from '$lib/analysis/hosting';

	const filters: { value: RelayRoleFilter; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'guard', label: 'G' },
		{ value: 'middle', label: 'M' },
		{ value: 'exit', label: 'E' }
	];

	let {
		value,
		onselect
	}: {
		value: RelayRoleFilter;
		onselect: (filter: RelayRoleFilter) => void;
	} = $props();
</script>

<div class="role-filter">
	{#each filters as filter (filter.value)}
		<button
			class="rf-btn"
			class:active={value === filter.value}
			onclick={() => onselect(filter.value)}
		>
			{filter.label}
		</button>
	{/each}
</div>

<style>
	.role-filter {
		display: flex;
		gap: 0.3rem;
		margin-bottom: 0.5rem;
	}
	.rf-btn {
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		padding: 0.15rem 0.5rem;
		border: 1px solid rgba(58, 93, 120, 0.4);
		border-radius: 3px;
		background: none;
		color: #6f8aa3;
		cursor: pointer;
		font-family: inherit;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.rf-btn:hover {
		color: #9fc6e0;
	}
	.rf-btn.active {
		color: var(--accent-cyan);
		border-color: var(--accent-cyan);
	}
</style>
