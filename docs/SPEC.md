# Itera Product Specification

**See the logic. Follow the flow.**

[Documentation index](../README.md#documentation) · [Tasks](TASKS.md) · [Verification history](verification.md)

## Objective and audience

Help CS students, DSA beginners, interview candidates, developers, and visual learners understand algorithms through deterministic, inspectable execution states. Connect each visual change with its pseudocode, explanation, variables, and operation counts.

## Status and terminology

Source inspection on 2026-11-08 confirms Phases 1–4 are implemented. Verification results are separate evidence: historical Phase 4 results and any newly executed checks are recorded in [verification.md](verification.md).

- **Implemented:** present in the current source.
- **Verified:** supported by a named check and its recorded run; not a guarantee for every browser or device.
- **Planned:** future scope requiring explicit approval.
- **Proposed:** an approach or model not yet implemented or approved as a final design.
- **TODO:** an unresolved decision or unperformed check.

| Feature             | Implemented behavior                                                                               | Status                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Sorting             | Bubble, Insertion, Merge, Quick generators and SVG bars                                            | Implemented, Phases 3–4                                           |
| Searching           | Sorted-input Binary Search, target editor, lo/mid/hi, leftmost match                               | Implemented                                                       |
| Dynamic programming | Kadane current/best ranges, sums, and observed running-sum chart                                   | Implemented                                                       |
| Inputs              | Custom arrays, eight presets, generation bounds, validation, reset                                 | Implemented                                                       |
| Playback            | Play/pause/resume, previous/next, restart, beginning/end, 0.25×–4×, cached timeline                | Implemented                                                       |
| Learning panels     | Registry pseudocode, deterministic explanations, variables, supported metrics, results, complexity | Implemented                                                       |
| Interface           | Responsive layout, persisted themes, reduced motion, shortcut reference, accessible state table    | Implemented; broader accessibility/device coverage remains TODO   |
| Race Mode           | Compare two sorting algorithms on identical input                                                  | Planned Phase 5; existing navigation is an unavailable-state page |
| Algorithm Library   | Educational detail views                                                                           | Planned Phase 6; existing navigation is an unavailable-state page |

## Current user stories and acceptance criteria

- Enter a valid array, Apply, and inspect its real generator execution; malformed drafts retain the last committed execution and show a validation message.
- Pause, step, rewind, restart, or scrub cached frames; visualizations, pseudocode, metrics, and explanations all correspond to the selected snapshot.
- Change algorithms or apply input to cancel the old execution. Editing the array/target pauses immediately; leaving the playground also pauses it.
- Choose Binary Search without silent sorting. Unsorted input produces an error; the explicitly labeled sorting action changes the visible input only when selected. Duplicate results identify the leftmost matching index.
- Inspect Kadane on all-negative, positive, mixed, zero, singleton, and empty input. Equal optima prefer earliest start, then earliest end; the empty result has sum 0 and null boundaries.
- Use keyboard shortcuts outside controls and scroll regions. Read overlapping search pointers on separate rows and dense arrays in a contained scrolling canvas.
- Distinguish generated steps from a final total. Jump-to-end yields in cancellable chunks; animation duration is never presented as algorithm runtime.

These behaviors have source and test coverage. An actual screen-reader session, physical-device testing, and Safari/Firefox coverage remain unverified; see [Design](DESIGN.md).

## Constraints

Browser-only React/Vite/JavaScript application; no backend, database, account, external AI explanations, or execution persistence. Input permits 0–48 integers in `[-999,999]`; search targets use the same range. Snapshot caching is capped at 20,000 without eviction. Only theme is persisted. The Vite build produces static `dist/` assets; no hosting provider or deployment configuration is selected.

Algorithm policies, metrics, and complexity remain as documented in the [README](../README.md#supported-algorithms) and [data model](DATA_MODEL.md).

## Phase 5 Race Mode — planned, not implemented

User story: compare two sorting algorithms on the same initial values without confusing animation timing with computational performance.

Acceptance criteria for future approval/implementation:

- Both lanes receive identical cloned input, isolate execution state, and clean up old work on input/algorithm changes and unmount.
- Shared start/pause/resume/restart/speed controls have documented behavior when a lane completes first.
- Explain synchronized-step progression and operation-count comparison. The latter is a proposed additional mode, not an existing feature or universal ranking.
- Show only supported counters, completion states, and a fair summary; do not claim one algorithm is universally faster from one visual race.
- Use side-by-side lanes on desktop and stacked lanes on mobile, preserve dense-array readability, and add deterministic engine/UI and browser coverage.

The proposed two-controller orchestration and `RaceSession` concept require design reconciliation before coding; neither exists in current source. Dependency-ordered work and open decisions are in [Tasks](TASKS.md).

## Boundaries and TODOs

Phase 5 excludes library expansion, new algorithms, unrelated redesigns, authentication, cloud accounts, databases, AI services, collaboration, arbitrary code execution, and backend benchmarking. Later library work, a demo GIF, and broader accessibility/browser audits require separate approval. Screenshots and keyboard help already exist.

TODO: confirm Race Mode counting/normalization policy, whether the same algorithm may occupy both lanes, and any deadline, hosting provider, or budget constraint. No deadline or free-tier requirement is assumed.
