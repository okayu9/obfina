const USER_AGENT = 'obfina (https://github.com/obfina)';

export const UPSTREAM_TIMEOUT_MS = 10_000;

export interface UpstreamFetchOptions {
	fetcher?: typeof fetch;
	init?: RequestInit;
	label?: string;
	timeoutMs?: number;
}

export async function fetchUpstream(
	url: string,
	options: UpstreamFetchOptions = {}
): Promise<Response | null> {
	const fetcher = options.fetcher ?? fetch;
	const timeoutMs = options.timeoutMs ?? UPSTREAM_TIMEOUT_MS;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	const label = options.label ?? url;

	try {
		const res = await fetcher(url, {
			...(options.init ?? {}),
			headers: {
				'user-agent': USER_AGENT,
				...(options.init?.headers ?? {})
			},
			signal: controller.signal
		});
		if (!res.ok) {
			console.warn(`Upstream fetch failed for ${label}: HTTP ${res.status}`);
			return null;
		}
		return res;
	} catch (error: unknown) {
		console.warn(`Upstream fetch failed for ${label}`, error);
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
