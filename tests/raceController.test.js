import { afterEach, describe, it, expect, vi } from "vitest";
import { createRaceController } from "../src/race/raceController.js";
import { algorithmRegistry } from "../src/engine/algorithmRegistry.js";
afterEach(() => vi.useRealTimers());
const config = (
  input = [3, 1, 2],
  leftId = "bubble-sort",
  rightId = "quick-sort",
) => ({ input, leftId, rightId });
function finish(c) {
  for (
    let tick = 0;
    tick < 20000 && !c.getState().complete && !c.getState().error;
    tick++
  )
    c.next();
  return c.getState();
}
describe("race coordinator", () => {
  it("copies shared input into independent frozen initial snapshots", () => {
    const input = [3, 1, 2],
      c = createRaceController();
    c.load(config(input));
    const s = c.getState();
    expect(s.left.snapshot.array).toEqual(input);
    expect(s.right.snapshot.array).toEqual(input);
    expect(s.left.snapshot.array).not.toBe(s.right.snapshot.array);
    input[0] = 99;
    expect(s.input).toEqual([3, 1, 2]);
    c.next();
    c.next();
    expect(s.left.snapshot.array).toEqual([3, 1, 2]);
    c.dispose();
  });
  it.each(["bubble-sort", "insertion-sort", "merge-sort", "quick-sort"])(
    "allows identical %s lanes with deterministic results",
    (id) => {
      const c = createRaceController();
      c.load(config([4, -1, 0, 4], id, id));
      while (!c.getState().complete) {
        c.next();
        const s = c.getState();
        expect(s.error).toBe(null);
        expect(s.left.snapshot).toEqual(s.right.snapshot);
      }
      expect(c.getState().left.snapshot.array).toEqual([-1, 0, 4, 4]);
      c.dispose();
    },
  );
  it.each([
    [[]],
    [[7]],
    [[1, 2, 3]],
    [[3, 2, 1]],
    [[2, 2, 1, 1]],
    [[0, 0, 0]],
    [[-3, -1, -2]],
    [[0, -5, 8, -1]],
  ])("finishes all 16 sorting combinations on %j", (input) => {
    const ids = ["bubble-sort", "insertion-sort", "merge-sort", "quick-sort"];
    for (const left of ids)
      for (const right of ids) {
        const c = createRaceController();
        c.load(config(input, left, right));
        const s = finish(c);
        expect(s.error).toBe(null);
        expect(s.complete).toBe(true);
        expect(s.left.snapshot.array).toEqual([...input].sort((a, b) => a - b));
        expect(s.right.snapshot.array).toEqual(s.left.snapshot.array);
        c.dispose();
      }
  });
  it("freezes an early completed lane and restores exact paired history", () => {
    const c = createRaceController();
    c.load(config([1, 2, 3, 4], "bubble-sort", "quick-sort"));
    const history = [c.getState()];
    while (!c.getState().complete) {
      c.next();
      history.push(c.getState());
    }
    const final = c.getState();
    const firstFinished = history.findIndex((s) => s.left.complete);
    expect(firstFinished).toBeLessThan(history.length - 1);
    for (const s of history.slice(firstFinished))
      expect(s.left.snapshot).toBe(history[firstFinished].left.snapshot);
    c.previous();
    expect(c.getState().left.snapshot).toBe(history.at(-2).left.snapshot);
    expect(c.getState().right.snapshot).toBe(history.at(-2).right.snapshot);
    expect(c.getState().complete).toBe(false);
    c.seek(firstFinished);
    expect(c.getState().right.index).toBe(history[firstFinished].right.index);
    c.seek(final.tick);
    expect(c.getState().right.snapshot).toBe(final.right.snapshot);
    c.restart();
    expect(c.getState().tick).toBe(0);
    expect(c.getState().left.snapshot.metrics.comparisons).toBe(0);
    c.dispose();
  });
  it("publishes only atomic paired changes per tick", () => {
    const c = createRaceController();
    c.load(config());
    const samples = [];
    c.subscribe(() => samples.push(c.getState()));
    c.next();
    expect(samples).toHaveLength(1);
    expect(samples[0].left.index).toBe(1);
    expect(samples[0].right.index).toBe(1);
    c.dispose();
  });
  it("owns one timer, handles rapid play/pause, live speed and final replay", () => {
    vi.useFakeTimers();
    const c = createRaceController({ interval: 1000 });
    c.load(config());
    c.play();
    c.play();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(500);
    c.setSpeed(4);
    vi.advanceTimersByTime(250);
    expect(c.getState().tick).toBe(1);
    c.pause();
    vi.advanceTimersByTime(5000);
    expect(c.getState().tick).toBe(1);
    c.play();
    vi.runAllTimers();
    expect(c.getState().complete).toBe(true);
    expect(c.getState().playing).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    c.restart();
    c.play();
    vi.runAllTimers();
    expect(c.getState().complete).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    c.dispose();
  });
  it("switches input and algorithms without stale callbacks and closes old generators", () => {
    vi.useFakeTimers();
    let closed = 0;
    const base = algorithmRegistry.get("bubble-sort");
    const registry = {
      get: (id) =>
        id === "bubble-sort"
          ? {
              ...base,
              generate: function* (input) {
                try {
                  yield* base.generate(input);
                } finally {
                  closed++;
                }
              },
            }
          : algorithmRegistry.get(id),
    };
    const c = createRaceController({ registry, interval: 100 });
    c.load(config());
    c.play();
    vi.advanceTimersByTime(90);
    c.load(config([9, 2], "merge-sort", "insertion-sort"));
    vi.advanceTimersByTime(1000);
    expect(closed).toBe(1);
    expect(c.getState().tick).toBe(0);
    expect(c.getState().left.snapshot.array).toEqual([9, 2]);
    expect(c.getState().right.algorithm.id).toBe("insertion-sort");
    c.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("changes emphasis modes without changing paired positions or creating clocks", () => {
    vi.useFakeTimers();
    const c = createRaceController();
    c.load(config());
    c.next();
    const before = c.getState();
    c.play();
    c.setMode("operations");
    expect(c.getState().mode).toBe("operations");
    expect(c.getState().left.snapshot).toBe(before.left.snapshot);
    expect(vi.getTimerCount()).toBe(1);
    expect(() => c.setMode("benchmark")).toThrow();
    c.dispose();
  });
  it.each(["binary-search", "kadane", "missing"])(
    "rejects ineligible algorithm %s",
    (id) => {
      const c = createRaceController();
      c.load(config([1, 2], id));
      expect(c.getState().error).toMatch(/sorting|unsupported|eligible/i);
      expect(c.getState().complete).toBe(false);
      c.dispose();
    },
  );
  it("surfaces lane errors, stops work, preserves diagnostics, and permits restart", () => {
    vi.useFakeTimers();
    let fail = true;
    const base = algorithmRegistry.get("quick-sort");
    const registry = {
      get: (id) =>
        id === "quick-sort"
          ? {
              ...base,
              generate: function* (input) {
                yield { array: input };
                if (fail) throw new Error("lane failed");
                yield* base.generate(input);
              },
            }
          : algorithmRegistry.get(id),
    };
    const c = createRaceController({ registry });
    c.load(config());
    c.play();
    vi.runAllTimers();
    expect(c.getState().error).toMatch(/lane failed/);
    expect(c.getState().right.error).toBe("lane failed");
    expect(c.getState().complete).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    fail = false;
    c.restart();
    expect(c.getState().error).toBe(null);
    expect(finish(c).complete).toBe(true);
    c.dispose();
  });
  it("rejects a falsely successful final output", () => {
    const base = algorithmRegistry.get("quick-sort"),
      registry = {
        get: (id) =>
          id === "quick-sort"
            ? {
                ...base,
                generate: function* (input) {
                  yield { array: input, status: "ready" };
                  yield { array: input, status: "complete", result: input };
                },
              }
            : algorithmRegistry.get(id),
      };
    const c = createRaceController({ registry });
    c.load(config([2, 1]));
    c.next();
    expect(c.getState().error).toMatch(/output|sorted/);
    expect(c.getState().complete).toBe(false);
    c.dispose();
  });
  it("bounds lane cache and paired history and keeps cached navigation exact after failure", () => {
    for (const options of [{ maxSnapshots: 3 }, { maxTicks: 3 }]) {
      const c = createRaceController(options);
      c.load(config([3, 2, 1]));
      const initial = c.getState();
      finish(c);
      expect(c.getState().error).toMatch(/limit/i);
      expect(c.getState().generatedTicks).toBeLessThanOrEqual(4);
      c.seek(0);
      expect(c.getState().left.snapshot).toBe(initial.left.snapshot);
      c.dispose();
    }
  });
  it("finishes maximum input lazily and navigates using bounded position pairs", () => {
    const input = Array.from({ length: 48 }, (_, i) => 48 - i),
      c = createRaceController();
    c.load(config(input));
    expect(c.getState().generatedTicks).toBe(1);
    const final = finish(c);
    expect(final.complete).toBe(true);
    expect(final.generatedTicks).toBeLessThan(20000);
    expect(final.pair).toEqual({
      left: final.left.index,
      right: final.right.index,
    });
    expect(Object.isFrozen(final.pair)).toBe(true);
    c.seek(10);
    c.seek(final.tick);
    expect(c.getState().left.snapshot).toBe(final.left.snapshot);
    c.dispose();
  });
  it("chunked finish is cancellable and can traverse the entire cached race after restart", async () => {
    vi.useFakeTimers();
    const c = createRaceController();
    c.load(config(Array.from({ length: 12 }, (_, i) => 12 - i)));
    let job = c.endAsync();
    expect(c.getState().tick).toBe(0);
    await vi.runAllTimersAsync();
    expect(await job).toBe(true);
    const final = c.getState();
    c.restart();
    job = c.endAsync();
    await vi.runAllTimersAsync();
    expect(await job).toBe(true);
    expect(c.getState().left.snapshot).toBe(final.left.snapshot);
    c.restart();
    job = c.endAsync();
    c.load(config([8, 2]));
    await vi.runAllTimersAsync();
    expect(await job).toBe(false);
    expect(c.getState().tick).toBe(0);
    c.dispose();
  });
  it("clear/dispose cancels all work and subscriber cleanup is safe", async () => {
    vi.useFakeTimers();
    const c = createRaceController();
    c.load(config());
    const off = c.subscribe(() => {});
    const job = c.endAsync();
    c.clear();
    off();
    await vi.runAllTimersAsync();
    expect(await job).toBe(false);
    expect(c.getState().status).toBe("idle");
    c.load(config());
    c.play();
    c.dispose();
    vi.runAllTimers();
    expect(vi.getTimerCount()).toBe(0);
  });
});

it("retained forward navigation works after a race limit error", () => {
  const c = createRaceController({ maxTicks: 3 });
  c.load(config([3, 2, 1]));
  finish(c);
  const diagnostic = c.getState();
  c.previous();
  c.next();
  expect(c.getState().tick).toBe(diagnostic.tick);
  expect(c.getState().left.snapshot).toBe(diagnostic.left.snapshot);
  expect(c.getState().error).toMatch(/limit/);
  c.dispose();
});
it("disposal releases retained paired history and prevents session reuse", () => {
  const c = createRaceController();
  c.load(config());
  finish(c);
  c.dispose();
  expect(c.getState().generatedTicks).toBe(0);
  expect(c.getState().left).toBe(null);
  c.load(config([8, 2]));
  expect(c.getState().left).toBe(null);
});
it.each(["pause", "previous", "seek", "restart", "dispose"])(
  "cancels chunked finish on %s without stale paired updates",
  async (action) => {
    vi.useFakeTimers();
    const c = createRaceController();
    c.load(config(Array.from({ length: 12 }, (_, i) => 12 - i)));
    const job = c.endAsync();
    vi.advanceTimersToNextTimer();
    if (action === "seek") c.seek(0);
    else c[action]();
    const tick = c.getState().tick;
    await vi.runAllTimersAsync();
    expect(await job).toBe(false);
    expect(c.getState().tick).toBe(tick);
    expect(vi.getTimerCount()).toBe(0);
    c.dispose();
  },
);
