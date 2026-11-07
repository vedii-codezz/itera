import { describe, it, expect, vi, afterEach } from "vitest";
import { algorithmRegistry } from "../src/engine/algorithmRegistry.js";
import { createPlaybackController } from "../src/engine/playbackController.js";
import { collect } from "./algorithmHelpers.js";

const ids = [
  "bubble-sort",
  "insertion-sort",
  "merge-sort",
  "quick-sort",
  "binary-search",
  "kadane",
];
afterEach(() => vi.useRealTimers());
it("registers six executable definitions with complete, immutable metadata", () => {
  expect(algorithmRegistry.list().map((entry) => entry.id)).toEqual(ids);
  for (const id of ids) {
    const entry = algorithmRegistry.get(id);
    expect(entry.name.length).toBeGreaterThan(3);
    expect(["Sorting", "Searching", "Dynamic Programming"]).toContain(
      entry.category,
    );
    expect(typeof entry.generate).toBe("function");
    expect(entry.inputRequirements).toMatchObject({
      maxLength: 48,
      min: -999,
      max: 999,
    });
    expect(entry.pseudocode.length).toBeGreaterThan(2);
    expect(new Set(entry.pseudocode.map((line) => line.id)).size).toBe(
      entry.pseudocode.length,
    );
    expect(entry.complexity).toEqual(
      expect.objectContaining({
        best: expect.any(String),
        average: expect.any(String),
        worst: expect.any(String),
        auxiliarySpace: expect.any(String),
        coreAuxiliarySpace: expect.any(String),
      }),
    );
    expect(entry.supportedMetrics).toContain("steps");
    expect(Object.isFrozen(entry.complexity)).toBe(true);
    expect(Object.isFrozen(entry.supportedMetrics)).toBe(true);
    const frames = collect(
      entry.generate,
      [1, 2, 3],
      id === "binary-search" ? { target: 2 } : {},
    );
    expect(frames.at(-1)?.status).toBe("complete");
    for (const metric of entry.supportedMetrics)
      expect(frames.at(-1)?.metrics[metric]).toEqual(expect.any(Number));
  }
  expect(algorithmRegistry.get("binary-search").supportedMetrics).not.toContain(
    "swaps",
  );
  expect(algorithmRegistry.get("kadane").supportedMetrics).not.toContain(
    "comparisons",
  );
});

for (const id of ids) {
  describe(`${id} playback`, () => {
    const input = [1, 2, 3, 4],
      options = id === "binary-search" ? { target: 3 } : {};
    it("steps, restores the exact cached frame, seeks, restarts and completes", () => {
      const definition = algorithmRegistry.get(id);
      const expected = collect(definition.generate, input, options);
      const c = createPlaybackController();
      c.load(definition.generate, input, options);
      expect(c.getState().snapshot).toEqual(expected[0]);
      const initial = c.getState().snapshot;
      c.next();
      const second = c.getState().snapshot;
      expect(second).toEqual(expected[1]);
      c.previous();
      expect(c.getState().snapshot).toBe(initial);
      c.next();
      expect(c.getState().snapshot).toBe(second);
      c.seek(Math.min(5, expected.length - 1));
      expect(c.getState().snapshot).toEqual(
        expected[Math.min(5, expected.length - 1)],
      );
      c.end();
      expect(c.getState().complete).toBe(true);
      expect(c.getState().error).toBe(null);
      expect(c.getState().snapshot).toEqual(expected.at(-1));
      const final = c.getState().snapshot;
      c.restart();
      expect(c.getState().snapshot).toBe(initial);
      c.seek(expected.length - 1);
      expect(c.getState().snapshot).toBe(final);
      c.dispose();
    });
    it("cancels the suspended generator on input replacement or algorithm switching", () => {
      vi.useFakeTimers();
      const definition = algorithmRegistry.get(id);
      let cancelled = false;
      function* tracked(values, config) {
        try {
          yield* definition.generate(values, config);
        } finally {
          cancelled = true;
        }
      }
      const c = createPlaybackController({ interval: 100 });
      c.load(tracked, input, options);
      c.play();
      c.load(
        definition.generate,
        [5],
        id === "binary-search" ? { target: 5 } : {},
      );
      expect(cancelled).toBe(true);
      vi.advanceTimersByTime(1000);
      expect(c.getState().index).toBe(0);
      expect(c.getState().snapshot.array).toEqual([5]);
      c.play();
      const nextAlgorithm = algorithmRegistry.get(
        id === "kadane" ? "bubble-sort" : "kadane",
      );
      c.load(nextAlgorithm.generate, [-1, 3]);
      vi.advanceTimersByTime(1000);
      expect(c.getState().index).toBe(0);
      expect(c.getState().snapshot.array).toEqual([-1, 3]);
      c.clear();
      vi.runAllTimers();
      expect(c.getState().snapshot).toBe(null);
      c.dispose();
    });
  });
}

it("preserves exact cached forward/backward/seek navigation after cache exhaustion", () => {
  const c = createPlaybackController({ maxSnapshots: 3 });
  c.load(algorithmRegistry.get("bubble-sort").generate, [3, 2, 1]);
  const first = c.getState().snapshot;
  c.next();
  const second = c.getState().snapshot;
  c.next();
  const third = c.getState().snapshot;
  c.end();
  expect(c.getState().generated).toBe(3);
  expect(c.getState().error).toMatch(/limit/i);
  c.previous();
  expect(c.getState().snapshot).toBe(second);
  c.next();
  expect(c.getState().snapshot).toBe(third);
  c.restart();
  expect(c.getState().snapshot).toBe(first);
  c.seek(1);
  expect(c.getState().snapshot).toBe(second);
  c.seek(10);
  expect(c.getState().snapshot).toBe(third);
  expect(c.getState().index).toBe(2);
  expect(c.getState().complete).toBe(false);
  c.dispose();
});
it("preserves cached navigation after a generator exception", () => {
  const c = createPlaybackController();
  c.load(function* () {
    yield { array: [1] };
    yield { array: [2] };
    throw new Error("boom");
  });
  c.next();
  const second = c.getState().snapshot;
  c.next();
  expect(c.getState().error).toBe("boom");
  c.previous();
  c.next();
  expect(c.getState().snapshot).toBe(second);
  c.dispose();
});
it("all valid maximum-size traces fit the existing default cache", () => {
  for (const id of ids) {
    const definition = algorithmRegistry.get(id),
      c = createPlaybackController();
    const input = Array.from({ length: 48 }, (_, i) =>
      id === "binary-search" ? i : 48 - i,
    );
    c.load(definition.generate, input, { target: 47 });
    c.end();
    expect(c.getState().error).toBe(null);
    expect(c.getState().complete).toBe(true);
    expect(c.getState().generated).toBeLessThan(20000);
    const final = c.getState().snapshot;
    c.restart();
    c.end();
    expect(c.getState().snapshot).toBe(final);
    c.dispose();
  }
});
