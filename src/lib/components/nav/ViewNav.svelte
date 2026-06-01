<script lang="ts">
	import { VIEWS, viewState, setView } from '$lib/stores/view.svelte';
	import { getMessages, getLocale, setLocale } from '$lib/i18n/index.svelte';
	import { AVAILABLE_LOCALES, VIEW_NAV_KEYS } from '$lib/navigation';
	import LocaleSwitcher from '$lib/components/nav/LocaleSwitcher.svelte';
	import NavBrand from '$lib/components/nav/NavBrand.svelte';
	import NavItem from '$lib/components/nav/NavItem.svelte';

	const t = $derived(getMessages());
	const locale = $derived(getLocale());
</script>

<nav class="rail" aria-label="visualizations">
	<NavBrand />
	{#each VIEWS as v, i (v.id)}
		{@const nav = VIEW_NAV_KEYS[v.id]}
		<NavItem
			index={i}
			label={t.nav[nav.label]}
			description={t.nav[nav.desc]}
			active={viewState.id === v.id}
			onselect={() => setView(v.id)}
		/>
	{/each}

	<div class="right-end">
		<div class="hint">{t.nav.hint}</div>
		<LocaleSwitcher
			locales={AVAILABLE_LOCALES}
			activeLocale={locale}
			labels={t.lang}
			onselect={setLocale}
		/>
	</div>
</nav>

<style>
	.rail {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 48px;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.25rem;
		padding: 0 1rem;
		background: #08141f;
		border-bottom: 1px solid rgba(58, 93, 120, 0.35);
		z-index: 20;
	}
	.right-end {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-left: auto;
	}
	.hint {
		font-size: 0.6rem;
		letter-spacing: 0.15em;
		color: #3a5266;
	}
</style>
