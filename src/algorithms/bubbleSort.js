import { createExecution, definePseudocode, indices } from "./execution.js";

export const bubbleSortPseudocode = definePseudocode([
  ["initial", "Copy input; initialize comparison, swap, and write counters"],
  ["compare", "For each adjacent pair before end: compare a[j] > a[j + 1]"],
  ["swap", "If out of order: swap a[j], a[j + 1]; mark pass changed"],
  ["pass", "Mark end as sorted; reduce end for the next pass"],
  ["early-exit", "If the pass made no swaps: the entire array is sorted; stop"],
  ["complete", "Return the sorted array"],
]);

export function* bubbleSort(input) {
  const { array, metrics, snapshot } = createExecution(
    input,
    bubbleSortPseudocode,
  );
  const n = array.length;
  yield snapshot("initial", `Prepare Bubble Sort for ${n} values.`);
  for (let end = n - 1; end > 0; end--) {
    let changed = false;
    for (let j = 0; j < end; j++) {
      metrics.comparisons++;
      const shouldSwap = array[j] > array[j + 1];
      yield snapshot(
        "compare",
        `Comparing ${array[j]} and ${array[j + 1]}. ${shouldSwap ? "The left value is larger, so a swap is needed." : "No swap is needed."}`,
        {
          pointers: { left: j, right: j + 1, end },
          variables: { changed },
          highlights: { comparing: [j, j + 1], sorted: indices(end + 1, n) },
        },
      );
      if (shouldSwap) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        metrics.swaps++;
        metrics.writes += 2;
        changed = true;
        yield snapshot(
          "swap",
          `Swap the adjacent values: ${array[j]} now comes before ${array[j + 1]}.`,
          {
            pointers: { left: j, right: j + 1, end },
            variables: { changed },
            highlights: { swapping: [j, j + 1], sorted: indices(end + 1, n) },
          },
        );
      }
    }
    yield snapshot(
      "pass",
      `Pass complete. ${array[end]} at index ${end} is in its final position.`,
      {
        pointers: { end },
        variables: { changed },
        highlights: { sorted: indices(end, n) },
      },
    );
    if (!changed) {
      yield snapshot(
        "early-exit",
        "This pass made no swaps. Every remaining value is already in order, so stop early.",
        {
          highlights: { sorted: indices(0, n) },
        },
      );
      break;
    }
  }
  yield snapshot(
    "complete",
    `Bubble Sort complete. All ${n} values are in ascending order.`,
    {
      result: array,
      highlights: { sorted: indices(0, n) },
    },
  );
}
