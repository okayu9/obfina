import { writeFile } from 'node:fs/promises';

const API_BASE = 'https://api.cloudflare.com/client/v4';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT ?? 'obfina';
const prodKvTitle = process.env.CLOUDFLARE_KV_PROD_TITLE ?? 'obfina-cache-prod';
const previewKvTitle = process.env.CLOUDFLARE_KV_PREVIEW_TITLE ?? 'obfina-cache-preview';
const compatibilityDate = process.env.CLOUDFLARE_COMPATIBILITY_DATE ?? '2026-05-31';

interface CloudflareList<T> {
	success: boolean;
	result: T[];
	errors?: { message: string }[];
}

interface CloudflareSingle<T> {
	success: boolean;
	result: T;
	errors?: { message: string }[];
}

interface KvNamespace {
	id: string;
	title: string;
}

interface PagesProject {
	id: string;
	name: string;
}

function requireEnv(name: string, value: string | undefined): string {
	if (!value) throw new Error(`${name} is required`);
	return value;
}

async function cf<T>(path: string, init: RequestInit = {}): Promise<T> {
	const apiToken = requireEnv('CLOUDFLARE_API_TOKEN', token);
	const res = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: {
			authorization: `Bearer ${apiToken}`,
			'content-type': 'application/json',
			...(init.headers ?? {})
		}
	});

	const body = (await res.json()) as T & { success?: boolean; errors?: { message: string }[] };
	if (!res.ok || body.success === false) {
		const message = body.errors?.map((e) => e.message).join('; ') || res.statusText;
		throw new Error(`Cloudflare API ${res.status}: ${message}`);
	}
	return body;
}

async function listKvNamespaces(): Promise<KvNamespace[]> {
	const id = requireEnv('CLOUDFLARE_ACCOUNT_ID', accountId);
	const namespaces: KvNamespace[] = [];
	let page = 1;

	while (true) {
		const data = await cf<CloudflareList<KvNamespace>>(
			`/accounts/${id}/storage/kv/namespaces?per_page=100&page=${page}`
		);
		namespaces.push(...data.result);
		if (data.result.length < 100) return namespaces;
		page += 1;
	}
}

async function ensureKvNamespace(title: string): Promise<KvNamespace> {
	const id = requireEnv('CLOUDFLARE_ACCOUNT_ID', accountId);
	const existing = (await listKvNamespaces()).find((ns) => ns.title === title);
	if (existing) return existing;

	const created = await cf<CloudflareSingle<KvNamespace>>(`/accounts/${id}/storage/kv/namespaces`, {
		method: 'POST',
		body: JSON.stringify({ title })
	});
	return created.result;
}

async function ensurePagesProject(name: string): Promise<PagesProject> {
	const id = requireEnv('CLOUDFLARE_ACCOUNT_ID', accountId);
	try {
		const existing = await cf<CloudflareSingle<PagesProject>>(
			`/accounts/${id}/pages/projects/${name}`
		);
		return existing.result;
	} catch (error) {
		if (!(error instanceof Error) || !error.message.includes('Project not found')) {
			throw error;
		}
	}

	const created = await cf<CloudflareSingle<PagesProject>>(`/accounts/${id}/pages/projects`, {
		method: 'POST',
		body: JSON.stringify({
			name,
			production_branch: 'main'
		})
	});
	return created.result;
}

async function writeWranglerToml(prodId: string, previewId: string): Promise<void> {
	const toml = `name = "${projectName}"
compatibility_date = "${compatibilityDate}"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".svelte-kit/cloudflare"

[[kv_namespaces]]
binding = "RELAY_CACHE"
id = "${prodId}"
preview_id = "${previewId}"
`;

	await writeFile('wrangler.toml', toml);
}

const prod = await ensureKvNamespace(prodKvTitle);
const preview = await ensureKvNamespace(previewKvTitle);
const project = await ensurePagesProject(projectName);
await writeWranglerToml(prod.id, preview.id);

console.log(`Wrote wrangler.toml for Cloudflare Pages project "${projectName}".`);
console.log(`Cloudflare Pages project: ${project.name} (${project.id})`);
console.log(`RELAY_CACHE production namespace: ${prod.title} (${prod.id})`);
console.log(`RELAY_CACHE preview namespace: ${preview.title} (${preview.id})`);
