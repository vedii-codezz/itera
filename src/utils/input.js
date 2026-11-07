export const MAX_LENGTH = 48;
export function parseArray(text) {
  if (!text.trim()) return [];
  const tokens = text.split(",").map((v) => v.trim());
  if (tokens.length > MAX_LENGTH)
    throw new Error(
      `Use at most ${MAX_LENGTH} values for a readable visualization.`,
    );
  if (tokens.some((v) => !/^[-+]?\d+$/.test(v)))
    throw new Error(
      "Enter whole numbers separated by commas. Remove empty entries.",
    );
  const values = tokens.map(Number);
  if (values.some((v) => !Number.isSafeInteger(v) || Math.abs(v) > 999))
    throw new Error("Each value must be a whole number between -999 and 999.");
  return values;
}
export const PRESETS = [
  "Random",
  "Already sorted",
  "Reverse sorted",
  "Nearly sorted",
  "Duplicate-heavy",
  "All equal",
  "All negative",
  "Mixed positive and negative",
];
export function generateArray({
  length = 12,
  min = 5,
  max = 95,
  preset = "Random",
  random = Math.random,
} = {}) {
  if (!Number.isInteger(length) || length < 0 || length > MAX_LENGTH)
    throw new Error(`Length must be between 0 and ${MAX_LENGTH}.`);
  if (
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min > max ||
    min < -999 ||
    max > 999
  )
    throw new Error(
      "Choose whole-number bounds between -999 and 999, with minimum ≤ maximum.",
    );
  if (!PRESETS.includes(preset)) throw new Error("Choose a supported preset.");
  if (preset === "All negative" && min >= 0)
    throw new Error("All negative requires a negative minimum.");
  if (
    preset === "Mixed positive and negative" &&
    !(min < 0 && max > 0 && length >= 2)
  )
    throw new Error(
      "Mixed values require a negative minimum, positive maximum, and at least 2 elements.",
    );
  const pick = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));
  let values = Array.from({ length }, () => pick(min, max));
  if (preset === "All equal") values.fill(values[0]);
  if (preset === "All negative")
    values = values.map(() => pick(min, Math.min(-1, max)));
  if (preset === "Mixed positive and negative") {
    values[0] = pick(min, -1);
    values[1] = pick(1, max);
  }
  if (preset === "Duplicate-heavy") {
    const palette = Array.from({ length: 3 }, () => pick(min, max));
    values = values.map(() => palette[pick(0, 2)]);
  }
  if (["Already sorted", "Reverse sorted", "Nearly sorted"].includes(preset))
    values.sort((a, b) => a - b);
  if (preset === "Reverse sorted") values.reverse();
  if (preset === "Nearly sorted" && length > 1)
    [values[0], values[1]] = [values[1], values[0]];
  return values;
}
