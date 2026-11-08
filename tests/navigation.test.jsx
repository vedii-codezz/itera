// @vitest-environment jsdom
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import App from "../src/App.jsx";
beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("opens registry details and sends the selected algorithm to the existing playground", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Algorithm Library/ }));
  fireEvent.click(
    screen.getByRole("button", { name: "Inspect Binary Search" }),
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Binary Search" }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Play in Playground" }));
  expect(screen.getByLabelText("Algorithm").value).toBe("binary-search");
  expect(screen.getByLabelText("Search target")).toBeTruthy();
});
it("filters the catalog and reports an empty search without dead actions", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Algorithm Library/ }));
  const catalog = screen.getByRole("region", { name: "Algorithm catalog" });
  expect(within(catalog).getAllByRole("article")).toHaveLength(6);
  fireEvent.change(screen.getByLabelText("Filter algorithms"), {
    target: { value: "unknown" },
  });
  expect(within(catalog).queryAllByRole("article")).toHaveLength(0);
  expect(screen.getByText("No algorithms match your filters.")).toBeTruthy();
});
