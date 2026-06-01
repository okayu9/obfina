<script lang="ts">
	import type { CountryStats } from '$lib/relay-stats';
	import type { CountryMapShape } from '$lib/map-shapes';

	let {
		offset,
		worldWidth,
		shapes,
		bordersPath,
		selectedCountry,
		onemptyenter,
		ondataenter,
		onmove,
		onleave,
		oncountryclick,
		onkey
	}: {
		offset: number;
		worldWidth: number;
		shapes: CountryMapShape[];
		bordersPath: string;
		selectedCountry: string | null;
		onemptyenter: (event: PointerEvent, code: string | null) => void;
		ondataenter: (event: PointerEvent, code: string | null, stats: CountryStats | null) => void;
		onmove: (event: PointerEvent) => void;
		onleave: () => void;
		oncountryclick: (event: MouseEvent, code: string | null) => void;
		onkey: (event: KeyboardEvent, code: string | null) => void;
	} = $props();
</script>

<g transform="translate({offset * worldWidth} 0)">
	{#each shapes as shape (shape.key)}
		<path class="land" d={shape.d} />
	{/each}
	<path class="borders" d={bordersPath} />
	{#each shapes as shape (`e-${shape.key}`)}
		{#if !shape.stats && shape.code}
			<path
				class="empty"
				d={shape.d}
				role="presentation"
				onpointerenter={(event) => onemptyenter(event, shape.code)}
				onpointermove={onmove}
				onpointerleave={onleave}
			/>
		{/if}
	{/each}
	{#each shapes as shape (`g-${shape.key}`)}
		{#if shape.stats && shape.glow}
			<path
				class="data"
				class:selected={shape.code && selectedCountry === shape.code}
				d={shape.d}
				fill={shape.glow}
				fill-opacity={shape.opacity}
				onclick={(event) => oncountryclick(event, shape.code)}
				onkeydown={(event) => onkey(event, shape.code)}
				onpointerenter={(event) => ondataenter(event, shape.code, shape.stats)}
				onpointermove={onmove}
				onpointerleave={onleave}
				role="button"
				tabindex="0"
				aria-label={`${shape.code}: ${shape.stats.count} relays`}
			/>
		{/if}
	{/each}
</g>

<style>
	.land {
		fill: #20384c;
		stroke: none;
	}
	/* Stroke widths are divided by the zoom scale (var(--inv-k) = 1 / k) so they
	   keep a constant on-screen thickness regardless of zoom. */
	.borders {
		fill: none;
		stroke: #3a5d78;
		stroke-width: calc(0.5px * var(--inv-k, 1));
		stroke-opacity: 0.8;
		pointer-events: none;
	}
	.empty {
		fill: transparent;
		stroke: none;
		cursor: default;
	}
	.data {
		cursor: pointer;
		stroke: none;
	}
	/* Suppress the browser focus rectangle (it boxes the element's scaled bbox,
	   so it balloons when zoomed); use our own outline-stroke for keyboard focus. */
	.data:focus {
		outline: none;
	}
	.data:hover,
	.data:focus-visible {
		stroke: #ffffff;
		stroke-width: calc(0.75px * var(--inv-k, 1));
	}
	.data.selected {
		stroke: #ffffff;
		stroke-width: calc(1.25px * var(--inv-k, 1));
	}
</style>
