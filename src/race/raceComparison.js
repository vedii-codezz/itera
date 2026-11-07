const categories = [
  ["comparisons", "Comparisons"],
  ["swaps", "Swaps"],
  ["writes", "Main-array writes"],
  ["bufferWrites", "Merge buffer writes"],
  ["steps", "Execution snapshots"],
];
export function buildRaceComparison(state) {
  const value = (lane, key) =>
    lane?.algorithm.supportedMetrics.includes(key)
      ? (lane.snapshot?.metrics[key] ?? null)
      : null;
  const rows = categories
    .filter(([id]) =>
      [state.left, state.right].some((lane) =>
        lane?.algorithm.supportedMetrics.includes(id),
      ),
    )
    .map(([id, label]) => ({
      id,
      label,
      left: value(state.left, id),
      right: value(state.right, id),
    }));
  const partial = !state.complete,
    observations = [];
  for (const id of ["comparisons", "writes"]) {
    const row = rows.find((item) => item.id === id);
    if (!row || row.left === null || row.right === null) continue;
    const category = id === "writes" ? "main-array writes" : "comparisons",
      prefix = partial ? "So far, " : "";
    if (row.left === row.right)
      observations.push(
        `${prefix}both lanes have recorded ${row.left} ${category}: a tie for this category.`,
      );
    else {
      const lower = row.left < row.right ? state.left : state.right;
      observations.push(
        `${prefix}${lower.algorithm.name} recorded ${Math.abs(row.left - row.right)} fewer ${category} on this input.`,
      );
    }
  }
  const comparisons = rows.find((row) => row.id === "comparisons"),
    writes = rows.find((row) => row.id === "writes");
  if (
    comparisons &&
    writes &&
    comparisons.left !== null &&
    comparisons.right !== null &&
    writes.left !== null &&
    writes.right !== null &&
    (comparisons.left - comparisons.right) * (writes.left - writes.right) < 0
  )
    observations.push(
      "One lane uses fewer comparisons but more main-array writes. These categories describe a trade-off, not a universal ranking.",
    );
  if (state.complete)
    observations.push("Both algorithms produced the same sorted output.");
  return { partial, rows, observations };
}
