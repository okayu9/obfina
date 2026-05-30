# ADR-008: Use a value-by-alpha encoding for the country map

**Status**: Accepted (refines the encoding in [ADR-007](007-2d-map-over-globe.md))

## Context

With the 2D map decided (ADR-007), the question was how to encode per-country
data (relay count, exit share, bandwidth) on it. We prototyped and compared a
wide set of established cartographic techniques, all selectable at the time via
a `?viz=` switch:

- **Proportional-symbol bubbles** (radius = count): circles overlapped into an
  unreadable blob over Europe — the classic "symbol congestion" problem.
- **Choropleth** (fill territory by count): area distortion — large empty
  countries (Russia, Canada) dominate while relay-dense small countries
  (Germany, Netherlands) vanish. Cartographic convention also reserves
  choropleth for ratios, not raw counts.
- **Dorling / Demers cartograms** (force-packed circles): removed overlap but
  scrambled geography — bubbles drifted far from their true location, so a
  country could only be identified by hovering.
- **Spike map** (height = count): readable "skyline" but spikes occlude one
  another front-to-back.
- **Hex tile cartogram**: every country readable, but geography becomes
  schematic and the size channel is lost.
- **Leader-line bubbles, dot-density, Europe inset, radial bursts**: each
  solved part of the problem but added clutter or lost a channel.

Research into how data journalists handle "per-country values over a dense
Europe" (Axis Maps, Datawrapper, FlowingData, the Tor Metrics site itself)
pointed to value-by-alpha as an unusually good fit for a dark, phosphor-style
aesthetic — its recommended base is a dark background.

## Decision

Use a **value-by-alpha (VBA)** encoding:

- Every country is drawn as a visible slate land base with borders, so the
  whole world always reads as a map.
- Countries with relays glow on top: **hue = exit share** (cyan → green),
  **opacity = relay count** (sqrt-scaled). Low-relay countries fade toward the
  base; the busiest countries glow brightest.
- Interaction (hover tooltip, click → detail panel, pan/zoom) is unchanged.

## Consequences

**Benefits:**

- No overlap and no scrambled geography — every country stays exactly where it
  belongs, identifiable without hovering.
- Suppresses the area-distortion noise of a raw-count choropleth: large,
  low-relay countries recede instead of shouting.
- The dark base + glow matches obfina's aesthetic; VBA's canonical base color is
  dark, so the technique and the look reinforce each other.
- Pure CSS/SVG, no force simulation or extra layout data.

**Tradeoffs:**

- VBA can _suppress_ unimportant countries but cannot _enlarge_ small important
  ones — a relay-dense small country (e.g. Luxembourg) is bright but still
  physically small, so dense Europe is helped but not fully solved. Zoom remains
  the tool for inspecting it.
- Opacity is a weaker quantitative channel than length or position, so exact
  count comparisons between countries need the detail panel.
- Bandwidth is no longer encoded on the map itself (it lives in the detail
  panel); the map now carries two variables (count, exit share) rather than
  three.
