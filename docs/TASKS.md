# Itera Tasks

**See the logic. Follow the flow.**

[Documentation index](../README.md#documentation) · [Specification](SPEC.md) · [Verification history](verification.md)

Checked implementation items below were reconciled with source on 2026-11-08. Check results are separately dated in verification history; the historical 196 automated / 14 Chrome results are not relabeled as a fresh browser run. Planned and proposed work is not authorized by this checklist.

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

## Milestone 5: Race Mode — planned; all tasks pending

Implementation must follow explicit approval. Tasks are dependency ordered and intended to be small reviewable increments.

- [ ] Inspect current [API](API.md) contracts and document race integration points.
- [ ] Resolve comparison units, same-algorithm selection and independent completion semantics.
- [ ] Define the proposed RaceSession shape and transitions; document synchronized-step semantics and whether operation comparison is included.
- [ ] Implement isolated execution sessions sharing identical cloned starting values.
- [ ] Add A/B selectors restricted to the four sorting algorithms.
- [ ] Compose dual SVG lanes using existing renderers.
- [ ] Wire shared start/pause/resume/restart controls and cancellation.
- [ ] Wire shared speed without overlapping or leaked timers.
- [ ] Add synchronized-step progression with documented tick behavior.
- [ ] Add operation-count comparison if approved, without presenting animation time as benchmark runtime.
- [ ] Render each lane's supported counters, operation, complexity and progress accurately.
- [ ] Handle unequal trace lengths and one lane finishing first.
- [ ] Add final side-by-side results and comparison summary; avoid universal-winner claims.
- [ ] Stack lanes on mobile and preserve dense-array readability.
- [ ] Test algorithm/input switching during a running race.
- [ ] Test pause/resume, cancellation, restart, completion and unmount cleanup.
- [ ] Test unequal trace lengths, supported-metric differences and deterministic replay.
- [ ] Run all existing/new automated tests, lint and production build.
- [ ] Verify Chrome desktop/mobile interaction and console errors; record exactly what ran.
- [ ] Update current docs and append verification evidence; stop at the approved boundary.

## Later work — not Phase 5

- [ ] Conduct a screen-reader session and expanded keyboard/contrast/accessibility audit.
- [ ] Verify Safari and Firefox rendering.
- [ ] Test physical mobile devices.
- [ ] Build Algorithm Library detail views after approval (Phase 6).
- [ ] Create a verified demo GIF; screenshots already exist.
- [ ] Choose a hosting target and add provider-specific deployment steps if requested. Generic static build/hosting guidance already exists.
- [ ] Consider additional algorithms only after a separately approved specification.

## Open decisions / TODOs

- [ ] Confirm race operation-count definitions/normalization for algorithms with different supported counters.
- [ ] Decide whether both lanes can select the same algorithm.
- [ ] Confirm if operation comparison is a separate mode or summary of synchronized-step runs.
- [ ] Confirm a deployment provider, budget/free-tier constraint, or deadline only if the user requires one; none is assumed.
