export function formatOnionooPublishedAt(value: string): string {
	const normalized =
		value.includes('T') || value.endsWith('Z') ? value : `${value.replace(' ', 'T')}Z`;
	const date = new Date(normalized);
	const yyyy = date.getUTCFullYear();
	const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(date.getUTCDate()).padStart(2, '0');
	const hh = String(date.getUTCHours()).padStart(2, '0');
	const min = String(date.getUTCMinutes()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
}
