# ADR-007: Use a 2D D3 map instead of a 3D globe

**Status**: Accepted (supersedes [ADR-002](002-threlte.md))

## Context

The first working visualization was a 3D WebGL globe (Threlte + Three.js) with
per-relay glowing points scattered around country centroids. It looked striking,
but in use it had two serious problems:

1. **Operability.** A rotating 3D globe is hard to navigate. Half the data is
   always on the far side, finding a specific country requires dragging the
   globe around, and the auto-rotation moves the subject out of view.
2. **Legibility.** Thousands of individually scattered points read as noise.
   Random jitter around a centroid implied a spatial precision the data does not
   have (Onionoo only provides country-level location), and dense regions like
   Europe became unreadable blobs.

We also reconsidered the per-relay scatter itself: showing one point per relay
conveyed count only through density, which is a weak and misleading channel.

## Decision

Replace the 3D globe with a flat 2D world map rendered with D3 and SVG:

- **Projection and geography**: a `d3-geo` cylindrical projection with
  `world-atlas` land and country borders. (Started as Natural Earth; later
  switched to equirectangular so the map tiles cleanly for horizontal
  wrapping — see the Overview in [architecture.md](../architecture.md).)
- **Per-country aggregation** (not per relay), since Onionoo only provides
  country-level location.
- **Interaction**: hover tooltip, click for a country detail panel, and
  `d3-zoom` pan/zoom to inspect dense regions.

> The original per-country encoding here was a proportional-symbol bubble
> (radius = count, color = exit share). That was later replaced after comparing
> many alternatives — see [ADR-008](008-value-by-alpha.md) for the final
> value-by-alpha encoding.

Three.js, Threlte, and the globe components were removed.

## Consequences

**Benefits:**

- The whole network is visible at once; no hidden hemisphere.
- One marker per country with multi-channel encoding conveys count, role, and
  bandwidth far more clearly than scattered points.
- SVG makes interaction (hover, click, focus, keyboard) trivial and accessible
  compared to WebGL raycasting.
- The dependency footprint shrank substantially (Three.js and Threlte removed).
- Honest about precision: country-level data is shown at country level, not
  faked with per-relay positions.

**Tradeoffs:**

- Less immediately spectacular than a glowing 3D globe; the "wow" factor is
  lower even if the clarity is higher.
- A flat projection distorts area (equirectangular stretches the poles) and
  cannot show great-circle relationships between relays.
- Country markers near each other (e.g. in Europe) still overlap at the default
  zoom; this is mitigated by zoom rather than eliminated.
