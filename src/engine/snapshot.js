/** Clone before freezing: no generator-owned reference can escape into playback. */
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export function createSnapshot(state) {
  if (
    !Array.isArray(state.array) ||
    state.array.some((v) => !Number.isFinite(v))
  )
    throw new Error("Snapshot array must contain finite numbers.");
  return freeze(
    structuredClone({
      highlights: { comparing: [], swapping: [], sorted: [], active: [] },
      pointers: {},
      variables: {},
      pseudocodeLine: null,
      explanation: "Ready to begin.",
      operation: "ready",
      metrics: { comparisons: 0, swaps: 0, writes: 0 },
      ...state,
    }),
  );
}
