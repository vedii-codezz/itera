import { describe, it, expect } from "vitest";
import {
  bubbleSort,
  bubbleSortPseudocode,
} from "../src/algorithms/bubbleSort.js";
import {
  insertionSort,
  insertionSortPseudocode,
} from "../src/algorithms/insertionSort.js";
import { mergeSort, mergeSortPseudocode } from "../src/algorithms/mergeSort.js";
import { quickSort, quickSortPseudocode } from "../src/algorithms/quickSort.js";
import { collect, checkFrames, seededRandom } from "./algorithmHelpers.js";

const algorithms = [
  ["Bubble Sort", bubbleSort, bubbleSortPseudocode],
  ["Insertion Sort", insertionSort, insertionSortPseudocode],
  ["Merge Sort", mergeSort, mergeSortPseudocode],
  ["Quick Sort", quickSort, quickSortPseudocode],
];
const cases = [
  ["empty", [], []],
  ["single", [7], [7]],
  ["sorted", [1, 2, 3, 4], [1, 2, 3, 4]],
  ["reversed", [4, 3, 2, 1], [1, 2, 3, 4]],
  ["duplicates", [3, 1, 3, 1, 2], [1, 1, 2, 3, 3]],
  ["equal", [5, 5, 5, 5], [5, 5, 5, 5]],
  ["negative", [-2, -9, -1, -4], [-9, -4, -2, -1]],
  ["zero", [0, 0, 0], [0, 0, 0]],
  ["mixed", [0, -4, 7, 0, -2], [-4, -2, 0, 0, 7]],
  ["domain extremes", [999, -999, 0], [-999, 0, 999]],
];

for (const [name, generate, pseudocode] of algorithms) {
  describe(name, () => {
    it.each(cases)(
      "sorts %s without mutating input and emits valid immutable snapshots",
      (_, input, expected) => {
        const original = [...input];
        const frames = collect(generate, Object.freeze([...input]));
        expect(frames.at(-1)?.result).toEqual(expected);
        expect(frames.at(-1)?.array).toEqual(expected);
        expect(frames.at(-1)?.highlights.sorted).toEqual(
          expected.map((_, i) => i),
        );
        expect(input).toEqual(original);
        checkFrames(frames, input, pseudocode);
      },
    );
    it("sorts maximum-length reverse and all-equal arrays within the cache budget", () => {
      for (const input of [
        Array.from({ length: 48 }, (_, i) => 48 - i),
        Array(48).fill(2),
      ]) {
        const frames = collect(generate, input);
        expect(frames.at(-1)?.array).toEqual([...input].sort((a, b) => a - b));
        expect(frames.length).toBeLessThan(20000);
        checkFrames(frames, input, pseudocode);
      }
    });
    it("matches numeric sort across 50 seeded random arrays", () => {
      const random = seededRandom();
      for (let run = 0; run < 50; run++) {
        const input = Array.from(
          { length: Math.floor(random() * 21) },
          () => Math.floor(random() * 31) - 15,
        );
        const expected = [...input].sort((a, b) => a - b);
        const frames = collect(generate, input);
        expect(frames.at(-1)?.result).toEqual(expected);
        expect(frames.at(-1)?.array).toEqual(expected);
      }
    });
    it.each(
      [[NaN], [Infinity], [1.1], [1000], Array(49).fill(0)].map((input) => [
        input,
      ]),
    )("rejects invalid generator input %j", (input) => {
      expect(() => collect(generate, input)).toThrow(/input|integer|48|999/i);
    });
    it("keeps operation metrics synchronized with actual emitted operations", () => {
      const frames = collect(generate, [5, 1, 4, 2, 3]);
      let comparisons = 0,
        swaps = 0,
        writes = 0,
        bufferWrites = 0;
      for (const frame of frames) {
        if (frame.operation === "compare") comparisons++;
        if (frame.operation === "swap") {
          swaps++;
          writes += 2;
        }
        if (["shift", "insert", "write"].includes(frame.operation)) writes++;
        if (frame.operation === "buffer") bufferWrites++;
        expect(frame.metrics.comparisons).toBe(comparisons);
        expect(frame.metrics.swaps).toBe(swaps);
        expect(frame.metrics.writes).toBe(writes);
        if (name === "Merge Sort")
          expect(frame.metrics.bufferWrites).toBe(bufferWrites);
      }
    });
  });
}

it("Bubble Sort exits after one sorted pass and counts reverse swaps", () => {
  const sorted = collect(bubbleSort, [1, 2, 3, 4]);
  expect(sorted.at(-1)?.metrics).toMatchObject({
    comparisons: 3,
    swaps: 0,
    writes: 0,
  });
  expect(sorted.some((s) => s.operation === "early-exit")).toBe(true);
  expect(collect(bubbleSort, [3, 2, 1]).at(-1)?.metrics).toMatchObject({
    comparisons: 3,
    swaps: 3,
    writes: 6,
  });
  for (const frame of collect(bubbleSort, [3, 1, 2])) {
    for (const i of frame.highlights.sorted)
      expect(frame.array[i]).toBe([1, 2, 3][i]);
    if (frame.operation === "compare")
      expect(frame.pointers.right).toBe(frame.pointers.left + 1);
  }
});
it("Insertion Sort holds a key and identifies the hole during shifts", () => {
  const frames = collect(insertionSort, [3, 2, 1]);
  expect(frames.at(-1)?.metrics).toMatchObject({
    comparisons: 3,
    swaps: 0,
    writes: 5,
  });
  const shift = frames.find((s) => s.operation === "shift");
  expect(shift?.variables.key).toBe(2);
  expect(shift?.metadata.hole).toBe(0);
  expect(shift?.array).toEqual([3, 3, 1]);
  expect(collect(insertionSort, [1, 2, 3]).at(-1)?.metrics).toMatchObject({
    comparisons: 2,
    swaps: 0,
    writes: 2,
  });
});
it("Merge Sort exposes immutable partition buffers and completed local ranges", () => {
  const frames = collect(mergeSort, [3, 2, 1]);
  expect(frames.at(-1)?.metrics).toMatchObject({
    comparisons: 2,
    swaps: 0,
    writes: 5,
    bufferWrites: 5,
  });
  expect(frames.find((s) => s.operation === "divide")?.metadata).toMatchObject({
    range: [0, 2],
    leftRange: [0, 1],
    rightRange: [2, 2],
    depth: 0,
  });
  const buffer = frames.find((s) => s.operation === "buffer");
  expect(buffer?.metadata.buffer).toEqual([2]);
  expect(Object.isFrozen(buffer?.metadata.buffer)).toBe(true);
  expect(
    frames.some(
      (s) => s.operation === "merged" && s.metadata.mergedRange.length === 2,
    ),
  ).toBe(true);
});
it("Quick Sort uses the final element pivot, excludes self-swaps and fixes pivot positions", () => {
  const frames = collect(quickSort, [3, 2, 1]);
  expect(frames.find((s) => s.operation === "pivot")?.variables.pivot).toBe(1);
  expect(frames.at(-1)?.metrics).toMatchObject({
    comparisons: 3,
    swaps: 1,
    writes: 2,
  });
  expect(collect(quickSort, [1, 2, 3]).at(-1)?.metrics).toMatchObject({
    comparisons: 3,
    swaps: 0,
    writes: 0,
  });
  for (const frame of frames) {
    for (const i of frame.highlights.sorted)
      expect(frame.array[i]).toBe([1, 2, 3][i]);
    if (frame.operation === "swap")
      expect(new Set(frame.highlights.swapping).size).toBe(2);
    if (frame.operation === "compare")
      expect(frame.array[frame.pointers.pivot]).toBe(frame.variables.pivot);
  }
});

it("Quick Sort partition metadata never labels a pending-swap value as already in the lower partition", () => {
  for (const frame of collect(quickSort, [8, 1, 7, 2, 6, 3])) {
    const range = frame.metadata.lowerRange;
    if (range) {
      for (let i = range[0]; i <= range[1]; i++)
        expect(frame.array[i]).toBeLessThanOrEqual(frame.variables.pivot);
    }
  }
});
it("Sorting swap and write snapshots perform exactly their declared array updates", () => {
  for (const [, generate] of algorithms) {
    const frames = collect(generate, [5, 2, 4, 1, 3]);
    for (let step = 1; step < frames.length; step++) {
      const frame = frames[step],
        previous = frames[step - 1];
      if (frame.operation === "swap") {
        const [a, b] = frame.highlights.swapping;
        const expected = [...previous.array];
        [expected[a], expected[b]] = [expected[b], expected[a]];
        expect(frame.array).toEqual(expected);
      } else if (!["write", "shift", "insert"].includes(frame.operation)) {
        expect(frame.array).toEqual(previous.array);
      }
    }
  }
});
