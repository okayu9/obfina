<script lang="ts">
	import { VIEWS, viewState, setView } from '$lib/stores/view.svelte';
	import { getMessages, getLocale, setLocale, type Locale } from '$lib/i18n/index.svelte';
	import logo from '$lib/assets/favicon.svg';

	const t = $derived(getMessages());
	const locale = $derived(getLocale());

	// Map view IDs to translation key getters
	const navMap = {
		map: { label: () => t.nav.map, desc: () => t.nav.mapDesc },
		hosting: { label: () => t.nav.hosting, desc: () => t.nav.hostingDesc },
		paths: { label: () => t.nav.paths, desc: () => t.nav.pathsDesc },
		growth: { label: () => t.nav.growth, desc: () => t.nav.growthDesc },
		circuits: { label: () => t.nav.circuits, desc: () => t.nav.circuitsDesc },
		about: { label: () => t.nav.about, desc: () => t.nav.aboutDesc }
	} as const;

	const availableLocales: { id: Locale; label: () => string }[] = [
		{ id: 'en', label: () => t.lang.en },
		{ id: 'ja', label: () => t.lang.ja }
	];
</script>

<nav class="rail" aria-label="visualizations">
	<span class="brand"><img src={logo} alt="" class="brand-logo" />OBFINA</span>
	{#each VIEWS as v, i (v.id)}
		{@const nav = navMap[v.id]}
		<button
			class="item"
			class:active={viewState.id === v.id}
			onclick={() => setView(v.id)}
			title={nav.desc()}
			aria-current={viewState.id === v.id ? 'page' : undefined}
		>
			<span class="num">{i + 1}</span>
			<span class="label">{nav.label()}</span>
		</button>
	{/each}

	<div class="right-end">
		<div class="hint">{t.nav.hint}</div>
		<div class="lang-switcher">
			{#each availableLocales as loc, i (loc.id)}
				{#if i > 0}<span class="lang-sep">/</span>{/if}
				<button
					class="lang-btn"
					class:active={locale === loc.id}
					onclick={() => setLocale(loc.id)}
					aria-pressed={locale === loc.id}
				>
					{loc.label()}
				</button>
			{/each}
		</div>
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
	.brand {
		display: flex;
		align-items: center;
		font-size: 0.6rem;
		letter-spacing: 0.3em;
		color: rgba(0, 212, 255, 0.4);
		margin-right: 0.5rem;
		user-select: none;
	}
	.brand-logo {
		height: 18px;
		width: 18px;
		margin-right: 0.35rem;
		flex-shrink: 0;
	}
	.item {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0 0.5rem;
		height: 100%;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: #6f8aa3;
		cursor: pointer;
		font-family: inherit;
		transition:
			color 0.18s,
			border-color 0.18s;
	}
	.item:hover {
		color: #9fc6e0;
	}
	.item.active {
		color: var(--accent-cyan);
		border-bottom-color: var(--accent-cyan);
		text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
	}
	.num {
		font-size: 0.7rem;
		color: rgba(0, 212, 255, 0.35);
		font-variant-numeric: tabular-nums;
	}
	.label {
		font-size: 0.75rem;
		letter-spacing: 0.1em;
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

	/* Language switcher */
	.lang-switcher {
		display: flex;
		align-items: center;
		gap: 0.1rem;
	}
	.lang-btn {
		background: none;
		border: none;
		padding: 0.1rem 0.15rem;
		font-family: inherit;
		font-size: 0.65rem;
		letter-spacing: 0.06em;
		color: #3a5266;
		cursor: pointer;
		transition: color 0.15s;
	}
	.lang-btn:hover {
		color: #9fc6e0;
	}
	.lang-btn.active {
		color: var(--accent-cyan);
	}
	.lang-sep {
		font-size: 0.6rem;
		color: #3a5266;
		pointer-events: none;
	}
</style>
