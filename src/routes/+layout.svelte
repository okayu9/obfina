<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initLocale, getMessages } from '$lib/i18n/index.svelte';
	import { relayStore } from '$lib/stores/relays.svelte';

	let { children } = $props();

	const t = $derived(getMessages());

	function formatPublishedAt(iso: string): string {
		const d = new Date(iso);
		const yyyy = d.getUTCFullYear();
		const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
		const dd = String(d.getUTCDate()).padStart(2, '0');
		const hh = String(d.getUTCHours()).padStart(2, '0');
		const min = String(d.getUTCMinutes()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
	}

	onMount(() => {
		initLocale();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<footer>
	© 2026 <a href="https://okayu.jp" target="_blank" rel="noopener noreferrer">Yumeto Inaoka</a>.{#if relayStore.publishedAt} · {t.footer.dataAsOf} {formatPublishedAt(relayStore.publishedAt)}{/if}
</footer>

<style>
	footer {
		position: fixed;
		bottom: 0;
		width: 100%;
		padding: 0.35rem 1rem;
		text-align: center;
		font-size: 0.7rem;
		color: #4a5568;
		pointer-events: none;
		background: #08141f;
		border-top: 1px solid rgba(58, 93, 120, 0.35);
	}

	footer a {
		color: #4a5568;
		text-decoration: none;
		pointer-events: auto;
	}

	footer a:hover {
		color: #718096;
	}
</style>
