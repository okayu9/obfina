# obfina

A real-time, interactive visualization of the Tor network.

![The obfina map: a value-by-alpha world map where each country glows by relay count and is colored by exit share](docs/assets/map.png)

## Why it exists

Tor routes traffic through thousands of volunteer-run relays across dozens of countries. The network is healthy, globally distributed, and surprisingly fragile — governments block it, relays go offline, bandwidth concentrates in unexpected places. None of this is visible to most people who use Tor, and even network operators lack a compelling way to see the whole picture at once.

obfina makes the Tor network observable. Not through tables and CSV exports, but through a world map where each country's place in the network reads at a glance.

## What it does

obfina is a set of linked views over the same network, switchable from the nav rail, with number keys `1`–`5`, or by cycling with `←`/`→` (or `[`/`]`); `Esc` clears the current selection. The active view is saved to `?view=…` so any view is shareable. On narrow screens the nav rail collapses to a hamburger menu.

- **Map** — value-by-alpha world map: hue encodes exit share (cyan → green) and brightness encodes relay count, so the busiest countries glow while the rest recede. A lightweight country summary loads first for fast startup, then full relay details are fetched for the Guard → Middle → Exit background simulation and drill-down panels. Click a country for its relay count, bandwidth, Guard/Middle/Exit composition, top autonomous systems, and a relay list with bandwidth bars; pan & zoom into dense regions like Europe.
- **Hosting** — centralization risk by autonomous system (hosting provider), as Lorenz curves with a Gini score and the top ASes — shown both for the whole network and for exit capacity alone, where concentration bites hardest. Click an AS for a detail panel with its relay list and bandwidth share.
- **Paths** — how much of all traffic rides on a few high-bandwidth relays: a concentration curve you can drag to read "the top N% of relays carry M% of traffic."
- **Growth** — the network over time: relay count, advertised capacity vs. bandwidth actually consumed, and estimated users by country (from Tor Metrics). Trend data is cached for the session so switching views does not re-fetch.
- **About** — data sources and references displayed as cards.
- **Ambient mode** — leave any view on a screen and it conveys the network's shape without interaction.

## Data

obfina pulls from two authoritative sources maintained by the Tor Project:

- [Onionoo](https://onionoo.torproject.org/) — per-relay details, bandwidth, country, flags, and AS information (no precise coordinates)
- [Tor Metrics](https://metrics.torproject.org/) — aggregate statistics and historical trends

Data is refreshed via a server-side cache layer (relay summary/details: 10 min, trends: 30 min). Relay data shown in the app may lag up to 3–6 hours behind the live network due to Onionoo's consensus ingestion cycle.

## Tech stack

| Layer        | Technology                             |
| ------------ | -------------------------------------- |
| Framework    | SvelteKit                              |
| Map          | D3 (d3-geo, d3-zoom) + world-atlas     |
| Country join | i18n-iso-countries (numeric → alpha-2) |
| Animation    | Svelte built-ins                       |
| Styling      | Tailwind CSS                           |
| Hosting      | Cloudflare Pages + Workers             |
| Cache        | Cloudflare KV                          |
| CI/CD        | GitHub Actions                         |

## Documentation

- [Architecture](docs/architecture.md) — system overview and design principles
- [Data Sources](docs/data-sources.md) — API reference, data quality notes, caveats
- [Development](docs/development.md) — local setup guide
- [Branching](docs/branching.md) — branch strategy, staging gate, and release flow
- [Infrastructure](docs/infrastructure.md) — Cloudflare deployment

## Acknowledgements

obfina would not exist without the work of the [Tor Project](https://www.torproject.org/) and the volunteers who run Tor relays worldwide. Network data is provided by [Onionoo](https://onionoo.torproject.org/) and [Tor Metrics](https://metrics.torproject.org/) — both maintained by the Tor Project.

## License

Copyright 2026 Yumeto Inaoka.

Licensed under the [Apache License, Version 2.0](LICENSE).
