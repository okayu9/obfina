# Development

## Prerequisites

- [Node.js](https://nodejs.org/) 24.x (see `.node-version`)
- [pnpm](https://pnpm.io/) 11.5.x
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (for local Cloudflare Workers emulation)
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

| Variable                        | Description                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`         | Your Cloudflare account ID                                        |
| `CLOUDFLARE_API_TOKEN`          | API token used by `pnpm cloudflare:bootstrap`                     |
| `CLOUDFLARE_PAGES_PROJECT`      | Pages project name; defaults to `obfina`                          |
| `CLOUDFLARE_KV_PROD_TITLE`      | Production KV namespace title; defaults to `obfina-cache-prod`    |
| `CLOUDFLARE_KV_PREVIEW_TITLE`   | Preview KV namespace title; defaults to `obfina-cache-preview`    |
| `CLOUDFLARE_COMPATIBILITY_DATE` | Generated `wrangler.toml` compatibility date; defaults to example |

For local development, Wrangler emulates Cloudflare KV in memory. You do not need a live Cloudflare account or KV namespace to run the app. Leave these variables empty and the dev server will use in-memory emulation.

## Running locally

```bash
pnpm dev
```

The default dev server uses Vite. KV bindings are optional in the server routes,
so local development works without Cloudflare credentials. To test Cloudflare KV
bindings locally, first run `pnpm cloudflare:bootstrap` with Cloudflare
credentials exported; this writes `wrangler.toml` with the `RELAY_CACHE`
binding.

The app is available at `http://localhost:5173`.

**What to expect on first run:**

1. The server route fetches a compact Onionoo-derived country summary for `/api/relays?summary=1`. This lets the map appear before full relay details load.
2. Full relay details are fetched from `/api/relays` for the path simulation, hosting/path analysis views, and drill-down panels.
3. The Growth view fetches Tor Metrics CSV-derived data from `/api/trends` the first time it is visited.
4. Subsequent requests within the cache TTL are served from Wrangler's in-memory KV emulator instantly.
5. The first run may show fewer relays than production if Onionoo is mid-update cycle.

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
│   │   ├── assets/           # static assets
│   │   ├── components/
│   │   │   ├── map/          # value-by-alpha world map (ValueByAlphaMap.svelte)
│   │   │   ├── nav/          # nav rail (ViewNav.svelte)
│   │   │   ├── panels/       # country detail panel (CountryPanel.svelte)
│   │   │   └── views/        # one component per view:
│   │   │       ├── MapView.svelte
│   │   │       ├── CentralizationView.svelte   # hosting/AS centralization
│   │   │       ├── PathBiasView.svelte
│   │   │       ├── TrendsView.svelte           # growth over time
│   │   │       └── AboutView.svelte
│   │   ├── geo/              # shared map projection and world GeoJSON ($lib/geo/world)
│   │   ├── stores/           # Svelte stores — relay/trend loading and UI state
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
├── scripts/cloudflare-bootstrap.ts  # create/find KV namespaces and write wrangler.toml
├── scripts/screenshot.ts     # headless visual-check helper
├── scripts/smoke.ts          # end-to-end smoke test across all views
├── scripts/click-test.ts     # panel open/close interaction test
├── docs/                     # project documentation
├── svelte.config.js          # SvelteKit config
├── vite.config.ts            # Vite + Tailwind v4 plugin (no tailwind.config)
└── eslint.config.js

# generated locally by pnpm cloudflare:bootstrap:
#   wrangler.toml       Cloudflare Pages config with account-specific KV IDs
```

Useful documentation links while navigating the codebase:

- [SvelteKit docs](https://svelte.dev/docs/kit)
- [D3 docs](https://d3js.org/) — especially `d3-geo` and `d3-zoom`
- [world-atlas](https://github.com/topojson/world-atlas) — TopoJSON base map data
- [Cloudflare Workers runtime APIs](https://developers.cloudflare.com/workers/runtime-apis/)

## Type Checking And Linting

```bash
pnpm check   # svelte-kit sync + svelte-check
pnpm lint    # prettier --check + eslint
pnpm format  # prettier --write
```

CI runs `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build`.

Branch and release workflow is documented in [Branching](branching.md).

## Tests

Unit tests for the pure helpers (relay aggregation, formatting) run with
[Vitest](https://vitest.dev/):

```bash
pnpm test
```

Test files live next to their sources as `*.test.ts`. The map component is
verified manually via `scripts/screenshot.ts` (see below) rather than in unit
tests.

## Visual verification

`scripts/screenshot.ts` loads the running app in a headless browser, captures a
screenshot, and reports the relay count, how many country paths rendered, and
console errors. With the dev server running:

```bash
pnpm tsx scripts/screenshot.ts [url] [outPath] [waitMs]
pnpm test:smoke [baseUrl] [waitMs]
pnpm tsx scripts/click-test.ts
```

## Building for production

```bash
pnpm build
```

Output goes to `.svelte-kit/cloudflare`. This is what Cloudflare Pages deploys.
