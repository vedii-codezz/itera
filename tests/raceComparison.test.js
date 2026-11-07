import { it, expect } from "vitest";
import { createRaceController } from "../src/race/raceController.js";
import { buildRaceComparison } from "../src/race/raceComparison.js";
it("reports supported current counters, omits unsupported swaps, and labels partial states", () => {
  const c = createRaceController();
  c.load({ input: [3, 1, 2], leftId: "insertion-sort", rightId: "merge-sort" });
  c.next();
  const model = buildRaceComparison(c.getState());
  expect(model.partial).toBe(true);
  expect(model.rows.find((r) => r.id === "swaps")).toBeUndefined();
  expect(model.rows.find((r) => r.id === "steps").left).toBe(
    c.getState().left.snapshot.metrics.steps,
  );
  expect(model.observations.join(" ")).not.toMatch(
    /sorted output|faster|winner/i,
  );
  c.dispose();
});
it("final observations use actual counts and rewind returns partial metrics", () => {
  const c = createRaceController();
  c.load({ input: [3, 2, 1], leftId: "bubble-sort", rightId: "quick-sort" });
  while (!c.getState().complete) c.next();
  const model = buildRaceComparison(c.getState());
  expect(model.partial).toBe(false);
  expect(model.rows.find((r) => r.id === "swaps")).toMatchObject({
    left: 3,
    right: 1,
  });
  expect(model.rows.find((r) => r.id === "writes")).toMatchObject({
    left: 6,
    right: 2,
  });
  expect(model.observations.join(" ")).toContain("same sorted output");
  expect(model.observations.join(" ")).not.toMatch(/faster|winner/i);
  const before = c.getState().right.snapshot;
  c.previous();
  const back = buildRaceComparison(c.getState());
  expect(back.partial).toBe(true);
  expect(back.rows.find((r) => r.id === "steps").right).toBe(
    c.getState().right.snapshot.metrics.steps,
  );
  c.next();
  expect(c.getState().right.snapshot).toBe(before);
  c.dispose();
});

it("omits categories supported by neither lane, instead of rendering meaningless rows", () => {
  const c = createRaceController();
  c.load({ input: [2, 1], leftId: "insertion-sort", rightId: "merge-sort" });
  const model = buildRaceComparison(c.getState());
  expect(model.rows.some((r) => r.id === "swaps")).toBe(false);
  expect(model.rows.some((r) => r.id === "bufferWrites")).toBe(true);
  c.dispose();
});
