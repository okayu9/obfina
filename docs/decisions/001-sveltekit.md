# ADR-001: Use SvelteKit as the application framework

**Status**: Accepted

## Context

obfina is an interaction-heavy, WebGL-first application. The primary content is a 3D globe rendered client-side; server-side rendering provides limited benefit because the page shell is thin and the meaningful content cannot be rendered on a server. We evaluated Next.js, Remix, SvelteKit, and a framework-free Vite + React setup.

## Decision

Use SvelteKit with `@sveltejs/adapter-cloudflare`.

## Consequences

**Benefits:**

- Svelte's compiler-based reactivity eliminates Virtual DOM overhead. When relay data updates, only the affected DOM nodes and Three.js scene objects change — no diffing across the entire component tree.
- Built-in animation primitives (`tweened`, `spring`, `transition:`, `animate:`) handle the majority of ambient UI effects without a separate animation library.
- Svelte stores are a natural fit for app-wide relay state that multiple components (globe, panels, legend) need to observe simultaneously.
- SvelteKit server routes (`+server.ts`) serve as the API proxy and cache layer without a separate backend.
- The Cloudflare adapter deploys server routes as Workers with no additional configuration.

**Tradeoffs:**

- The Svelte ecosystem is smaller than React's. Some libraries assume React and require adaptation or replacement.
- Threlte (the Svelte-native Three.js wrapper) is less mature than react-three-fiber. Breaking changes between Threlte and Three.js releases require more active maintenance attention.
- Fewer hiring candidates are familiar with Svelte compared to React, which matters if the project grows to a team.
