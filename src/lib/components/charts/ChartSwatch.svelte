<script lang="ts">
	let {
		color,
		tone,
		width = '14px'
	}: {
		color?: string;
		tone?: 'cyan' | 'green';
		width?: string;
	} = $props();
</script>

<i
	aria-hidden="true"
	class="sw"
	class:cyan={tone === 'cyan'}
	class:green={tone === 'green'}
	style:background={color}
	style:width
></i>

<style>
	.sw {
		height: 3px;
		border-radius: 2px;
		display: inline-block;
		flex: 0 0 auto;
	}
	.sw.cyan {
		background: var(--accent-cyan);
	}
	.sw.green {
		background: var(--accent-green);
	}
</style>
