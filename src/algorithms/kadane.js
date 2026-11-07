import { createExecution, definePseudocode, indices } from "./execution.js";

export const kadanePseudocode = definePseudocode([
  [
    "initial",
    "Initialize empty current and best ranges; empty input returns sum 0",
  ],
  ["start", "At i = 0: currentSum = a[i]; currentStart = 0"],
  [
    "restart",
    "If a[i] > currentSum + a[i]: currentSum = a[i]; currentStart = i",
  ],
  [
    "extend",
    "Otherwise extend the current range; keep its earlier start on equality",
  ],
  ["best", "If no best yet or currentSum > bestSum: record sum and boundaries"],
  [
    "complete",
    "Return best range and sum; ties keep earliest start, then earliest end",
  ],
]);

/** Nonempty optimum for nonempty input; equal sums prefer earliest start/end. */
export function* kadane(input) {
  const { array, metrics, snapshot } = createExecution(
    input,
    kadanePseudocode,
    { elementsProcessed: 0, bestUpdates: 0 },
  );
  let currentSum = null,
    bestSum = null,
    currentStart = null,
    bestStart = null,
    bestEnd = null;
  let current = -1;
  const runningSums = [];
  const state = () => ({
    pointers: current === -1 ? {} : { current },
    variables: {
      currentElement: current === -1 ? null : array[current],
      currentSum,
      bestSum,
      currentStart,
      bestStart,
      bestEnd,
    },
    metadata: {
      runningSums,
      currentRange: currentStart === null ? null : [currentStart, current],
      bestRange: bestStart === null ? null : [bestStart, bestEnd],
    },
    highlights: {
      active: current === -1 ? [] : [current],
      current: currentStart === null ? [] : indices(currentStart, current + 1),
      best: bestStart === null ? [] : indices(bestStart, bestEnd + 1),
    },
  });
  yield snapshot(
    "initial",
    "Prepare Kadane's Algorithm. For nonempty input, the best subarray must contain at least one value.",
    state(),
  );
  for (current = 0; current < array.length; current++) {
    const value = array[current];
    let operation, explanation;
    if (current === 0) {
      currentSum = value;
      currentStart = 0;
      operation = "start";
      explanation = `Start the first subarray with ${value} at index 0.`;
    } else if (value > currentSum + value) {
      currentSum = value;
      currentStart = current;
      operation = "restart";
      explanation = `Starting at index ${current} with ${value} produces a larger running sum than extending the negative previous sum.`;
    } else {
      currentSum += value;
      operation = "extend";
      explanation = `Extend the subarray starting at index ${currentStart} with ${value}. Its running sum is ${currentSum}; equality keeps the earlier start.`;
    }
    metrics.elementsProcessed++;
    runningSums.push(currentSum);
    yield snapshot(operation, explanation, state());
    if (bestSum === null || currentSum > bestSum) {
      bestSum = currentSum;
      bestStart = currentStart;
      bestEnd = current;
      metrics.bestUpdates++;
      yield snapshot(
        "best",
        `Record a new best sum of ${bestSum} from index ${bestStart} through ${bestEnd}.`,
        state(),
      );
    }
  }
  // The loop cursor is one past the input; restore the last real element for display.
  current = array.length - 1;
  const result = array.length
    ? {
        sum: bestSum,
        start: bestStart,
        end: bestEnd,
        subarray: array.slice(bestStart, bestEnd + 1),
      }
    : { sum: 0, start: null, end: null, subarray: [] };
  yield snapshot(
    "complete",
    array.length
      ? `The maximum subarray is indices ${bestStart}–${bestEnd}, with sum ${bestSum}. Equal sums retain the earliest start, then earliest end.`
      : "The input is empty. Return an empty subarray with sum 0 and no boundaries.",
    {
      ...state(),
      result,
    },
  );
}
