# Itera Data Model

**See the logic. Follow the flow.**

[Documentation index](../README.md#documentation) · [Architecture](ARCHITECTURE.md) · [Internal API](API.md)

## In-memory state only

These are actual JavaScript objects, arrays, closures and React state, audited on 2026-11-08. There is no database schema, SQL table, cloud account, or stored execution history. Phases 1–5 are implemented; Race Mode is an in-memory coordinated session.

```text
algorithmRegistry -> AlgorithmDefinition.generate -> generator iterator
controller closure -> private ordered frames of Snapshot
controller.getState() -> current PlaybackState -> React views
Playground + InputStudio -> committed input and editable draft fields
localStorage["itera-theme"] -> theme only
```

## Algorithm definitions

[definitions.js](../src/algorithms/definitions.js) supplies six deeply frozen definitions. The function field is **`generate`**, not `generator`.

| Field                    | Actual shape / meaning                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `name`, `category` | Strings; IDs: `bubble-sort`, `insertion-sort`, `merge-sort`, `quick-sort`, `binary-search`, `kadane`                                                        |
| `generate`               | Generator function; all accept `input`, Binary Search also reads `options.target`                                                                           |
| `inputRequirements`      | `{type:"integer-array",maxLength:48,min:-999,max:999,sorted:boolean,allowEmpty:true}`; Binary adds `target:{required:true,type:"integer",min:-999,max:999}` |
| `pseudocode`             | Ordered frozen `{id,text}[]`                                                                                                                                |
| `complexity`             | `best`, `average`, `worst`, `auxiliarySpace`, `coreAuxiliarySpace`, `notes`; Binary also has `validation`                                                   |
| `supportedMetrics`       | Names of metrics appropriate for this algorithm                                                                                                             |
| Optional policies        | Sorting `stable`/`inPlaceCore`; Quick `pivotStrategy`; Binary `duplicatePolicy`; Kadane `tiePolicy`/`emptyPolicy`                                           |

Production definitions are deeply frozen before registration. The generic registry shallow-freezes newly registered definition objects; it does not independently deep-freeze arbitrary caller metadata.

## Input and preferences

There is no exported `InputConfig` entity. `Playground` stores committed `values: number[]`, editable `text: string`, selected algorithm `id`, committed numeric `target`, draft `targetText`, and validation messages. `InputStudio` separately stores the preset and string-valued length/min/max form fields. Parsing produces 0–48 whole numbers in `[-999,999]`; blank input maps to `[]`. Binary targets must be one integer in the same domain, and input must be nondecreasing.

Only `localStorage["itera-theme"]` persists: `"light"` or `"dark"`, defaulting to dark unless stored value is exactly light. `useMotionPreference` reads `(prefers-reduced-motion: reduce)` live; there is no stored reducedMotion setting. Committed input survives navigation within the mounted workspace, not a page reload.

## Snapshot contract

[createSnapshot](../src/engine/snapshot.js) deep-clones and recursively freezes its result. It checks that `array` contains finite numbers; algorithm-domain validation is separately enforced by [execution.js](../src/algorithms/execution.js). It does not validate every possible highlight or metadata field.

| Field                      | Production-generator contract                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `array`                    | Copy of current working numeric array                                                                  |
| `highlights`               | Default index arrays `comparing`, `swapping`, `sorted`, `active`; additional algorithm-specific arrays |
| `pointers`                 | Named integer indices; boundary sentinels `-1` and `array.length` are allowed                          |
| `variables`                | Algorithm-specific scalars; may include null initial values                                            |
| `pseudocodeLine`           | One-based index into registry pseudocode; utility default is null for generic snapshots                |
| `explanation`, `operation` | Deterministic descriptive text and semantic operation ID                                               |
| `metrics`                  | Cumulative counters; base utility defaults comparisons/swaps/writes to zero                            |
| `metadata`                 | Algorithm-specific immutable tracing data; added by generator helper                                   |
| `status`                   | `ready`, `running`, or `complete`; added by generator helper                                           |
| `result`                   | Null until a final yielded state; added by generator helper                                            |

The final four generator-specific concerns (`steps` within metrics, metadata, status, result) do not become mandatory on generic legacy snapshots merely by documenting them. Caller-supplied object fields override utility defaults; the algorithm helper supplies complete highlights and counters.

Actual first comparison from Bubble Sort on `[3,1,2]`:

```json
{
  "array": [3, 1, 2],
  "highlights": {
    "comparing": [0, 1],
    "swapping": [],
    "sorted": [],
    "active": []
  },
  "pointers": { "left": 0, "right": 1, "end": 2 },
  "variables": { "changed": false },
  "pseudocodeLine": 2,
  "explanation": "Comparing 3 and 1. The left value is larger, so a swap is needed.",
  "operation": "compare",
  "metrics": { "comparisons": 1, "swaps": 0, "writes": 0, "steps": 2 },
  "metadata": {},
  "status": "running",
  "result": null
}
```

Highlights are real zero-based indices. Metadata ranges are inclusive or null. Insertion `metadata.hole` identifies a logical empty position while `variables.key` is held separately; the working array may temporarily contain duplicates. Merge stores copied `left`, `right`, `buffer`, their cursor offsets, ranges and recursion depth. Quick records range, pivot index, lower range and pending swaps. Binary keeps interval/search status and a separate candidate. Kadane keeps current/best ranges and observed `runningSums`. Full field notes are in the [README](../README.md#snapshot-metadata-and-pseudocode).

## Playback state and private resources

`getState()` initially returns:

```js
{
  index: -1, snapshot: null, playing: false, speed: 1,
  complete: false, generated: 0, error: null,
  generating: false, finalGenerated: false
}
```

Consumers must treat state as read-only; the outer object is not deep-frozen by the controller, while cached snapshots are. Updates replace the outer state object for subscribers. `index` is zero-based, `generated` is the retained frame count, and `error` is null or message text. `complete` means the iterator is exhausted; `finalGenerated` records a known complete algorithm frame; `generating` marks active chunked end-navigation. Rewind/restart preserve known generated data and completion knowledge.

The closure privately owns `iterator`, `frames`, playback `timer`, `chunkTimer`, pending promise resolver and disposal flag. There are no public `algorithmId`, `input`, `cache`, `currentStep`, or `raceStatus` state fields. Cache capacity defaults to 20,000 with no eviction; errors block further generation but do not invalidate retained frames. Reload/clear resets execution state while preserving speed.

## Metrics and results

| Algorithm      | Supported metrics                                |
| -------------- | ------------------------------------------------ |
| Bubble / Quick | `comparisons`, `swaps`, `writes`, `steps`        |
| Insertion      | `comparisons`, `writes`, `steps`                 |
| Merge          | `comparisons`, `writes`, `bufferWrites`, `steps` |
| Binary         | `comparisons`, `iterations`, `steps`             |
| Kadane         | `elementsProcessed`, `bestUpdates`, `steps`      |

Unsupported legacy base counters may exist as zeros but must not be displayed as applicable work. Comparisons exclude bounds/validation; Binary counts one conceptual three-way key comparison per iteration. A distinct-index swap writes twice; self-swaps are skipped. Main-array writes include shifts, key insertion and merge writes; merge output-buffer appends count separately. Steps count every yielded frame including administrative and final states. Kadane counts visited elements and strict best-sum improvements, including its first best. See the [counting conventions](../README.md#operation-counting-conventions) for exclusions.

- Sorting result: ascending `number[]`; empty input returns `[]`.
- Binary result: `{found:boolean,index:number,target:number}`; leftmost match or index `-1`. Empty input with a valid target is not found; unsorted input errors before yielding.
- Kadane result: `{sum,start,end,subarray}`; nonempty input yields a nonempty best subarray. Ties prefer earliest start then earliest end. Empty input returns `{sum:0,start:null,end:null,subarray:[]}`.
- Quick policy: last-element Lomuto partition, `<=` lower side, no self-swaps.

## Race session state — implemented Phase 5

This is state returned by `createRaceController().getState()`, not a persisted class or database entity:

```js
{
  (sessionId,
    input,
    left,
    right,
    tick,
    generatedTicks,
    pair,
    playing,
    generating,
    speed,
    mode,
    complete,
    knownComplete,
    error,
    status);
}
```

The outer view, shared input, lane views and pairs are frozen; snapshots remain deep-frozen by the existing engine. `mode` is `steps` or `operations`. `status` is idle, Ready, Running, Paused, Generating, Completed or Error. `tick` is a zero-based index into retained coordinated history (−1 when empty). `generatedTicks` counts pairs including initial tick 0. `pair` is null or `{left:index,right:index}`; no full snapshot arrays are duplicated in this history.

Each lane view contains `algorithm` (registry definition), `snapshot`, `index`, `generated`, `knownComplete`, `complete`, `error`, and `status`. Lane completion refers to the displayed terminal position, not just its controller's globally exhausted iterator. A finished lane's index remains fixed during later ticks. Lane statuses are Ready, Running, Paused, Generating, Completed or Error.

Race `complete` is true only when the current pair has both terminal lanes, no race error and verified final arrays/results matching the sorted original input. Rewind makes it false; `knownComplete` retains the knowledge that the full timeline has already been generated. A race-level error is null or diagnostic text; it persists through cached navigation and is cleared by loading/restarting the failed configuration. Lane errors remain isolated. Final success cannot be inferred merely because both current arrays happen to match.

The coordinator privately owns two controllers, selected configuration, expected output, ordered frozen index pairs, cursor, cancellation epoch, one timer and pending finish resolver. Input/algorithm replacement disposes old lanes, increments sessionId and resets paired history/metrics. Healthy restart seeks tick 0 without discarding caches; speed/mode changes do not reset snapshots. Defaults cap both lane frames and paired entries at 20,000 with no eviction.

Comparison models contain `partial`, metric `rows` and deterministic `observations`. Row entries have `id`, `label`, `left`, `right`; unsupported/unavailable values are null, never misleading zeroes. Categories unsupported by both lanes are omitted. Partial/final labels depend on current race completion. No total recorded-operation aggregate or runtime field is invented.
