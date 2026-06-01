<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { logConsoleBrand } from '$lib/console-brand';
	import { formatOnionooPublishedAt } from '$lib/date';
	import { initLocale, getLocale, getMessages } from '$lib/i18n/index.svelte';
	import { relayStore } from '$lib/stores/relays.svelte';

	let { children } = $props();

	const t = $derived(getMessages());

	onMount(() => {
		initLocale();
		logConsoleBrand();
	});

	$effect(() => {
		document.documentElement.lang = getLocale();
	});
</script>

<svelte:head>
	<title>OBFINA — Tor Network Observatory</title>
	<meta
		name="description"
		content="Visualize the Tor network: relay distribution, hosting concentration, path-selection bias, and circuit simulation."
	/>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<footer>
	© 2026 <a href="https://okayu.jp" target="_blank" rel="noopener noreferrer">Yumeto Inaoka</a
	>.{#if relayStore.publishedAt}
		· {t.footer.dataAsOf} {formatOnionooPublishedAt(relayStore.publishedAt)}{/if}
</footer>

<style>
	footer {
		position: fixed;
		bottom: 0;
		width: 100%;
		padding: 0.35rem 1rem;
		text-align: center;
		font-size: 0.7rem;
		color: rgba(58, 93, 120, 0.6);
		pointer-events: none;
		background: #08141f;
		border-top: 1px solid rgba(58, 93, 120, 0.35);
	}

	footer a {
		color: rgba(58, 93, 120, 0.6);
		text-decoration: none;
		pointer-events: auto;
	}

	footer a:hover {
		color: #6f8aa3;
	}
</style>
