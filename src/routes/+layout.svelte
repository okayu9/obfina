<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initLocale, getLocale, getMessages } from '$lib/i18n/index.svelte';
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
		console.log(
			'%c ◈ OBFINA %c Precision Network Observatory %c obfina.pages.dev ',
			'background:#00d4ff;color:#08141f;font-weight:bold;padding:3px 8px;border-radius:3px 0 0 3px;font-family:monospace;font-size:12px',
			'background:#0d1f2d;color:#00d4ff;padding:3px 8px;font-family:monospace;font-size:12px;border-top:1px solid #1a3a52;border-bottom:1px solid #1a3a52',
			'background:#08141f;color:#3a5d78;padding:3px 8px;border-radius:0 3px 3px 0;font-family:monospace;font-size:12px;border:1px solid #1a3a52'
		);
		console.log(
			'%c Visualizing Tor relay distribution · Guard · Middle · Exit',
			'color:#3a5d78;font-family:monospace;font-size:11px;padding-left:2px'
		);
	});

	$effect(() => {
		document.documentElement.lang = getLocale();
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
