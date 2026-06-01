import { last } from '$lib/chart';
import type { TrendsResponse } from '$lib/types';

export { hoverIndex } from '$lib/chart';

export type UsersData = TrendsResponse['users'];

export function utilization(advertised: number[], consumed: number[]): number {
	const advertisedLatest = last(advertised) ?? 0;
	const consumedLatest = last(consumed) ?? 0;
	return advertisedLatest > 0 ? consumedLatest / advertisedLatest : 0;
}

export function userSeries(users: UsersData, country: string): number[] {
	return users.series.map((point) => point.values[country] ?? 0);
}

export function totalLatestUsers(users: UsersData): number {
	return users.countries.reduce((sum, country) => sum + (last(userSeries(users, country)) ?? 0), 0);
}

export function maxUserValue(users: UsersData): number {
	return Math.max(
		1,
		...users.series.flatMap((point) => users.countries.map((country) => point.values[country] ?? 0))
	);
}

export function seriesColorIndex(index: number, count: number): number {
	return index / Math.max(1, count - 1);
}
