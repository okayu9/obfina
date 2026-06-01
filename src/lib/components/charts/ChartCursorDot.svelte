<script lang="ts">
	let {
		x,
		y,
		tone,
		color
	}: {
		x: number;
		y: number;
		tone?: 'cyan' | 'green';
		color?: string;
	} = $props();
</script>

<circle
	class="cursor-dot"
	class:cyan={tone === 'cyan'}
	class:green={tone === 'green'}
	cx={x}
	cy={y}
	r="3.5"
	style:fill={color}
/>

<style>
	.cursor-dot {
		fill: #fff;
		stroke: rgba(8, 20, 31, 0.8);
		stroke-width: 1;
		pointer-events: none;
	}
	.cursor-dot.cyan {
		fill: var(--accent-cyan);
	}
	.cursor-dot.green {
		fill: var(--accent-green);
	}
</style>
