<script lang="ts">
	import { onMount } from 'svelte';
	import { geoPath } from 'd3-geo';
	import { countryFeatures, randomPointInCountry, makeProjection } from '$lib/geo/world';
	import { buildSamplers, sampleCircuit, type Circuit } from '$lib/analysis/circuit';
	import { flagEmoji, countryName } from '$lib/relay-stats';
	import { relayStore } from '$lib/stores/relays.svelte';
	import type { Relay } from '$lib/types';

	const MAX = 7;
	const LIFE = 5600; // ms a circuit is animated before it fades out
	const SPAWN = 1100; // ms between new circuits

	let width = $state(0);
	let height = $state(0);
	let now = $state(0);

	const projection = $derived(width && height ? makeProjection(width, height) : null);
	const path = $derived(projection ? geoPath(projection) : null);
	const landPaths = $derived(path ? countryFeatures.map((f) => path(f as never) ?? '') : []);

	const samplers = $derived(buildSamplers(relayStore.relays));

	// ── Mode toggles ─────────────────────────────────────────────────────────────
	/** false = normal circuit, true = .onion circuit */
	let onionMode = $state(false);
	/** Hidden Service style: 'A' | 'B' | 'C' */
	let hsStyle = $state<'A' | 'B' | 'C'>('A');

	// ── Geo distribution weights (for User & Destination points) ─────────────────
	interface GeodistData {
		users: Record<string, number>;
		exits: Record<string, number>;
	}
	let geodist = $state<GeodistData | null>(null);

	/** Build a weighted prefix-sum sampler from a Record<cc, weight> */
	function buildWeightMap(
		map: Record<string, number>
	): { ccs: string[]; cumulative: number[]; total: number } {
		const entries = Object.entries(map).filter(([, w]) => w > 0);
		const ccs: string[] = [];
		const cumulative: number[] = [];
		let total = 0;
		for (const [cc, w] of entries) {
			total += w;
			ccs.push(cc);
			cumulative.push(total);
		}
		return { ccs, cumulative, total };
	}

	function weightedPickCC(wm: {
		ccs: string[];
		cumulative: number[];
		total: number;
	}): string | null {
		if (wm.ccs.length === 0 || wm.total <= 0) return null;
		const target = Math.random() * wm.total;
		let lo = 0;
		let hi = wm.cumulative.length - 1;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (wm.cumulative[mid] < target) lo = mid + 1;
			else hi = mid;
		}
		return wm.ccs[lo] ?? null;
	}

	const userWM = $derived(geodist ? buildWeightMap(geodist.users) : null);
	const exitWM = $derived(geodist ? buildWeightMap(geodist.exits) : null);

	// ── Normal circuit type ───────────────────────────────────────────────────────
	interface Live {
		id: number;
		c: Circuit;
		born: number;
		/** [guard, middle, exit] lon/lat coords */
		coords: [number, number][];
		/** User source point [lon, lat] */
		userCoord: [number, number] | null;
		/** Destination point [lon, lat] */
		destCoord: [number, number] | null;
	}

	/** .onion circuit: client side G1→M1→RP plus HS side HS→G2→M2→RP */
	interface OnionLive {
		id: number;
		born: number;
		cGuard: Relay;
		cMiddle: Relay;
		hsGuard: Relay;
		hsMiddle: Relay;
		rp: Relay;
		/** [cGuardCoord, cMiddleCoord, rpCoord, hsGuardCoord, hsMiddleCoord] */
		coords: ([number, number] | null)[];
		userCoord: [number, number] | null;
		/** Style B initial offset for the HS node */
		hsOffset: [number, number];
	}

	let circuits = $state<Live[]>([]);
	let onionCircuits = $state<OnionLive[]>([]);
	let seq = 0;

	function coordOf(r: Relay): [number, number] | null {
		return randomPointInCountry(r.country);
	}

	function spawn() {
		if (relayStore.relays.length === 0) return;
		if (onionMode) spawnOnion();
		else spawnNormal();
	}

	function spawnNormal() {
		if (circuits.length >= MAX) return;
		const c = sampleCircuit(samplers);
		if (!c) return;
		const g = coordOf(c.guard);
		const m = coordOf(c.middle);
		const e = coordOf(c.exit);
		if (!g || !m || !e) return;

		let userCoord: [number, number] | null = null;
		if (userWM) {
			const cc = weightedPickCC(userWM);
			if (cc) userCoord = randomPointInCountry(cc);
		}

		let destCoord: [number, number] | null = null;
		if (exitWM) {
			const cc = weightedPickCC(exitWM);
			if (cc) destCoord = randomPointInCountry(cc);
		}

		circuits = [
			...circuits,
			{ id: seq++, c, born: performance.now(), coords: [g, m, e], userCoord, destCoord }
		];
	}

	function spawnOnion() {
		if (onionCircuits.length >= MAX) return;
		const all = relayStore.relays;
		if (all.length < 5) return;
		const c = sampleCircuit(samplers);
		if (!c) return;

		const used = new Set([c.guard, c.middle, c.exit]);

		// Rendezvous point: pick from middle-capable relays not already used
		const middles = all.filter((r) => r.middleProb > 0 && !used.has(r));
		if (middles.length < 3) return;
		const rp = middles[Math.floor(Math.random() * middles.length)];
		used.add(rp);

		const hsGuardPool = all.filter((r) => r.guardProb > 0 && !used.has(r));
		if (hsGuardPool.length === 0) return;
		const hsGuard = hsGuardPool[Math.floor(Math.random() * hsGuardPool.length)];
		used.add(hsGuard);

		const hsMiddlePool = middles.filter((r) => !used.has(r));
		if (hsMiddlePool.length === 0) return;
		const hsMiddle = hsMiddlePool[Math.floor(Math.random() * hsMiddlePool.length)];

		let userCoord: [number, number] | null = null;
		if (userWM) {
			const cc = weightedPickCC(userWM);
			if (cc) userCoord = randomPointInCountry(cc);
		}

		const hsOffset: [number, number] = [
			width * (0.5 + (Math.random() - 0.5) * 0.6),
			height * (0.3 + (Math.random() - 0.5) * 0.4)
		];

		onionCircuits = [
			...onionCircuits,
			{
				id: seq++,
				born: performance.now(),
				cGuard: c.guard,
				cMiddle: c.middle,
				hsGuard,
				hsMiddle,
				rp,
				coords: [coordOf(c.guard), coordOf(c.middle), coordOf(rp), coordOf(hsGuard), coordOf(hsMiddle)],
				userCoord,
				hsOffset
			}
		];
	}

	// ── Tick / animation ──────────────────────────────────────────────────────────
	onMount(() => {
		fetch('/api/geodist')
			.then((r) => r.json())
			.then((d: GeodistData & { unavailable?: boolean }) => {
				if (d && !d.unavailable) {
					geodist = { users: d.users ?? {}, exits: d.exits ?? {} };
				}
			})
			.catch(() => {
				// degrade silently — user/dest points won't appear
			});

		let raf = 0;
		const tick = () => {
			now = performance.now();
			const cutoff = now - LIFE;
			if (circuits.some((x) => x.born < cutoff)) {
				circuits = circuits.filter((x) => x.born >= cutoff);
			}
			if (onionCircuits.some((x) => x.born < cutoff)) {
				onionCircuits = onionCircuits.filter((x) => x.born >= cutoff);
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		const iv = setInterval(spawn, SPAWN);
		const seed = setInterval(() => {
			if (relayStore.relays.length > 0) {
				spawn();
				const activeCount = onionMode ? onionCircuits.length : circuits.length;
				if (activeCount >= 3) clearInterval(seed);
			}
		}, 250);
		return () => {
			cancelAnimationFrame(raf);
			clearInterval(iv);
			clearInterval(seed);
		};
	});

	// Clear circuits when mode switches so they respawn in the new mode
	$effect(() => {
		void onionMode;
		circuits = [];
		onionCircuits = [];
	});

	// ── Projection helpers ────────────────────────────────────────────────────────
	function project(co: [number, number]): [number, number] | null {
		const p = projection?.(co);
		return p ? [p[0], p[1]] : null;
	}
	function lerp(a: number, b: number, t: number): number {
		return a + (b - a) * t;
	}
	function packet(pts: ([number, number] | null)[], t: number): [number, number] | null {
		const seg = t < 0.5 ? 0 : 1;
		const lt = seg === 0 ? t / 0.5 : (t - 0.5) / 0.5;
		const a = pts[seg];
		const b = pts[seg + 1];
		if (!a || !b) return null;
		return [lerp(a[0], b[0], lt), lerp(a[1], b[1], lt)];
	}
	const progress = (born: number) => Math.min(1, (now - born) / LIFE);
	function fade(born: number): number {
		const t = progress(born);
		if (t < 0.1) return t / 0.1;
		if (t > 0.85) return (1 - t) / 0.15;
		return 1;
	}
	const pulse = $derived(2.6 + Math.sin(now / 260) * 0.7);

	/** Flash intensity peaking at 60% of circuit life */
	function rpFlashOp(born: number): number {
		const t = progress(born);
		const dist = Math.abs(t - 0.6);
		if (dist > 0.08) return 0;
		return 1 - dist / 0.08;
	}

	// ── HS glitch seed (style B, ticks every 800ms) ───────────────────────────────
	let glitchSeed = $state(0);
	$effect(() => {
		if (!onionMode || hsStyle !== 'B') return;
		const iv = setInterval(() => {
			glitchSeed = Math.random();
		}, 800);
		return () => clearInterval(iv);
	});

	// ── HS wander position (style C) ──────────────────────────────────────────────
	let wanderX = $state(0.5);
	let wanderY = $state(0.4);
	let wanderTargetX = $state(0.5);
	let wanderTargetY = $state(0.4);
	$effect(() => {
		if (!onionMode || hsStyle !== 'C') return;
		const iv = setInterval(() => {
			wanderTargetX = 0.3 + Math.random() * 0.4;
			wanderTargetY = 0.2 + Math.random() * 0.5;
		}, 3000);
		let rafId = 0;
		const step = () => {
			wanderX = lerp(wanderX, wanderTargetX, 0.02);
			wanderY = lerp(wanderY, wanderTargetY, 0.02);
			rafId = requestAnimationFrame(step);
		};
		rafId = requestAnimationFrame(step);
		return () => {
			clearInterval(iv);
			cancelAnimationFrame(rafId);
		};
	});

	/** Screen position of HS node for styles B/C */
	function hsScreenPos(live: OnionLive): [number, number] {
		if (hsStyle === 'C') return [width * wanderX, height * wanderY];
		const gx = ((Math.sin(glitchSeed * 17.3 + live.id) * 24) | 0);
		const gy = ((Math.cos(glitchSeed * 11.7 + live.id) * 16) | 0);
		return [live.hsOffset[0] + gx, live.hsOffset[1] + gy];
	}

	// ── Readout ───────────────────────────────────────────────────────────────────
	const latest = $derived(circuits.length ? circuits[circuits.length - 1] : null);
	const latestOnion = $derived(
		onionCircuits.length ? onionCircuits[onionCircuits.length - 1] : null
	);
	const roles = $derived(
		latest
			? [
					{ key: 'guard', label: 'Guard', r: latest.c.guard },
					{ key: 'middle', label: 'Middle', r: latest.c.middle },
					{ key: 'exit', label: 'Exit', r: latest.c.exit }
				]
			: []
	);
	const onionRoles = $derived(
		latestOnion
			? [
					{ key: 'guard', label: 'Client Guard', r: latestOnion.cGuard },
					{ key: 'middle', label: 'Client Middle', r: latestOnion.cMiddle },
					{ key: 'exit', label: 'Rendezvous Point', r: latestOnion.rp },
					{ key: 'hs-guard', label: 'HS Guard', r: latestOnion.hsGuard },
					{ key: 'hs-middle', label: 'HS Middle', r: latestOnion.hsMiddle }
				]
			: []
	);
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
	<svg {width} {height} role="presentation">
		{#each landPaths as d, i (i)}
			<path class="land" {d} />
		{/each}

		<!-- ── Normal circuits ───────────────────────────────────────────────── -->
		{#if !onionMode}
			{#each circuits as live (live.id)}
				{@const pts = live.coords.map(project)}
				{@const up = live.userCoord ? project(live.userCoord) : null}
				{@const dp = live.destCoord ? project(live.destCoord) : null}
				{@const op = fade(live.born)}
				{@const pk = packet(pts, progress(live.born))}
				<g style:opacity={op}>
					<!-- User → Guard dashed edge -->
					{#if up && pts[0]}
						<line x1={up[0]} y1={up[1]} x2={pts[0][0]} y2={pts[0][1]} class="hop user-edge" />
					{/if}
					<!-- Guard → Middle -->
					{#if pts[0] && pts[1]}
						<line x1={pts[0][0]} y1={pts[0][1]} x2={pts[1][0]} y2={pts[1][1]} class="hop a" />
					{/if}
					<!-- Middle → Exit -->
					{#if pts[1] && pts[2]}
						<line x1={pts[1][0]} y1={pts[1][1]} x2={pts[2][0]} y2={pts[2][1]} class="hop b" />
					{/if}
					<!-- Exit → Destination dashed edge -->
					{#if pts[2] && dp}
						<line x1={pts[2][0]} y1={pts[2][1]} x2={dp[0]} y2={dp[1]} class="hop dest-edge" />
					{/if}
					<!-- User node -->
					{#if up}<circle cx={up[0]} cy={up[1]} r={pulse * 0.85} class="node user-node" />{/if}
					<!-- Relay nodes -->
					{#if pts[0]}<circle cx={pts[0][0]} cy={pts[0][1]} r={pulse} class="node guard" />{/if}
					{#if pts[1]}<circle cx={pts[1][0]} cy={pts[1][1]} r={pulse} class="node middle" />{/if}
					{#if pts[2]}<circle cx={pts[2][0]} cy={pts[2][1]} r={pulse} class="node exit" />{/if}
					<!-- Destination node -->
					{#if dp}<circle cx={dp[0]} cy={dp[1]} r={pulse * 0.85} class="node dest-node" />{/if}
					<!-- Travelling packet -->
					{#if pk}<circle cx={pk[0]} cy={pk[1]} r="3" class="packet" />{/if}
				</g>
			{/each}
		{/if}

		<!-- ── .onion circuits ───────────────────────────────────────────────── -->
		{#if onionMode}
			{#each onionCircuits as live (live.id)}
				{@const [cg, cm, rpc, hsg, hsm] = live.coords.map((c) => (c ? project(c) : null))}
				{@const up = live.userCoord ? project(live.userCoord) : null}
				{@const op = fade(live.born)}
				{@const flashOp = rpFlashOp(live.born)}
				{@const hsSP = hsStyle !== 'A' ? hsScreenPos(live) : null}
				<g style:opacity={op}>
					<!-- Client side: User → cGuard → cMiddle → RP -->
					{#if up && cg}
						<line x1={up[0]} y1={up[1]} x2={cg[0]} y2={cg[1]} class="hop user-edge" />
					{/if}
					{#if cg && cm}
						<line x1={cg[0]} y1={cg[1]} x2={cm[0]} y2={cm[1]} class="hop a" />
					{/if}
					{#if cm && rpc}
						<line x1={cm[0]} y1={cm[1]} x2={rpc[0]} y2={rpc[1]} class="hop a" />
					{/if}

					<!-- HS side to RP -->
					{#if hsStyle === 'A'}
						<!-- Style A: dashed line from right panel edge to RP -->
						{#if rpc}
							<line
								x1={width - 20}
								y1={height / 2}
								x2={rpc[0]}
								y2={rpc[1]}
								class="hop hs-edge"
								stroke-dasharray="6 4"
							/>
						{/if}
					{:else if hsSP}
						<!-- Styles B/C: HS on map -->
						{#if hsg}
							<line x1={hsSP[0]} y1={hsSP[1]} x2={hsg[0]} y2={hsg[1]} class="hop hs-edge" />
						{/if}
						{#if hsg && hsm}
							<line x1={hsg[0]} y1={hsg[1]} x2={hsm[0]} y2={hsm[1]} class="hop hs-inner" />
						{/if}
						{#if hsm && rpc}
							<line x1={hsm[0]} y1={hsm[1]} x2={rpc[0]} y2={rpc[1]} class="hop hs-inner" />
						{/if}
					{/if}

					<!-- HS guard/middle relay nodes (styles B/C) -->
					{#if hsStyle !== 'A' && hsg}
						<circle cx={hsg[0]} cy={hsg[1]} r={pulse} class="node hs-relay" />
					{/if}
					{#if hsStyle !== 'A' && hsm}
						<circle cx={hsm[0]} cy={hsm[1]} r={pulse} class="node hs-relay" />
					{/if}

					<!-- HS node visual -->
					{#if hsStyle === 'B' && hsSP}
						{@const gx2 = ((Math.sin(glitchSeed * 5.1 + live.id + 1) * 12) | 0)}
						{@const gy2 = ((Math.cos(glitchSeed * 8.3 + live.id + 1) * 8) | 0)}
						<circle cx={hsSP[0] + gx2} cy={hsSP[1] + gy2} r={pulse * 1.5} class="node hs-ghost" />
						<circle cx={hsSP[0]} cy={hsSP[1]} r={pulse * 1.2} class="node hs-glitch" />
					{:else if hsStyle === 'C' && hsSP}
						<circle cx={hsSP[0]} cy={hsSP[1]} r={pulse * 1.4} class="node hs-fog" />
					{/if}

					<!-- Client nodes -->
					{#if up}<circle cx={up[0]} cy={up[1]} r={pulse * 0.85} class="node user-node" />{/if}
					{#if cg}<circle cx={cg[0]} cy={cg[1]} r={pulse} class="node guard" />{/if}
					{#if cm}<circle cx={cm[0]} cy={cm[1]} r={pulse} class="node middle" />{/if}

					<!-- RP node with flash at convergence -->
					{#if rpc}
						<circle
							cx={rpc[0]}
							cy={rpc[1]}
							r={pulse * (1 + flashOp * 1.5)}
							class="node rp"
							style:filter={flashOp > 0.05
								? `drop-shadow(0 0 ${6 + flashOp * 14}px rgba(255,220,80,${flashOp}))`
								: undefined}
						/>
					{/if}
				</g>
			{/each}

			<!-- Style A: off-map Hidden Service panel -->
			{#if hsStyle === 'A'}
				<foreignObject x={width - 174} y={height / 2 - 28} width="164" height="56">
					<div class="hs-panel" xmlns="http://www.w3.org/1999/xhtml">
						<span class="hs-icon">&#x1F9C5;</span>
						<span class="hs-label">Hidden Service</span>
					</div>
				</foreignObject>
			{/if}
		{/if}
	</svg>

	<!-- ── Controls ─────────────────────────────────────────────────────────── -->
	<div class="controls">
		<button class="mode-btn" class:active={!onionMode} onclick={() => { onionMode = false; }}>
			Normal
		</button>
		<button class="mode-btn" class:active={onionMode} onclick={() => { onionMode = true; }}>
			&#x1F9C5; .onion
		</button>
		{#if onionMode}
			<span class="hs-style-label">HS:</span>
			{#each (['A', 'B', 'C'] as const) as s (s)}
				<button
					class="style-btn"
					class:active={hsStyle === s}
					onclick={() => { hsStyle = s; }}>{s}</button
				>
			{/each}
		{/if}
	</div>

	<!-- ── HUD ──────────────────────────────────────────────────────────────── -->
	<div class="hud">
		<div class="title">{onionMode ? '.onion circuits' : 'Live circuits'}</div>
		<div class="sub">
			{#if onionMode}
				Client: User &rarr; Guard &rarr; Middle &rarr; RP &nbsp;|&nbsp; HS side merges at Rendezvous
				Point
			{:else}
				User &rarr; Guard &rarr; Middle &rarr; Exit &rarr; Destination, sampled from real relays by
				selection weight
			{/if}
		</div>
	</div>

	<!-- ── Normal readout ───────────────────────────────────────────────────── -->
	{#if !onionMode && latest}
		<aside class="readout">
			{#each roles as role (role.key)}
				<div class="hop-row">
					<i class="dot {role.key}"></i>
					<div class="meta">
						<span class="rl">{role.label}</span>
						<span class="rc">{flagEmoji(role.r.country)} {countryName(role.r.country)}</span>
						<span class="ra">{role.r.asName ?? role.r.as ?? 'unknown AS'}</span>
					</div>
				</div>
			{/each}
		</aside>
	{/if}

	<!-- ── .onion readout ───────────────────────────────────────────────────── -->
	{#if onionMode && latestOnion}
		<aside class="readout onion-readout">
			{#each onionRoles as role (role.key)}
				<div class="hop-row">
					<i class="dot {role.key}"></i>
					<div class="meta">
						<span class="rl">{role.label}</span>
						<span class="rc">{flagEmoji(role.r.country)} {countryName(role.r.country)}</span>
						<span class="ra">{role.r.asName ?? role.r.as ?? 'unknown AS'}</span>
					</div>
				</div>
			{/each}
			<div class="hs-row">
				<i class="dot hs-dot"></i>
				<div class="meta">
					<span class="rl">Hidden Service</span>
					<span class="rc hs-unknown">&#x1F9C5; location unknown</span>
				</div>
			</div>
		</aside>
	{/if}
</div>

<style>
	.map {
		position: fixed;
		inset: 0;
		background: radial-gradient(ellipse at 50% 40%, #122436 0%, #0a141f 70%, #070d16 100%);
	}
	svg {
		display: block;
	}
	.land {
		fill: #16293a;
		stroke: #24405a;
		stroke-width: 0.4;
	}
	.hop {
		stroke-width: 1.1;
		stroke-linecap: round;
	}
	.hop.a {
		stroke: rgba(0, 212, 255, 0.55);
	}
	.hop.b {
		stroke: rgba(57, 255, 20, 0.55);
	}
	.hop.user-edge {
		stroke: rgba(255, 200, 60, 0.45);
		stroke-dasharray: 4 3;
	}
	.hop.dest-edge {
		stroke: rgba(255, 120, 60, 0.45);
		stroke-dasharray: 4 3;
	}
	.hop.hs-edge {
		stroke: rgba(200, 80, 255, 0.5);
	}
	.hop.hs-inner {
		stroke: rgba(160, 60, 220, 0.4);
	}
	.node {
		stroke: rgba(0, 0, 0, 0.4);
		stroke-width: 0.5;
	}
	.node.guard {
		fill: var(--accent-cyan);
	}
	.node.middle {
		fill: #9fc6e0;
	}
	.node.exit {
		fill: var(--accent-green);
	}
	.node.user-node {
		fill: rgba(255, 200, 60, 0.9);
	}
	.node.dest-node {
		fill: rgba(255, 120, 60, 0.9);
	}
	.node.rp {
		fill: rgba(255, 220, 80, 0.95);
		stroke: rgba(255, 200, 40, 0.8);
		stroke-width: 1;
	}
	.node.hs-relay {
		fill: rgba(160, 60, 220, 0.6);
	}
	.node.hs-glitch {
		fill: rgba(200, 80, 255, 0.7);
		animation: glitch-jitter 0.15s infinite alternate;
	}
	.node.hs-ghost {
		fill: rgba(200, 80, 255, 0.25);
	}
	.node.hs-fog {
		fill: rgba(200, 80, 255, 0.35);
		filter: blur(6px);
	}
	@keyframes glitch-jitter {
		0% {
			transform: translate(0, 0) scaleX(1);
		}
		25% {
			transform: translate(-3px, 2px) scaleX(1.05);
		}
		50% {
			transform: translate(4px, -1px) scaleX(0.97);
		}
		75% {
			transform: translate(-2px, 3px) scaleX(1.03);
		}
		100% {
			transform: translate(3px, -2px) scaleX(0.98);
		}
	}
	.packet {
		fill: #fff;
		filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
	}

	/* ── Controls ── */
	.controls {
		position: fixed;
		top: 1rem;
		right: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		pointer-events: all;
	}
	.mode-btn,
	.style-btn {
		padding: 0.25rem 0.6rem;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		border-radius: 6px;
		border: 1px solid rgba(0, 212, 255, 0.25);
		background: rgba(8, 14, 22, 0.75);
		color: #8faec4;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
		backdrop-filter: blur(8px);
	}
	.mode-btn:hover,
	.style-btn:hover {
		border-color: rgba(0, 212, 255, 0.5);
		color: #e6f1ff;
	}
	.mode-btn.active {
		background: rgba(0, 212, 255, 0.18);
		border-color: rgba(0, 212, 255, 0.6);
		color: #e6f1ff;
	}
	.style-btn.active {
		background: rgba(180, 60, 255, 0.2);
		border-color: rgba(180, 60, 255, 0.55);
		color: #e6f1ff;
	}
	.hs-style-label {
		font-size: 0.65rem;
		color: #6f8aa3;
		letter-spacing: 0.08em;
		margin-left: 0.3rem;
	}

	/* ── Style A off-map HS panel ── */
	.hs-panel {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.7rem;
		background: rgba(50, 10, 70, 0.82);
		border: 1px solid rgba(180, 60, 255, 0.4);
		border-radius: 8px;
		backdrop-filter: blur(8px);
	}
	.hs-icon {
		font-size: 1.1rem;
	}
	.hs-label {
		font-size: 0.68rem;
		color: rgba(200, 140, 255, 0.9);
		letter-spacing: 0.1em;
		white-space: nowrap;
	}

	/* ── HUD ── */
	.hud {
		position: fixed;
		bottom: 1.5rem;
		left: 1.5rem;
		pointer-events: none;
	}
	.title {
		font-size: 1.1rem;
		letter-spacing: 0.12em;
		color: #e6f1ff;
		text-transform: uppercase;
	}
	.sub {
		margin-top: 0.3rem;
		font-size: 0.72rem;
		color: #6f8aa3;
		max-width: 60ch;
	}

	/* ── Readout panels ── */
	.readout {
		position: fixed;
		bottom: 4rem;
		left: 1.5rem;
		width: 240px;
		padding: 1.2rem;
		background: rgba(8, 14, 22, 0.82);
		border: 1px solid rgba(0, 212, 255, 0.2);
		border-radius: 12px;
		backdrop-filter: blur(12px);
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.onion-readout {
		border-color: rgba(180, 60, 255, 0.25);
		width: 260px;
	}
	.hop-row {
		display: grid;
		grid-template-columns: 10px 1fr;
		gap: 0.6rem;
		align-items: start;
	}
	.hs-row {
		display: grid;
		grid-template-columns: 10px 1fr;
		gap: 0.6rem;
		align-items: start;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(180, 60, 255, 0.15);
		margin-top: 0.2rem;
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		margin-top: 0.2rem;
	}
	.dot.guard {
		background: var(--accent-cyan);
	}
	.dot.middle {
		background: #9fc6e0;
	}
	.dot.exit {
		background: var(--accent-green);
	}
	.dot.rp {
		background: rgba(255, 220, 80, 0.95);
	}
	.dot.hs-guard,
	.dot.hs-middle {
		background: rgba(160, 60, 220, 0.7);
	}
	.dot.hs-dot {
		background: rgba(200, 80, 255, 0.7);
		box-shadow: 0 0 4px rgba(200, 80, 255, 0.5);
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.rl {
		font-size: 0.64rem;
		letter-spacing: 0.14em;
		color: #6f8aa3;
		text-transform: uppercase;
	}
	.rc {
		font-size: 0.86rem;
		color: #e6f1ff;
	}
	.ra {
		font-size: 0.68rem;
		color: #9fc6e0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.hs-unknown {
		color: rgba(200, 140, 255, 0.7);
		font-style: italic;
	}
</style>
