<script lang="ts">
	import { formatBandwidth } from '$lib/relay-stats';

	let {
		relayCount,
		totalBandwidth,
		relaysLabel,
		legendExitLabel,
		legendBrightnessLabel
	}: {
		relayCount: number;
		totalBandwidth: number;
		relaysLabel: string;
		legendExitLabel: string;
		legendBrightnessLabel: string;
	} = $props();
</script>

<div class="hud">
	<div class="metric">
		<span class="count">{relayCount.toLocaleString()}</span>
		<span class="unit">{relaysLabel}</span>
	</div>
	<div class="metric">
		<span class="bw">{formatBandwidth(totalBandwidth)}</span>
	</div>
	<div class="legend">
		<span class="enc"><i class="ramp"></i>{legendExitLabel}</span>
		<span class="enc"><i class="bright"></i>{legendBrightnessLabel}</span>
	</div>
</div>

<style>
	.hud {
		position: fixed;
		bottom: 1.5rem;
		left: 1.5rem;
		pointer-events: none;
		background: rgba(8, 14, 22, 0.6);
		padding: 0.8rem 1rem;
		border-radius: 8px;
		border: 1px solid rgba(58, 93, 120, 0.2);
	}
	.metric {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.count {
		font-size: 2.4rem;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.05em;
		color: var(--accent-cyan);
		text-shadow:
			0 0 20px rgba(0, 212, 255, 0.7),
			0 0 40px rgba(0, 212, 255, 0.3);
	}
	.unit {
		font-size: 0.8rem;
		letter-spacing: 0.15em;
		color: #6f8aa3;
	}
	.bw {
		font-size: 1rem;
		color: #9fc6e0;
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 8px rgba(159, 198, 224, 0.3);
	}
	.legend {
		margin-top: 0.7rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		color: #6f8aa3;
	}
	.enc {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.bright,
	.ramp {
		width: 28px;
		height: 8px;
		display: inline-block;
		border-radius: 999px;
	}
	.bright {
		background: linear-gradient(90deg, #0e2230, #00d4ff);
	}
	.ramp {
		background: linear-gradient(90deg, #00d4ff, #39ff14);
	}
</style>
