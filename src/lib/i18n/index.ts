/**
 * Lightweight i18n for obfina.
 *
 * Usage:
 *   import { t } from '$lib/i18n';
 *   $t.nav.map         // → 'MAP' or 'マップ'
 *
 * Adding a new language:
 *   1. Create `src/lib/i18n/<lang>.ts` that satisfies the `Messages` type.
 *   2. Add it to the `locales` map below.
 *   3. Add a button entry to the `lang` section of each messages file.
 */

import { en, type Messages } from './en';
import { ja } from './ja';

export type Locale = 'en' | 'ja';

const STORAGE_KEY = 'obfina:locale';

const locales: Record<Locale, Messages> = { en, ja };

// Detect the preferred locale from localStorage or the browser.
function detectLocale(): Locale {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'en' || stored === 'ja') return stored;
	}
	if (typeof navigator !== 'undefined') {
		const lang = navigator.language.slice(0, 2).toLowerCase();
		if (lang === 'ja') return 'ja';
	}
	return 'en';
}

// Svelte 5 runes-based reactive locale state.
let _locale = $state<Locale>('en');
let _messages = $state<Messages>(en);

// Initialise from storage / browser on first use (client only).
export function initLocale(): void {
	const l = detectLocale();
	_locale = l;
	_messages = locales[l];
}

export function setLocale(l: Locale): void {
	_locale = l;
	_messages = locales[l];
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, l);
	}
}

/** Reactive getter – use as `$t.some.key` inside Svelte components. */
export function getMessages(): Messages {
	return _messages;
}

/** Reactive locale id – use as `$locale` inside Svelte components. */
export function getLocale(): Locale {
	return _locale;
}

// Re-export the Messages type for typing helpers elsewhere.
export type { Messages };
