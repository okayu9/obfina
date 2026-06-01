export const KONAMI_SEQUENCE = [
	'ArrowUp',
	'ArrowUp',
	'ArrowDown',
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'ArrowLeft',
	'ArrowRight',
	'KeyB',
	'KeyA'
] as const;

export interface KonamiProgress {
	progress: number;
	matched: boolean;
}

export function nextKonamiProgress(
	code: string,
	progress: number,
	sequence: readonly string[] = KONAMI_SEQUENCE
): KonamiProgress {
	if (code === sequence[progress]) {
		const next = progress + 1;
		return { progress: next === sequence.length ? 0 : next, matched: next === sequence.length };
	}
	return { progress: code === sequence[0] ? 1 : 0, matched: false };
}
