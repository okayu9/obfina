<script lang="ts">
	let {
		value,
		label,
		tone = 'neutral',
		active = true
	}: {
		value: number;
		label: string;
		tone?: 'cyan' | 'green' | 'neutral';
		active?: boolean;
	} = $props();
</script>

<div class="gbox" class:active class:cyan={tone === 'cyan'} class:green={tone === 'green'}>
	<span class="g">{value.toFixed(2)}</span>
	<span class="l">{label}</span>
</div>

<style>
	.gbox {
		display: flex;
		flex-direction: column;
		opacity: 0.45;
		transition: opacity 0.2s;
	}
	.gbox.active {
		opacity: 1;
	}
	.g {
		font-size: 1.8rem;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		color: #e6f1ff;
	}
	.gbox.cyan .g {
		color: var(--accent-cyan);
		text-shadow: 0 0 16px rgba(0, 212, 255, 0.4);
	}
	.gbox.green .g {
		color: var(--accent-green);
		text-shadow: 0 0 16px rgba(57, 255, 20, 0.35);
	}
	.l {
		font-size: 0.66rem;
		letter-spacing: 0.12em;
		color: #6f8aa3;
		margin-top: 0.2rem;
	}
</style>
