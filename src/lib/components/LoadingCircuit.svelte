<script lang="ts">
	import {
		LOADING_CENTER,
		LOADING_EDGES,
		LOADING_NODES,
		LOADING_PACKET_PATH,
		LOADING_RINGS
	} from '$lib/components/loading-animation';
</script>

<svg class="anim" viewBox="0 0 120 120" aria-hidden="true">
	{#each LOADING_RINGS as ring (ring.className)}
		<circle class="ring {ring.className}" cx={LOADING_CENTER} cy={LOADING_CENTER} r={ring.radius} />
	{/each}

	{#each LOADING_NODES as node (node.role)}
		<circle class="node {node.role}" cx={node.x} cy={node.y} r={node.radius} />
	{/each}

	{#each LOADING_EDGES as edge (edge.className)}
		<line class="edge {edge.className}" x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} />
	{/each}

	<circle class="packet" r="3.5">
		<animateMotion dur="2.4s" repeatCount="indefinite" path={LOADING_PACKET_PATH} />
	</circle>

	<circle class="core" cx={LOADING_CENTER} cy={LOADING_CENTER} r="6" />
</svg>

<style>
	.anim {
		width: 120px;
		height: 120px;
		overflow: visible;
	}

	.ring {
		fill: none;
		stroke-dasharray: 6 6;
		stroke-width: 0.8;
	}
	.ring-1 {
		stroke: rgba(0, 212, 255, 0.18);
		animation: spin 14s linear infinite;
		transform-origin: 60px 60px;
	}
	.ring-2 {
		stroke: rgba(57, 255, 20, 0.14);
		animation: spin 9s linear infinite reverse;
		transform-origin: 60px 60px;
	}

	.node {
		stroke-width: 1.2;
	}
	.node.guard {
		fill: var(--accent-cyan);
		stroke: rgba(0, 212, 255, 0.5);
		filter: drop-shadow(0 0 5px rgba(0, 212, 255, 0.7));
		animation: glow-cyan 2.4s ease-in-out infinite;
	}
	.node.middle {
		fill: #9fc6e0;
		stroke: rgba(159, 198, 224, 0.4);
		animation: glow-mid 2.4s ease-in-out 0.8s infinite;
	}
	.node.exit {
		fill: var(--accent-green);
		stroke: rgba(57, 255, 20, 0.4);
		filter: drop-shadow(0 0 5px rgba(57, 255, 20, 0.6));
		animation: glow-green 2.4s ease-in-out 1.6s infinite;
	}

	.edge {
		stroke-width: 0.9;
		stroke-linecap: round;
		stroke-dasharray: 4 4;
		animation: dash 1.8s linear infinite;
	}
	.edge.a {
		stroke: rgba(0, 212, 255, 0.45);
	}
	.edge.b {
		stroke: rgba(159, 198, 224, 0.35);
		animation-delay: -0.6s;
	}
	.edge.c {
		stroke: rgba(57, 255, 20, 0.4);
		animation-delay: -1.2s;
	}

	.packet {
		fill: #ffffff;
		filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
	}

	.core {
		fill: rgba(0, 212, 255, 0.15);
		stroke: rgba(0, 212, 255, 0.5);
		stroke-width: 1;
		animation: pulse-core 2s ease-in-out infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes dash {
		to {
			stroke-dashoffset: -16;
		}
	}
	@keyframes pulse-core {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(0.85);
			transform-origin: 60px 60px;
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
			transform-origin: 60px 60px;
		}
	}
	@keyframes glow-cyan {
		0%,
		100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
	}
	@keyframes glow-mid {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}
	@keyframes glow-green {
		0%,
		100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
	}
</style>
