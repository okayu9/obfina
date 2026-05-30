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
</script>

<div class="view">
	<header>
		<h1>Hosting concentration</h1>
		<p>
			Share of the network held by its autonomous systems. A curve bowing toward the bottom-right
			means a few providers carry most of the traffic.
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
					<li>
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
</style>
