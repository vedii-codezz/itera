import { createExecution, definePseudocode, indices } from "./execution.js";

export const quickSortPseudocode = definePseudocode([
  ["initial", "Copy input; begin quickSort(0, n - 1)"],
  ["settled", "A singleton range is already in its final position"],
  ["pivot", "For lo < hi: choose pivot = a[hi]; set boundary i = lo - 1"],
  ["compare", "For j from lo to hi - 1: compare a[j] <= pivot"],
  ["partition", "If true: increment boundary i"],
  [
    "swap",
    "Swap distinct positions i and j; finally swap i + 1 and hi if distinct",
  ],
  ["partitioned", "Fix pivot at i + 1; recursively sort ranges on either side"],
  ["complete", "Return the sorted array"],
]);

/** Lomuto partitioning, final-element pivot, <= partition; self-swaps are skipped. */
export function* quickSort(input) {
  const { array, metrics, snapshot } = createExecution(
    input,
    quickSortPseudocode,
  );
  const settled = new Set();
  const sorted = () => [...settled].sort((a, b) => a - b);
  yield snapshot(
    "initial",
    "Prepare Quick Sort with Lomuto partitioning and the final element as each pivot.",
  );
  function* sort(lo, hi, depth) {
    if (lo > hi) return;
    if (lo === hi) {
      settled.add(lo);
      yield snapshot(
        "settled",
        `The singleton at index ${lo} is already in its final position.`,
        {
          pointers: { lo, hi },
          metadata: { range: [lo, hi], depth },
          highlights: { sorted: sorted() },
        },
      );
      return;
    }
    const pivot = array[hi];
    let i = lo - 1;
    const state = (j, pivotIndex = hi) => ({
      pointers: { lo, hi, i, j, pivot: pivotIndex },
      variables: { pivot },
      metadata: {
        range: [lo, hi],
        depth,
        pivotIndex,
        lowerRange: i >= lo ? [lo, i] : null,
      },
      highlights: { sorted: sorted(), pivot: [pivotIndex] },
    });
    yield snapshot(
      "pivot",
      `Choose ${pivot} at index ${hi} as pivot for indices ${lo}–${hi}.`,
      state(lo),
    );
    for (let j = lo; j < hi; j++) {
      metrics.comparisons++;
      const belongsLeft = array[j] <= pivot;
      const before = state(j);
      yield snapshot(
        "compare",
        `Compare ${array[j]} with pivot ${pivot}. ${belongsLeft ? "It belongs in the lower-or-equal partition." : "Leave it in the greater partition."}`,
        {
          ...before,
          highlights: { ...before.highlights, comparing: [j, hi] },
        },
      );
      if (belongsLeft) {
        i++;
        const moved = state(j);
        // i has advanced, but a distinct destination is not part of the lower region until swapped.
        if (i !== j)
          moved.metadata = {
            ...moved.metadata,
            lowerRange: i > lo ? [lo, i - 1] : null,
            pendingSwap: [i, j],
          };
        yield snapshot(
          "partition",
          `Move the lower partition boundary to index ${i}.${i === j ? " The value is already there, so no swap is needed." : " Exchange the current value into that position next."}`,
          moved,
        );
        if (i !== j) {
          [array[i], array[j]] = [array[j], array[i]];
          metrics.swaps++;
          metrics.writes += 2;
          const after = state(j);
          yield snapshot(
            "swap",
            `Swap indices ${i} and ${j} to extend the lower-or-equal partition.`,
            {
              ...after,
              highlights: { ...after.highlights, swapping: [i, j] },
            },
          );
        }
      }
    }
    const pivotIndex = i + 1;
    if (pivotIndex !== hi) {
      [array[pivotIndex], array[hi]] = [array[hi], array[pivotIndex]];
      metrics.swaps++;
      metrics.writes += 2;
      const after = state(hi, pivotIndex);
      yield snapshot(
        "swap",
        `Move pivot ${pivot} to index ${pivotIndex} by swapping it with index ${hi}.`,
        {
          ...after,
          highlights: { ...after.highlights, swapping: [pivotIndex, hi] },
        },
      );
    }
    settled.add(pivotIndex);
    yield snapshot(
      "partitioned",
      `Pivot ${pivot} is fixed at index ${pivotIndex}. Continue with the ranges on either side.`,
      state(hi, pivotIndex),
    );
    yield* sort(lo, pivotIndex - 1, depth + 1);
    yield* sort(pivotIndex + 1, hi, depth + 1);
  }
  yield* sort(0, array.length - 1, 0);
  yield snapshot(
    "complete",
    "Quick Sort complete. Every partition and pivot is in ascending order.",
    {
      result: array,
      highlights: { sorted: indices(0, array.length) },
    },
  );
}
