<script lang="ts">
	import { countryName, flagEmoji, formatBandwidth, type CountryStats } from '$lib/relay-stats';
	import type { Messages } from '$lib/i18n/index.svelte';
	import CountryRoleBreakdown from '$lib/components/panels/CountryRoleBreakdown.svelte';

	let {
		stats,
		t
	}: {
		stats: CountryStats;
		t: Messages['countryPanel'];
	} = $props();
</script>

<div class="flag">{flagEmoji(stats.country)}</div>
<div class="name">{countryName(stats.country)}</div>
<div class="code">{stats.country.toUpperCase()}</div>

<div class="count">{stats.count.toLocaleString()}</div>
<div class="label">{t.relays}</div>

<div class="bw">{formatBandwidth(stats.bandwidth)}</div>

<CountryRoleBreakdown {stats} {t} />

<style>
	.flag {
		font-size: 2.4rem;
	}
	.name {
		margin-top: 0.3rem;
		font-size: 1.1rem;
		color: #e6f1ff;
		line-height: 1.2;
		text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
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
		text-shadow: 0 0 8px rgba(159, 198, 224, 0.3);
	}
</style>
