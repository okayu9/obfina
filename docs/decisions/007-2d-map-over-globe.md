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

- **Projection and geography**: `d3-geo` Natural Earth projection with
  `world-atlas` land and country borders.
- **One marker per country** (not per relay). Each marker encodes multiple
  dimensions at once:
  - radius → relay count (sqrt scale, so area reads as count)
  - color → exit share (cyan = guard-heavy, green = exit-heavy)
  - opacity → total bandwidth
- **Interaction**: hover tooltip, click for a country detail panel, and
  `d3-zoom` pan/zoom to inspect dense regions.

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
- A flat projection distorts area (Natural Earth is a compromise) and cannot
  show great-circle relationships between relays.
- Country markers near each other (e.g. in Europe) still overlap at the default
  zoom; this is mitigated by zoom rather than eliminated.
