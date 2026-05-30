/** Shared motion preference: true when the user prefers reduced motion. */
export const motion = $state({ reduced: false });

/** Initialize from the OS/browser setting and keep it in sync. Browser-only. */
export function initMotion(): void {
	if (typeof window === 'undefined') return;
	const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
	motion.reduced = mq.matches;
	mq.addEventListener('change', (e) => (motion.reduced = e.matches));
}
