type LogValue = string | number | boolean | null | undefined;
type LogFields = Record<string, LogValue>;

function serialize(event: string, fields: LogFields): string {
	return JSON.stringify({
		event,
		...fields
	});
}

export function logInfo(event: string, fields: LogFields = {}): void {
	console.info(serialize(event, fields));
}

export function logWarn(event: string, fields: LogFields = {}): void {
	console.warn(serialize(event, fields));
}
