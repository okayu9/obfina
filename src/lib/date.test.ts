import { describe, expect, it } from 'vitest';
import { formatOnionooPublishedAt } from './date';

describe('formatOnionooPublishedAt', () => {
	it('treats Onionoo space-separated timestamps as UTC', () => {
		expect(formatOnionooPublishedAt('2026-01-02 03:04:05')).toBe('2026-01-02 03:04 UTC');
	});

	it('preserves ISO timestamps with explicit UTC markers', () => {
		expect(formatOnionooPublishedAt('2026-01-02T03:04:05Z')).toBe('2026-01-02 03:04 UTC');
	});
});
