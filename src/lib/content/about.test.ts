import { describe, expect, it } from 'vitest';
import { aboutSections, cardDescription } from './about';

describe('about content', () => {
	it('has stable keyed sections with cards', () => {
		expect(aboutSections.map((section) => section.id)).toEqual([
			'dataSources',
			'references',
			'relatedOrgs',
			'authors'
		]);
		expect(aboutSections.every((section) => section.cards.length > 0)).toBe(true);
	});

	it('selects localized descriptions', () => {
		const card = aboutSections[0].cards[0];
		expect(cardDescription(card, 'en')).toContain('Relay statistics');
		expect(cardDescription(card, 'ja')).toContain('Torプロジェクト');
	});
});
