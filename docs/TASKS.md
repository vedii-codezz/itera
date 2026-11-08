# Itera Tasks

**See the logic. Follow the flow.**

[Documentation index](../README.md#documentation) · [Specification](SPEC.md) · [Verification history](verification.md)

Checked implementation items below were reconciled with source through Phase 5 on 2026-11-08. Check results are separately dated in verification history; the historical 196 automated / 14 Chrome results are not relabeled as a fresh browser run. Phase 5 implementation was explicitly approved by its brief; this checklist does not authorize Phase 6.

## Milestone 1: Foundation — implemented

- [x] React/Vite shell and responsive navigation.
- [x] Persisted light/dark appearance and shared design tokens.
- [x] Input studio, eight presets, bounds, validation and reset.

## Milestone 2: Execution engine — implemented

- [x] Deep-cloned/frozen snapshots with a backward-compatible contract.
- [x] Registry and framework-independent generator playback controller.
- [x] Lazy bounded caching, seek/rewind, speed changes and cancellation.
- [x] Chunked cancellable end-navigation and exact cached completion handling.

## Milestone 3: Algorithms — implemented

- [x] Bubble and Insertion generators with comparisons/swaps or shifts/writes.
- [x] Merge and last-pivot Lomuto Quick generators with tracing metadata.
- [x] Leftmost Binary Search with explicit sortedness rejection.
- [x] Kadane with all-negative/empty handling and earliest-start/end ties.
- [x] Deterministic correctness, metrics, immutability and property-test coverage.

## Milestone 4: Playground — implemented

- [x] Real snapshots connected to all transport controls and generated-frame timeline.
- [x] Sorting SVGs, stacked Binary Search pointers and Kadane sum chart.
- [x] Synchronized registry pseudocode, explanations, variables, supported metrics and results.
- [x] Responsive panels, accessible state table, keyboard shortcuts/reference and live reduced motion.
- [x] Existing automated and Chrome viewport regression suites; historical execution reported 196 + 14 passing. Consult the dated verification record for fresh runs or skips.

## Milestone 5: Race Mode — implemented

The approved Phase 5 brief resolved same-algorithm selection and comparison-mode semantics. The following work is implemented; current verification is appended to the history.

- [x] Inspect current [API](API.md) contracts and document race integration points.
- [x] Resolve comparison units, same-algorithm selection and independent completion semantics.
- [x] Define the proposed RaceSession shape and transitions; document synchronized-step semantics and whether operation comparison is included.
- [x] Implement isolated execution sessions sharing identical cloned starting values.
- [x] Add A/B selectors restricted to the four sorting algorithms.
- [x] Compose dual SVG lanes using existing renderers.
- [x] Wire shared start/pause/resume/restart controls and cancellation.
- [x] Wire shared speed without overlapping or leaked timers.
- [x] Add synchronized-step progression with documented tick behavior.
- [x] Add operation-count comparison if approved, without presenting animation time as benchmark runtime.
- [x] Render each lane's supported counters, operation, complexity and progress accurately.
- [x] Handle unequal trace lengths and one lane finishing first.
- [x] Add final side-by-side results and comparison summary; avoid universal-winner claims.
- [x] Stack lanes on mobile and preserve dense-array readability.
- [x] Test algorithm/input switching during a running race.
- [x] Test pause/resume, cancellation, restart, completion and unmount cleanup.
- [x] Test unequal trace lengths, supported-metric differences and deterministic replay.
- [x] Run all existing/new automated tests, lint and production build.
- [x] Verify Chrome desktop/mobile interaction and console errors; record exactly what ran.
- [x] Update current docs and append verification evidence; stop at the approved boundary.

## Later work — not Phase 5

- [ ] Conduct a screen-reader session and expanded keyboard/contrast/accessibility audit.
- [ ] Verify Safari and Firefox rendering.
- [ ] Test physical mobile devices.
- [ ] Expand Algorithm Library educational content after approval (Phase 6); registry-only presentation is available in Phase 5.5.
- [ ] Create a verified demo GIF; screenshots already exist.
- [ ] Choose a hosting target and add provider-specific deployment steps if requested. Generic static build/hosting guidance already exists.
- [ ] Consider additional algorithms only after a separately approved specification.

## Open decisions / TODOs

- [x] Keep operation categories separate; no aggregate/normalization model is invented. Unsupported categories are N/A or omitted.
- [x] Allow the same sorting algorithm in both lanes with deterministic independent state.
- [x] Provide Operation Comparison as a separate emphasis mode sharing synchronized playback/history.
- [ ] Confirm a deployment provider, budget/free-tier constraint, or deadline only if the user requires one; none is assumed.

## Phase 5.5 — Stitch presentation redesign

- [x] Audit both archives and current source; baseline 240 automated tests, lint and build pass.
- [x] Canonical palette, contrast-sensitive themes, self-hosted reference fonts and reusable workbench styling.
- [x] Desktop header, mobile bottom navigation, existing workspace preservation and selected-algorithm handoff.
- [x] Live Playground and paired Race presentation; execution engine retained.
- [x] Registry-only catalog/detail and accurate About presentation (expanded Phase 6 content deferred).
- [x] Final verification evidence is recorded separately in [verification history](verification.md).
