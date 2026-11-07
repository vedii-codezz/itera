export const stateLabels = {
  default: "Unprocessed",
  compare: "Comparing",
  swap: "Swapping",
  sorted: "Final position",
  active: "Active",
  selected: "Selected region",
  hole: "Hole · key held separately",
  pivot: "Pivot",
  prefix: "Sorted prefix",
  merged: "Merged range",
  current: "Current subarray",
  best: "Best subarray",
  found: "Match candidate",
  eliminated: "Eliminated",
};
export function elementState(snapshot, index) {
  if (snapshot.metadata?.hole === index) return "hole";
  const h = snapshot.highlights;
  const map = [
    ["hole", "hole"],
    ["swapping", "swap"],
    ["comparing", "compare"],
    ["found", "found"],
    ["pivot", "pivot"],
    ["sorted", "sorted"],
    ["active", "active"],
    ["best", "best"],
    ["current", "current"],
    ["prefix", "prefix"],
    ["merged", "merged"],
    ["left", "selected"],
    ["right", "selected"],
    ["eliminated", "eliminated"],
  ];
  return map.find(([key]) => h[key]?.includes(index))?.[1] || "default";
}
export function formatNumber(value) {
  return value === null || value === undefined
    ? "—"
    : String(value).replace(/^-/, "−");
}
export function formatRange(range) {
  return range ? `${range[0]}…${range[1]}` : "∅";
}
export function plotScale(values, top = 35, bottom = 235) {
  let low = Math.min(0, ...values),
    high = Math.max(0, ...values);
  if (low === high) {
    low = -1;
    high = 1;
  }
  const y = (value) => top + ((high - value) / (high - low)) * (bottom - top);
  return { y, zero: y(0), low, high };
}
