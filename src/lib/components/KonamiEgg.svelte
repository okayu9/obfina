<script lang="ts">
	import { getLocale } from '$lib/i18n/index.svelte';
	import { pickQuote, PRIVACY_QUOTES, quoteTranslation } from '$lib/content/privacy-quotes';
	import { nextKonamiProgress } from '$lib/interaction/konami';
	import KonamiQuoteDialog from '$lib/components/KonamiQuoteDialog.svelte';

	const locale = $derived(getLocale());

	let visible = $state(false);
	let quote = $state(PRIVACY_QUOTES[0]);
	let progress = $state(0);

	const translation = $derived(quoteTranslation(quote, locale));

	const hintText = $derived(locale === 'ja' ? '任意のキーで閉じる' : 'press any key to dismiss');

	function dismiss() {
		visible = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (visible) {
			dismiss();
			progress = 0;
			return;
		}
		const next = nextKonamiProgress(e.code, progress);
		progress = next.progress;
		if (!next.matched) return;
		quote = pickQuote(PRIVACY_QUOTES);
		visible = true;
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if visible}
	<KonamiQuoteDialog {quote} {translation} {hintText} ondismiss={dismiss} />
{/if}
