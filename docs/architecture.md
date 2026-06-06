# Architecture

## Overview

obfina is a single-page web application that visualizes the Tor network in real time. It presents several linked **views** over one dataset, switchable from a nav rail, the number keys `1`–`5`, or `←`/`→`; the active view is mirrored to `?view=…` for deep-linking.

The default view is a 2D **value-by-alpha** world map (D3 + SVG): every country is drawn as a visible land base, and countries with relays glow on top — hue encodes exit share (cyan → green) and opacity encodes relay count. The map first loads a compact per-country relay summary, then fetches full relay details for the Guard → Middle → Exit path simulation and drill-down panels. Paths are sampled from live relays by selection weight and animated as a non-interactive background simulation on the same map. The map uses an equirectangular projection fitted to viewport height so the poles sit at the top/bottom edges; it pans and zooms, wraps seamlessly east–west (no left/right edge), and clamps vertical panning at the poles. The other views reframe the same network:

- **Hosting** — per-AS centralization risk (Lorenz curves + Gini), all relays vs. exit-only; click an AS for a detail panel with its relay list and bandwidth share.
- **Paths** — per-relay path-selection concentration, read interactively.
- **Growth** — relay count, advertised vs. consumed bandwidth, and users by country over time; data is cached in-session.
- **About** — data sources and references as cards.

A server-side cache layer mediates between upstream Tor APIs and the client, keeping data fresh without hammering external services.

> The visualization began as a 3D WebGL globe (Threlte + Three.js), then a proportional-symbol bubble map, then a single value-by-alpha map, before growing into the linked-view exhibit it is now.

## System diagram

```mermaid
flowchart TD
    Browser["Browser\n(SvelteKit client)"]
    ServerRoutes["SvelteKit Server Routes\n(Cloudflare Workers)"]
    KV["Cloudflare KV\n(response cache)"]
    Onionoo["Onionoo API\n(relay details)"]
    TorMetrics["Tor Metrics API\n(aggregate stats)"]

    Browser -->|"fetch JSON"| ServerRoutes
    ServerRoutes -->|"cache hit"| KV
    ServerRoutes -->|"cache miss: fetch"| Onionoo
    ServerRoutes -->|"cache miss: fetch"| TorMetrics
    Onionoo -->|"write + return"| KV
    TorMetrics -->|"write + return"| KV
    KV -->|"upstream failure: serve stale"| ServerRoutes
```

## Caching strategy

| Endpoint                | TTL    | Rationale                                               |
| ----------------------- | ------ | ------------------------------------------------------- |
| `/api/relays?summary=1` | 10 min | Compact startup payload; Onionoo updates every ~3 hours |
| `/api/relays`           | 10 min | Full relay details; polling more often is wasteful      |
| `/api/trends`           | 30 min | Tor Metrics CSV exports update about once a day         |

`/api/relays?summary=1` returns country-level counts, observed bandwidth, and Guard/Middle/Exit composition for fast map startup. `/api/relays` returns the per-relay fields the analysis views share: `country`, `flags`, `observed_bandwidth`, `consensus_weight`, the per-position selection probabilities (`guard`/`middle`/`exit`), `as`/`as_name`, and `first_seen`. `/api/trends` proxies and downsamples three Tor Metrics CSVs (network size, advertised vs. consumed bandwidth, per-country users) into one compact payload; each section degrades independently if its CSV is unavailable.

Cache entries are stored as JSON envelopes in Cloudflare KV with separate fresh and stale windows. On a cache miss the Worker fetches upstream, schedules the KV write with `waitUntil()` when the platform provides it, and returns the fresh response without waiting for the write to finish. KV expiry is set to the stale window so cached data remains available for outage fallback after the normal freshness window has passed.

During an upstream outage, the Worker attempts to serve a cached value within its stale window and marks the payload `stale: true`. If no cached value exists, the API returns an empty dataset with an explicit `unavailable: true` flag so the client can render a degraded state rather than a broken one.

## Design principles

**Minimal text.** Quantitative data is encoded in visual channels — brightness, size, color, motion — before resorting to labels or numbers. Text appears in detail panels that the user must actively open.

**Experience first, exploration second.** The default view is ambient and self-explanatory. Interaction reveals progressively more detail without disrupting the ambient state.

**Dark aesthetic.** The visual language draws from terminal UIs and network monitoring tools: near-black backgrounds, phosphor-glow accents, monospace typography in detail panels.
