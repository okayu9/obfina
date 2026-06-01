<script lang="ts">
	let {
		value,
		label,
		size = 'md'
	}: {
		value: string | number;
		label: string;
		size?: 'sm' | 'md';
	} = $props();
</script>

<div class="stat" class:sm={size === 'sm'}>
	<span class="stat-val">{value}</span>
	<span class="stat-lbl">{label}</span>
</div>

<style>
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.stat-val {
		font-size: 1.5rem;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		color: var(--accent-cyan);
		text-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
	}
	.stat.sm .stat-val {
		font-size: 1.3rem;
	}
	.stat-lbl {
		font-size: 0.62rem;
		letter-spacing: 0.09em;
		color: #6f8aa3;
	}
</style>
