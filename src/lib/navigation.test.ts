import { describe, expect, it } from 'vitest';
import { VIEWS } from './stores/view.svelte';
import { AVAILABLE_LOCALES, VIEW_NAV_KEYS, viewKeyAction, viewNeedsRelays } from './navigation';

describe('VIEW_NAV_KEYS', () => {
	it('covers every view id in display order', () => {
		expect(Object.keys(VIEW_NAV_KEYS)).toEqual(VIEWS.map((view) => view.id));
	});
});

describe('AVAILABLE_LOCALES', () => {
	it('keeps the language switcher order stable', () => {
		expect(AVAILABLE_LOCALES).toEqual(['en', 'ja']);
	});
});

describe('viewNeedsRelays', () => {
	it('requires relay data only for live relay views', () => {
		expect(viewNeedsRelays('map')).toBe(true);
		expect(viewNeedsRelays('hosting')).toBe(true);
		expect(viewNeedsRelays('paths')).toBe(true);
		expect(viewNeedsRelays('circuits')).toBe(true);
		expect(viewNeedsRelays('growth')).toBe(false);
		expect(viewNeedsRelays('about')).toBe(false);
	});
});

describe('viewKeyAction', () => {
	const event = (key: string, modifiers = {}) => ({
		key,
		metaKey: false,
		ctrlKey: false,
		altKey: false,
		...modifiers
	});

	it('maps navigation shortcuts to actions', () => {
		expect(viewKeyAction(event('Escape'))).toEqual({ type: 'clear-selection' });
		expect(viewKeyAction(event('1'))).toEqual({ type: 'set-view', view: 'map' });
		expect(viewKeyAction(event('6'))).toEqual({ type: 'set-view', view: 'about' });
		expect(viewKeyAction(event('ArrowRight'))).toEqual({ type: 'cycle-view', direction: 1 });
		expect(viewKeyAction(event(']'))).toEqual({ type: 'cycle-view', direction: 1 });
		expect(viewKeyAction(event('ArrowLeft'))).toEqual({ type: 'cycle-view', direction: -1 });
		expect(viewKeyAction(event('['))).toEqual({ type: 'cycle-view', direction: -1 });
	});

	it('ignores modified or unmapped keys', () => {
		expect(viewKeyAction(event('1', { metaKey: true }))).toBeNull();
		expect(viewKeyAction(event('7'))).toBeNull();
		expect(viewKeyAction(event('x'))).toBeNull();
	});
});
