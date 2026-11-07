// @vitest-environment jsdom
import { it, expect, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within,
  act,
} from "@testing-library/react";
import { RaceMode } from "../src/components/race/RaceMode.jsx";
import { algorithmRegistry } from "../src/engine/algorithmRegistry.js";
import { SnapshotVisualization } from "../src/components/visualization/SnapshotVisualization.jsx";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
function input(value) {
  fireEvent.change(screen.getByLabelText("Race array values"), {
    target: { value },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply input" }));
}
async function finish() {
  fireEvent.click(screen.getByRole("button", { name: "Finish race" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Race status").textContent).toBe("Completed"),
  );
}
it("renders two sorting selectors, identical input, and partial summary", () => {
  render(<RaceMode />);
  expect(screen.getByRole("heading", { name: "Algorithm Race" })).toBeTruthy();
  for (const name of ["Algorithm A", "Algorithm B"]) {
    const select = screen.getByLabelText(name, { exact: true });
    expect([...select.options].map((o) => o.value)).toEqual([
      "bubble-sort",
      "insertion-sort",
      "merge-sort",
      "quick-sort",
    ]);
  }
  expect(
    screen.getByLabelText("Comparison summary status").textContent,
  ).toContain("Partial");
  expect(
    within(screen.getByLabelText("Algorithm A lane"))
      .getByTestId("element-0")
      .getAttribute("data-value"),
  ).toBe(
    within(screen.getByLabelText("Algorithm B lane"))
      .getByTestId("element-0")
      .getAttribute("data-value"),
  );
});
it("steps paired snapshots and rewinds explanation, pseudocode and counters exactly", () => {
  render(<RaceMode />);
  input("3, 1, 2");
  fireEvent.click(screen.getByRole("button", { name: "Next race step" }));
  const a = within(screen.getByLabelText("Algorithm A lane"));
  expect(a.getByLabelText("Lane operation").textContent).toBe("compare");
  expect(a.getByTestId("metric-comparisons").textContent).toContain("1");
  expect(a.getByLabelText("Lane explanation").textContent).toContain(
    "Comparing 3 and 1",
  );
  fireEvent.click(screen.getByRole("button", { name: "Previous race step" }));
  expect(a.getByTestId("metric-comparisons").textContent).toContain("0");
  expect(screen.getByLabelText("Race timeline").value).toBe("0");
});
it("shared playback speed, seeking and drafts cancel scheduled work", () => {
  vi.useFakeTimers();
  render(<RaceMode />);
  input("3, 2, 1");
  fireEvent.click(screen.getByRole("button", { name: "Start race" }));
  act(() => vi.advanceTimersByTime(600));
  expect(screen.getByLabelText("Race timeline").value).toBe("1");
  fireEvent.change(screen.getByLabelText("Race speed"), {
    target: { value: "4" },
  });
  act(() => vi.advanceTimersByTime(150));
  expect(screen.getByLabelText("Race timeline").value).toBe("2");
  fireEvent.change(screen.getByLabelText("Race timeline"), {
    target: { value: "0" },
  });
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByLabelText("Race timeline").value).toBe("0");
  fireEvent.click(screen.getByRole("button", { name: "Start race" }));
  fireEvent.change(screen.getByLabelText("Race array values"), {
    target: { value: "9, 2" },
  });
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByLabelText("Race timeline").value).toBe("0");
  expect(screen.getByRole("button", { name: "Start race" }).disabled).toBe(
    true,
  );
});
it("completes same-algorithm lanes, changes mode without reset, and resets input/selection safely", async () => {
  render(<RaceMode />);
  input("3, 1, 2");
  fireEvent.change(screen.getByLabelText("Algorithm B", { exact: true }), {
    target: { value: "bubble-sort" },
  });
  await finish();
  expect(
    screen.getByLabelText("Comparison summary status").textContent,
  ).toContain("Final");
  expect(
    screen.getByText("Both algorithms produced the same sorted output."),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Operation Comparison" }));
  expect(
    screen
      .getByRole("button", { name: "Operation Comparison" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(screen.getByLabelText("Race status").textContent).toBe("Completed");
  fireEvent.click(screen.getByRole("button", { name: "Restart race" }));
  expect(screen.getByLabelText("Race timeline").value).toBe("0");
  fireEvent.change(screen.getByLabelText("Algorithm A", { exact: true }), {
    target: { value: "insertion-sort" },
  });
  expect(
    within(screen.getByLabelText("Algorithm A lane")).queryByTestId(
      "metric-swaps",
    ),
  ).toBe(null);
  input("-1, 4");
  expect(
    within(screen.getByLabelText("Algorithm A lane"))
      .getByTestId("element-0")
      .getAttribute("data-value"),
  ).toBe("-1");
});
it("shows input errors and permits an empty race", async () => {
  render(<RaceMode />);
  input("1,,2");
  expect(screen.getByRole("alert").textContent).toMatch(/whole numbers/i);
  input("");
  await finish();
  expect(
    screen.getByLabelText("Comparison summary status").textContent,
  ).toContain("Final");
});
it("navigation inactivity and unmount cancel generation and timers", () => {
  vi.useFakeTimers();
  const view = render(<RaceMode />);
  fireEvent.click(screen.getByRole("button", { name: "Start race" }));
  view.rerender(<RaceMode active={false} />);
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByLabelText("Race timeline").value).toBe("0");
  view.rerender(<RaceMode />);
  fireEvent.click(screen.getByRole("button", { name: "Finish race" }));
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
it("shared scale includes a held insertion key missing from the current working array", () => {
  const a = algorithmRegistry.get("insertion-sort");
  const frames = [...a.generate([-1, -9])],
    snapshot = frames.find((s) => s.operation === "shift");
  render(
    <SnapshotVisualization
      algorithm={a}
      snapshot={snapshot}
      scaleValues={[-1, -9]}
    />,
  );
  const bar = screen.getByTestId("element-1").querySelector("rect");
  expect(Number(bar.getAttribute("height"))).toBeCloseTo(20);
});
