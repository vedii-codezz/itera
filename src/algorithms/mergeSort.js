import { createExecution, definePseudocode, indices } from "./execution.js";

export const mergeSortPseudocode = definePseudocode([
  ["initial", "Copy input; begin mergeSort(0, n - 1)"],
  ["divide", "If lo < hi: split at mid; recursively sort left and right"],
  ["merge", "Copy the sorted left and right ranges; create an empty buffer"],
  [
    "compare",
    "Compare the next left and right values; prefer left on equality",
  ],
  ["buffer", "Append the chosen value, or a remaining value, to the buffer"],
  ["write", "Write each buffered value back into a[lo + k]"],
  ["merged", "Mark this local range as merged; return to the parent call"],
  ["complete", "Return the sorted array"],
]);

export function* mergeSort(input) {
  const { array, metrics, snapshot } = createExecution(
    input,
    mergeSortPseudocode,
    { bufferWrites: 0 },
  );
  yield snapshot(
    "initial",
    `Prepare Merge Sort for ${array.length} values. Split ranges before merging them.`,
  );
  function* sort(lo, hi, depth) {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    const boundaries = {
      range: [lo, hi],
      leftRange: [lo, mid],
      rightRange: [mid + 1, hi],
      depth,
    };
    yield snapshot(
      "divide",
      `Divide indices ${lo}–${hi} into ${lo}–${mid} and ${mid + 1}–${hi}.`,
      {
        pointers: { lo, mid, hi },
        metadata: boundaries,
        highlights: { active: indices(lo, hi + 1) },
      },
    );
    yield* sort(lo, mid, depth + 1);
    yield* sort(mid + 1, hi, depth + 1);
    const left = array.slice(lo, mid + 1),
      right = array.slice(mid + 1, hi + 1),
      buffer = [];
    let i = 0,
      j = 0;
    const metadata = () => ({
      ...boundaries,
      left,
      right,
      buffer,
      leftCursor: i,
      rightCursor: j,
    });
    yield snapshot(
      "merge",
      `Both child ranges are sorted. Merge ${left.length} left values and ${right.length} right values.`,
      {
        pointers: { lo, mid, hi },
        metadata: metadata(),
        highlights: {
          left: indices(lo, mid + 1),
          right: indices(mid + 1, hi + 1),
        },
      },
    );
    while (i < left.length || j < right.length) {
      let takeLeft;
      if (i < left.length && j < right.length) {
        metrics.comparisons++;
        takeLeft = left[i] <= right[j];
        yield snapshot(
          "compare",
          `Compare left value ${left[i]} and right value ${right[j]}. Take ${takeLeft ? "left" : "right"}${left[i] === right[j] ? " to preserve stability on equality" : " because it is smaller"}.`,
          {
            pointers: { lo, mid, hi, left: lo + i, right: mid + 1 + j },
            metadata: metadata(),
            highlights: { comparing: [lo + i, mid + 1 + j] },
          },
        );
      } else takeLeft = i < left.length;
      const source = takeLeft ? lo + i : mid + 1 + j;
      buffer.push(takeLeft ? left[i++] : right[j++]);
      metrics.bufferWrites++;
      yield snapshot(
        "buffer",
        `Append ${buffer.at(-1)} from the ${takeLeft ? "left" : "right"} range to the temporary merge buffer.`,
        {
          pointers: { lo, mid, hi, source },
          metadata: metadata(),
          highlights: { active: [source] },
        },
      );
    }
    for (let k = 0; k < buffer.length; k++) {
      array[lo + k] = buffer[k];
      metrics.writes++;
      yield snapshot(
        "write",
        `Write buffered value ${buffer[k]} into index ${lo + k}.`,
        {
          pointers: { lo, mid, hi, destination: lo + k },
          metadata: { ...metadata(), bufferCursor: k },
          highlights: { active: [lo + k] },
        },
      );
    }
    yield snapshot(
      "merged",
      `Indices ${lo}–${hi} are now a sorted local range. The parent merge may still move these values.`,
      {
        pointers: { lo, hi },
        metadata: { ...metadata(), mergedRange: [lo, hi] },
        highlights: { merged: indices(lo, hi + 1) },
      },
    );
  }
  yield* sort(0, array.length - 1, 0);
  yield snapshot(
    "complete",
    "Merge Sort complete. All recursive ranges have been merged into ascending order.",
    {
      result: array,
      highlights: { sorted: indices(0, array.length) },
    },
  );
}
