// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
  waitFor,
} from "@testing-library/react";
import { Playground } from "../src/components/playground/Playground.jsx";
import { SnapshotVisualization } from "../src/components/visualization/SnapshotVisualization.jsx";
import { algorithmRegistry } from "../src/engine/algorithmRegistry.js";
import { collect } from "./algorithmHelpers.js";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
function input(text) {
  fireEvent.change(screen.getByLabelText("Array values"), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply input" }));
}
function select(id) {
  fireEvent.change(screen.getByLabelText("Algorithm"), {
    target: { value: id },
  });
}
async function finish() {
  fireEvent.click(screen.getByRole("button", { name: "Jump to end" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Execution status").textContent).toBe(
      "Completed",
    ),
  );
}

describe("interactive playground", () => {
  it("loads registry metadata and steps pseudocode, explanation, metrics and bars together", () => {
    render(<Playground />);
    input("3, 1, 2");
    expect(screen.getByRole("button", { name: "Previous step" }).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    const line = document.querySelector('[aria-current="step"]');
    expect(line.textContent).toContain(
      algorithmRegistry.get("bubble-sort").pseudocode[1].text,
    );
    expect(screen.getByLabelText("Current explanation").textContent).toContain(
      "Comparing 3 and 1",
    );
    expect(screen.getByTestId("metric-comparisons").textContent).toContain("1");
    expect(screen.getByTestId("element-0").getAttribute("data-state")).toBe(
      "compare",
    );
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByTestId("element-0").getAttribute("data-value")).toBe(
      "1",
    );
    expect(screen.getByTestId("metric-swaps").textContent).toContain("1");
    fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
    expect(screen.getByTestId("element-0").getAttribute("data-value")).toBe(
      "3",
    );
    expect(screen.getByTestId("metric-swaps").textContent).toContain("0");
    expect(screen.getByLabelText("Timeline").value).toBe("1");
  });
  it("plays, pauses, resumes, applies speed and pauses on timeline seek", () => {
    vi.useFakeTimers();
    render(<Playground />);
    input("3, 2, 1");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByLabelText("Current operation").textContent).toBe(
      "compare",
    );
    fireEvent.change(screen.getByLabelText("Playback speed"), {
      target: { value: "4" },
    });
    act(() => vi.advanceTimersByTime(150));
    expect(screen.getByLabelText("Current operation").textContent).toBe("swap");
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByLabelText("Current operation").textContent).toBe("swap");
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    fireEvent.change(screen.getByLabelText("Timeline"), {
      target: { value: "0" },
    });
    expect(screen.getByLabelText("Execution status").textContent).toBe("Ready");
    expect(screen.getByLabelText("Current operation").textContent).toBe(
      "initial",
    );
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByLabelText("Timeline").value).toBe("0");
  });
  it("cancels playback on drafts, input application and algorithm changes", () => {
    vi.useFakeTimers();
    render(<Playground />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.change(screen.getByLabelText("Array values"), {
      target: { value: "9, 1" },
    });
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole("button", { name: /Play|Resume/ }).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply input" }));
    expect(screen.getByTestId("element-0").getAttribute("data-value")).toBe(
      "9",
    );
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    select("insertion-sort");
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByLabelText("Current operation").textContent).toBe(
      "initial",
    );
    expect(screen.queryByTestId("metric-swaps")).toBe(null);
  });
  it.each([
    "bubble-sort",
    "insertion-sort",
    "merge-sort",
    "quick-sort",
    "binary-search",
    "kadane",
  ])("completes %s and restarts the original execution", async (id) => {
    render(<Playground />);
    input("1, 2, 3");
    select(id);
    await finish();
    expect(
      screen.getByLabelText("Algorithm result").textContent.length,
    ).toBeGreaterThan(3);
    expect(screen.getByRole("button", { name: /Play|Resume/ }).disabled).toBe(
      true,
    );
    expect(screen.getByLabelText("Timeline summary").textContent).toMatch(
      /total/i,
    );
    fireEvent.click(screen.getByRole("button", { name: "Restart" }));
    expect(screen.getByLabelText("Timeline").value).toBe("0");
    expect(screen.getByLabelText("Current operation").textContent).toBe(
      "initial",
    );
  });
  it("surfaces binary validation and sorts only on the explicit action", async () => {
    render(<Playground />);
    input("3, 1, 2");
    select("binary-search");
    expect(screen.getByRole("alert").textContent).toMatch(/sorted/i);
    expect(screen.getByLabelText("Array values").value).toBe("3, 1, 2");
    fireEvent.click(
      screen.getByRole("button", { name: "Sort input explicitly" }),
    );
    expect(screen.getByLabelText("Array values").value).toBe("1, 2, 3");
    fireEvent.change(screen.getByLabelText("Search target"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply target" }));
    await finish();
    expect(screen.getByLabelText("Algorithm result").textContent).toMatch(
      /leftmost.*1/i,
    );
    expect(screen.queryByTestId("metric-swaps")).toBe(null);
  });
  it("preserves valid input on validation errors and handles empty completion", async () => {
    render(<Playground />);
    input("1,,2");
    expect(screen.getByRole("alert").textContent).toMatch(/whole numbers/i);
    input("");
    await finish();
    expect(screen.getByLabelText("Algorithm result").textContent).toContain(
      "[]",
    );
  });
  it("keyboard shortcuts work outside controls and ignore typing or modified keys", () => {
    render(<Playground />);
    input("3, 2, 1");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByLabelText("Timeline").value).toBe("1");
    fireEvent.keyDown(screen.getByLabelText("Array values"), {
      key: "ArrowRight",
    });
    expect(screen.getByLabelText("Timeline").value).toBe("1");
    fireEvent.keyDown(window, { key: "ArrowRight", ctrlKey: true });
    expect(screen.getByLabelText("Timeline").value).toBe("1");
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByLabelText("Timeline").value).toBe("0");
  });
  it("unmounting cancels all playback and chunk timers", () => {
    vi.useFakeTimers();
    const view = render(<Playground />);
    fireEvent.click(screen.getByRole("button", { name: "Jump to end" }));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("only labels partial counts as generated until a final frame is known", () => {
    render(<Playground />);
    expect(screen.getByLabelText("Timeline summary").textContent).toMatch(
      /generated/i,
    );
    expect(screen.getByLabelText("Timeline summary").textContent).not.toMatch(
      /total/i,
    );
  });
});

describe("snapshot visualization", () => {
  it("separates insertion holes from held keys and marks shifts", () => {
    const algorithm = algorithmRegistry.get("insertion-sort");
    const snapshot = collect(algorithm.generate, [3, 2, 1]).find(
      (s) => s.operation === "shift",
    );
    render(<SnapshotVisualization algorithm={algorithm} snapshot={snapshot} />);
    expect(screen.getByTestId("element-0").getAttribute("data-state")).toBe(
      "hole",
    );
    expect(screen.getByText(/Held key/).textContent).toContain("2");
  });
  it("renders merge temporary arrays from the snapshot", () => {
    const algorithm = algorithmRegistry.get("merge-sort");
    const snapshot = collect(algorithm.generate, [3, 2, 1]).find(
      (s) => s.operation === "buffer",
    );
    render(<SnapshotVisualization algorithm={algorithm} snapshot={snapshot} />);
    expect(screen.getByLabelText("Merge buffer").textContent).toContain("2");
  });
  it("stacks binary lo/mid/hi labels when they share one cell", () => {
    const algorithm = algorithmRegistry.get("binary-search");
    const snapshot = collect(algorithm.generate, [2], { target: 2 }).find(
      (s) => s.operation === "compare",
    );
    render(<SnapshotVisualization algorithm={algorithm} snapshot={snapshot} />);
    const labels = ["lo", "mid", "hi"].map((name) =>
      screen.getByTestId(`pointer-${name}`),
    );
    expect(
      labels.every((node) => node.getAttribute("data-index") === "0"),
    ).toBe(true);
    expect(new Set(labels.map((node) => node.getAttribute("y"))).size).toBe(3);
  });
  it("renders only observed Kadane running sums below a meaningful zero baseline for negatives", () => {
    const algorithm = algorithmRegistry.get("kadane");
    const snapshot = collect(algorithm.generate, [-4, -2, -7]).at(-1);
    render(<SnapshotVisualization algorithm={algorithm} snapshot={snapshot} />);
    const zero = Number(screen.getByTestId("zero-baseline").getAttribute("y1"));
    const points = screen.getAllByTestId(/running-point-/);
    expect(points).toHaveLength(3);
    expect(points.every((node) => Number(node.getAttribute("cy")) > zero)).toBe(
      true,
    );
    expect(screen.getByText(/Best sum/).textContent).toContain("−2");
  });
  it("keeps dense arrays in a labelled scroll region with every value present", () => {
    const algorithm = algorithmRegistry.get("bubble-sort");
    const snapshot = algorithm.generate(Array(48).fill(7)).next().value;
    render(<SnapshotVisualization algorithm={algorithm} snapshot={snapshot} />);
    expect(screen.getAllByTestId(/element-/)).toHaveLength(48);
    expect(
      screen.getByRole("region", { name: "Scrollable algorithm visualization" })
        .tabIndex,
    ).toBe(0);
  });
});

it("keeps native arrow navigation in a focused scrollable visualization", () => {
  render(<Playground />);
  const region = screen.getByRole("region", {
    name: "Scrollable algorithm visualization",
  });
  region.focus();
  fireEvent.keyDown(region, { key: "ArrowRight" });
  expect(screen.getByLabelText("Timeline").value).toBe("0");
});
it("applies valid custom input independently of invalid generation settings", () => {
  render(<Playground />);
  fireEvent.change(screen.getByLabelText("Length"), {
    target: { value: "49" },
  });
  input("8, 2");
  expect(screen.getByTestId("element-0").getAttribute("data-value")).toBe("8");
});
it("renders the logical insertion hole even before the first shift", () => {
  const algorithm = algorithmRegistry.get("insertion-sort");
  const snapshot = collect(algorithm.generate, [3, 2, 1]).find(
    (s) => s.operation === "select",
  );
  render(<SnapshotVisualization algorithm={algorithm} snapshot={snapshot} />);
  expect(screen.getByTestId("element-1").getAttribute("data-state")).toBe(
    "hole",
  );
});
