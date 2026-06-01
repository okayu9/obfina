<script lang="ts">
	let {
		x,
		height
	}: {
		x: number;
		height: number;
	} = $props();
</script>

<line class="cursor-line" x1={x} y1="0" x2={x} y2={height} />

<style>
	.cursor-line {
		stroke: rgba(230, 241, 255, 0.45);
		stroke-width: 1;
		pointer-events: none;
	}
</style>
