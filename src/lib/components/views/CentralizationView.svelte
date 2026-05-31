<script lang="ts">
	import { relayStore } from '$lib/stores/relays.svelte';
	import { gini, lorenz, groupBy, type LorenzPoint, type Group } from '$lib/analysis/concentration';

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

	// The scope currently in focus, sorted largest-first (groupBy returns desc).
	const ranked = $derived(scope === 'all' ? groupsAll : groupsExit);
	const N = $derived(ranked.length);
	const totalW = $derived(ranked.reduce((s, g) => s + g.weight, 0));
	// cumTop[m] = share of the network held by the m largest providers (m = 0..N).
	const cumTop = $derived.by(() => {
		const out = [0];
		let c = 0;
		for (const g of ranked) {
			c += g.weight;
			out.push(totalW > 0 ? c / totalW : 0);
		}
		return out;
	});

	// Cursor: how many of the top providers to count. Defaults to the old top-6.
	let pickM = $state(6);
	const m = $derived(Math.max(1, Math.min(pickM, Math.max(1, N))));
	const topSelShare = $derived(cumTop[m] ?? 0);
	const marginal = $derived(ranked[m - 1]);
	const presets = [1, 5, 10, 25];

	// Long-but-bounded ranked list; the tail is summarised into one row so the
	// whole network is accounted for without an unscrollable wall of providers.
	const LIST_N = $derived(Math.min(24, N));
	const listed = $derived(ranked.slice(0, LIST_N));
	const tailCount = $derived(N - LIST_N);
	const tailShare = $derived(1 - (cumTop[LIST_N] ?? 0));

	function curve(pts: LorenzPoint[]): string {
		return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 100} ${(1 - p.y) * 100}`).join(' ');
	}
	function area(pts: LorenzPoint[]): string {
		return `${curve(pts)} L 100 100 L 0 100 Z`;
	}
	const pct = (v: number) => `${(v * 100).toFixed(v > 0 && v < 0.1 ? 1 : 0)}%`;
	const share = (g: Group) => (totalW > 0 ? g.weight / totalW : 0);

	// The top-m boundary sits on the active Lorenz curve at population fraction
	// (N-m)/N (the smallest N-m providers), whose cumulative height is 1-cumTop[m].
	const dotX = $derived(N > 0 ? ((N - m) / N) * 100 : 0);
	const dotY = $derived(topSelShare * 100);

	let svgEl = $state<SVGSVGElement | undefined>();
	let dragging = $state(false);
	function setFromEvent(e: PointerEvent) {
		if (!svgEl || N === 0) return;
		const r = svgEl.getBoundingClientRect();
		const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
		pickM = Math.max(1, Math.min(N, N - Math.round(x * N)));
	}
	function onDown(e: PointerEvent) {
		dragging = true;
		svgEl?.setPointerCapture(e.pointerId);
		setFromEvent(e);
	}
	function onMove(e: PointerEvent) {
		if (dragging) setFromEvent(e);
	}
	function onUp() {
		dragging = false;
	}
</script>

<div class="view">
	<header>
		<h1>Hosting concentration</h1>
		<p>
			Share of the network held by its autonomous systems. A curve bowing toward the bottom-right
			means a few providers carry most of the traffic. Drag the line — or pick a preset — to count
			the top providers.
		</p>
	</header>

	<div class="body">
		<figure class="plot" class:exit={scope === 'exit'}>
			<svg
				bind:this={svgEl}
				viewBox="0 0 100 100"
				preserveAspectRatio="none"
				role="img"
				aria-label="Lorenz curves"
				onpointerdown={onDown}
				onpointermove={onMove}
				onpointerup={onUp}
				onpointerleave={onUp}
			>
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

				{#if N > 0}
					<line
						x1={dotX}
						y1="0"
						x2={dotX}
						y2="100"
						class="cursor-line"
						vector-effect="non-scaling-stroke"
					/>
					<circle cx={dotX} cy={dotY} r="2.4" class="cursor-dot {scope}" />
				{/if}
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

			{#if N > 0}
				<div class="readout">
					<div class="big {scope}">{pct(topSelShare)}</div>
					<div class="sub">
						held by the top <b>{m}</b> of {N.toLocaleString()} providers
						{#if marginal}<span class="muted">· #{m} {marginal.label}</span>{/if}
					</div>
				</div>

				<div class="presets">
					{#each presets as p (p)}
						{#if p < N}
							<button class:on={m === p} onclick={() => (pickM = p)}>top {p}</button>
						{/if}
					{/each}
					<button class:on={m === N} onclick={() => (pickM = N)}>all {N}</button>
				</div>

				<ul class="bars" class:exit={scope === 'exit'}>
					{#each listed as g, i (g.key)}
						<li class:sel={i < m}>
							<span class="rank">{i + 1}</span>
							<span class="as" title={g.key}>{g.label}</span>
							<span class="track"><i style:width={pct(share(g))}></i></span>
							<span class="v">{pct(share(g))}</span>
						</li>
					{/each}
					{#if tailCount > 0}
						<li class="rest" class:sel={m > LIST_N}>
							<span class="rank">·</span>
							<span class="as">+{tailCount.toLocaleString()} more</span>
							<span class="track"><i style:width={pct(tailShare)}></i></span>
							<span class="v">{pct(tailShare)}</span>
						</li>
					{/if}
				</ul>
			{/if}
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
		max-width: 52ch;
		font-size: 0.74rem;
		line-height: 1.5;
		color: #6f8aa3;
	}
	.body {
		display: flex;
		gap: 2.5rem;
		align-items: stretch;
		flex: 1;
		min-height: 0;
	}
	.plot {
		position: relative;
		margin: 0;
		/* Keep the chart square and within the viewport; align-self stops the row
		   from stretching it, so it never grows past its aspect ratio. */
		flex: 0 0 auto;
		align-self: flex-start;
		width: min(48vh, 440px);
		max-height: 100%;
		aspect-ratio: 1;
		border: 1px solid rgba(58, 93, 120, 0.35);
		border-radius: 8px;
		background: rgba(8, 20, 31, 0.4);
	}
	.plot svg {
		width: 100%;
		height: 100%;
		display: block;
		cursor: ew-resize;
		touch-action: none;
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
	.cursor-line {
		stroke: rgba(230, 241, 255, 0.5);
		stroke-width: 1;
	}
	.cursor-dot {
		fill: #fff;
	}
	.cursor-dot.all {
		fill: var(--accent-cyan);
		stroke: #fff;
		stroke-width: 0.6;
	}
	.cursor-dot.exit {
		fill: var(--accent-green);
		stroke: #fff;
		stroke-width: 0.6;
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
		gap: 1rem;
		min-height: 0;
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
		font-size: 1.8rem;
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
	.readout .big {
		font-size: 2.4rem;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		color: var(--accent-cyan);
		text-shadow: 0 0 16px rgba(0, 212, 255, 0.35);
	}
	.readout .big.exit {
		color: var(--accent-green);
		text-shadow: 0 0 16px rgba(57, 255, 20, 0.35);
	}
	.readout .sub {
		margin-top: 0.35rem;
		font-size: 0.74rem;
		color: #9fc6e0;
		line-height: 1.4;
	}
	.readout b {
		color: #e6f1ff;
	}
	.muted {
		color: #6f8aa3;
	}
	.presets {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.presets button {
		padding: 0.3rem 0.55rem;
		background: rgba(8, 20, 31, 0.6);
		border: 1px solid rgba(58, 93, 120, 0.35);
		border-radius: 6px;
		color: #6f8aa3;
		font-family: inherit;
		font-size: 0.68rem;
		cursor: pointer;
	}
	.presets button.on {
		color: #e6f1ff;
		border-color: rgba(0, 212, 255, 0.5);
	}
	.bars {
		list-style: none;
		margin: 0;
		padding: 0.2rem 0.5rem 0.2rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		flex: 1;
		min-height: 4rem;
		overflow-y: auto;
	}
	.bars li {
		display: grid;
		grid-template-columns: 1.4rem 7.5rem 1fr 2.8rem;
		align-items: center;
		gap: 0.55rem;
		font-size: 0.72rem;
		opacity: 0.5;
		transition: opacity 0.15s;
	}
	.bars li.sel {
		opacity: 1;
	}
	.rank {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 0.64rem;
		color: #6f8aa3;
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
	/* Narrow viewports: stack the chart above the list and let the page scroll. */
	@media (max-width: 880px) {
		.body {
			flex-wrap: wrap;
		}
		.plot {
			align-self: auto;
		}
	}
</style>
