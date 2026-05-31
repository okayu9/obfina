<script lang="ts">
	let { message = 'Fetching relay data…' }: { message?: string } = $props();
</script>

<div class="loading-screen">
	<div class="stage">
		<svg class="anim" viewBox="0 0 120 120" aria-hidden="true">
			<!-- Orbit rings -->
			<circle class="ring ring-1" cx="60" cy="60" r="46" />
			<circle class="ring ring-2" cx="60" cy="60" r="30" />

			<!-- Guard node (top) -->
			<circle class="node guard" cx="60" cy="14" r="5" />
			<!-- Middle node (bottom-right) -->
			<circle class="node middle" cx="99.9" cy="83" r="4" />
			<!-- Exit node (bottom-left) -->
			<circle class="node exit" cx="20.1" cy="83" r="4" />

			<!-- Circuit edges -->
			<line class="edge a" x1="60" y1="14" x2="99.9" y2="83" />
			<line class="edge b" x1="99.9" y1="83" x2="20.1" y2="83" />
			<line class="edge c" x1="20.1" y1="83" x2="60" y2="14" />

			<!-- Travelling packet -->
			<circle class="packet" r="3.5">
				<animateMotion dur="2.4s" repeatCount="indefinite" path="M60,14 L99.9,83 L20.1,83 Z" />
			</circle>

			<!-- Core pulse -->
			<circle class="core" cx="60" cy="60" r="6" />
		</svg>

		<p class="message">{message}</p>

		<div class="bars">
			<span class="bar bar-1"></span>
			<span class="bar bar-2"></span>
			<span class="bar bar-3"></span>
			<span class="bar bar-4"></span>
			<span class="bar bar-5"></span>
		</div>
	</div>
</div>

<style>
	.loading-screen {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		background: radial-gradient(ellipse at 50% 40%, #0d1f2e 0%, #080b0f 70%);
	}

	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.6rem;
	}

	/* SVG animation */
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

	/* Message */
	.message {
		margin: 0;
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		color: #6f8aa3;
		text-transform: uppercase;
	}

	/* EQ-style bars */
	.bars {
		display: flex;
		align-items: flex-end;
		gap: 3px;
		height: 18px;
	}
	.bar {
		display: block;
		width: 4px;
		border-radius: 2px;
		background: var(--accent-cyan);
		opacity: 0.6;
		animation: eq 1.1s ease-in-out infinite;
	}
	.bar-1 {
		animation-delay: 0s;
		height: 30%;
	}
	.bar-2 {
		animation-delay: 0.15s;
		height: 70%;
	}
	.bar-3 {
		animation-delay: 0.3s;
		height: 50%;
	}
	.bar-4 {
		animation-delay: 0.45s;
		height: 90%;
	}
	.bar-5 {
		animation-delay: 0.6s;
		height: 40%;
	}

	/* Keyframes */
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
	@keyframes eq {
		0%,
		100% {
			transform: scaleY(0.3);
		}
		50% {
			transform: scaleY(1);
		}
	}
</style>
