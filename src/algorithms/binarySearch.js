import { createExecution, definePseudocode, indices } from "./execution.js";

export const binarySearchPseudocode = definePseudocode([
  [
    "initial",
    "Validate sorted input and target; lo = 0; hi = n - 1; candidate = -1",
  ],
  [
    "compare",
    "While lo <= hi: mid = floor((lo + hi) / 2); compare a[mid] with target",
  ],
  ["discard-left", "If a[mid] < target: set lo = mid + 1"],
  ["discard-right", "If a[mid] > target: set hi = mid - 1"],
  ["match", "If equal: candidate = mid; hi = mid - 1; keep looking left"],
  ["complete", "Return the leftmost candidate, or not found if candidate = -1"],
]);

/** Iterative leftmost binary search. Validation failures use controller.error. */
export function* binarySearch(input, options = {}) {
  const { array, metrics, snapshot } = createExecution(
    input,
    binarySearchPseudocode,
    { iterations: 0 },
  );
  const target = options?.target;
  if (!Number.isInteger(target) || Math.abs(target) > 999) {
    throw new Error(
      "Binary Search target must be an integer between -999 and 999.",
    );
  }
  if (array.some((value, i) => i > 0 && array[i - 1] > value)) {
    throw new Error(
      "Binary Search requires input sorted in ascending order. Sort the input explicitly before searching; it has not been changed.",
    );
  }
  let lo = 0,
    hi = array.length - 1,
    mid = -1,
    candidate = -1;
  let comparisonResult = null;
  const state = (
    searchStatus = candidate === -1 ? "searching" : "candidate",
  ) => {
    const active = lo <= hi ? indices(lo, hi + 1) : [];
    const eliminated = indices(0, array.length).filter(
      (i) => (i < lo || i > hi) && i !== candidate,
    );
    return {
      pointers: { lo, mid, hi },
      variables: { target, candidate, comparisonResult },
      metadata: { interval: lo <= hi ? [lo, hi] : null, searchStatus },
      highlights: {
        active,
        eliminated,
        found: candidate === -1 ? [] : [candidate],
      },
    };
  };
  yield snapshot(
    "initial",
    `Search the sorted input for the leftmost occurrence of ${target}.`,
    state(),
  );
  while (lo <= hi) {
    mid = Math.floor((lo + hi) / 2);
    comparisonResult =
      array[mid] === target
        ? "equal"
        : array[mid] < target
          ? "less"
          : "greater";
    metrics.iterations++;
    metrics.comparisons++;
    const current = state();
    yield snapshot(
      "compare",
      `Compare middle value ${array[mid]} at index ${mid} with target ${target}: it is ${comparisonResult}.`,
      {
        ...current,
        highlights: { ...current.highlights, comparing: [mid] },
      },
    );
    if (comparisonResult === "less") {
      lo = mid + 1;
      yield snapshot(
        "discard-left",
        `${array[mid]} is less than ${target}. Every value through index ${mid} is also too small, so discard that half.`,
        state(),
      );
    } else if (comparisonResult === "greater") {
      hi = mid - 1;
      yield snapshot(
        "discard-right",
        `${array[mid]} is greater than ${target}. Every value from index ${mid} rightward is also too large, so discard that half.`,
        state(),
      );
    } else {
      candidate = mid;
      hi = mid - 1;
      yield snapshot(
        "match",
        `Found ${target} at index ${mid}. Keep this candidate and search the left half for an earlier duplicate.`,
        state(),
      );
    }
  }
  yield snapshot(
    "complete",
    candidate === -1
      ? `The interval is empty. Target ${target} is not present in the input.`
      : `Search complete. The leftmost occurrence of ${target} is at index ${candidate}.`,
    {
      ...state(candidate === -1 ? "not-found" : "found"),
      result: { found: candidate !== -1, index: candidate, target },
    },
  );
}
