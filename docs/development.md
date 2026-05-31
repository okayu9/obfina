# Development

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [pnpm](https://pnpm.io/) 9 or later
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (for local Cloudflare Workers emulation)
- [Terraform](https://developer.hashicorp.com/terraform/install) 1.10 or later (for infrastructure changes only — not required to run the app)
- A Cloudflare account (free tier is sufficient; optional for local development — see below)

## Setup

```bash
pnpm install
```

## Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable                | Description                                   |
| ----------------------- | --------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID                    |
| `KV_NAMESPACE_ID`       | KV namespace ID for local dev (from Wrangler) |

For local development, Wrangler emulates Cloudflare KV in memory. You do not need a live Cloudflare account or KV namespace to run the app. Leave these variables empty and the dev server will use in-memory emulation.

## Running locally

```bash
pnpm dev
```

This must invoke `wrangler dev` (not bare `vite dev`) so that the Cloudflare Workers runtime is emulated locally. The `package.json` dev script should call `wrangler dev` directly. If it calls `vite dev` instead, KV bindings will be absent and the server routes will fail. Confirm `wrangler.toml` declares the KV namespace binding before running.

The app is available at `http://localhost:5173`.

**What to expect on first run:**

1. The server routes fetch live data from Onionoo and Tor Metrics on the first request. This takes 2–5 seconds.
2. The map appears once relays load; each country glows by relay count and exit share.
3. Subsequent requests within the cache TTL are served from Wrangler's in-memory KV emulator instantly.
4. The first run may show fewer relays than production if Onionoo is mid-update cycle.

## Forcing a cache miss in development

Wrangler's in-memory KV resets on each dev server restart. To force a cache miss mid-session without restarting, add a `?nocache=1` query parameter to any `/api/*` route in your browser's network tab, or call the endpoint directly:

```bash
curl "http://localhost:5173/api/relays?nocache=1"
```

## Project structure

```
obfina/
├── src/
│   ├── lib/
│   │   ├── analysis/         # relay analysis helpers (path bias, concentration)
│   │   ├── assets/           # static assets (flag sprites, etc.)
│   │   ├── components/
│   │   │   ├── map/          # value-by-alpha world map (ValueByAlphaMap.svelte)
│   │   │   ├── nav/          # nav rail (ViewNav.svelte)
│   │   │   ├── panels/       # country detail panel (CountryPanel.svelte)
│   │   │   └── views/        # one component per view:
│   │   │       ├── MapView.svelte
│   │   │       ├── CentralizationView.svelte   # hosting/AS centralization
│   │   │       ├── PathBiasView.svelte
│   │   │       ├── TrendsView.svelte           # growth over time
│   │   │       ├── CircuitView.svelte
│   │   │       └── AboutView.svelte
│   │   ├── geo/              # shared map projection and world GeoJSON ($lib/geo/world)
│   │   ├── stores/           # Svelte stores — selection state
│   │   ├── map-encoding.ts   # exit-share → color
│   │   ├── relay-stats.ts    # per-country aggregation, formatting, country names
│   │   └── types.ts          # shared types
│   ├── routes/
│   │   ├── +layout.svelte    # app shell: nav rail + loading screen + footer
│   │   ├── +page.svelte      # main entry point — renders the active view
│   │   └── api/
│   │       ├── relays/       # proxies Onionoo /details (filtered fields)
│   │       └── trends/       # proxies Tor Metrics CSVs (downsampled)
│   ├── app.css               # global styles + Tailwind v4 import
│   └── app.html
├── scripts/screenshot.mjs    # headless visual-check helper
├── docs/
│   └── decisions/            # Architecture Decision Records (ADRs)
├── svelte.config.js          # SvelteKit config
├── vite.config.ts            # Vite + Tailwind v4 plugin (no tailwind.config)
├── eslint.config.js
└── .prettierrc

# planned (see infrastructure.md), not yet in the repo:
#   infra/              Terraform
#   .github/workflows/  CI/CD
#   wrangler.toml       Cloudflare Workers config
```

Useful documentation links while navigating the codebase:

- [SvelteKit docs](https://svelte.dev/docs/kit)
- [D3 docs](https://d3js.org/) — especially `d3-geo` and `d3-zoom`
- [world-atlas](https://github.com/topojson/world-atlas) — TopoJSON base map data
- [Cloudflare Workers runtime APIs](https://developers.cloudflare.com/workers/runtime-apis/)

## Type checking

```bash
pnpm check   # svelte-kit sync + svelte-check
```

ESLint and Prettier are not yet configured; adding them is a good first
contribution.

## Tests

Unit tests for the pure helpers (relay aggregation, formatting) run with
[Vitest](https://vitest.dev/):

```bash
pnpm test
```

Test files live next to their sources as `*.test.ts`. The map component is
verified manually via `scripts/screenshot.mjs` (see below) rather than in unit
tests.

## Visual verification

`scripts/screenshot.mjs` loads the running app in a headless browser, captures a
screenshot, and reports the relay count, how many country paths rendered, and
console errors. With the dev server running:

```bash
node scripts/screenshot.mjs [url] [outPath] [waitMs]
```

## Building for production

```bash
pnpm build
```

Output goes to `.svelte-kit/cloudflare`. This is what Cloudflare Pages deploys.
