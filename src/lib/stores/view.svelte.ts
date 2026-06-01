/**
 * Which visualization is on screen, and the means to move between them. The id
 * is mirrored to the `?view=` query param so views are deep-linkable.
 */
import { browser } from '$app/environment';

export interface ViewDef {
	id: ViewId;
	/** Short label shown in the nav rail. */
	label: string;
	/** One-line description (tooltip / sub-label). */
	desc: string;
}

export type ViewId = 'map' | 'hosting' | 'paths' | 'growth' | 'circuits' | 'about';

export const VIEWS: ViewDef[] = [
	{ id: 'map', label: 'MAP', desc: 'Relays by country' },
	{ id: 'hosting', label: 'HOSTING', desc: 'AS concentration risk' },
	{ id: 'paths', label: 'PATHS', desc: 'Path-selection bias' },
	{ id: 'growth', label: 'GROWTH', desc: 'Capacity & usage over time' },
	{ id: 'circuits', label: 'CIRCUITS', desc: 'Live circuit simulation' },
	{ id: 'about', label: 'ABOUT', desc: 'Data sources & references' }
];

export const viewState = $state<{ id: ViewId }>({ id: 'map' });

function isViewId(v: string | null): v is ViewId {
	return !!v && VIEWS.some((x) => x.id === v);
}

export function setView(id: ViewId): void {
	viewState.id = id;
	syncViewToUrl(id);
}

/** Move forward (+1) or backward (-1) through the views, wrapping around. */
export function cycleView(dir: 1 | -1): void {
	const i = VIEWS.findIndex((v) => v.id === viewState.id);
	const next = (i + dir + VIEWS.length) % VIEWS.length;
	setView(VIEWS[next].id);
}

/** Read the initial view from the URL (`?view=...`). */
export function initViewFromUrl(): void {
	if (typeof location === 'undefined') return;
	// Plain string parse (no URLSearchParams): this is a one-off read, not
	// reactive state, so the Svelte reactivity wrappers don't apply.
	const m = location.search.match(/[?&]view=([^&]+)/);
	const v = m ? decodeURIComponent(m[1]) : null;
	if (isViewId(v)) viewState.id = v;
}

/** Reflect the current view into the URL without adding history entries. */
export function syncViewToUrl(id: ViewId = viewState.id): void {
	if (!browser) return;
	const params = location.search
		.slice(1)
		.split('&')
		.filter((param) => param && decodeURIComponent(param.split('=')[0]) !== 'view');
	if (id !== 'map') params.push(`view=${encodeURIComponent(id)}`);
	const search = params.join('&');
	const next = `${location.pathname}${search ? `?${search}` : ''}${location.hash}`;
	if (next !== `${location.pathname}${location.search}${location.hash}`) {
		history.replaceState(history.state, '', next);
	}
}
