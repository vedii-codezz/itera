import { describe, it, expect, vi, afterEach } from "vitest";
import { createSnapshot } from "../src/engine/snapshot.js";
import { createPlaybackController } from "../src/engine/playbackController.js";
import { parseArray, generateArray } from "../src/utils/input.js";
import { createRegistry } from "../src/engine/algorithmRegistry.js";
function* fixture(values) {
  for (let i = 0; i < 4; i++)
    yield createSnapshot({
      array: values,
      variables: { i },
      explanation: `Frame ${i}`,
    });
}
afterEach(() => vi.useRealTimers());
describe("snapshot contract", () => {
  it("deep copies and freezes nested state", () => {
    const input = { array: [2, 1], variables: { nested: [3] } };
    const s = createSnapshot(input);
    input.array[0] = 9;
    input.variables.nested[0] = 8;
    expect(s.array).toEqual([2, 1]);
    expect(s.variables.nested).toEqual([3]);
    expect(() => s.array.push(4)).toThrow();
    expect(s.metrics).toEqual({ comparisons: 0, swaps: 0, writes: 0 });
  });
  it("rejects malformed snapshots", () =>
    expect(() => createSnapshot({ array: [NaN] })).toThrow());
});
describe("inputs", () => {
  it("accepts empty, zero, negatives, duplicates and a single number", () => {
    expect(parseArray("")).toEqual([]);
    expect(parseArray("0, -4, -4")).toEqual([0, -4, -4]);
    expect(parseArray("2")).toEqual([2]);
  });
  it.each(["1,,2", "3x", "Infinity", "1.5", "1000", "1,"])(
    "rejects invalid input %s",
    (value) => expect(() => parseArray(value)).toThrow(),
  );
  it("caps input length", () =>
    expect(() => parseArray(Array(49).fill(1).join(","))).toThrow());
  it("creates bounded preset arrays", () => {
    expect(
      generateArray({
        length: 4,
        min: -3,
        max: 2,
        preset: "Reverse sorted",
        random: () => 0.5,
      }),
    ).toEqual([0, 0, 0, 0]);
    expect(
      generateArray({
        length: 3,
        min: -9,
        max: 9,
        preset: "All negative",
        random: () => 0,
      }),
    ).toEqual([-9, -9, -9]);
    expect(() => generateArray({ length: 49, min: 0, max: 9 })).toThrow();
    expect(() => generateArray({ length: 4, min: 9, max: 0 })).toThrow();
  });
});
describe("playback", () => {
  it("caches exact frames for backward navigation and seeks to end", () => {
    const c = createPlaybackController();
    c.load(fixture, [3, 1]);
    const first = c.getState().snapshot;
    c.next();
    c.previous();
    expect(c.getState().snapshot).toBe(first);
    c.end();
    expect(c.getState().index).toBe(3);
    expect(c.getState().complete).toBe(true);
    c.restart();
    expect(c.getState().index).toBe(0);
    c.dispose();
  });
  it("pauses, resumes and changes speed without overlapping ticks", () => {
    vi.useFakeTimers();
    const c = createPlaybackController({ interval: 1000 });
    c.load(fixture, [1]);
    c.play();
    vi.advanceTimersByTime(500);
    c.setSpeed(4);
    vi.advanceTimersByTime(250);
    expect(c.getState().index).toBe(1);
    c.pause();
    vi.advanceTimersByTime(5000);
    expect(c.getState().index).toBe(1);
    c.play();
    vi.advanceTimersByTime(250);
    expect(c.getState().index).toBe(2);
    c.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("cancels previous execution on load and clear", () => {
    vi.useFakeTimers();
    const c = createPlaybackController();
    c.load(fixture, [1]);
    c.play();
    c.load(fixture, [9]);
    vi.advanceTimersByTime(10000);
    expect(c.getState().snapshot.array).toEqual([9]);
    expect(c.getState().index).toBe(0);
    c.play();
    c.clear();
    vi.runAllTimers();
    expect(c.getState().snapshot).toBe(null);
    c.dispose();
  });
  it("handles empty generators and bounded caching", () => {
    const c = createPlaybackController({ maxSnapshots: 2 });
    c.load(function* () {});
    expect(c.getState().complete).toBe(true);
    c.load(fixture, []);
    c.end();
    expect(c.getState().error).toMatch(/limit/i);
    expect(c.getState().playing).toBe(false);
    c.dispose();
  });
  it("notifies subscribers and unsubscribes", () => {
    const c = createPlaybackController();
    const listener = vi.fn();
    const off = c.subscribe(listener);
    c.load(fixture, []);
    expect(listener).toHaveBeenCalled();
    off();
    listener.mockClear();
    c.next();
    expect(listener).not.toHaveBeenCalled();
    c.dispose();
  });
});
it("registry validates definitions and rejects duplicate IDs", () => {
  const r = createRegistry();
  r.register({ id: "fixture", generate: fixture });
  expect(r.get("fixture").generate).toBe(fixture);
  expect(() => r.register({ id: "fixture", generate: fixture })).toThrow();
  expect(() => r.get("missing")).toThrow();
});

describe("additional execution edge cases", () => {
  it("replays cached frames after completion without regenerating them", () => {
    const c = createPlaybackController();
    c.load(fixture, [5]);
    c.end();
    const final = c.getState().snapshot;
    c.restart();
    c.seek(3);
    expect(c.getState().snapshot).toBe(final);
    c.previous();
    expect(c.getState().snapshot.variables.i).toBe(2);
    c.dispose();
  });
  it("captures generator failures and stops timers", () => {
    vi.useFakeTimers();
    const c = createPlaybackController();
    c.load(function* () {
      yield { array: [1] };
      throw new Error("execution failed");
    });
    c.play();
    vi.runAllTimers();
    expect(c.getState().error).toBe("execution failed");
    expect(c.getState().playing).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    c.dispose();
  });
  it("does not let later generator mutations change old snapshots", () => {
    const c = createPlaybackController();
    c.load(function* () {
      const a = [1];
      yield { array: a };
      a[0] = 2;
      yield { array: a };
    });
    const previous = c.getState().snapshot;
    c.next();
    expect(previous.array).toEqual([1]);
    expect(c.getState().snapshot.array).toEqual([2]);
    c.dispose();
  });
  it("cleans up generator resources on replacement", () => {
    let closed = false;
    const c = createPlaybackController();
    c.load(function* () {
      try {
        yield { array: [] };
        yield { array: [] };
      } finally {
        closed = true;
      }
    });
    c.load(fixture, []);
    expect(closed).toBe(true);
    c.dispose();
  });
  it("rejects invalid speed while preserving state", () => {
    const c = createPlaybackController();
    expect(() => c.setSpeed(0)).toThrow();
    expect(() => c.setSpeed(NaN)).toThrow();
    expect(c.getState().speed).toBe(1);
    c.dispose();
  });
  it("invalidates the old scheduled tick when changing input", () => {
    vi.useFakeTimers();
    const c = createPlaybackController({ interval: 100 });
    c.load(fixture, [1]);
    c.play();
    vi.advanceTimersByTime(90);
    c.load(fixture, [7]);
    c.play();
    vi.advanceTimersByTime(10);
    expect(c.getState().index).toBe(0);
    vi.advanceTimersByTime(90);
    expect(c.getState().index).toBe(1);
    expect(c.getState().snapshot.array).toEqual([7]);
    c.dispose();
  });
});
