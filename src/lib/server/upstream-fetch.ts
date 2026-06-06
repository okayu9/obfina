import { logInfo, logWarn } from '$lib/server/log';

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
	const startedAt = Date.now();

	try {
		const res = await fetcher(url, {
			...(options.init ?? {}),
			headers: {
				'user-agent': USER_AGENT,
				...(options.init?.headers ?? {})
			},
			signal: controller.signal
		});
		const durationMs = Date.now() - startedAt;
		if (!res.ok) {
			logWarn('upstream_fetch_failed', {
				label,
				status: res.status,
				durationMs
			});
			return null;
		}
		logInfo('upstream_fetch_ok', {
			label,
			status: res.status,
			durationMs
		});
		return res;
	} catch (error: unknown) {
		logWarn('upstream_fetch_failed', {
			label,
			durationMs: Date.now() - startedAt,
			error: error instanceof Error ? error.message : String(error)
		});
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
