<script lang="ts">
	import { onMount } from 'svelte';
	import { Canvas } from '@threlte/core';
	import Scene from '$lib/components/globe/Scene.svelte';
	import type { Relay, RelaysResponse } from '$lib/types';

	let relays = $state<Relay[]>([]);
	let count = $state(0);
	let loading = $state(true);
	let failed = $state(false);

	onMount(async () => {
		try {
			const res = await fetch('/api/relays');
			const data = (await res.json()) as RelaysResponse;
			if (data.unavailable) {
				failed = true;
			} else {
				relays = data.relays;
				count = data.count;
			}
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	});
</script>

<div class="scene">
	<Canvas>
		<Scene {relays} />
	</Canvas>

	{#if loading}
		<div class="status pulse" aria-label="loading"></div>
	{:else if failed}
		<div class="status err" aria-label="unavailable"></div>
	{:else}
		<div class="hud">
			<span class="count">{count.toLocaleString()}</span>
		</div>
	{/if}
</div>

<style>
	.scene {
		position: fixed;
		inset: 0;
	}

	.hud {
		position: fixed;
		bottom: 1.5rem;
		left: 1.5rem;
		color: var(--accent-cyan);
		text-shadow: 0 0 12px rgba(0, 212, 255, 0.6);
		pointer-events: none;
	}

	.count {
		font-size: 2rem;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.05em;
	}

	.status {
		position: fixed;
		top: 50%;
		left: 50%;
		width: 14px;
		height: 14px;
		margin: -7px 0 0 -7px;
		border-radius: 50%;
		background: var(--accent-cyan);
	}

	.status.err {
		background: #ff3b3b;
	}

	.pulse {
		animation: pulse 1.4s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.2;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1.3);
		}
	}
</style>
