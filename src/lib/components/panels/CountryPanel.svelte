<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { countryName, flagEmoji, formatBandwidth, type CountryStats } from '$lib/relay-stats';
	import { selection } from '$lib/stores/selection.svelte';

	let { stats }: { stats: CountryStats | null } = $props();

	function close() {
		selection.country = null;
	}

	const total = $derived(stats ? Math.max(stats.count, 1) : 1);

	// Circuit order: entry → middle → exit.
	const roles = $derived(
		stats
			? [
					{
						key: 'guard',
						name: 'Guard',
						desc: 'entry — a client’s first hop into Tor',
						count: stats.guard
					},
					{
						key: 'middle',
						name: 'Middle',
						desc: 'relays traffic between guard and exit',
						count: stats.middle
					},
					{
						key: 'exit',
						name: 'Exit',
						desc: 'last hop — connects out to the destination',
						count: stats.exit
					}
				]
			: []
	);
</script>

{#if stats}
	<aside class="panel" transition:fly={{ x: 320, duration: 350, easing: cubicOut }}>
		<button class="close" onclick={close} aria-label="close">×</button>

		<div class="flag">{flagEmoji(stats.country)}</div>
		<div class="name">{countryName(stats.country)}</div>
		<div class="code">{stats.country.toUpperCase()}</div>

		<div class="count">{stats.count.toLocaleString()}</div>
		<div class="label">relays</div>

		<div class="bw">{formatBandwidth(stats.bandwidth)}</div>

		<!-- Relay composition as a stacked bar (entry → middle → exit) -->
		<div class="bar" role="img" aria-label="relay role composition">
			<div class="seg guard" style:width="{(stats.guard / total) * 100}%"></div>
			<div class="seg middle" style:width="{(stats.middle / total) * 100}%"></div>
			<div class="seg exit" style:width="{(stats.exit / total) * 100}%"></div>
		</div>

		<ul class="roles">
			{#each roles as role (role.key)}
				<li>
					<i class="dot {role.key}"></i>
					<div class="role-text">
						<span class="role-name">{role.name}</span>
						<span class="role-desc">{role.desc}</span>
					</div>
					<span class="role-count">{role.count.toLocaleString()}</span>
				</li>
			{/each}
		</ul>
	</aside>
{/if}

<style>
	.panel {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		width: 240px;
		padding: 1.5rem;
		background: rgba(8, 14, 22, 0.82);
		border: 1px solid rgba(0, 212, 255, 0.2);
		border-radius: 12px;
		backdrop-filter: blur(12px);
		box-shadow: 0 0 40px rgba(0, 212, 255, 0.08);
		color: #e6f1ff;
	}

	.close {
		position: absolute;
		top: 0.6rem;
		right: 0.8rem;
		background: none;
		border: none;
		color: #6f8aa3;
		font-size: 1.4rem;
		line-height: 1;
		cursor: pointer;
	}
	.close:hover {
		color: var(--accent-cyan);
	}

	.flag {
		font-size: 2.4rem;
	}
	.name {
		margin-top: 0.3rem;
		font-size: 1.1rem;
		color: #e6f1ff;
		line-height: 1.2;
	}
	.code {
		color: #6f8aa3;
		letter-spacing: 0.2em;
		font-size: 0.75rem;
		margin-top: 0.1rem;
	}

	.count {
		margin-top: 1rem;
		font-size: 2.6rem;
		font-variant-numeric: tabular-nums;
		color: var(--accent-cyan);
		text-shadow: 0 0 16px rgba(0, 212, 255, 0.5);
		line-height: 1;
	}
	.label {
		color: #6f8aa3;
		font-size: 0.8rem;
		letter-spacing: 0.15em;
	}

	.bw {
		margin-top: 0.8rem;
		font-size: 1.1rem;
		color: #9fc6e0;
	}

	.bar {
		margin-top: 1.2rem;
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.05);
	}
	.seg.guard {
		background: #00d4ff;
	}
	.seg.middle {
		background: #5a7a99;
	}
	.seg.exit {
		background: #39ff14;
	}

	.roles {
		list-style: none;
		margin: 0.9rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
	}
	.roles li {
		display: grid;
		grid-template-columns: 8px 1fr auto;
		align-items: baseline;
		gap: 0.5rem;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
		transform: translateY(1px);
	}
	.dot.guard {
		background: #00d4ff;
	}
	.dot.middle {
		background: #5a7a99;
	}
	.dot.exit {
		background: #39ff14;
	}
	.role-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.role-name {
		font-size: 0.85rem;
		color: #e6f1ff;
	}
	.role-desc {
		font-size: 0.7rem;
		line-height: 1.3;
		color: #6f8aa3;
	}
	.role-count {
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
		color: #9fc6e0;
	}
</style>
