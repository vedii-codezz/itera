# Itera Architecture

**See the logic. Follow the flow.**

[Documentation index](../README.md#documentation) · [Internal API](API.md) · [Data model](DATA_MODEL.md)

## Implemented system

Source-audited on 2026-11-08: Phases 1–4 form one browser-only React application. There is no server, HTTP API, database, router service, or remote persistence. Planning documents do not authorize implementation of the planned Race Mode.

```text
InputStudio / target editor -> input validation -> registry definition.generate
                                                       |
                                                 generator.next()
                                                       |
                                        createSnapshot (clone + deep freeze)
                                                       |
                               playbackController (lazy frames, timing, chunks)
                                                       |
                                     usePlayback / useSyncExternalStore
                                                       |
                        current snapshot -> SVG + pseudocode + metrics + explanation
```

Registry lookup selects a definition; it is not a second execution engine. `Playground` supplies its generator, copied input and options to the controller. Generators never own DOM or animation timing. The controller defensively clones/freezes yielded states again before caching.

## Actual structure and responsibilities

| Path                                                                                                      | Responsibility                                                                                    |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [src/main.jsx](../src/main.jsx), [src/App.jsx](../src/App.jsx)                                            | React entry, preserved shell/navigation, theme and mounted playground                             |
| [src/algorithms/](../src/algorithms/)                                                                     | Six generators, shared `execution.js`, immutable `definitions.js`                                 |
| [src/engine/snapshot.js](../src/engine/snapshot.js)                                                       | Snapshot defaults, validation, deep copy/freeze                                                   |
| [src/engine/algorithmRegistry.js](../src/engine/algorithmRegistry.js)                                     | Generic registry and six populated production definitions                                         |
| [src/engine/playbackController.js](../src/engine/playbackController.js)                                   | The sole execution controller: lazy iteration, cache, navigation, playback and chunk cancellation |
| [src/components/playground/](../src/components/playground/)                                               | `Playground`, `InputStudio`, `PlaybackControls`, `LivePanels`                                     |
| [src/components/visualization/](../src/components/visualization/)                                         | Sorting, Binary Search, Kadane renderers; dispatcher, primitives and state mapping                |
| [src/components/InputPreview.jsx](../src/components/InputPreview.jsx), [UI.jsx](../src/components/UI.jsx) | Unexecuted preview and reusable Button/Panel primitives                                           |
| [src/hooks/](../src/hooks/)                                                                               | `usePlayback`, `useTheme`, live `useMotionPreference`                                             |
| [src/utils/input.js](../src/utils/input.js)                                                               | Parsing, bounds, eight generation presets                                                         |
| [src/styles.css](../src/styles.css), [public/favicon.svg](../public/favicon.svg)                          | Tokens, responsive presentation and favicon                                                       |
| [tests/](../tests/)                                                                                       | Six test suites plus shared algorithm test helpers                                                |
| [e2e/playground.spec.js](../e2e/playground.spec.js)                                                       | Playwright browser scenarios                                                                      |
| [vite.config.js](../vite.config.js), [playwright.config.js](../playwright.config.js)                      | Build/unit test discovery and browser project configuration                                       |
| [docs/](./)                                                                                               | Planning references, preserved phase plans, screenshots and append-only verification history      |

## Dependencies and build

[package.json](../package.json) declares React/React DOM, `motion` (Motion for React) and `lucide-react` at runtime. Development tooling includes Vite with React and Tailwind plugins, Tailwind CSS, Vitest, React Testing Library, jsdom, ESLint with React Hooks rules, and `@playwright/test`.

Styling combines the Tailwind import with substantial authored CSS; this is not an exclusively utility-class implementation. `npm run build` emits static `dist/` assets. Vercel is not a dependency, selected host, or configured deployment; hosting remains a future decision.

## Timeline, cache and cancellation

The controller generates one immutable state at a time and caches it in private `frames`. Backward navigation restores the exact retained frame; forward seeking generates only as needed. Public state exposes the selected snapshot/index and generated count, not the frame array or iterator.

The default 20,000-frame cap has no eviction. Overflow or a generator exception stops generation and records an error. Cached previous/next/restart/seek remain available; a request beyond retained frames stops at the last available frame. Timed playback requires reloading after an error.

`complete` means iterator exhaustion. A yielded algorithm snapshot with `status: "complete"` also sets `finalGenerated` and stops timed playback immediately; cached replay stops at its last known frame too. Rewinding does not clear the global knowledge that the timeline has finished generating.

`end()` synchronously traverses to the end and is retained for compatibility. The UI uses `endAsync()`: default 64 advances per chunk, configurable count clamped to 1–128, roughly 8 ms work budget, and a timeout yield between chunks. Timed playback and end-generation are mutually exclusive. The budget cannot preempt one `iterator.next()` call.

`pause`, manual navigation, restart, clear, replacement load and disposal cancel pending chunk work. `load`/`clear` close the old iterator. Algorithm or committed-input changes reload through `Playground`; drafts pause playback, navigation away pauses the retained workspace, and `usePlayback` cleanup calls `clear()` on unmount. See [API](API.md) for the actual method names.

## Presentation and preferences

All execution panels derive from the same snapshot. Pseudocode and applicable metrics come from the selected definition. Available width determines SVG sizing; dense arrays scroll within the canvas. Geometry snaps to actual values; short color transitions run only during timed forward playback. Reduced-motion CSS and the live media-query hook disable transitions as appropriate.

Only `itera-theme` is stored in localStorage. Reduced motion follows the browser/OS query; arrays, targets, caches and execution state remain in memory and reset on reload.

## Verification and future architecture

Vitest discovers `tests/**/*.test.{js,jsx}`; React tests opt into jsdom. Playwright independently discovers `e2e/`, uses installed headless Chrome, and defines desktop/mobile viewport projects. Historical and newly run checks are separated in [verification.md](verification.md).

**Planned Phase 5:** race orchestration may compose two isolated controllers with identical cloned input and shared controls. No RaceSession module, race controller, comparison engine, or active race UI exists. Choose and document coordination semantics before implementation; see [Tasks](TASKS.md). Preserve immutable snapshots, supported metrics, cancellation, and deterministic retained navigation.
