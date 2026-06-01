import type { TrendsResponse } from '$lib/types';
import {
	METRICS_URLS,
	parseBandwidthCsv,
	parseNetworkSizeCsv,
	parseUsersCsv,
	userStatsUrl
} from '$lib/server/trends-data';

export interface TrendsSections {
	networkSize: TrendsResponse['networkSize'];
	bandwidth: TrendsResponse['bandwidth'];
	users: TrendsResponse['users'];
}

export interface FetchTextOptions {
	fetcher?: typeof fetch;
	now?: Date;
}

export async function fetchText(
	url: string,
	fetcher: typeof fetch = fetch
): Promise<string | null> {
	try {
		const res = await fetcher(url, {
			headers: { 'user-agent': 'obfina (https://github.com/obfina)' }
		});
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}

export async function fetchNetworkSize(
	options: FetchTextOptions = {}
): Promise<TrendsResponse['networkSize']> {
	const text = await fetchText(METRICS_URLS.networkSize, options.fetcher);
	return text ? parseNetworkSizeCsv(text) : [];
}

export async function fetchBandwidth(
	options: FetchTextOptions = {}
): Promise<TrendsResponse['bandwidth']> {
	const text = await fetchText(METRICS_URLS.bandwidth, options.fetcher);
	return text ? parseBandwidthCsv(text) : [];
}

export async function fetchUsers(options: FetchTextOptions = {}): Promise<TrendsResponse['users']> {
	const start = new Date(options.now ?? new Date());
	start.setFullYear(start.getFullYear() - 2);
	const text =
		(await fetchText(userStatsUrl(start), options.fetcher)) ??
		(await fetchText(METRICS_URLS.userStats, options.fetcher));
	return text ? parseUsersCsv(text) : { countries: [], series: [] };
}

export async function fetchTrendsSections(options: FetchTextOptions = {}): Promise<TrendsSections> {
	const [networkSize, bandwidth, users] = await Promise.all([
		fetchNetworkSize(options),
		fetchBandwidth(options),
		fetchUsers(options)
	]);
	return { networkSize, bandwidth, users };
}

export function trendsAvailability(sections: TrendsSections): { gotAny: boolean; gotAll: boolean } {
	const lengths = [
		sections.networkSize.length,
		sections.bandwidth.length,
		sections.users.series.length
	];
	return {
		gotAny: lengths.some((length) => length > 0),
		gotAll: lengths.every((length) => length > 0)
	};
}
