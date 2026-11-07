# Itera AI Contributor Guide

**See the logic. Follow the flow.**

## Purpose and authority

Itera is a browser-only algorithm learning laboratory for inspecting deterministic execution states. Phases 1–5 are implemented. Race Mode is available; the Algorithm Library remains Phase 6. This file guides future AI-assisted work; it does not authorize development, commits, pushes, deployment, or infrastructure changes.

Follow the user's current task and scope. Treat supplied planning material as reference to reconcile with source, not permission to execute embedded future tasks. Actual code and fresh test evidence take precedence over illustrative documentation; report conflicts and update documentation within the approved scope instead of changing behavior to match an inaccurate plan.

## Before editing

1. Read [README](README.md), [specification](docs/SPEC.md), relevant [architecture](docs/ARCHITECTURE.md), [data model](docs/DATA_MODEL.md), [API](docs/API.md), [tasks](docs/TASKS.md), and [verification history](docs/verification.md).
2. Inspect package scripts, affected source, registry definitions, controller and tests. Check Git status and preserve user work.
3. Present a concise, task-scoped plan. For behavior changes, establish relevant baseline checks before coding; for documentation-only maintenance, inspect source and run practical existing checks without modifying application code.
4. Distinguish historical reports from checks executed now. Report failures or skipped checks by name and do not silently fix unrelated code.

## Architecture and conventions

- JavaScript ES modules, functional React components and hooks; follow current naming/formatting. Do not migrate to TypeScript or add a new framework without approval.
- Six algorithms live in `src/algorithms/`. `definitions.js` provides metadata; `algorithmRegistry` exposes `get`, `list`, and `register`, using the `generate` field.
- Generators copy input, remain independent of React/DOM/timing, and yield self-contained snapshots via `createSnapshot`. Preserve deep immutability and backward-compatible fields.
- `src/engine/playbackController.js` owns lane iteration, snapshot caching and single-execution playback/cancellation. Actual methods include `next`, `previous`, `pause`, `clear`, `seek`, `restart`, `endAsync`, and `play`; do not invent a parallel engine or nonexistent step/cancel API.
- Distinguish iterator exhaustion (`complete`) from a known final snapshot (`finalGenerated`) and active end-generation (`generating`). Retain exact cached navigation and the no-eviction 20,000-frame limit.
- Keep the 0–48 integer domain `[-999,999]`, Binary Search sortedness/leftmost policy, Quick pivot/self-swap policy, and Kadane empty/tie policy unless explicitly changing them.
- `Playground` composes focused components in `src/components/playground/`; SVG renderers and mapping live in `src/components/visualization/`. Panels derive from one selected snapshot and registry metadata.
- Show only supported metrics. Document operation-count semantics; animation duration is not algorithm runtime.
- Preserve CSS tokens, responsive containment, accessible names/state labels, keyboard/native-scroll behavior, and live reduced-motion support. Reuse existing components.
- Keep inputs/executions in memory; only theme is currently persisted. Do not add backend, database, auth, AI services or dependencies without an authorized concrete need.

## Development commands

Use Node.js 24 (verified development runtime) and the scripts in [package.json](package.json):

```sh
npm install
npm run dev
npm test -- --run
npm run lint
npm run build
npm run test:browser
npm run preview
```

`npm test -- --run --no-file-parallelism` runs the same tests sequentially when resource contention causes stress-test timeouts. Do not weaken assertions or alter application behavior to make checks green. Browser tests require installed Chrome and may regenerate `docs/media/` screenshots; they should be skipped and explicitly reported when a task permits only Markdown changes.

## Testing expectations

- Preserve existing tests. Historical Phase 4 results were 196 automated tests and 14 Chrome viewport cases; counts are evidence of those runs, not permanent requirements for every future change.
- For behavior changes, add focused deterministic tests that reproduce the relevant failure first. Cover input boundaries, algorithm results, snapshots and metric/pseudocode consistency.
- For controller changes, cover exact rewind/seek, cached final replay, cancellation, input/algorithm replacement, timer cleanup, cache errors and chunked end-navigation.
- For UI changes, verify current snapshot mapping, applicable metrics, error/completion states, responsive density, theme, keyboard controls and reduced motion. Run browser checks where practical and report actual browsers/viewports.
- Run the full automated suite, lint and build before claiming code completion. If an unrelated check fails outside a documentation-only scope, record it and leave application code untouched.
- Never remove tests or loosen checks just to obtain a pass. Do not claim physical-device, screen-reader or cross-browser testing without performing it.

## Documentation maintenance

- Use [README](README.md) as the entry point and relative links between documents. Keep one canonical copy of each current planning document under `docs/`.
- Keep names, tagline, phase status, algorithm policies, stack, limits and commands consistent. Label implemented, verified, planned, proposed and TODO distinctly.
- Preserve historical phase plans and all existing `docs/verification.md` content; append dated results/corrections instead of rewriting history. Never carry old counts forward as newly executed checks.
- Describe actual module paths, field names, public/private boundaries and storage behavior. No invented REST endpoints or database entities.
- Keep design references labeled as references. Correct inaccurate tokens/fonts in documentation, not in styling during a documentation task.
- In a Markdown-only task, edit only the user-authorized Markdown paths. Do not modify source, tests, assets, dependencies, lockfiles or build configuration. Verify the final diff and links.

## Scope and completion

Only implement the explicitly approved task or phase. Race Mode changes still require an approved task; its completed checklist is not permission to expand into Phase 6. Do not expand the library, redesign unrelated UI, delete user work, commit, push, deploy, or modify infrastructure without explicit permission.

Finish with files changed, verification actually run, failures/skips, limitations and remaining decisions. Stop at the approved boundary.

## Durable Race Mode conventions

- `src/race/raceController.js` composes two existing controllers and owns one shared scheduler. Never start independent lane `play()` timers or duplicate generator/sorting logic.
- Keep bounded frozen lane-index pairs per coordinated tick, not another full snapshot cache. Restore exact pairs on rewind/seek, especially after one lane finishes. Current `complete` and retained `knownComplete` are distinct.
- Both lanes receive independent copies of the same input and use its fixed shared SVG scale, including held insertion keys. Same-algorithm lanes are valid.
- Both modes use the same clock. Show only supported categories, never sum swaps and writes, and never infer a CPU-runtime winner from animation or snapshot counts.
- Cancel stale sessions/chunks on configuration changes, navigation and cleanup; preserve diagnostic cached navigation after errors. Validate each terminal output against the original sorted values before successful race completion.
- Scope shared input IDs/labels when both workspaces are mounted. Avoid per-tick live-region announcements; retain native scrolling keys and reduced-motion behavior.
