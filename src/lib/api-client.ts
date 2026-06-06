export class ApiFetchError extends Error {
	constructor(
		message: string,
		readonly status?: number
	) {
		super(message);
		this.name = 'ApiFetchError';
	}
}

export async function fetchJson<T>(
	input: RequestInfo | URL,
	init?: RequestInit,
	fetcher: typeof fetch = fetch
): Promise<T> {
	const res = await fetcher(input, init);
	const contentType = res.headers.get('content-type') ?? '';

	if (!res.ok) {
		throw new ApiFetchError(`Request failed with HTTP ${res.status}`, res.status);
	}
	if (!contentType.toLowerCase().includes('application/json')) {
		throw new ApiFetchError(`Expected JSON response but received "${contentType || 'unknown'}"`);
	}

	return (await res.json()) as T;
}
