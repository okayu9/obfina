<script lang="ts">
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { countryName, flagEmoji, formatBandwidth, type CountryStats } from '$lib/relay-stats';
	import { selection } from '$lib/stores/selection.svelte';
	import type { Relay } from '$lib/types';
	import { getMessages } from '$lib/i18n';

	let {
		stats,
		relays = [],
		totalBandwidth = 0
	}: { stats: CountryStats | null; relays?: Relay[]; totalBandwidth?: number } = $props();

	let expanded = $state(false);
	const t = $derived(getMessages());

	function close() {
		selection.country = null;
		expanded = false;
	}

	// Reset expanded state when country changes
	$effect(() => {
		if (stats?.country) {
			expanded = false;
		}
	});

	const total = $derived(stats ? Math.max(stats.count, 1) : 1);

	// Circuit order: entry → middle → exit.
	const roles = $derived(
		stats
			? [
					{
						key: 'guard',
						name: t.countryPanel.guard,
						desc: t.countryPanel.guardDesc,
						count: stats.guard
					},
					{
						key: 'middle',
						name: t.countryPanel.middle,
						desc: t.countryPanel.middleDesc,
						count: stats.middle
					},
					{
						key: 'exit',
						name: t.countryPanel.exit,
						desc: t.countryPanel.exitDesc,
						count: stats.exit
					}
				]
			: []
	);

	// Relays for the selected country, sorted by bandwidth descending
	const countryRelays = $derived(
		stats
			? relays.filter((r) => r.country === stats!.country).sort((a, b) => b.bandwidth - a.bandwidth)
			: []
	);

	// Bandwidth share in the network
	const bwShare = $derived(
		totalBandwidth > 0 && stats ? (stats.bandwidth / totalBandwidth) * 100 : 0
	);

	// Unique AS count
	const uniqueAS = $derived(new Set(countryRelays.map((r) => r.as).filter(Boolean)).size);


	// Max bandwidth among relays in this country (for relative color scale)
	const maxRelayBw = $derived(
		countryRelays.length > 0 ? Math.max(...countryRelays.map((r) => r.bandwidth)) : 1
	);


	// Top AS providers by bandwidth share within country
	interface AsEntry {
		key: string;
		name: string;
		bw: number;
		count: number;
		share: number;
	}

	const topAS = $derived.by((): AsEntry[] => {
		if (!stats) return [];
		const totalCountryBw = stats.bandwidth || 1;
		const map = new Map<string, AsEntry>();
		for (const r of countryRelays) {
			const key = r.as ?? 'unknown';
			const name = r.asName ?? r.as ?? 'Unknown';
			const existing = map.get(key);
			if (existing) {
				existing.bw += r.bandwidth;
				existing.count++;
			} else {
				map.set(key, { key, name, bw: r.bandwidth, count: 1, share: 0 });
			}
		}
		const entries = Array.from(map.values()).sort((a, b) => b.bw - a.bw);
		const top = entries.slice(0, 5);
		// Compute share relative to total country bandwidth
		for (const e of top) {
			e.share = (e.bw / totalCountryBw) * 100;
		}
		return top;
	});

	function hasFlag(r: Relay, flag: string): boolean {
		return r.flags.includes(flag);
	}

	function fmtBw(bps: number): string {
		if (bps >= 1e9) return `${(bps / 1e9).toFixed(1)} GB/s`;
		if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} MB/s`;
		if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} KB/s`;
		return `${bps} B/s`;
	}

	function bwColor(bw: number): string {
		const t = maxRelayBw > 0 ? bw / maxRelayBw : 0;
		const r = Math.round(0x3a + t * (0x00 - 0x3a));
		const g = Math.round(0x52 + t * (0xd4 - 0x52));
		const b = Math.round(0x66 + t * (0xff - 0x66));
		return `rgb(${r},${g},${b})`;
	}
</script>

{#if stats}
	<aside class="panel" class:panel--expanded={expanded} transition:fly={{ x: 320, duration: 350, easing: cubicOut }}>
		<button class="close" onclick={close} aria-label="close">×</button>

		<div class="flag">{flagEmoji(stats.country)}</div>
		<div class="name">{countryName(stats.country)}</div>
		<div class="code">{stats.country.toUpperCase()}</div>

		<div class="count">{stats.count.toLocaleString()}</div>
		<div class="label">{t.countryPanel.relays}</div>

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

		<!-- Expand toggle -->
		<button class="expand-btn" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
			<span>{expanded ? t.countryPanel.showLess : t.countryPanel.moreDetails}</span>
			<svg
				class="chevron"
				class:chevron--up={expanded}
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>

		<!-- Expanded detail section -->
		{#if expanded}
			<div class="detail" transition:slide={{ duration: 220, easing: cubicOut }}>
				<!-- Summary stats row -->
				<div class="detail-stats">
					<div class="stat">
						<span class="stat-val">{bwShare.toFixed(1)}%</span>
						<span class="stat-lbl">{t.countryPanel.networkBw}</span>
					</div>
					<div class="stat">
						<span class="stat-val">{uniqueAS}</span>
						<span class="stat-lbl">{t.countryPanel.uniqueAs}</span>
					</div>
				</div>

				<!-- Top AS providers -->
				{#if topAS.length > 0}
					<div class="section-title">{t.countryPanel.topProviders}</div>
					<ul class="as-bars">
						{#each topAS as entry (entry.key)}
							<li>
								<span class="as-name" title="{entry.key} · {entry.name}">{entry.name}</span>
								<div class="as-track">
									<div class="as-fill" style:width="{entry.share}%"></div>
								</div>
								<span class="as-pct">{entry.share.toFixed(0)}%</span>
							</li>
						{/each}
					</ul>
				{/if}

				<!-- Relay list -->
				{#if countryRelays.length > 0}
					<div class="section-title">{t.countryPanel.relayList}</div>
					<ul class="relay-list">
						<li class="relay-header">
							<span class="rn">{t.countryPanel.nickname}</span>
							<span class="rb">{t.countryPanel.bandwidth}</span>
							<span class="rf">{t.countryPanel.flags}</span>
						</li>
						{#each countryRelays as r (r.nickname + r.bandwidth)}
							<li class="relay-row">
								<span class="rn" title="{r.nickname}{r.asName ? ' · ' + r.asName : ''}">{r.nickname}</span>
								<span class="rb">
									<span class="rb-bar-wrap">
										<span class="rb-bar" style:width="{(r.bandwidth / maxRelayBw * 100).toFixed(1)}%" style:background={bwColor(r.bandwidth)}></span>
									</span>
									<span class="rb-text" style:color={bwColor(r.bandwidth)}>{fmtBw(r.bandwidth)}</span>
								</span>
								<span class="rf">
									{#if hasFlag(r, 'Guard')}<span class="rflag guard">G</span>{/if}
									{#if !hasFlag(r, 'Guard') && !hasFlag(r, 'Exit')}<span class="rflag middle">M</span>{/if}
									{#if hasFlag(r, 'Exit')}<span class="rflag exit">E</span>{/if}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</aside>
{/if}

<style>
	.panel {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		width: 260px;
		padding: 1.5rem;
		background: rgba(8, 14, 22, 0.82);
		border: 1px solid rgba(0, 212, 255, 0.2);
		border-radius: 12px;
		backdrop-filter: blur(12px);
		box-shadow: 0 0 40px rgba(0, 212, 255, 0.08);
		color: #e6f1ff;
		/* Allow panel to grow when expanded */
		max-height: calc(100vh - 3rem);
		overflow-y: auto;
		overflow-x: hidden;
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

	/* Expand button */
	.expand-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		width: 100%;
		margin-top: 1rem;
		padding: 0.4rem 0.6rem;
		background: rgba(0, 212, 255, 0.06);
		border: 1px solid rgba(0, 212, 255, 0.18);
		border-radius: 6px;
		color: #9fc6e0;
		font-family: inherit;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}
	.expand-btn:hover {
		background: rgba(0, 212, 255, 0.12);
		border-color: rgba(0, 212, 255, 0.35);
		color: #e6f1ff;
	}
	.chevron {
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}
	.chevron--up {
		transform: rotate(180deg);
	}

	/* Detail section */
	.detail {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.detail-stats {
		display: flex;
		gap: 1.2rem;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.stat-val {
		font-size: 1.3rem;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		color: var(--accent-cyan);
		text-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
	}
	.stat-lbl {
		font-size: 0.62rem;
		letter-spacing: 0.09em;
		color: #6f8aa3;
	}

	.section-title {
		font-size: 0.62rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #3a5266;
		margin-bottom: -0.4rem;
	}

	/* Top AS bars */
	.as-bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.as-bars li {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-rows: auto auto;
		gap: 0.15rem 0.5rem;
		align-items: center;
	}
	.as-name {
		font-size: 0.68rem;
		color: #9fc6e0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		grid-column: 1;
		grid-row: 1;
	}
	.as-track {
		grid-column: 1;
		grid-row: 2;
		height: 5px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 3px;
		overflow: hidden;
	}
	.as-fill {
		height: 100%;
		background: var(--accent-cyan);
		border-radius: 3px;
		min-width: 2px;
	}
	.as-pct {
		grid-column: 2;
		grid-row: 1 / 3;
		font-size: 0.68rem;
		font-variant-numeric: tabular-nums;
		color: #6f8aa3;
		text-align: right;
		align-self: center;
	}

	/* Relay list table */
	.relay-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		max-height: 260px;
		overflow-y: auto;
		border: 1px solid rgba(58, 93, 120, 0.25);
		border-radius: 6px;
		background: rgba(4, 12, 20, 0.4);
	}
	.relay-header {
		display: grid;
		grid-template-columns: 1fr 5rem 3rem;
		gap: 0.3rem;
		padding: 0.3rem 0.6rem;
		font-size: 0.58rem;
		letter-spacing: 0.1em;
		color: #3a5266;
		text-transform: uppercase;
		border-bottom: 1px solid rgba(58, 93, 120, 0.2);
		position: sticky;
		top: 0;
		background: rgba(4, 12, 20, 0.92);
	}
	.relay-row {
		display: grid;
		grid-template-columns: 1fr 5rem 3rem;
		gap: 0.3rem;
		padding: 0.25rem 0.6rem;
		font-size: 0.68rem;
		align-items: center;
		border-bottom: 1px solid rgba(58, 93, 120, 0.08);
		transition: background 0.1s;
	}
	.relay-row:last-child {
		border-bottom: none;
	}
	.relay-row:hover {
		background: rgba(0, 212, 255, 0.04);
	}
	.rn {
		color: #9fc6e0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.rb {
		display: flex;
		flex-direction: column;
		gap: 1px;
		align-items: stretch;
	}
	.relay-header .rb {
		display: block;
		text-align: right;
	}
	.rb-bar-wrap {
		height: 3px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 2px;
		overflow: hidden;
	}
	.rb-bar {
		height: 100%;
		border-radius: 2px;
	}
	.rb-text {
		font-variant-numeric: tabular-nums;
		text-align: right;
		font-size: inherit;
	}
	.rf {
		display: flex;
		gap: 0.15rem;
		justify-content: flex-end;
	}
	.rflag {
		font-size: 0.56rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		padding: 0.08rem 0.28rem;
		border-radius: 3px;
	}
	.rflag.guard {
		color: var(--accent-cyan);
		background: rgba(0, 212, 255, 0.12);
	}
	.rflag.middle {
		color: #9fc6e0;
		background: rgba(159, 198, 224, 0.1);
	}
	.rflag.exit {
		color: var(--accent-green);
		background: rgba(57, 255, 20, 0.1);
	}
</style>
