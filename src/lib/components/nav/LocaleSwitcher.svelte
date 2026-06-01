<script lang="ts">
	import type { Locale } from '$lib/i18n/index.svelte';

	let {
		locales,
		activeLocale,
		labels,
		onselect
	}: {
		locales: Locale[];
		activeLocale: Locale;
		labels: Record<Locale, string>;
		onselect: (locale: Locale) => void;
	} = $props();
</script>

<div class="lang-switcher">
	{#each locales as locale, i (locale)}
		{#if i > 0}<span class="lang-sep">/</span>{/if}
		<button
			class="lang-btn"
			class:active={activeLocale === locale}
			onclick={() => onselect(locale)}
			aria-pressed={activeLocale === locale}
		>
			{labels[locale]}
		</button>
	{/each}
</div>

<style>
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
		color: var(--text-faint);
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
		color: var(--text-faint);
		pointer-events: none;
	}
</style>
