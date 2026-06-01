<script lang="ts">
	import { bandwidthColor, formatBandwidth } from '$lib/relay-stats';

	let {
		bandwidth,
		maxBandwidth,
		variant = 'stacked'
	}: {
		bandwidth: number;
		maxBandwidth: number;
		variant?: 'inline' | 'stacked';
	} = $props();

	const color = $derived(bandwidthColor(bandwidth, maxBandwidth));
	const width = $derived(maxBandwidth > 0 ? (bandwidth / maxBandwidth) * 100 : 0);
</script>

<span class="bandwidth" class:inline={variant === 'inline'}>
	<span class="bar-wrap">
		<span class="bar" style:width="{width.toFixed(1)}%" style:background={color}></span>
	</span>
	<span class="text" style:color>{formatBandwidth(bandwidth)}</span>
</span>

<style>
	.bandwidth {
		font-variant-numeric: tabular-nums;
		display: flex;
		flex-direction: column;
		gap: 2px;
		align-items: stretch;
	}
	.bandwidth.inline {
		flex-direction: row;
		align-items: center;
		gap: 0.3rem;
	}
	.bar-wrap {
		height: 3px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 2px;
		overflow: hidden;
	}
	.inline .bar-wrap {
		flex: 1;
	}
	.bar {
		display: block;
		height: 100%;
		border-radius: 2px;
		transition: width 0.2s ease;
	}
	.text {
		font-size: 0.68rem;
		text-align: right;
		transition: color 0.2s ease;
	}
	.inline .text {
		font-size: 0.62rem;
		white-space: nowrap;
		flex-shrink: 0;
	}
</style>
