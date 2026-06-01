<script lang="ts">
	let {
		count,
		share,
		label,
		selected,
		exit = false
	}: {
		count: number;
		share: string;
		label: string;
		selected: boolean;
		exit?: boolean;
	} = $props();
</script>

<li class="rest" class:sel={selected}>
	<span class="rank">·</span>
	<span class="as">+{count.toLocaleString()} {label}</span>
	<span class="track" class:exit><i style:width={share}></i></span>
	<span class="v">{share}</span>
</li>

<style>
	.rest {
		display: grid;
		grid-template-columns: 1.4rem 7.5rem 1fr 2.8rem;
		align-items: center;
		gap: 0.55rem;
		font-size: 0.72rem;
		opacity: 0.5;
		border-radius: 5px;
		padding: 0.25rem 0.3rem;
		list-style: none;
	}
	.rest.sel {
		opacity: 1;
	}
	.rank {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 0.64rem;
		color: #6f8aa3;
	}
	.as {
		color: #6f8aa3;
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
