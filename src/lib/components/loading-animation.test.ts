import { describe, expect, it } from 'vitest';
import {
	LOADING_BARS,
	LOADING_CENTER,
	LOADING_EDGES,
	LOADING_NODES,
	LOADING_PACKET_PATH,
	LOADING_RINGS
} from '$lib/components/loading-animation';

describe('loading animation data', () => {
	it('defines the expected circuit geometry', () => {
		expect(LOADING_CENTER).toBe(60);
		expect(LOADING_RINGS.map((ring) => ring.radius)).toEqual([46, 30]);
		expect(LOADING_NODES.map((node) => node.role)).toEqual(['guard', 'middle', 'exit']);
		expect(LOADING_EDGES).toHaveLength(3);
		expect(LOADING_PACKET_PATH).toBe('M60,14 L99.9,83 L20.1,83 Z');
	});

	it('keeps equalizer bars ordered by delay', () => {
		expect(LOADING_BARS.map((bar) => bar.height)).toEqual(['30%', '70%', '50%', '90%', '40%']);
		expect(LOADING_BARS.map((bar) => bar.delay)).toEqual(['0s', '0.15s', '0.3s', '0.45s', '0.6s']);
	});
});
