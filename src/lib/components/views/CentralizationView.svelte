<script lang="ts">
	import { relayStore } from '$lib/stores/relays.svelte';
	import {
		gini,
		lorenz,
		groupBy,
		topBreakdown,
		type LorenzPoint,
		type Group
	} from '$lib/analysis/concentration';
	import type { Relay } from '$lib/types';

	let scope = $state<'all' | 'exit'>('all');

	const isExit = (r: { exitProb: number; flags: string[] }) =>
		r.exitProb > 0 || r.flags.includes('Exit');

	// AS-level weight: the whole network by consensus weight, and the exit
	// position alone by exit probability (its real path-selection weight).
	const groupsAll = $derived(
		groupBy(
			relayStore.relays,
			(r) => r.as,
			(r) => r.asName || r.as || 'Unknown',
			(r) => r.consensusWeight
		)
	);
	// Exit weight = each relay's exit-selection probability. Fall back to
	// bandwidth only if the dataset has no exit probabilities at all — never per
	// relay, which would mix probabilities (~1e-4) with raw bytes/sec (~1e7) in
	// one sum and let a single misreported relay dominate the whole chart.
	const hasExitProb = $derived(relayStore.relays.some((r) => r.exitProb > 0));
	const groupsExit = $derived(
		groupBy(
			relayStore.relays.filter(isExit),
			(r) => r.as,
			(r) => r.asName || r.as || 'Unknown',
			hasExitProb ? (r) => r.exitProb : (r) => r.bandwidth
		)
	);

	const lorenzAll = $derived(lorenz(groupsAll.map((g) => g.weight)));
	const lorenzExit = $derived(lorenz(groupsExit.map((g) => g.weight)));
	const giniAll = $derived(gini(groupsAll.map((g) => g.weight)));
	const giniExit = $derived(gini(groupsExit.map((g) => g.weight)));

	const emphasized = $derived(scope === 'all' ? groupsAll : groupsExit);
	const breakdown = $derived(topBreakdown(emphasized, 6));
	const restShare = $derived(breakdown.total > 0 ? breakdown.rest / breakdown.total : 0);

	// Provider detail panel
	let selectedAsKey = $state<string | null>(null);

	const selectedRelays = $derived(
		selectedAsKey !== null
			? relayStore.relays
					.filter((r) => r.as === selectedAsKey)
					.sort((a, b) => b.bandwidth - a.bandwidth)
			: ([] as Relay[])
	);

	const selectedGroup = $derived(
		selectedAsKey !== null ? groupsAll.find((g) => g.key === selectedAsKey) ?? null : null
	);

	const totalBandwidth = $derived(relayStore.relays.reduce((s, r) => s + r.bandwidth, 0));
	const totalConsensus = $derived(relayStore.relays.reduce((s, r) => s + r.consensusWeight, 0));

	function selectProvider(g: Group) {
		if (selectedAsKey === g.key) {
			selectedAsKey = null;
		} else {
			selectedAsKey = g.key;
		}
	}

	function closePanel() {
		selectedAsKey = null;
	}

	function curve(pts: LorenzPoint[]): string {
		return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 100} ${(1 - p.y) * 100}`).join(' ');
	}
	function area(pts: LorenzPoint[]): string {
		return `${curve(pts)} L 100 100 L 0 100 Z`;
	}
	const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
	function share(g: Group): number {
		return breakdown.total > 0 ? g.weight / breakdown.total : 0;
	}

	function fmtBw(bps: number): string {
		if (bps >= 1e9) return `${(bps / 1e9).toFixed(1)} GB/s`;
		if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} MB/s`;
		if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} KB/s`;
		return `${bps} B/s`;
	}

	function hasFlag(r: Relay, flag: string): boolean {
		return r.flags.includes(flag);
	}
</script>

<div class="view">
	<header>
		<h1>Hosting concentration</h1>
		<p>
			Share of the network held by its autonomous systems. A curve bowing toward the bottom-right
			means a few providers carry most of the traffic. Click a provider to see its relays.
		</p>
	</header>

	<div class="body">
		<figure class="plot" class:exit={scope === 'exit'}>
			<svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Lorenz curves">
				<line x1="0" y1="100" x2="100" y2="0" class="equality" vector-effect="non-scaling-stroke" />
				<path d={area(scope === 'all' ? lorenzAll : lorenzExit)} class="fill {scope}" />
				<path
					d={curve(lorenzAll)}
					class="line all"
					class:dim={scope !== 'all'}
					vector-effect="non-scaling-stroke"
				/>
				<path
					d={curve(lorenzExit)}
					class="line exit"
					class:dim={scope !== 'exit'}
					vector-effect="non-scaling-stroke"
				/>
			</svg>
			<figcaption>
				<span>fewer ASes →</span>
				<span>↑ cumulative share</span>
			</figcaption>
		</figure>

		<div class="side">
			<div class="toggle" role="tablist">
				<button class:on={scope === 'all'} onclick={() => (scope = 'all')} role="tab">
					All relays
				</button>
				<button class:on={scope === 'exit'} onclick={() => (scope = 'exit')} role="tab">
					Exit only
				</button>
			</div>

			<div class="ginis">
				<div class="gbox all" class:em={scope === 'all'}>
					<span class="g">{giniAll.toFixed(2)}</span>
					<span class="l">Gini · all</span>
				</div>
				<div class="gbox exit" class:em={scope === 'exit'}>
					<span class="g">{giniExit.toFixed(2)}</span>
					<span class="l">Gini · exit</span>
				</div>
			</div>

			<ul class="bars" class:exit={scope === 'exit'}>
				{#each breakdown.top as g (g.key)}
					<li
						class:sel={selectedAsKey === g.key}
						onclick={() => selectProvider(g)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && selectProvider(g)}
					>
						<span class="as" title={g.key}>{g.label}</span>
						<span class="track"><i style:width={pct(share(g))}></i></span>
						<span class="v">{pct(share(g))}</span>
					</li>
				{/each}
				{#if breakdown.rest > 0}
					<li class="rest">
						<span class="as">others</span>
						<span class="track"><i style:width={pct(restShare)}></i></span>
						<span class="v">{pct(restShare)}</span>
					</li>
				{/if}
			</ul>
		</div>

		<!-- Provider detail panel -->
		{#if selectedAsKey !== null && selectedGroup !== null}
			<div class="detail-panel">
				<div class="detail-header">
					<div class="detail-title">
						<span class="detail-as-key">{selectedAsKey}</span>
						<span class="detail-as-name">{selectedGroup.label}</span>
					</div>
					<button class="close-btn" onclick={closePanel} aria-label="Close panel">&#x2715;</button>
				</div>

				<div class="detail-stats">
					<div class="stat">
						<span class="stat-val">{selectedRelays.length}</span>
						<span class="stat-lbl">relays</span>
					</div>
					<div class="stat">
						<span class="stat-val"
							>{totalBandwidth > 0
								? ((selectedRelays.reduce((s, r) => s + r.bandwidth, 0) / totalBandwidth) * 100).toFixed(1)
								: '0'}%</span
						>
						<span class="stat-lbl">bandwidth share</span>
					</div>
					<div class="stat">
						<span class="stat-val"
							>{totalConsensus > 0
								? ((selectedGroup.weight / totalConsensus) * 100).toFixed(1)
								: '0'}%</span
						>
						<span class="stat-lbl">consensus share</span>
					</div>
				</div>

				<ul class="relay-list">
					<li class="relay-header">
						<span class="rn">Nickname</span>
						<span class="rc">CC</span>
						<span class="rb">Bandwidth</span>
						<span class="rf">Flags</span>
					</li>
					{#each selectedRelays as r (r.nickname + r.bandwidth)}
						<li class="relay-row">
							<span class="rn" title={r.nickname}>{r.nickname}</span>
							<span class="rc">{r.country.toUpperCase()}</span>
							<span class="rb">{fmtBw(r.bandwidth)}</span>
							<span class="rf">
								{#if hasFlag(r, 'Guard')}<span class="flag guard">G</span>{/if}
								{#if hasFlag(r, 'Middle') || (!hasFlag(r, 'Guard') && !hasFlag(r, 'Exit'))}<span
										class="flag middle">M</span
									>{/if}
								{#if hasFlag(r, 'Exit')}<span class="flag exit">E</span>{/if}
							</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>

<style>
	.view {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		padding: 4.5rem 2rem 2rem 14rem;
		gap: 1.2rem;
		overflow: auto;
	}
	header h1 {
		margin: 0;
		font-size: 1.1rem;
		letter-spacing: 0.12em;
		color: #e6f1ff;
		text-transform: uppercase;
	}
	header p {
		margin: 0.4rem 0 0;
		max-width: 46ch;
		font-size: 0.74rem;
		line-height: 1.5;
		color: #6f8aa3;
	}
	.body {
		display: flex;
		gap: 2.5rem;
		flex-wrap: wrap;
		align-items: stretch;
		flex: 1;
		min-height: 0;
	}
	.plot {
		position: relative;
		margin: 0;
		width: min(48vh, 440px);
		aspect-ratio: 1;
		border: 1px solid rgba(58, 93, 120, 0.35);
		border-radius: 8px;
		background: rgba(8, 20, 31, 0.4);
	}
	.plot svg {
		width: 100%;
		height: 100%;
		display: block;
	}
	.equality {
		stroke: #3a5266;
		stroke-width: 1;
		stroke-dasharray: 3 3;
	}
	.line {
		fill: none;
		stroke-width: 2;
	}
	.line.all {
		stroke: var(--accent-cyan);
	}
	.line.exit {
		stroke: var(--accent-green);
	}
	.line.dim {
		opacity: 0.3;
		stroke-width: 1.2;
	}
	.fill {
		opacity: 0.12;
	}
	.fill.all {
		fill: var(--accent-cyan);
	}
	.fill.exit {
		fill: var(--accent-green);
	}
	figcaption {
		position: absolute;
		inset: auto 0 -1.3rem 0;
		display: flex;
		justify-content: space-between;
		font-size: 0.6rem;
		letter-spacing: 0.08em;
		color: #3a5266;
	}
	.side {
		flex: 1;
		min-width: 240px;
		max-width: 420px;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}
	.toggle {
		display: flex;
		gap: 0.3rem;
	}
	.toggle button {
		flex: 1;
		padding: 0.4rem;
		background: rgba(8, 20, 31, 0.6);
		border: 1px solid rgba(58, 93, 120, 0.35);
		border-radius: 6px;
		color: #6f8aa3;
		font-family: inherit;
		font-size: 0.72rem;
		letter-spacing: 0.06em;
		cursor: pointer;
	}
	.toggle button.on {
		color: #e6f1ff;
		border-color: rgba(0, 212, 255, 0.5);
	}
	.ginis {
		display: flex;
		gap: 1rem;
	}
	.gbox {
		display: flex;
		flex-direction: column;
		opacity: 0.45;
		transition: opacity 0.2s;
	}
	.gbox.em {
		opacity: 1;
	}
	.gbox .g {
		font-size: 2.4rem;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
	.gbox.all .g {
		color: var(--accent-cyan);
		text-shadow: 0 0 16px rgba(0, 212, 255, 0.4);
	}
	.gbox.exit .g {
		color: var(--accent-green);
		text-shadow: 0 0 16px rgba(57, 255, 20, 0.35);
	}
	.gbox .l {
		font-size: 0.66rem;
		letter-spacing: 0.12em;
		color: #6f8aa3;
		margin-top: 0.2rem;
	}
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.bars li {
		display: grid;
		grid-template-columns: 9rem 1fr 2.6rem;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.72rem;
		border-radius: 5px;
		padding: 0.25rem 0.3rem;
		transition: background 0.12s;
	}
	.bars li:not(.rest) {
		cursor: pointer;
	}
	.bars li:not(.rest):hover {
		background: rgba(0, 212, 255, 0.06);
	}
	.bars li.sel {
		background: rgba(0, 212, 255, 0.1);
		outline: 1px solid rgba(0, 212, 255, 0.3);
	}
	.as {
		color: #9fc6e0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.rest .as {
		color: #6f8aa3;
	}
	.track {
		height: 8px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
		overflow: hidden;
	}
	.track i {
		display: block;
		height: 100%;
		background: var(--accent-cyan);
	}
	.bars.exit .track i {
		background: var(--accent-green);
	}
	.v {
		text-align: right;
		color: #9fc6e0;
		font-variant-numeric: tabular-nums;
	}

	/* Detail panel */
	.detail-panel {
		flex: 0 0 auto;
		width: min(420px, 100%);
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		background: rgba(8, 20, 31, 0.7);
		border: 1px solid rgba(0, 212, 255, 0.25);
		border-radius: 10px;
		padding: 1.1rem 1.2rem;
		animation: slide-in 0.18s ease-out;
		overflow: hidden;
	}
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(12px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	.detail-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.detail-title {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}
	.detail-as-key {
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		color: var(--accent-cyan);
		text-transform: uppercase;
	}
	.detail-as-name {
		font-size: 0.95rem;
		color: #e6f1ff;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.close-btn {
		flex: 0 0 auto;
		background: none;
		border: 1px solid rgba(58, 93, 120, 0.4);
		border-radius: 5px;
		color: #6f8aa3;
		font-size: 0.75rem;
		width: 1.6rem;
		height: 1.6rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: color 0.12s, border-color 0.12s;
	}
	.close-btn:hover {
		color: #e6f1ff;
		border-color: rgba(230, 241, 255, 0.4);
	}
	.detail-stats {
		display: flex;
		gap: 1.4rem;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.stat-val {
		font-size: 1.5rem;
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
	.relay-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		flex: 1;
		overflow-y: auto;
		max-height: 340px;
		border: 1px solid rgba(58, 93, 120, 0.25);
		border-radius: 6px;
		background: rgba(4, 12, 20, 0.4);
	}
	.relay-header {
		display: grid;
		grid-template-columns: 1fr 2.2rem 5.5rem 3.5rem;
		gap: 0.4rem;
		padding: 0.35rem 0.7rem;
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		color: #3a5266;
		text-transform: uppercase;
		border-bottom: 1px solid rgba(58, 93, 120, 0.2);
		position: sticky;
		top: 0;
		background: rgba(4, 12, 20, 0.9);
	}
	.relay-row {
		display: grid;
		grid-template-columns: 1fr 2.2rem 5.5rem 3.5rem;
		gap: 0.4rem;
		padding: 0.28rem 0.7rem;
		font-size: 0.7rem;
		align-items: center;
		border-bottom: 1px solid rgba(58, 93, 120, 0.1);
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
	.rc {
		color: #6f8aa3;
		font-size: 0.62rem;
		letter-spacing: 0.06em;
	}
	.rb {
		color: #9fc6e0;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	.rf {
		display: flex;
		gap: 0.2rem;
		justify-content: flex-end;
	}
	.flag {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
	}
	.flag.guard {
		color: var(--accent-cyan);
		background: rgba(0, 212, 255, 0.12);
	}
	.flag.middle {
		color: #9fc6e0;
		background: rgba(159, 198, 224, 0.1);
	}
	.flag.exit {
		color: var(--accent-green);
		background: rgba(57, 255, 20, 0.1);
	}
</style>
