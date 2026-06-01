import { describe, expect, it } from 'vitest';
import {
	pickQuote,
	PRIVACY_QUOTES,
	quoteTranslation,
	type PrivacyQuote
} from '$lib/content/privacy-quotes';

describe('privacy quotes content helpers', () => {
	const quote: PrivacyQuote = {
		text: 'Privacy matters.',
		author: 'Author',
		source: 'Source',
		lang: 'en',
		translations: {
			ja: 'プライバシーは重要だ。'
		}
	};

	it('returns translated text only for different locales', () => {
		expect(quoteTranslation(quote, 'ja')).toBe('プライバシーは重要だ。');
		expect(quoteTranslation(quote, 'en')).toBeNull();
		expect(quoteTranslation(quote, 'fr')).toBeNull();
	});

	it('picks quotes deterministically from an injected random source', () => {
		expect(pickQuote(PRIVACY_QUOTES, () => 0)).toBe(PRIVACY_QUOTES[0]);
		expect(pickQuote(PRIVACY_QUOTES, () => 0.999)).toBe(PRIVACY_QUOTES.at(-1));
	});
});
