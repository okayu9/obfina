# ADR-009: Multiple linked views over the single map

**Status**: Accepted (extends [ADR-008](008-value-by-alpha.md))

## Context

The value-by-alpha map (ADR-008) answers one question well — _where are the
relays?_ — but the network's health hinges on questions the map cannot show:

- **Centralization risk.** Relays cluster in a handful of hosting providers
  (autonomous systems). If one AS fails or is coerced, a large slice of the
  network — and especially of the _exit_ capacity — goes with it. Geography
  hides this: a country can look healthy while sitting on one provider.
- **Path-selection bias.** Tor weights relays by capacity, so a small number of
  high-bandwidth relays carry a disproportionate share of all circuits.
- **Change over time.** Growth, the gap between advertised capacity and the
  bandwidth actually consumed, and where users connect from are all temporal —
  a single consensus snapshot says nothing about them.
- **What a circuit _is_.** The core Tor concept — a Guard → Middle → Exit path —
  is invisible on a static choropleth.

These are different questions with different natural encodings. Forcing them all
onto the map would either clutter it or distort geography, which ADR-007/008
explicitly rejected.

## Decision

Keep the map as one view among several, and add a **view switcher**. Each view
keeps obfina's design language (dark base, cyan→green accents, minimal text,
quantitative data in visual channels) but picks the encoding that fits its
question:

| View       | Question                       | Encoding                                                                 |
| ---------- | ------------------------------ | ------------------------------------------------------------------------ |
| `map`      | Where are the relays?          | Value-by-alpha choropleth (ADR-008)                                      |
| `hosting`  | How centralized is hosting?    | Lorenz curves of per-AS weight, all vs. exit-only, with Gini + top ASes  |
| `paths`    | How biased is path selection?  | Per-relay concentration curve with draggable “top N% → M% of traffic”    |
| `growth`   | How is the network changing?   | Time-series: relay count, advertised vs. consumed bandwidth, users by CC |
| `circuits` | What does a circuit look like? | Real Guard→Middle→Exit paths animated over the map                       |
| `about`    | Where does the data come from? | Data source and reference cards                                          |

Navigation is intentionally cheap so the views read as one exhibit:

- a fixed nav rail (click), number keys `1`–`6`, and `←`/`→` (or `[`/`]`);
- the active view is mirrored to `?view=…` so any view is deep-linkable.

Geography stays meaningful where it appears: the `circuits` view reuses the same
height-fitted equirectangular projection as the map (shared via
`$lib/geo/world`), placing relays at their country centroids.

The non-snapshot data the `growth` view needs is fetched through a new cached
server route, `/api/relays` having been extended with the fields the analytical
views require (`as`, `as_name`, `consensus_weight`, the per-position
probabilities, `first_seen`).

## Consequences

**Benefits:**

- Each question gets a purpose-built, legible encoding instead of an overloaded
  map.
- Concentration risk — the network's most underappreciated fragility — becomes a
  first-class, at-a-glance reading (a curve bowing to the corner, a single Gini
  number) rather than something buried in tables.
- Path bias and circuits make abstract Tor mechanics tangible, supporting the
  “experience first” principle.
- Views share one relay dataset and one projection, so they stay cheap and
  visually consistent.

**Tradeoffs:**

- Lorenz curves and time-series carry a little more text (axis hints, a one-line
  caption) than the near-textless map. We keep it minimal and lean on big-number
  readouts in the house style.
- The `growth` view depends on Tor Metrics CSV exports, whose availability and
  schema we do not control; each series degrades independently (see
  [data-sources](../data-sources.md)).
- More surface area to maintain than a single map.
