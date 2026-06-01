<script lang="ts">
	import type { ProviderBandwidth } from '$lib/analysis/hosting';

	let {
		providers,
		title
	}: {
		providers: ProviderBandwidth[];
		title: string;
	} = $props();
</script>

{#if providers.length > 0}
	<div class="section-title">{title}</div>
	<ul class="as-bars">
		{#each providers as entry (entry.key)}
			<li>
				<span class="as-name" title="{entry.key} · {entry.name}">{entry.name}</span>
				<div class="as-track">
					<div class="as-fill" style:width="{entry.share}%"></div>
				</div>
				<span class="as-pct">{entry.share.toFixed(0)}%</span>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.section-title {
		font-size: 0.62rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #3a5266;
		margin-bottom: -0.4rem;
	}
	.as-bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.as-bars li {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-rows: auto auto;
		gap: 0.15rem 0.5rem;
		align-items: center;
	}
	.as-name {
		font-size: 0.68rem;
		color: #9fc6e0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		grid-column: 1;
		grid-row: 1;
	}
	.as-track {
		grid-column: 1;
		grid-row: 2;
		height: 5px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 3px;
		overflow: hidden;
	}
	.as-fill {
		height: 100%;
		background: var(--accent-cyan);
		border-radius: 3px;
		min-width: 2px;
	}
	.as-pct {
		grid-column: 2;
		grid-row: 1 / 3;
		font-size: 0.68rem;
		font-variant-numeric: tabular-nums;
		color: #6f8aa3;
		text-align: right;
		align-self: center;
	}
</style>
