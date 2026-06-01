<script lang="ts">
	import RelayBandwidthBar from '$lib/components/RelayBandwidthBar.svelte';
	import RelayFlags from '$lib/components/RelayFlags.svelte';
	import type { Relay } from '$lib/types';

	let {
		relay,
		maxBandwidth
	}: {
		relay: Relay;
		maxBandwidth: number;
	} = $props();
</script>

<li class="relay-row">
	<span class="rn" title={relay.nickname}>{relay.nickname}</span>
	<span class="rc">{relay.country.toUpperCase()}</span>
	<span class="rb">
		<RelayBandwidthBar bandwidth={relay.bandwidth} {maxBandwidth} />
	</span>
	<span class="rf">
		<RelayFlags {relay} />
	</span>
</li>

<style>
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
		font-variant-numeric: tabular-nums;
		display: flex;
		flex-direction: column;
		gap: 2px;
		align-items: stretch;
	}
	.rf {
		display: flex;
		gap: 0.2rem;
		justify-content: flex-end;
	}
</style>
