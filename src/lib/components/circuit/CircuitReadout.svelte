<script lang="ts">
	import { flagEmoji, countryName } from '$lib/relay-stats';
	import type { Circuit } from '$lib/analysis/circuit';
	import type { Messages } from '$lib/i18n/index.svelte';

	let {
		circuit,
		t
	}: {
		circuit: Circuit;
		t: Messages['circuits'];
	} = $props();

	const roles = $derived([
		{ key: 'guard', label: t.guardLabel, relay: circuit.guard },
		{ key: 'middle', label: t.middleLabel, relay: circuit.middle },
		{ key: 'exit', label: t.exitLabel, relay: circuit.exit }
	]);
</script>

<aside class="readout">
	{#each roles as role (role.key)}
		<div class="hop-row">
			<i class="dot {role.key}"></i>
			<div class="meta">
				<span class="rl">{role.label}</span>
				<span class="rc">{flagEmoji(role.relay.country)} {countryName(role.relay.country)}</span>
				<span class="ra">{role.relay.asName ?? role.relay.as ?? t.unknownAs}</span>
			</div>
		</div>
	{/each}
</aside>

<style>
	.readout {
		position: absolute;
		/* Clear the fixed footer plus the HUD title/subtitle below us. */
		bottom: calc(var(--footer-height, 2rem) + 4.5rem);
		left: 1.5rem;
		width: 240px;
		max-width: calc(100% - 3rem);
		padding: 1.2rem;
		background: #08141f;
		border: 1px solid rgba(58, 93, 120, 0.35);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	@media (max-width: 480px) {
		.readout {
			right: 1.5rem;
			width: auto;
			padding: 0.9rem 1rem;
			gap: 0.6rem;
		}
		.hop-row {
			grid-template-columns: 10px 1fr auto;
			align-items: center;
		}
		.meta {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 0.1rem 0.6rem;
			align-items: baseline;
		}
		.ra {
			flex-basis: 100%;
		}
	}
	.hop-row {
		display: grid;
		grid-template-columns: 10px 1fr;
		gap: 0.6rem;
		align-items: start;
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
</style>
