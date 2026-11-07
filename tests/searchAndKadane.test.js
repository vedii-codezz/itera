import { describe, it, expect } from "vitest";
import {
  binarySearch,
  binarySearchPseudocode,
} from "../src/algorithms/binarySearch.js";
import { kadane, kadanePseudocode } from "../src/algorithms/kadane.js";
import { createPlaybackController } from "../src/engine/playbackController.js";
import { collect, checkFrames, seededRandom } from "./algorithmHelpers.js";

const searchCases = [
  [[], 3, -1],
  [[2], 2, 0],
  [[2], 3, -1],
  [[1, 2, 3, 4, 5], 4, 3],
  [[1, 2, 3, 4, 5], 0, -1],
  [[1, 2, 3, 4, 5], 6, -1],
  [[1, 3, 5], 2, -1],
  [[1, 2, 2, 2, 3], 2, 1],
  [[4, 4, 4, 4], 4, 0],
  [[-9, -4, -2, 0, 3], -4, 1],
  [[0, 0, 0], 0, 0],
  [[-999, 0, 999], 999, 2],
];

describe("Binary Search", () => {
  it.each(searchCases)(
    "finds the leftmost target in %j for %i",
    (input, target, expected) => {
      const original = [...input];
      const frames = collect(binarySearch, Object.freeze([...input]), {
        target,
      });
      expect(frames.at(-1)?.result).toEqual({
        found: expected !== -1,
        index: expected,
        target,
      });
      expect(
        frames.every(
          (frame) => JSON.stringify(frame.array) === JSON.stringify(original),
        ),
      ).toBe(true);
      expect(input).toEqual(original);
      checkFrames(frames, input, binarySearchPseudocode);
    },
  );
  it("matches an independent linear search on 80 deterministic arrays and targets", () => {
    const random = seededRandom(87);
    for (let run = 0; run < 80; run++) {
      const input = Array.from(
        { length: Math.floor(random() * 49) },
        () => Math.floor(random() * 21) - 10,
      ).sort((a, b) => a - b);
      const target = Math.floor(random() * 25) - 12;
      const result = collect(binarySearch, input, { target }).at(-1)?.result;
      expect(result?.index).toBe(input.indexOf(target));
      expect(result?.found).toBe(input.includes(target));
    }
  });
  it.each([[[3, 1, 2]], [[2, 1]], [[0, -1]], [[1, 2, 1]]])(
    "rejects unsorted input without modifying it: %j",
    (input) => {
      const original = [...input];
      expect(() => collect(binarySearch, input, { target: 1 })).toThrow(
        /sorted/i,
      );
      expect(input).toEqual(original);
      const c = createPlaybackController();
      c.load(binarySearch, input, { target: 1 });
      expect(c.getState().error).toMatch(/sorted/i);
      expect(c.getState().snapshot).toBe(null);
      c.dispose();
    },
  );
  it.each([undefined, NaN, Infinity, 1.5, "2", 1000])(
    "rejects invalid target %j",
    (target) => {
      expect(() => collect(binarySearch, [1, 2], { target })).toThrow(
        /target/i,
      );
    },
  );
  it("counts one key comparison per search iteration, excluding sortedness validation", () => {
    const frames = collect(binarySearch, [1, 2, 3, 4, 5, 6, 7], { target: 6 });
    expect(frames.at(-1)?.metrics).toMatchObject({
      comparisons: 3,
      iterations: 3,
      swaps: 0,
      writes: 0,
    });
    let count = 0;
    for (const frame of frames) {
      if (frame.operation === "compare") count++;
      expect(frame.metrics.comparisons).toBe(count);
      expect(frame.metrics.iterations).toBe(count);
    }
  });
  it("keeps lo/mid/hi, comparisons, eliminated indices and candidate consistent", () => {
    for (const target of [-3, 0, 2, 5, 99]) {
      const input = [-3, 0, 2, 2, 2, 5, 8];
      for (const frame of collect(binarySearch, input, { target })) {
        const { lo, mid, hi } = frame.pointers;
        const { candidate } = frame.variables;
        if (frame.operation === "compare") {
          expect(mid).toBe(Math.floor((lo + hi) / 2));
          expect(mid).toBeGreaterThanOrEqual(lo);
          expect(mid).toBeLessThanOrEqual(hi);
          const expectedRelation =
            input[mid] === target
              ? "equal"
              : input[mid] < target
                ? "less"
                : "greater";
          expect(frame.variables.comparisonResult).toBe(expectedRelation);
        }
        if (candidate !== -1) expect(input[candidate]).toBe(target);
        for (const index of frame.highlights.eliminated) {
          expect(index < lo || index > hi).toBe(true);
          expect(index).not.toBe(candidate);
        }
        if (frame.metadata.interval)
          expect(frame.metadata.interval).toEqual([lo, hi]);
        else expect(lo).toBeGreaterThan(hi);
      }
    }
  });
  it("captures the target before suspension so options edits cannot alter execution", () => {
    const options = { target: 3 },
      iterator = binarySearch([1, 2, 3], options);
    iterator.next();
    options.target = 99;
    const rest = [...iterator];
    expect(rest.at(-1)?.result).toEqual({ found: true, index: 2, target: 3 });
  });
});

// Quadratic oracle enumerates all nonempty subarrays in tie-priority order.
function bruteForce(input) {
  if (!input.length) return { sum: 0, start: null, end: null, subarray: [] };
  let best = { sum: -Infinity, start: null, end: null, subarray: [] };
  for (let start = 0; start < input.length; start++) {
    let sum = 0;
    for (let end = start; end < input.length; end++) {
      sum += input[end];
      if (sum > best.sum)
        best = { sum, start, end, subarray: input.slice(start, end + 1) };
    }
  }
  return best;
}
const kadaneCases = [
  ["empty", [], { sum: 0, start: null, end: null, subarray: [] }],
  ["single", [-4], { sum: -4, start: 0, end: 0, subarray: [-4] }],
  ["positive", [1, 2, 3], { sum: 6, start: 0, end: 2, subarray: [1, 2, 3] }],
  [
    "all-negative",
    [-8, -3, -6, -2, -5, -4],
    { sum: -2, start: 3, end: 3, subarray: [-2] },
  ],
  [
    "mixed",
    [-2, 1, -3, 4, -1, 2, 1, -5, 4],
    { sum: 6, start: 3, end: 6, subarray: [4, -1, 2, 1] },
  ],
  ["zeros", [0, 0, 0], { sum: 0, start: 0, end: 0, subarray: [0] }],
  [
    "equal positive optima",
    [1, -1, 1],
    { sum: 1, start: 0, end: 0, subarray: [1] },
  ],
  ["earliest start", [0, 1], { sum: 1, start: 0, end: 1, subarray: [0, 1] }],
  ["earliest end", [1, 0], { sum: 1, start: 0, end: 0, subarray: [1] }],
  [
    "equal negative optima",
    [-2, -2],
    { sum: -2, start: 0, end: 0, subarray: [-2] },
  ],
  [
    "zero after negatives",
    [-1, 0, 0],
    { sum: 0, start: 1, end: 1, subarray: [0] },
  ],
];
describe("Kadane", () => {
  it.each(kadaneCases)(
    "handles %s with deterministic ties",
    (_, input, expected) => {
      const original = [...input];
      const frames = collect(kadane, Object.freeze([...input]));
      expect(frames.at(-1)?.result).toEqual(expected);
      expect(frames.at(-1)?.metrics.elementsProcessed).toBe(input.length);
      expect(input).toEqual(original);
      checkFrames(frames, input, kadanePseudocode);
    },
  );
  it("matches the brute-force sum and boundaries for 200 seeded small inputs", () => {
    const random = seededRandom(203);
    for (let run = 0; run < 200; run++) {
      const input = Array.from(
        { length: Math.floor(random() * 11) },
        () => Math.floor(random() * 9) - 4,
      );
      expect(collect(kadane, input).at(-1)?.result).toEqual(bruteForce(input));
    }
  });
  it("handles maximum-length positive, negative and reversed inputs", () => {
    for (const input of [
      Array(48).fill(999),
      Array(48).fill(-999),
      Array.from({ length: 48 }, (_, i) => 24 - i),
    ]) {
      const frames = collect(kadane, input);
      expect(frames.at(-1)?.result).toEqual(bruteForce(input));
      checkFrames(frames, input, kadanePseudocode);
    }
  });
  it("provides running sums, current and best boundaries, and restart decisions", () => {
    const input = [-2, 3, -1, 4];
    const frames = collect(kadane, input);
    let processed = 0,
      updates = 0;
    for (const frame of frames) {
      if (["start", "restart", "extend"].includes(frame.operation)) processed++;
      if (frame.operation === "best") updates++;
      expect(frame.metrics.elementsProcessed).toBe(processed);
      expect(frame.metrics.bestUpdates).toBe(updates);
      expect(frame.metrics.comparisons).toBe(0);
      expect(frame.metrics.swaps).toBe(0);
      expect(frame.metrics.writes).toBe(0);
      if (frame.metadata.currentRange) {
        const [start, end] = frame.metadata.currentRange;
        expect(input.slice(start, end + 1).reduce((a, b) => a + b, 0)).toBe(
          frame.variables.currentSum,
        );
        expect(frame.metadata.runningSums.at(-1)).toBe(
          frame.variables.currentSum,
        );
        expect(frame.pointers.current).toBe(end);
        expect(frame.variables.currentElement).toBe(input[end]);
      }
      if (frame.metadata.bestRange) {
        const [start, end] = frame.metadata.bestRange;
        expect(input.slice(start, end + 1).reduce((a, b) => a + b, 0)).toBe(
          frame.variables.bestSum,
        );
      }
    }
    expect(
      frames.find((s) => s.operation === "restart")?.metadata.currentRange,
    ).toEqual([1, 1]);
    expect(frames.at(-1)?.metrics).toMatchObject({
      elementsProcessed: 4,
      bestUpdates: 3,
    });
    expect(frames.at(-1)?.metadata.runningSums).toEqual([-2, 3, 2, 6]);
  });
  it.each(
    [[NaN], [Infinity], [1.1], [1000], Array(49).fill(0)].map((input) => [
      input,
    ]),
  )("rejects invalid input %j", (input) => {
    expect(() => collect(kadane, input)).toThrow(/input|integer|48|999/i);
  });
});
