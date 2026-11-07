# Itera Internal API

**See the logic. Follow the flow.**

[Documentation index](../README.md#documentation) · [Architecture](ARCHITECTURE.md) · [Data model](DATA_MODEL.md)

## No HTTP API

Phases 1–5 execute locally in the browser. There are no REST endpoints, backend services, authentication, external AI APIs, or database APIs. Vite's development server and test automation are tooling, not application HTTP contracts. No network API is proposed for Phase 5.

The contracts below were checked against source on 2026-11-08. They are internal JavaScript interfaces, not versioned network services.

## Registry

Module: [algorithmRegistry.js](../src/engine/algorithmRegistry.js).

| Export / method        | Input                                      | Return / behavior                                                                              |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `createRegistry()`     | None                                       | Independent empty registry                                                                     |
| `algorithmRegistry`    | Singleton export                           | Registry populated with all six production definitions                                         |
| `register(definition)` | Truthy `id` and function-valued `generate` | Undefined; stores a shallow-frozen definition copy; missing requirements or duplicate ID throw |
| `get(id)`              | Registered ID                              | Definition reference; unknown IDs throw                                                        |
| `list()`               | None                                       | New array of registered definition references, in registration order                           |

Production definitions and their nested metadata are already deeply frozen by [definitions.js](../src/algorithms/definitions.js). Definition fields and IDs are listed in [Data model](DATA_MODEL.md#algorithm-definitions). The generic registry does not independently prove that an arbitrary registered function is a generator.

## Generators and snapshots

| Export / module                                                   | Signature                         | Contract                                                                                                    |
| ----------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `bubbleSort`, `insertionSort`, `mergeSort`, `quickSort`, `kadane` | `function* (input)`               | Each named export lives in its same-named file under [src/algorithms/](../src/algorithms/)                  |
| `binarySearch`                                                    | `function* (input, options = {})` | Requires `options.target`; rejects unsorted input without modifying it                                      |
| `createSnapshot` in [snapshot.js](../src/engine/snapshot.js)      | `createSnapshot(state)`           | Returns a deep-cloned, recursively frozen snapshot; throws if array is missing or contains nonfinite values |

Generators validate/copy input when first advanced, yield initial and meaningful intermediate snapshots, then yield a final complete snapshot carrying `result`. They terminate on a subsequent advance; integrations should read final output from the snapshot, not rely on the iterator return value. All six accept the established 0–48 integer domain `[-999,999]`. Validation throws for direct consumers; controller loading catches execution errors into `state.error`.

Each module also exports its `*Pseudocode` definition, with names such as `bubbleSortPseudocode` and `kadanePseudocode`. Prefer the registry's `pseudocode` when integrating views. Snapshot lines are one-based; state/results/metric conventions are in [Data model](DATA_MODEL.md#snapshot-contract).

## Playback controller

Module: [playbackController.js](../src/engine/playbackController.js).

`createPlaybackController({interval = 600, maxSnapshots = 20000} = {})` creates a controller. `interval` is playback milliseconds at 1×, not algorithm runtime; `maxSnapshots` is the cache ceiling. Use valid positive configuration values; the constructor does not validate these options.

| Method                                      | Input / return                                        | Behavior                                                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `getState()`                                | None → current state object                           | Read-only by consumer convention; see [state fields](DATA_MODEL.md#playback-state-and-private-resources)                                      |
| `subscribe(listener)`                       | Zero-argument callback → unsubscribe function         | Fires on state updates; listener reads state using `getState()`                                                                               |
| `load(generator, input = [], options = {})` | Generator factory, numeric array, options → undefined | Cancels/closes old execution, clears frames/errors, copies input/options, advances to the first frame; validation errors become `state.error` |
| `play()`                                    | None → undefined                                      | Starts or resumes one timer; ignores unavailable, errored, generating, final, or disposed execution                                           |
| `pause()`                                   | None → undefined                                      | Stops timing and cancels chunked end-navigation; keeps iterator/cache/current frame                                                           |
| `next()`                                    | None → undefined                                      | Pauses, then advances one retained or newly generated frame                                                                                   |
| `previous()`                                | None → undefined                                      | Pauses, then restores the previous cached frame, if any                                                                                       |
| `restart()`                                 | None → undefined                                      | Pauses and returns to cached index 0; preserves input/timeline/known completion                                                               |
| `seek(index)`                               | Nonnegative integer, zero-based → undefined           | Pauses; traverses cached or lazily generated frames to the requested index if available. Invalid indices are ignored after pausing            |
| `end()`                                     | None → undefined                                      | Synchronous traversal to the last available frame; UI does not call this                                                                      |
| `endAsync({batchSize = 64} = {})`           | Options → `Promise<boolean>`                          | Cancellable chunked traversal; true on exhausted completion, false on cancellation/error/unavailable execution                                |
| `setSpeed(speed)`                           | Finite number 0.25–4 → undefined                      | Updates an active playback timer without reset; invalid values throw                                                                          |
| `clear()`                                   | None → undefined                                      | Cancels/closes execution; clears frames, current snapshot, errors and completion flags; preserves speed/subscriptions                         |
| `dispose()`                                 | None → undefined                                      | Cancels/closes resources and removes listeners; do not reuse the controller                                                                   |

There are no `stepForward()`, `stepBackward()`, `cancel()`, or `resume()` methods. Use `next()`, `previous()`, `pause()` (or `clear()` when discarding execution), and `play()` respectively. Jump-to-beginning maps to `restart()`.

`endAsync` clamps integer batch size to 1–128 (nonintegers use 64), checks an approximately 8 ms work budget, and yields via timeout between chunks. It cannot interrupt a synchronous generator call. Manual navigation, pause, clear, replacement load, disposal or a replacement end request cancels the old job with false.

The no-eviction cache retains exact snapshots. Attempting to retain more than the configured cap records an error; exactly fitting a completed trace is allowed. After errors, cached navigation remains possible but timed playback/new generation is blocked. Forward seeking beyond a finished/error-limited trace stops at the last available frame. The UI scrubber only selects already generated indices.

## Input utilities and React adapters

Module: [input.js](../src/utils/input.js).

- `parseArray(text)` returns a numeric array; blank text gives `[]`; malformed entries, fractions, excess length and out-of-range values throw.
- `generateArray({length = 12,min = 5,max = 95,preset = "Random",random = Math.random} = {})` returns a new array. Length is 0–48, integer bounds stay within `[-999,999]` with min ≤ max; incompatible preset bounds throw. Supplied `random` functions must follow the Math.random convention `[0,1)`.
- `MAX_LENGTH` is 48. `PRESETS` lists Random, Already sorted, Reverse sorted, Nearly sorted, Duplicate-heavy, All equal, All negative, Mixed positive and negative.

[usePlayback](../src/hooks/usePlayback.js) returns `{state,controller}` via `useSyncExternalStore` and calls `clear()` on cleanup. [useTheme](../src/hooks/useTheme.js) returns `[theme,toggleTheme]`; [useMotionPreference](../src/hooks/useMotionPreference.js) returns the live reduced-motion boolean. These are React hooks, not standalone controller methods.

## Example

```js
import { algorithmRegistry } from "../src/engine/algorithmRegistry.js";
import { createPlaybackController } from "../src/engine/playbackController.js";

const controller = createPlaybackController();
const definition = algorithmRegistry.get("binary-search");
controller.load(definition.generate, [1, 2, 2, 4], { target: 2 });
await controller.endAsync();
console.log(controller.getState().snapshot.result);
// { found: true, index: 1, target: 2 }
controller.previous();
controller.dispose();
```

Import paths above are relative to a hypothetical module in `docs/`; use the appropriate relative paths in real source. Race-specific APIs are documented below. Phase 6 is not included.

## Race coordinator (Phase 5)

Module: [raceController.js](../src/race/raceController.js). `RACE_ALGORITHM_IDS` lists the four sorting IDs; `RACE_MODES` is `["steps","operations"]`.

`createRaceController({interval=600,maxSnapshots=20000,maxTicks=20000,registry=algorithmRegistry}={})` validates a positive finite interval and integer limits from 1–20,000. The optional registry defaults to the existing singleton. Each lane is an existing playback controller; only the coordinator schedules.

| Method                                                          | Behavior                                                                                                                                                                                                    |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getState()`                                                    | Frozen coherent race view; see [race model](DATA_MODEL.md#race-session-state--implemented-phase-5)                                                                                                          |
| `subscribe(listener)`                                           | Zero-argument subscriber; returns unsubscribe                                                                                                                                                               |
| `load({input=[],leftId="bubble-sort",rightId="quick-sort"}={})` | Cancels/disposes old lanes, validates sorting eligibility/input, clones input independently, loads initial pair and resets history. Errors become race state, not a successful result. Same IDs are allowed |
| `play()` / `pause()`                                            | Shared start/resume or cancellation of timer/chunk work while retaining history                                                                                                                             |
| `next()` / `previous()`                                         | Advance unfinished lanes once or restore the exact previous retained pair; manual actions pause                                                                                                             |
| `seek(tick)`                                                    | Pause and select an integer within retained pair history; outside-history/invalid requests leave the pair unchanged                                                                                         |
| `restart()`                                                     | Restore initial pair; after an error, reload selected configuration to allow recovery                                                                                                                       |
| `setSpeed(value)`                                               | Finite 0.25–4; invalid values throw; reschedules subsequent timed ticks without reset                                                                                                                       |
| `setMode(value)`                                                | `steps` or `operations`; invalid mode throws; changes emphasis without resetting history or clock                                                                                                           |
| `endAsync()`                                                    | Promise resolving true when both valid outputs complete, false on error/cancellation/unavailable execution. Walks paired ticks in cancellable chunks, not independent lane end jobs                         |
| `clear()` / `dispose()`                                         | Cancel work and release lane/history resources; clear permits reuse, disposal does not                                                                                                                      |

Other than getState, subscribe and endAsync, these methods return undefined. A cancellation epoch rejects stale callbacks; load increments sessionId. Paused/errored cached previous/next/seek remain exact; new generation and timed playback stay blocked on error until reload. Finish is bounded to 64 paired advances or approximately 8 ms per chunk and yields between chunks. Existing snapshot caps apply, plus the race-pair cap; no eviction or unbounded timeline duplication is introduced.

[useRace](../src/hooks/useRace.js) returns `{state,controller}` with an external-store subscription and clear-on-unmount. [buildRaceComparison](../src/race/raceComparison.js) returns `{partial,rows,observations}` from a current race view; unsupported categories are null/omitted rather than zero. It does not aggregate swaps/writes or benchmark runtime.
