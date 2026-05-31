<script lang="ts">
	import { onMount } from 'svelte';
	import { formatBandwidth, countryName } from '$lib/relay-stats';
	import type { TrendsResponse } from '$lib/types';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';

	let data = $state<TrendsResponse | null>(null);
	let loading = $state(true);
	let failed = $state(false);

	onMount(async () => {
		try {
			const res = await fetch('/api/trends');
			const json = (await res.json()) as TrendsResponse;
			if (json.unavailable) failed = true;
			else data = json;
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	});

	function linePath(values: number[], max: number): string {
		const n = values.length;
		if (n < 2 || max <= 0) return '';
		return values
			.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (n - 1)) * 100} ${(1 - v / max) * 100}`)
			.join(' ');
	}
	function areaPath(top: number[], bottom: number[], max: number): string {
		const n = top.length;
		if (n < 2 || max <= 0) return '';
		const up = top.map(
			(v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (n - 1)) * 100} ${(1 - v / max) * 100}`
		);
		const down = bottom
			.map((v, i) => `L ${((n - 1 - i) / (n - 1)) * 100} ${(1 - bottom[n - 1 - i] / max) * 100}`)
			.slice(1);
		return `${up.join(' ')} ${down.join(' ')} Z`;
	}
	function compact(n: number): string {
		if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
		if (n >= 1e3) return `${(n / 1e3).toFixed(n < 1e4 ? 1 : 0)}k`;
		return `${Math.round(n)}`;
	}
	function ramp(t: number): string {
		const c = [0, 212, 255];
		const g = [57, 255, 20];
		const m = (a: number, b: number) => Math.round(a + (b - a) * t);
		return `rgb(${m(c[0], g[0])}, ${m(c[1], g[1])}, ${m(c[2], g[2])})`;
	}
	const last = <T,>(a: T[]): T | undefined => a[a.length - 1];

	// --- growth ---
	const sizeVals = $derived(data?.networkSize.map((p) => p.relays) ?? []);
	const sizeMax = $derived(Math.max(1, ...sizeVals));

	// --- capacity vs usage ---
	const bw = $derived(data?.bandwidth ?? []);
	const adv = $derived(bw.map((p) => p.advertised));
	const con = $derived(bw.map((p) => p.consumed));
	const bwMax = $derived(Math.max(1, ...adv, ...con));
	const util = $derived(() => {
		const a = last(adv) ?? 0;
		const c = last(con) ?? 0;
		return a > 0 ? c / a : 0;
	});

	// --- users ---
	const users = $derived(data?.users ?? { countries: [], series: [] });
	const userMax = $derived(
		Math.max(1, ...users.series.flatMap((s) => users.countries.map((c) => s.values[c] ?? 0)))
	);
	function userSeries(cc: string): number[] {
		return users.series.map((s) => s.values[cc] ?? 0);
	}

	// --- chart cursor ---
	// One shared hover state; each chart tracks the index under the pointer and
	// draws its own guide line, dots and a floating readout at that date.
	let hover = $state<{ chart: 'size' | 'bw' | 'users'; i: number } | null>(null);
	function onChartMove(e: PointerEvent, chart: 'size' | 'bw' | 'users', n: number) {
		if (n < 2) return;
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
		hover = { chart, i: Math.round(frac * (n - 1)) };
	}
	const clearHover = () => (hover = null);
	const xAt = (i: number, n: number) => (n > 1 ? (i / (n - 1)) * 100 : 0);
	const yAt = (v: number, max: number) => (max > 0 ? (1 - v / max) * 100 : 100);
</script>

<div class="view">
	<header>
		<h1>Network over time</h1>
		<p>
			Growth of the relay network, the gap between advertised capacity and bandwidth actually used,
			and where Tor's users connect from. Source: Tor Metrics.
		</p>
	</header>

	{#if loading}
		<LoadingScreen message="Fetching Tor Metrics…" />
	{:else if failed}
		<LoadingScreen message="Historical data unavailable" />
	{:else if data}
		<div class="panels">
			<!-- GROWTH -->
			<section class="panel">
				<div class="head">
					<div class="big">{compact(last(sizeVals) ?? 0)}</div>
					<div class="cap">running relays</div>
				</div>
				<div class="chart">
					{#if sizeVals.length > 1}
						<svg
							viewBox="0 0 100 100"
							preserveAspectRatio="none"
							role="img"
							aria-label="running relays over time"
							onpointermove={(e) => onChartMove(e, 'size', sizeVals.length)}
							onpointerleave={clearHover}
						>
							<path
								d={linePath(sizeVals, sizeMax)}
								class="line cyan"
								vector-effect="non-scaling-stroke"
							/>
							{#if hover?.chart === 'size'}
								<line
									class="cursor-line"
									x1={xAt(hover.i, sizeVals.length)}
									y1="0"
									x2={xAt(hover.i, sizeVals.length)}
									y2="100"
									vector-effect="non-scaling-stroke"
								/>
								<circle
									class="cursor-dot cyan"
									cx={xAt(hover.i, sizeVals.length)}
									cy={yAt(sizeVals[hover.i], sizeMax)}
									r="2.4"
								/>
							{/if}
						</svg>
						{#if hover?.chart === 'size'}
							<div class="tip" style:left={`${xAt(hover.i, sizeVals.length)}%`}>
								<span class="tip-d">{data.networkSize[hover.i].date}</span>
								<span class="tip-v">{compact(sizeVals[hover.i])} relays</span>
							</div>
						{/if}
						<span class="t0">{data.networkSize[0].date}</span>
						<span class="t1">{last(data.networkSize)?.date}</span>
					{:else}
						<span class="empty">—</span>
					{/if}
				</div>
			</section>

			<!-- CAPACITY vs USAGE -->
			<section class="panel">
				<div class="head">
					<div class="big">{(util() * 100).toFixed(0)}%</div>
					<div class="cap">capacity used</div>
					<div class="legend">
						<span><i class="sw cyan"></i>{formatBandwidth(last(adv) ?? 0)} advertised</span>
						<span><i class="sw green"></i>{formatBandwidth(last(con) ?? 0)} consumed</span>
					</div>
				</div>
				<div class="chart">
					{#if bw.length > 1}
						<svg
							viewBox="0 0 100 100"
							preserveAspectRatio="none"
							role="img"
							aria-label="advertised vs consumed bandwidth over time"
							onpointermove={(e) => onChartMove(e, 'bw', bw.length)}
							onpointerleave={clearHover}
						>
							<path d={areaPath(adv, con, bwMax)} class="fill" />
							<path d={linePath(adv, bwMax)} class="line cyan" vector-effect="non-scaling-stroke" />
							<path
								d={linePath(con, bwMax)}
								class="line green"
								vector-effect="non-scaling-stroke"
							/>
							{#if hover?.chart === 'bw'}
								<line
									class="cursor-line"
									x1={xAt(hover.i, bw.length)}
									y1="0"
									x2={xAt(hover.i, bw.length)}
									y2="100"
									vector-effect="non-scaling-stroke"
								/>
								<circle
									class="cursor-dot cyan"
									cx={xAt(hover.i, bw.length)}
									cy={yAt(adv[hover.i], bwMax)}
									r="2.4"
								/>
								<circle
									class="cursor-dot green"
									cx={xAt(hover.i, bw.length)}
									cy={yAt(con[hover.i], bwMax)}
									r="2.4"
								/>
							{/if}
						</svg>
						{#if hover?.chart === 'bw'}
							<div class="tip" style:left={`${xAt(hover.i, bw.length)}%`}>
								<span class="tip-d">{bw[hover.i].date}</span>
								<span class="tip-v"><i class="sw cyan"></i>{formatBandwidth(adv[hover.i])}</span>
								<span class="tip-v"><i class="sw green"></i>{formatBandwidth(con[hover.i])}</span>
							</div>
						{/if}
						<span class="t0">{bw[0].date}</span>
						<span class="t1">{last(bw)?.date}</span>
					{:else}
						<span class="empty">—</span>
					{/if}
				</div>
			</section>

			<!-- USERS BY COUNTRY -->
			<section class="panel wide">
				<div class="head">
					<div class="cap">est. daily users · top countries</div>
				</div>
				<div class="chart">
					{#if users.series.length > 1}
						<svg
							viewBox="0 0 100 100"
							preserveAspectRatio="none"
							role="img"
							aria-label="estimated daily users by country over time"
							onpointermove={(e) => onChartMove(e, 'users', users.series.length)}
							onpointerleave={clearHover}
						>
							{#each users.countries as cc, i (cc)}
								<path
									d={linePath(userSeries(cc), userMax)}
									class="line"
									style:stroke={ramp(i / Math.max(1, users.countries.length - 1))}
									vector-effect="non-scaling-stroke"
								/>
							{/each}
							{#if hover?.chart === 'users'}
								<line
									class="cursor-line"
									x1={xAt(hover.i, users.series.length)}
									y1="0"
									x2={xAt(hover.i, users.series.length)}
									y2="100"
									vector-effect="non-scaling-stroke"
								/>
								{#each users.countries as cc, i (cc)}
									<circle
										cx={xAt(hover.i, users.series.length)}
										cy={yAt(userSeries(cc)[hover.i], userMax)}
										r="1.8"
										class="cursor-dot"
										style:fill={ramp(i / Math.max(1, users.countries.length - 1))}
									/>
								{/each}
							{/if}
						</svg>
						{#if hover?.chart === 'users'}
							<div class="tip wide" style:left={`${xAt(hover.i, users.series.length)}%`}>
								<span class="tip-d">{users.series[hover.i].date}</span>
								{#each users.countries as cc, i (cc)}
									<span class="tip-row">
										<i
											class="sw"
											style:background={ramp(i / Math.max(1, users.countries.length - 1))}
										></i>
										<span>{countryName(cc)}</span>
										<b>{compact(userSeries(cc)[hover.i] ?? 0)}</b>
									</span>
								{/each}
							</div>
						{/if}
						<span class="t0">{users.series[0].date}</span>
						<span class="t1">{last(users.series)?.date}</span>
					{:else}
						<span class="empty">—</span>
					{/if}
				</div>
				<ul class="ckey">
					{#each users.countries as cc, i (cc)}
						<li>
							<i class="sw" style:background={ramp(i / Math.max(1, users.countries.length - 1))}
							></i>
							<span>{countryName(cc)}</span>
							<b>{compact(last(userSeries(cc)) ?? 0)}</b>
						</li>
					{/each}
				</ul>
			</section>
		</div>
		{#if data.partial}
			<p class="note">Some series were unavailable upstream and are omitted.</p>
		{/if}
	{/if}
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
		max-width: 56ch;
		font-size: 0.74rem;
		line-height: 1.5;
		color: #6f8aa3;
	}
	.panels {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.4rem;
		flex: 1;
		min-height: 0;
	}
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border: 1px solid rgba(58, 93, 120, 0.3);
		border-radius: 8px;
		padding: 1rem;
		background: rgba(8, 20, 31, 0.4);
		min-height: 180px;
	}
	.panel.wide {
		grid-column: 1 / -1;
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.big {
		font-size: 2.2rem;
		line-height: 1;
		color: var(--accent-cyan);
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 16px rgba(0, 212, 255, 0.35);
	}
	.cap {
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		color: #6f8aa3;
	}
	.legend {
		display: flex;
		gap: 1rem;
		margin-top: 0.4rem;
		font-size: 0.68rem;
		color: #9fc6e0;
	}
	.legend span {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.chart {
		position: relative;
		flex: 1;
		min-height: 90px;
		touch-action: none;
	}
	.chart svg {
		width: 100%;
		height: 100%;
		display: block;
		cursor: crosshair;
	}
	.cursor-line {
		stroke: rgba(230, 241, 255, 0.45);
		stroke-width: 1;
		pointer-events: none;
	}
	.cursor-dot {
		fill: #fff;
		stroke: rgba(8, 20, 31, 0.8);
		stroke-width: 0.5;
		pointer-events: none;
	}
	.cursor-dot.cyan {
		fill: var(--accent-cyan);
	}
	.cursor-dot.green {
		fill: var(--accent-green);
	}
	.tip {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.35rem 0.5rem;
		background: rgba(8, 20, 31, 0.92);
		border: 1px solid rgba(58, 93, 120, 0.5);
		border-radius: 6px;
		font-size: 0.64rem;
		color: #e6f1ff;
		white-space: nowrap;
		pointer-events: none;
		z-index: 2;
	}
	.tip.wide {
		gap: 0.15rem;
	}
	.tip-d {
		color: #6f8aa3;
		letter-spacing: 0.04em;
	}
	.tip-v,
	.tip-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-variant-numeric: tabular-nums;
	}
	.tip-row span {
		color: #9fc6e0;
	}
	.tip-row b {
		margin-left: auto;
		color: #e6f1ff;
	}
	.line {
		fill: none;
		stroke-width: 1.8;
	}
	.cyan {
		stroke: var(--accent-cyan);
	}
	.green {
		stroke: var(--accent-green);
	}
	.fill {
		fill: rgba(0, 212, 255, 0.08);
	}
	.t0,
	.t1 {
		position: absolute;
		bottom: -1.1rem;
		font-size: 0.58rem;
		color: #3a5266;
	}
	.t0 {
		left: 0;
	}
	.t1 {
		right: 0;
	}
	.empty {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: #3a5266;
		font-size: 1.4rem;
	}
	.ckey {
		list-style: none;
		margin: 0.8rem 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.2rem;
		font-size: 0.68rem;
		color: #9fc6e0;
	}
	.ckey li {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.ckey b {
		color: #e6f1ff;
		font-variant-numeric: tabular-nums;
	}
	.sw {
		width: 14px;
		height: 3px;
		border-radius: 2px;
		display: inline-block;
	}
	.sw.cyan {
		background: var(--accent-cyan);
	}
	.sw.green {
		background: var(--accent-green);
	}
	.note {
		font-size: 0.66rem;
		color: #6f8aa3;
	}
</style>
