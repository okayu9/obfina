<script lang="ts">
	import { relayStore } from '$lib/stores/relays.svelte';
	import { getMessages } from '$lib/i18n';
	import {
		gini,
		topShare,
		concentrationFromTop,
		type LorenzPoint
	} from '$lib/analysis/concentration';

	// Per-relay path-selection weight = consensus weight (drives middle position
	// and underpins guard/exit). Guard and exit positions overlaid for context.
	const weight = $derived(relayStore.relays.map((r) => r.consensusWeight));
	const guardW = $derived(relayStore.relays.map((r) => r.guardProb));
	const exitW = $derived(relayStore.relays.map((r) => r.exitProb));

	const curveMain = $derived(concentrationFromTop(weight));
	const curveGuard = $derived(concentrationFromTop(guardW));
	const curveExit = $derived(concentrationFromTop(exitW));
	const giniMain = $derived(gini(weight));
	const nRelays = $derived(weight.filter((v) => v > 0).length);

	let frac = $state(0.01);
	const markShare = $derived(topShare(weight, frac));
	const markCount = $derived(Math.max(1, Math.round(nRelays * frac)));

	const presets = [0.01, 0.05, 0.1, 0.25];
	const t = $derived(getMessages());

	function path(pts: LorenzPoint[]): string {
		return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * 100} ${(1 - p.y) * 100}`).join(' ');
	}
	const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;

	let svgEl = $state<SVGSVGElement | undefined>();
	let dragging = $state(false);
	function setFromEvent(e: PointerEvent) {
		if (!svgEl) return;
		const r = svgEl.getBoundingClientRect();
		const x = (e.clientX - r.left) / r.width;
		frac = Math.min(1, Math.max(0.001, x));
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
		<h1>{t.paths.title}</h1>
		<p>{t.paths.description}</p>
	</header>

	<div class="body">
		<figure class="plot">
			<svg
				bind:this={svgEl}
				viewBox="0 0 100 100"
				preserveAspectRatio="none"
				role="img"
				aria-label="relay concentration curve"
				onpointerdown={onDown}
				onpointermove={onMove}
				onpointerup={onUp}
				onpointerleave={onUp}
			>
				<line x1="0" y1="100" x2="100" y2="0" class="equality" vector-effect="non-scaling-stroke" />
				<path d={path(curveGuard)} class="line guard" vector-effect="non-scaling-stroke" />
				<path d={path(curveExit)} class="line exit" vector-effect="non-scaling-stroke" />
				<path d={path(curveMain)} class="line main" vector-effect="non-scaling-stroke" />

				<line
					x1={frac * 100}
					y1="0"
					x2={frac * 100}
					y2="100"
					class="marker"
					vector-effect="non-scaling-stroke"
				/>
				<circle cx={frac * 100} cy={(1 - markShare) * 100} r="2.4" class="dot" />
			</svg>
			<figcaption><span>{t.paths.topRelays}</span><span>{t.paths.shareOfTraffic}</span></figcaption>
		</figure>

		<div class="side">
			<div class="readout">
				<div class="big">{pct(markShare)}</div>
				<div class="sub">
					{t.paths.ofTrafficRidesOn}
					<b>{pct(frac, frac < 0.1 ? 1 : 0)}</b>
					{t.paths.ofRelays}
					<span class="muted">(~{markCount.toLocaleString()} of {nRelays.toLocaleString()})</span>
				</div>
			</div>

			<div class="presets">
				{#each presets as p (p)}
					<button class:on={Math.abs(frac - p) < 1e-6} onclick={() => (frac = p)}>
						{t.paths.top} {pct(p, p < 0.1 ? 1 : 0)}
					</button>
				{/each}
			</div>

			<div class="gbox">
				<span class="g">{giniMain.toFixed(2)}</span>
				<span class="l">{t.paths.giniConsensus}</span>
			</div>

			<ul class="key">
				<li><i class="sw main"></i>{t.paths.legendConsensus}</li>
				<li><i class="sw guard"></i>{t.paths.legendGuard}</li>
				<li><i class="sw exit"></i>{t.paths.legendExit}</li>
				<li><i class="sw eq"></i>{t.paths.legendEquality}</li>
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
		max-width: 50ch;
		font-size: 0.74rem;
		line-height: 1.5;
		color: #6f8aa3;
	}
	.body {
		display: flex;
		gap: 2.5rem;
		flex-wrap: wrap;
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
	}
	.line.main {
		stroke: #e6f1ff;
		stroke-width: 2.4;
	}
	.line.guard {
		stroke: var(--accent-cyan);
		stroke-width: 1.4;
		opacity: 0.55;
	}
	.line.exit {
		stroke: var(--accent-green);
		stroke-width: 1.4;
		opacity: 0.55;
	}
	.marker {
		stroke: rgba(230, 241, 255, 0.5);
		stroke-width: 1;
	}
	.dot {
		fill: #fff;
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
		gap: 1.2rem;
	}
	.readout .big {
		font-size: 3rem;
		line-height: 1;
		color: var(--accent-cyan);
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 18px rgba(0, 212, 255, 0.4);
	}
	.readout .sub {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: #9fc6e0;
		line-height: 1.5;
		max-width: 32ch;
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
		padding: 0.35rem 0.6rem;
		background: rgba(8, 20, 31, 0.6);
		border: 1px solid rgba(58, 93, 120, 0.35);
		border-radius: 6px;
		color: #6f8aa3;
		font-family: inherit;
		font-size: 0.7rem;
		cursor: pointer;
	}
	.presets button.on {
		color: #e6f1ff;
		border-color: rgba(0, 212, 255, 0.5);
	}
	.gbox {
		display: flex;
		flex-direction: column;
	}
	.gbox .g {
		font-size: 2rem;
		line-height: 1;
		color: #e6f1ff;
		font-variant-numeric: tabular-nums;
	}
	.gbox .l {
		font-size: 0.66rem;
		letter-spacing: 0.1em;
		color: #6f8aa3;
		margin-top: 0.2rem;
	}
	.key {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.72rem;
		color: #9fc6e0;
	}
	.key li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.sw {
		width: 18px;
		height: 3px;
		border-radius: 2px;
		display: inline-block;
	}
	.sw.main {
		background: #e6f1ff;
	}
	.sw.guard {
		background: var(--accent-cyan);
	}
	.sw.exit {
		background: var(--accent-green);
	}
	.sw.eq {
		background: #3a5266;
	}
</style>
