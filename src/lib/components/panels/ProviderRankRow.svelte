<script lang="ts">
	import type { Group } from '$lib/analysis/concentration';

	let {
		group,
		rank,
		share,
		selected,
		active,
		exit = false,
		onselect
	}: {
		group: Group;
		rank: number;
		share: string;
		selected: boolean;
		active: boolean;
		exit?: boolean;
		onselect: (group: Group) => void;
	} = $props();
</script>

<li>
	<button class:sel={selected} class:active onclick={() => onselect(group)}>
		<span class="rank">{rank}</span>
		<span class="as" title={group.key}>{group.label}</span>
		<span class="track" class:exit><i style:width={share}></i></span>
		<span class="v">{share}</span>
	</button>
</li>

<style>
	li {
		list-style: none;
	}
	button {
		display: grid;
		grid-template-columns: 1.4rem 7.5rem 1fr 2.8rem;
		align-items: center;
		gap: 0.55rem;
		font-size: 0.72rem;
		opacity: 0.5;
		border-radius: 5px;
		padding: 0.25rem 0.3rem;
		transition:
			opacity 0.15s,
			background 0.12s;
		width: 100%;
		background: none;
		border: none;
		color: inherit;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
	}
	button:hover {
		background: rgba(0, 212, 255, 0.06);
	}
	button.sel {
		opacity: 1;
	}
	button.active {
		background: rgba(0, 212, 255, 0.1);
		outline: 1px solid rgba(0, 212, 255, 0.3);
	}
	.rank {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 0.64rem;
		color: #6f8aa3;
	}
	.as {
		color: #9fc6e0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.track {
		height: 8px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
		overflow: hidden;
	}
	.track i {
		display: block;
		height: 100%;
		background: var(--accent-cyan);
	}
	.track.exit i {
		background: var(--accent-green);
	}
	.v {
		text-align: right;
		color: #9fc6e0;
		font-variant-numeric: tabular-nums;
	}
</style>
