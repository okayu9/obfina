<script lang="ts">
	import { VIEWS, viewState, setView } from '$lib/stores/view.svelte';
	import { getMessages, getLocale, setLocale } from '$lib/i18n/index.svelte';
	import { AVAILABLE_LOCALES, VIEW_NAV_KEYS } from '$lib/navigation';
	import type { Locale } from '$lib/i18n/index.svelte';
	import type { ViewId } from '$lib/stores/view.svelte';
	import LocaleSwitcher from '$lib/components/nav/LocaleSwitcher.svelte';
	import NavBrand from '$lib/components/nav/NavBrand.svelte';
	import NavItem from '$lib/components/nav/NavItem.svelte';

	const t = $derived(getMessages());
	const locale = $derived(getLocale());

	let drawerOpen = $state(false);

	function select(view: ViewId) {
		setView(view);
		drawerOpen = false;
	}

	function pickLocale(l: Locale) {
		setLocale(l);
		drawerOpen = false;
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && drawerOpen) {
			drawerOpen = false;
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<nav class="rail" aria-label="visualizations">
	<NavBrand />

	<div class="items">
		{#each VIEWS as v, i (v.id)}
			{@const nav = VIEW_NAV_KEYS[v.id]}
			<NavItem
				index={i}
				label={t.nav[nav.label]}
				description={t.nav[nav.desc]}
				active={viewState.id === v.id}
				onselect={() => select(v.id)}
			/>
		{/each}
	</div>

	<div class="right-end">
		<div class="hint">{t.nav.hint}</div>
		<LocaleSwitcher
			locales={AVAILABLE_LOCALES}
			activeLocale={locale}
			labels={t.lang}
			onselect={pickLocale}
		/>
	</div>

	<button
		class="hamburger"
		aria-label={t.nav.menu}
		aria-expanded={drawerOpen}
		aria-controls="nav-drawer"
		onclick={() => (drawerOpen = !drawerOpen)}
	>
		<span class:open={drawerOpen}></span>
	</button>
</nav>

{#if drawerOpen}
	<div class="backdrop" role="presentation" onclick={() => (drawerOpen = false)}></div>
	<div class="drawer" id="nav-drawer">
		<div class="drawer-views">
			{#each VIEWS as v, i (v.id)}
				{@const nav = VIEW_NAV_KEYS[v.id]}
				<NavItem
					index={i}
					label={t.nav[nav.label]}
					description={t.nav[nav.desc]}
					active={viewState.id === v.id}
					onselect={() => select(v.id)}
				/>
			{/each}
		</div>

		<div class="drawer-footer">
			<LocaleSwitcher
				locales={AVAILABLE_LOCALES}
				activeLocale={locale}
				labels={t.lang}
				onselect={pickLocale}
			/>
			<div class="drawer-hint">
				<span class="drawer-hint-label">{t.nav.shortcuts}</span>
				<span class="hint">{t.nav.hint}</span>
			</div>
		</div>
	</div>
{/if}

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
	.items {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.25rem;
		height: 100%;
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
		color: var(--text-faint);
	}

	/* Hamburger — hidden on wide screens, shown when the rail collapses. */
	.hamburger {
		display: none;
		margin-left: auto;
		width: 32px;
		height: 32px;
		padding: 0;
		background: none;
		border: 1px solid rgba(58, 93, 120, 0.35);
		border-radius: 4px;
		cursor: pointer;
		position: relative;
	}
	.hamburger span,
	.hamburger span::before,
	.hamburger span::after {
		content: '';
		position: absolute;
		left: 50%;
		width: 16px;
		height: 1.5px;
		background: var(--accent-cyan);
		transform: translateX(-50%);
		transition: transform 0.18s ease;
	}
	.hamburger span {
		top: 50%;
		transform: translate(-50%, -50%);
	}
	.hamburger span::before {
		top: -5px;
	}
	.hamburger span::after {
		top: 5px;
	}
	.hamburger span.open {
		background: transparent;
	}
	.hamburger span.open::before {
		top: 0;
		transform: translateX(-50%) rotate(45deg);
	}
	.hamburger span.open::after {
		top: 0;
		transform: translateX(-50%) rotate(-45deg);
	}

	.backdrop {
		position: fixed;
		inset: 48px 0 0 0;
		background: rgba(4, 10, 16, 0.6);
		z-index: 18;
		animation: fade 0.15s ease-out;
	}
	.drawer {
		position: fixed;
		top: 48px;
		right: 0;
		width: min(260px, 80vw);
		bottom: 0;
		display: flex;
		flex-direction: column;
		background: #08141f;
		border-left: 1px solid rgba(0, 212, 255, 0.25);
		z-index: 19;
		padding: 0.75rem 0 calc(0.75rem + var(--footer-height));
		overflow-y: auto;
		animation: slide-in 0.18s ease-out;
	}
	.drawer-views {
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}
	/* In the drawer the NavItems stack vertically and grow to full width;
	   move the active affordance from the bottom underline to a left bar. */
	.drawer-views :global(.item) {
		height: auto;
		padding: 0.7rem 1.1rem;
		border-bottom: none;
		border-left: 2px solid transparent;
	}
	.drawer-views :global(.item.active) {
		border-bottom-color: transparent;
		border-left-color: var(--accent-cyan);
	}
	.drawer-footer {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1rem 1.1rem 0.5rem;
		border-top: 1px solid rgba(58, 93, 120, 0.35);
	}
	.drawer-hint {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.drawer-hint-label {
		font-size: 0.55rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #6f8aa3;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	@media (max-width: 640px) {
		.items,
		.right-end {
			display: none;
		}
		.hamburger {
			display: block;
		}
	}
</style>
