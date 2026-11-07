import { createSnapshot } from "../engine/snapshot.js";
import { MAX_LENGTH } from "../utils/input.js";

export function validateInput(input) {
  if (
    !Array.isArray(input) ||
    input.length > MAX_LENGTH ||
    Array.from(input).some(
      (value) => !Number.isInteger(value) || Math.abs(value) > 999,
    )
  ) {
    throw new Error(
      "Input must be an array of at most 48 integers between -999 and 999.",
    );
  }
}

export function indices(start, end) {
  return Array.from({ length: Math.max(0, end - start) }, (_, i) => start + i);
}

export function definePseudocode(entries) {
  return Object.freeze(
    entries.map(([id, text]) => Object.freeze({ id, text })),
  );
}

/** Shared bookkeeping only: algorithm decisions stay in their generators. */
export function createExecution(input, pseudocode, extraMetrics = {}) {
  validateInput(input);
  const array = [...input];
  const metrics = {
    comparisons: 0,
    swaps: 0,
    writes: 0,
    ...extraMetrics,
    steps: 0,
  };
  function snapshot(operation, explanation, extra = {}) {
    const line = pseudocode.findIndex((entry) => entry.id === operation);
    if (line < 0)
      throw new Error(`Missing pseudocode mapping for ${operation}.`);
    metrics.steps++;
    return createSnapshot({
      array,
      metrics,
      status:
        operation === "complete"
          ? "complete"
          : operation === "initial"
            ? "ready"
            : "running",
      result: null,
      metadata: {},
      ...extra,
      highlights: {
        comparing: [],
        swapping: [],
        sorted: [],
        active: [],
        ...extra.highlights,
      },
      operation,
      explanation,
      pseudocodeLine: line + 1,
    });
  }
  return { array, metrics, snapshot };
}
