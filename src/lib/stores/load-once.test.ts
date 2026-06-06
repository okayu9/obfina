import { describe, expect, it } from 'vitest';
import { createLoadOnce, type LoadOnceState } from './load-once';

const state = (): LoadOnceState => ({
	loading: true,
	failed: false,
	loaded: false,
	error: null
});

describe('createLoadOnce', () => {
	it('applies successful data and marks the store loaded', async () => {
		const store = state();
		const load = createLoadOnce(store, {
			fetchData: async () => ({ value: 42 }),
			applyData: (data) => Object.assign(store, data)
		});

		await load();

		expect(store).toMatchObject({ value: 42, loading: false, failed: false, loaded: true });
	});

	it('deduplicates concurrent loads', async () => {
		const store = state();
		let calls = 0;
		let release!: (value: { value: number }) => void;
		const pending = new Promise<{ value: number }>((resolve) => {
			release = resolve;
		});
		const load = createLoadOnce(store, {
			fetchData: async () => {
				calls++;
				return pending;
			},
			applyData: (data) => Object.assign(store, data)
		});

		const first = load();
		const second = load();
		release({ value: 7 });
		await Promise.all([first, second]);

		expect(calls).toBe(1);
		expect(store).toMatchObject({ value: 7, loaded: true });
	});

	it('marks unavailable and thrown loads as failed without applying data', async () => {
		const unavailableStore = state();
		await createLoadOnce(unavailableStore, {
			fetchData: async () => ({ unavailable: true, value: 1 }),
			isUnavailable: (data) => data.unavailable,
			applyData: (data) => Object.assign(unavailableStore, data)
		})();

		expect(unavailableStore).toEqual({
			loading: false,
			failed: true,
			loaded: false,
			error: 'unavailable'
		});

		const throwingStore = state();
		await createLoadOnce(throwingStore, {
			fetchData: async () => {
				throw new Error('offline');
			},
			applyData: (data) => Object.assign(throwingStore, data)
		})();

		expect(throwingStore).toEqual({
			loading: false,
			failed: true,
			loaded: false,
			error: 'offline'
		});
	});

	it('allows retry after a failed load', async () => {
		const store = state();
		let attempt = 0;
		const load = createLoadOnce(store, {
			fetchData: async () => {
				attempt++;
				if (attempt === 1) throw new Error('temporary');
				return { value: 9 };
			},
			applyData: (data) => Object.assign(store, data)
		});

		await load();
		await load();

		expect(attempt).toBe(2);
		expect(store).toMatchObject({ value: 9, loading: false, failed: false, loaded: true });
	});
});
