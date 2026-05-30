# ADR-002: Use Threlte + Three.js for 3D rendering

**Status**: Superseded by [ADR-007](007-2d-map-over-globe.md)

> The 3D globe described here was built and working, but was replaced by a 2D
> D3 map for readability and operability. This record is kept for history; the
> Threlte/Three.js dependencies have been removed from the project.

## Context

The core visualization is a 3D globe with thousands of relay nodes, animated arcs, and real-time data binding. We needed a 3D rendering library that integrates naturally with Svelte's reactivity, is performant at the relay count Tor's network produces (~8,000 relays), and supports the custom WebGL effects the dark aesthetic requires.

Candidates evaluated: raw Three.js, Threlte, Globe.gl (a Three.js wrapper), and Deck.gl.

## Decision

Use Threlte as the primary interface to Three.js, with raw Three.js available as an escape hatch for geometry or shader work that Threlte does not expose.

## Consequences

**Benefits:**

- Threlte wraps Three.js objects as Svelte components. Relay nodes become `<T.Mesh>` components driven by store state — when the relay store updates, the scene updates reactively without manual imperative calls to `scene.add()` / `object.position.set()`.
- The canvas lifecycle (renderer creation, resize handling, animation loop) is managed by Threlte's `<Canvas>` component.
- Raw Three.js is always accessible via `useThrelte()` when fine-grained control is needed.

**Tradeoffs:**

- Relay nodes must be rendered using `THREE.InstancedMesh`, not individual `<T.Mesh>` components. Rendering ~8,000 relays as separate mesh components produces ~8,000 draw calls per frame, which is unacceptably slow. `InstancedMesh` batches all relay geometry into a single draw call and is accessed via `useThrelte()` as raw Three.js, bypassing Threlte's component abstraction for this specific use case.
- Threlte adds a component abstraction layer. When Three.js releases a breaking change, Threlte may lag before publishing a compatible version. Pinning Three.js and Threlte versions together is necessary in `package.json`.
- Custom shaders and post-processing effects (bloom glow for relay nodes) require dropping down to raw Three.js or using Threlte's `<T.ShaderMaterial>` which has less community documentation than the equivalent in react-three-fiber.
- Globe.gl would have shipped a working globe faster. The trade is that Globe.gl's abstraction level is too high to implement the custom relay pulse animation and the click-to-zoom country behavior we need.
