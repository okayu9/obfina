# CLAUDE.md — Agent Instructions for obfina

This file is read by AI agents (Claude Code subagents) working in this repository.
Follow these instructions in addition to any task-specific prompt you receive.

---

## Orchestrator behavior (main session)

This section is for the main Claude Code session that coordinates subagents — not for subagents themselves.

### Delegating tasks to subagents

- Each user task is delegated to a **separate subagent with `isolation: worktree`** running in the background. **Never do development work in the main session directly — this applies even to trivial one-line fixes.** If the cause is already known and the fix is obvious, that is not a reason to bypass the subagent; the worktree isolation and commit history still matter.
- Spawn subagents as soon as a task arrives — do not wait to batch them unless they clearly conflict on the same files.
- Prompt subagents with: the task goal, specific file paths to investigate, relevant patterns from this CLAUDE.md (design system, existing component references), and what to do on completion (commit + update docs if needed).
- If two subagents are likely to touch the same file, note it in each prompt so they are aware; resolve conflicts at merge time.

### Merging subagent work

- Before merging, always run `git diff main...{branch} --stat` and `git log main..{branch} --oneline` to verify scope.
- Merge with `--no-ff` to preserve history: `git merge {branch} --no-ff -m "…"`.
- When a merge conflicts, read the conflict markers, understand the intent of each side, and produce a result that preserves both features. Never discard either side without reason.
- After resolving conflicts, verify no `<<<<<<<` markers remain before committing.

### Communication with the user

- Keep responses short. State what was launched or what changed — no narration of internal reasoning.
- When a subagent completes, report: what changed and where, then ask if there is more work.
- If a subagent fails (permission denied, nothing committed, wrong files), diagnose the cause, fix the conditions (e.g. permissions, better prompt), and re-spawn.
- Do not push to remote unless the user explicitly asks.

### Context management

- Do not read large files in the main session. Delegate exploration to subagents.
- Do not re-read files after editing them to verify — trust the tool result.
- If the user's request is ambiguous, ask one focused question rather than making assumptions.

---

## Workflow

### Before you finish

1. Run `pnpm run check` — fix all TypeScript errors before committing.
2. **For UI changes, verify visually before committing.** Start the dev server (`pnpm run dev`), take a screenshot with `pnpm tsx scripts/screenshot.ts http://localhost:5173 /tmp/verify.png 3000`, inspect the result, and confirm the change looks correct. Kill the dev server after. Do not report a UI task as done without this step.
3. **Commit everything.** Never leave uncommitted changes in the worktree. If you created files but didn't commit them, they will be lost when the worktree is cleaned up.
4. **Update documentation** if your changes affect the feature set, views, or architecture. Specifically:
   - `README.md` — if views, keyboard shortcuts, or top-level features changed
   - `docs/architecture.md` — if the view list, system diagram, or design principles changed
   - `docs/decisions/009-multi-view.md` — if a view was added or removed
   - `docs/development.md` — if the directory structure or build process changed
     Do this in the same commit as the feature, not as a separate task.

### Constraints

- Do not write to `.claude/settings.json` — that path is outside the worktree scope and will be rejected.
- Do not add features, refactoring, or abstractions beyond what the task requires.
- Do not add comments that explain _what_ code does — only _why_ when non-obvious.

---

## Project overview

**obfina** is a SvelteKit + TypeScript + Cloudflare Workers app that visualizes the Tor network.
Stack: SvelteKit, D3.js, Svelte 5 runes (`$state`, `$derived`, `$effect`), pnpm, Cloudflare KV.

### Views (keyboard `1`–`6`, or `←`/`→`)

| Key | `?view=`   | Component                   | Description                                              |
| --- | ---------- | --------------------------- | -------------------------------------------------------- |
| 1   | `map`      | `MapView.svelte`            | Value-by-alpha world map; click country for detail panel |
| 2   | `hosting`  | `CentralizationView.svelte` | Lorenz curve + Gini; click AS for relay detail panel     |
| 3   | `growth`   | `TrendsView.svelte`         | Time-series charts; data cached in-session               |
| 4   | `paths`    | `PathsView.svelte`          | Per-relay path-selection concentration                   |
| 5   | `circuits` | `CircuitView.svelte`        | Guard → Middle → Exit animation over the map             |
| 6   | `about`    | `AboutView.svelte`          | Data sources and references                              |

### Key source paths

```
src/
  lib/
    analysis/       concentration.ts, circuit-sampling utilities
    components/
      nav/          ViewNav.svelte (sidebar navigation)
      panels/       CountryPanel.svelte (map detail panel)
      views/        One .svelte file per view + LoadingScreen.svelte
    geo/            world.ts  — projection, randomPointInCountry(), geoContains
    stores/         relays.svelte.ts, trends.svelte.ts, view.svelte.ts, selection.svelte.ts
    types.ts        Relay, CountryStats, …
  routes/
    +page.svelte    Top-level router (view switching)
    +layout.svelte  Shell with footer
    api/            trends/, relays/, stats/, censorship/ — server-side KV-cached proxies
```

---

## Design system

### Colors

```
Background:    #08141f  (near-black)
Surface:       rgba(8, 20, 31, 0.7)
Border:        rgba(58, 93, 120, 0.35)
Text primary:  #e6f1ff
Text muted:    #6f8aa3
Text secondary:#9fc6e0
Accent cyan:   #00d4ff  (var(--accent-cyan))  — Guard nodes, primary highlight
Accent green:  #39ff14  (var(--accent-green)) — Exit nodes
```

### Recurring UI patterns

**Detail panel (slide-in)**
A right-side panel that appears when the user clicks an item in a list. See `CentralizationView.svelte` for the canonical implementation. Key properties:

```css
flex: 0 0 auto;
width: min(420px, 100%);
background: rgba(8, 20, 31, 0.7);
border: 1px solid rgba(0, 212, 255, 0.25);
border-radius: 10px;
padding: 1.1rem 1.2rem;
animation: slide-in 0.18s ease-out;
```

**Relay list with bandwidth mini-bar**
Used in both `CentralizationView.svelte` (hosting detail panel) and `CountryPanel.svelte` (map detail panel). The pattern: compute `maxRelayBw`, use `bwColor(bw)` to interpolate `#3a5266` → `#00d4ff`, render a 3 px tall bar + colored text. When adding a new relay list, reuse this pattern.

```ts
const maxRelayBw = $derived(Math.max(...relays.map((r) => r.bandwidth), 1));
function bwColor(bw: number): string {
	const t = maxRelayBw > 0 ? bw / maxRelayBw : 0;
	return `rgb(${Math.round(0x3a + t * (0x00 - 0x3a))},${Math.round(0x52 + t * (0xd4 - 0x52))},${Math.round(0x66 + t * (0xff - 0x66))})`;
}
```

**Loading screen**
Use `<LoadingScreen message="…" />` from `$lib/components/LoadingScreen.svelte`. Do not build custom spinners.

**Flag badges (G/M/E)**

```svelte
{#if hasFlag(r, 'Guard')}<span class="flag guard">G</span>{/if}
{#if !hasFlag(r, 'Guard') && !hasFlag(r, 'Exit')}<span class="flag middle">M</span>{/if}
{#if hasFlag(r, 'Exit')}<span class="flag exit">E</span>{/if}
```

### Typography

- Section headers: `font-size: 1.1rem; letter-spacing: 0.12em; text-transform: uppercase; color: #e6f1ff`
- Subheadings / labels: `font-size: 0.6–0.65rem; letter-spacing: 0.09–0.15em; color: #6f8aa3; text-transform: uppercase`
- Data values: `font-variant-numeric: tabular-nums`
- Monospace is used throughout (set globally)

---

## Data stores

| Store         | File                         | Contents                              |
| ------------- | ---------------------------- | ------------------------------------- |
| `relayStore`  | `stores/relays.svelte.ts`    | All relays; `loading`, `failed` flags |
| `trendsStore` | `stores/trends.svelte.ts`    | Time-series data; session-cached      |
| `selection`   | `stores/selection.svelte.ts` | Selected country code                 |
| view state    | `stores/view.svelte.ts`      | `ViewId` type, `VIEWS` array          |

Adding a new view: add its `id` to `ViewId` and `VIEWS` in `view.svelte.ts`, import and render it in `+page.svelte`, add it to the `needsRelays` exclusion list if it doesn't need relay data.

---

## API routes (server-side, Cloudflare Workers)

All routes are in `src/routes/api/`. They proxy Tor APIs with Cloudflare KV caching and graceful stale fallback. When adding a new data source:

1. Create `src/routes/api/<name>/+server.ts`
2. Use the existing KV cache pattern from `trends/+server.ts` (check KV → fetch upstream → write KV → return)
3. Return stale data on upstream failure rather than erroring

---

## Git conventions

Commit message format: `type(scope): description`
Types: `feat`, `fix`, `docs`, `refactor`
Scopes match view names or areas: `map`, `hosting`, `circuits`, `growth`, `paths`, `about`, `nav`, `ui`, `layout`

Examples from this repo:

```
feat(hosting): provider detail panel with relay list on AS click
fix(circuits): place relay dots inside country polygon via rejection sampling
docs: update documentation to reflect current 6-view implementation
```
