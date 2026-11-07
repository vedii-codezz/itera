import { createExecution, definePseudocode, indices } from "./execution.js";

export const insertionSortPseudocode = definePseudocode([
  ["initial", "Copy input; the first value is a sorted prefix"],
  ["select", "For i from 1 to n - 1: hold key = a[i]; hole = i; j = i - 1"],
  ["compare", "While j >= 0: compare a[j] > key; stop if false"],
  ["shift", "Move a[j] into the hole; move the hole left; decrement j"],
  ["insert", "Write key into the hole; the prefix through i is sorted"],
  ["complete", "Return the sorted array"],
]);

export function* insertionSort(input) {
  const { array, metrics, snapshot } = createExecution(
    input,
    insertionSortPseudocode,
  );
  yield snapshot(
    "initial",
    "Prepare Insertion Sort. Begin with a sorted prefix of at most one value.",
    {
      highlights: { prefix: indices(0, Math.min(1, array.length)) },
    },
  );
  for (let i = 1; i < array.length; i++) {
    const key = array[i];
    let j = i - 1;
    yield snapshot(
      "select",
      `Hold ${key} as the current key. Find its place in the sorted prefix.`,
      {
        pointers: { i, j },
        variables: { key },
        metadata: { hole: i, prefixRange: [0, i - 1] },
        highlights: { active: [i], prefix: indices(0, i) },
      },
    );
    while (j >= 0) {
      metrics.comparisons++;
      const shouldShift = array[j] > key;
      yield snapshot(
        "compare",
        `Compare ${array[j]} with key ${key}. ${shouldShift ? "Shift the larger value right." : "The key belongs immediately to the right."}`,
        {
          pointers: { i, j },
          variables: { key },
          metadata: { hole: j + 1, prefixRange: [0, j] },
          highlights: {
            comparing: [j],
            active: [j + 1],
            prefix: indices(0, j + 1),
          },
        },
      );
      if (!shouldShift) break;
      array[j + 1] = array[j];
      metrics.writes++;
      const from = j,
        to = j + 1;
      j--;
      yield snapshot(
        "shift",
        `Shift ${array[to]} from index ${from} to ${to}. The held key ${key} remains outside the array; index ${from} is now the hole.`,
        {
          pointers: { i, j },
          variables: { key },
          metadata: {
            hole: from,
            from,
            to,
            prefixRange: j >= 0 ? [0, j] : null,
          },
          highlights: { active: [to], hole: [from], prefix: indices(0, j + 1) },
        },
      );
    }
    array[j + 1] = key;
    metrics.writes++;
    yield snapshot(
      "insert",
      `Insert key ${key} at index ${j + 1}. The prefix through index ${i} is now sorted.`,
      {
        pointers: { i, j, insertion: j + 1 },
        variables: { key },
        metadata: { hole: null, prefixRange: [0, i] },
        highlights: { active: [j + 1], prefix: indices(0, i + 1) },
      },
    );
  }
  yield snapshot(
    "complete",
    "Insertion Sort complete. All held keys have been inserted into ascending order.",
    {
      result: array,
      metadata: { hole: null },
      highlights: { sorted: indices(0, array.length) },
    },
  );
}
