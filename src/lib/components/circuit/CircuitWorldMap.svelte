<script lang="ts">
	import {
		packetPosition,
		circuitFade,
		circuitProgress,
		pulseRadius,
		type Point
	} from '$lib/analysis/circuit';

	interface LiveCircuit {
		id: number;
		born: number;
		coords: Point[];
	}

	let {
		width,
		height,
		landPaths,
		circuits,
		now,
		lifeMs,
		project,
		rootTransform = '',
		worldWidth = 0,
		copies = [0]
	}: {
		width: number;
		height: number;
		landPaths: string[];
		circuits: LiveCircuit[];
		now: number;
		lifeMs: number;
		project: (point: Point) => Point | null;
		rootTransform?: string;
		worldWidth?: number;
		copies?: number[];
	} = $props();

	const progress = (born: number) => circuitProgress(now, born, lifeMs);
	const fade = (born: number) => circuitFade(progress(born));
	const pulse = $derived(pulseRadius(now));
</script>

<svg {width} {height} role="presentation">
	<g transform={rootTransform}>
		{#each copies as offset (offset)}
			<g transform="translate({offset * worldWidth} 0)">
				{#each landPaths as d, i (i)}
					<path class="land" {d} />
				{/each}

				{#each circuits as live (`${offset}-${live.id}`)}
					{@const pts = live.coords.map(project)}
					{@const op = fade(live.born)}
					{@const pk = packetPosition(pts, progress(live.born))}
					<g style:opacity={op}>
						{#if pts[0] && pts[1]}
							<line x1={pts[0][0]} y1={pts[0][1]} x2={pts[1][0]} y2={pts[1][1]} class="hop a" />
						{/if}
						{#if pts[1] && pts[2]}
							<line x1={pts[1][0]} y1={pts[1][1]} x2={pts[2][0]} y2={pts[2][1]} class="hop b" />
						{/if}
						{#if pts[0]}<circle cx={pts[0][0]} cy={pts[0][1]} r={pulse} class="node guard" />{/if}
						{#if pts[1]}<circle cx={pts[1][0]} cy={pts[1][1]} r={pulse} class="node middle" />{/if}
						{#if pts[2]}<circle cx={pts[2][0]} cy={pts[2][1]} r={pulse} class="node exit" />{/if}
						{#if pk}<circle cx={pk[0]} cy={pk[1]} r="3" class="packet" />{/if}
					</g>
				{/each}
			</g>
		{/each}
	</g>
</svg>

<style>
	svg {
		display: block;
	}
	.land {
		fill: #16293a;
		stroke: #24405a;
		stroke-width: 0.4;
	}
	.hop {
		stroke-width: 1.1;
		stroke-linecap: round;
	}
	.hop.a {
		stroke: rgba(0, 212, 255, 0.55);
	}
	.hop.b {
		stroke: rgba(57, 255, 20, 0.55);
	}
	.node {
		stroke: rgba(0, 0, 0, 0.4);
		stroke-width: 0.5;
	}
	.node.guard {
		fill: var(--accent-cyan);
	}
	.node.middle {
		fill: #9fc6e0;
	}
	.node.exit {
		fill: var(--accent-green);
	}
	.packet {
		fill: #fff;
		filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
	}
</style>
