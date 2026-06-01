<script lang="ts">
	import { getMessages, getLocale } from '$lib/i18n/index.svelte';
	import { aboutSections, cardDescription } from '$lib/content/about';
	import ViewShell from '$lib/components/layout/ViewShell.svelte';

	const t = $derived(getMessages());
	const locale = $derived(getLocale());
</script>

<ViewShell title={t.about.title} description={t.about.subtitle}>
	<div class="body">
		{#each aboutSections as section (section.id)}
			<section>
				<h2>{section.title[locale]}</h2>
				<div class="cards">
					{#each section.cards as card (card.href)}
						<a href={card.href} target="_blank" rel="external noopener noreferrer" class="card">
							<div class="card-name">{card.name}</div>
							<div class="card-desc">{cardDescription(card, locale)}</div>
							<div class="card-url">{card.url}</div>
						</a>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</ViewShell>

<style>
	.body {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	section h2 {
		margin: 0 0 0.75rem;
		font-size: 0.65rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #3a5266;
	}
	.cards {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.85rem 1.1rem;
		width: 22rem;
		max-width: 100%;
		background: #0b1824;
		border: 1px solid #1e3044;
		border-radius: 4px;
		text-decoration: none;
		transition:
			border-color 0.18s,
			background 0.18s;
	}
	.card:hover {
		border-color: #2a4a66;
		background: #0e1f30;
	}
	.card-name {
		font-size: 0.82rem;
		letter-spacing: 0.08em;
		color: #9fc6e0;
	}
	.card-desc {
		font-size: 0.7rem;
		line-height: 1.5;
		color: #6f8aa3;
	}
	.card-url {
		margin-top: 0.2rem;
		font-size: 0.62rem;
		letter-spacing: 0.06em;
		color: #2a4a66;
		font-variant-numeric: tabular-nums;
	}
</style>
