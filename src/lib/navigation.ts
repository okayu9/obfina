import type { Messages, Locale } from '$lib/i18n/index.svelte';
import { VIEWS, type ViewId } from '$lib/stores/view.svelte';

type NavKey = keyof Omit<Messages['nav'], 'hint'>;

export const VIEW_NAV_KEYS: Record<ViewId, { label: NavKey; desc: NavKey }> = {
	map: { label: 'map', desc: 'mapDesc' },
	hosting: { label: 'hosting', desc: 'hostingDesc' },
	paths: { label: 'paths', desc: 'pathsDesc' },
	growth: { label: 'growth', desc: 'growthDesc' },
	about: { label: 'about', desc: 'aboutDesc' }
};

export const AVAILABLE_LOCALES: Locale[] = ['en', 'ja'];

export type ViewKeyAction =
	| { type: 'clear-selection' }
	| { type: 'set-view'; view: ViewId }
	| { type: 'cycle-view'; direction: 1 | -1 };

export function viewNeedsRelays(view: ViewId): boolean {
	return view !== 'growth' && view !== 'about';
}

export function viewKeyAction(
	event: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'key' | 'metaKey'>
): ViewKeyAction | null {
	if (event.metaKey || event.ctrlKey || event.altKey) return null;
	if (event.key === 'Escape') return { type: 'clear-selection' };

	const index = Number(event.key) - 1;
	if (index >= 0 && index < VIEWS.length) return { type: 'set-view', view: VIEWS[index].id };

	if (event.key === 'ArrowRight' || event.key === ']') {
		return { type: 'cycle-view', direction: 1 };
	}
	if (event.key === 'ArrowLeft' || event.key === '[') {
		return { type: 'cycle-view', direction: -1 };
	}

	return null;
}
