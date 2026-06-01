import { describe, expect, it } from 'vitest';
import { KONAMI_SEQUENCE, nextKonamiProgress } from '$lib/interaction/konami';

describe('konami interaction helpers', () => {
	it('advances through the full sequence and reports a match', () => {
		let progress = 0;
		for (const code of KONAMI_SEQUENCE.slice(0, -1)) {
			const next = nextKonamiProgress(code, progress);
			expect(next.matched).toBe(false);
			progress = next.progress;
		}

		const final = nextKonamiProgress(KONAMI_SEQUENCE.at(-1) ?? '', progress);
		expect(final).toEqual({ progress: 0, matched: true });
	});

	it('keeps an overlapping first key as partial progress', () => {
		expect(nextKonamiProgress('KeyX', 3)).toEqual({ progress: 0, matched: false });
		expect(nextKonamiProgress('ArrowUp', 3)).toEqual({ progress: 1, matched: false });
	});
});
