import { describe, it, expect, vi, afterEach } from "vitest";
import { createPlaybackController } from "../src/engine/playbackController.js";
import { algorithmRegistry } from "../src/engine/algorithmRegistry.js";
afterEach(() => vi.useRealTimers());
function* longTrace() {
  for (let i = 0; i < 500; i++) yield { array: [i] };
}
describe("chunked end generation", () => {
  it("yields between bounded chunks then reaches the exact final snapshot", async () => {
    vi.useFakeTimers();
    const c = createPlaybackController();
    c.load(longTrace);
    const job = c.endAsync({ batchSize: 20 });
    expect(c.getState().generating).toBe(true);
    expect(c.getState().index).toBe(0);
    vi.advanceTimersToNextTimer();
    expect(c.getState().generated).toBeGreaterThan(1);
    expect(c.getState().generated).toBeLessThanOrEqual(21);
    expect(c.getState().complete).toBe(false);
    await vi.runAllTimersAsync();
    expect(await job).toBe(true);
    expect(c.getState().snapshot.array).toEqual([499]);
    expect(c.getState().complete).toBe(true);
    expect(c.getState().generating).toBe(false);
    c.dispose();
  });
  it.each(["pause", "clear", "restart", "dispose"])(
    "cancels pending chunks on %s",
    async (action) => {
      vi.useFakeTimers();
      const c = createPlaybackController();
      c.load(longTrace);
      const job = c.endAsync({ batchSize: 5 });
      vi.advanceTimersToNextTimer();
      c[action]();
      const index = c.getState().index;
      await vi.runAllTimersAsync();
      expect(await job).toBe(false);
      expect(c.getState().index).toBe(index);
      expect(c.getState().generating).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
      c.dispose();
    },
  );
  it("input replacement prevents stale chunks from modifying the new run", async () => {
    vi.useFakeTimers();
    const c = createPlaybackController();
    c.load(longTrace);
    const job = c.endAsync();
    c.load(algorithmRegistry.get("kadane").generate, [-3, 2]);
    await vi.runAllTimersAsync();
    expect(await job).toBe(false);
    expect(c.getState().index).toBe(0);
    expect(c.getState().snapshot.array).toEqual([-3, 2]);
    c.dispose();
  });
  it("seek cancels generation and restores an exact cached frame", async () => {
    vi.useFakeTimers();
    const c = createPlaybackController();
    c.load(longTrace);
    const initial = c.getState().snapshot;
    const job = c.endAsync();
    vi.advanceTimersToNextTimer();
    c.seek(0);
    await vi.runAllTimersAsync();
    expect(await job).toBe(false);
    expect(c.getState().snapshot).toBe(initial);
    c.dispose();
  });
  it("stops at the cache limit with cached navigation intact", async () => {
    vi.useFakeTimers();
    const c = createPlaybackController({ maxSnapshots: 3 });
    c.load(longTrace);
    const job = c.endAsync();
    await vi.runAllTimersAsync();
    expect(await job).toBe(false);
    expect(c.getState().error).toMatch(/limit/);
    expect(c.getState().generated).toBe(3);
    c.previous();
    c.next();
    expect(c.getState().snapshot.array).toEqual([2]);
    c.dispose();
  });
  it("timed playback stops on the final yielded algorithm state, without an extra tick", () => {
    vi.useFakeTimers();
    const c = createPlaybackController({ interval: 10 });
    c.load(algorithmRegistry.get("bubble-sort").generate, []);
    c.play();
    vi.advanceTimersByTime(10);
    expect(c.getState().snapshot.status).toBe("complete");
    expect(c.getState().playing).toBe(false);
    expect(c.getState().finalGenerated).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    c.dispose();
  });
});

it("stops immediately when replay enters a cached algorithm completion", async () => {
  vi.useFakeTimers();
  const c = createPlaybackController({ interval: 10 });
  c.load(algorithmRegistry.get("bubble-sort").generate, []);
  const job = c.endAsync();
  await vi.runAllTimersAsync();
  await job;
  c.restart();
  c.play();
  vi.advanceTimersByTime(10);
  expect(c.getState().snapshot.status).toBe("complete");
  expect(c.getState().playing).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  c.dispose();
});
it("stops when replay enters the last cached frame of an exhausted legacy generator", () => {
  vi.useFakeTimers();
  const c = createPlaybackController({ interval: 10 });
  c.load(function* () {
    yield { array: [1] };
    yield { array: [2] };
  });
  c.end();
  c.restart();
  c.play();
  vi.advanceTimersByTime(10);
  expect(c.getState().snapshot.array).toEqual([2]);
  expect(c.getState().playing).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
  c.dispose();
});

it("chunked jump reaches the final cached frame after restarting a long completed execution", async () => {
  vi.useFakeTimers();
  const c = createPlaybackController();
  c.load(
    algorithmRegistry.get("bubble-sort").generate,
    Array.from({ length: 12 }, (_, i) => 12 - i),
  );
  let job = c.endAsync();
  await vi.runAllTimersAsync();
  expect(await job).toBe(true);
  const final = c.getState().snapshot,
    finalIndex = c.getState().index;
  expect(finalIndex).toBeGreaterThan(64);
  c.restart();
  job = c.endAsync();
  await vi.runAllTimersAsync();
  expect(await job).toBe(true);
  expect(c.getState().index).toBe(finalIndex);
  expect(c.getState().snapshot).toBe(final);
  c.dispose();
});
