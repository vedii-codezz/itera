import { test, expect } from "@playwright/test";

let errors;
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByLabel("Current operation", { exact: true }),
  ).toHaveText("initial");
});
test.afterEach(() => expect(errors).toEqual([]));
async function input(page, text) {
  await page.getByLabel("Array values", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Apply input", exact: true }).click();
}
async function end(page) {
  await page.getByRole("button", { name: "Jump to end", exact: true }).click();
  await expect(page.getByLabel("Execution status", { exact: true })).toHaveText(
    "Completed",
  );
}

test("all six algorithms finish with real results and synchronized pseudocode", async ({
  page,
}, testInfo) => {
  await input(page, "3, 1, 2");
  for (const id of [
    "bubble-sort",
    "insertion-sort",
    "merge-sort",
    "quick-sort",
    "binary-search",
    "kadane",
  ]) {
    await page.getByLabel("Algorithm", { exact: true }).selectOption(id);
    if (id === "binary-search") {
      await expect(page.getByRole("alert")).toContainText("sorted");
      await page.getByRole("button", { name: "Sort input explicitly" }).click();
      await page.getByLabel("Search target", { exact: true }).fill("2");
      await page.getByRole("button", { name: "Apply target" }).click();
    }
    await end(page);
    const result = page.getByLabel("Algorithm result", { exact: true });
    if (id === "binary-search")
      await expect(result).toContainText("leftmost matching index 1");
    else if (id === "kadane")
      await expect(result).toContainText("Maximum sum 6");
    else await expect(result).toContainText("[1, 2, 3]");
    await expect(page.locator('[aria-current="step"]')).toContainText(
      id === "binary-search"
        ? "Return the leftmost candidate"
        : id === "kadane"
          ? "Return best range"
          : "Return the sorted array",
    );
    await expect(page.getByLabel("Timeline summary")).toContainText("total");
    await page.getByRole("button", { name: "Restart", exact: true }).click();
    await expect(
      page.getByLabel("Current operation", { exact: true }),
    ).toHaveText("initial");
  }
  await page
    .getByLabel("Algorithm", { exact: true })
    .selectOption("quick-sort");
  await page.getByRole("button", { name: "Reset input" }).click();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `docs/media/phase4-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("play pause resume speed scrub rewind and jump controls", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await input(page, "4, 3, 2, 1");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByLabel("Execution status", { exact: true })).toHaveText(
    "Playing",
  );
  await expect(
    page.getByLabel("Current operation", { exact: true }),
  ).not.toHaveText("initial");
  await expect(page.locator(".snapshot-visualization")).toHaveAttribute(
    "data-animate",
    "true",
  );
  await page
    .getByRole("slider", { name: "Playback speed", exact: true })
    .fill("4");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator(".snapshot-visualization")).toHaveAttribute(
    "data-animate",
    "false",
  );
  await expect(page.getByLabel("Execution status", { exact: true })).toHaveText(
    "Paused",
  );
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".snapshot-visualization")).toHaveAttribute(
    "data-animate",
    "false",
  );
  await page.getByRole("slider", { name: "Timeline", exact: true }).fill("0");
  await expect(
    page.getByLabel("Current operation", { exact: true }),
  ).toHaveText("initial");
  await expect(page.getByLabel("Execution status", { exact: true })).toHaveText(
    "Ready",
  );
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page
    .getByRole("button", { name: "Previous step", exact: true })
    .click();
  await expect(page.getByLabel("Timeline", { exact: true })).toHaveValue("0");
  await end(page);
  await page
    .getByRole("button", { name: "Jump to beginning", exact: true })
    .click();
  await expect(page.getByLabel("Timeline", { exact: true })).toHaveValue("0");
});

test("input validation, cancellation, reset, generation and theme persistence", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByLabel("Array values", { exact: true }).fill("1,,2");
  await page.getByRole("button", { name: "Apply input", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("whole numbers");
  await expect(
    page.getByRole("button", { name: /^(Play|Resume)$/, exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Length", { exact: true }).fill("49");
  await input(page, "9, 1");
  await expect(page.getByTestId("element-0")).toHaveAttribute(
    "data-value",
    "9",
  );
  await page.getByLabel("Length", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Generate input" }).click();
  await expect(
    page.getByLabel("Current operation", { exact: true }),
  ).toHaveText("initial");
  await page.getByRole("button", { name: "Reset input" }).click();
  await expect(page.getByLabel("Array values", { exact: true })).toHaveValue(
    "42, 18, 65, 31, 87, 12, 56, 73, 24, 94, 38, 61",
  );
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
});

test("binary duplicate pointers and negative Kadane chart remain readable", async ({
  page,
}) => {
  await input(page, "2");
  await page
    .getByLabel("Algorithm", { exact: true })
    .selectOption("binary-search");
  await page.getByLabel("Search target", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Apply target" }).click();
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  const ys = [];
  for (const name of ["lo", "mid", "hi"]) {
    await expect(page.getByTestId(`pointer-${name}`)).toHaveAttribute(
      "data-index",
      "0",
    );
    ys.push(await page.getByTestId(`pointer-${name}`).getAttribute("y"));
  }
  expect(new Set(ys).size).toBe(3);
  await input(page, "-8, -3, -6, -2");
  await page.getByLabel("Algorithm", { exact: true }).selectOption("kadane");
  await end(page);
  await expect(
    page.getByLabel("Algorithm result", { exact: true }),
  ).toContainText("Maximum sum −2");
  const zero = Number(
    await page.getByTestId("zero-baseline").getAttribute("y1"),
  );
  for (const point of await page
    .locator('[data-testid^="running-point-"]')
    .all())
    expect(Number(await point.getAttribute("cy"))).toBeGreaterThan(zero);
});

test("dense arrays are contained at both viewport sizes and panels collapse", async ({
  page,
}) => {
  await input(page, "3, 1, 2");
  const smallRegion = page.getByRole("region", {
    name: "Scrollable algorithm visualization",
  });
  expect(
    await smallRegion.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await input(page, Array.from({ length: 48 }, (_, i) => 48 - i).join(", "));
  await expect(page.locator('[data-testid^="element-"]')).toHaveCount(48);
  const region = page.getByRole("region", {
    name: "Scrollable algorithm visualization",
  });
  expect(
    await region.evaluate((node) => node.scrollWidth > node.clientWidth),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await region.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Timeline", { exact: true })).toHaveValue("0");
  await expect
    .poll(() => region.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Collapse pseudocode" }).click();
  await expect(
    page.getByRole("list", { name: "Bubble Sort pseudocode" }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Expand pseudocode" }).click();
  await expect(
    page.getByRole("list", { name: "Bubble Sort pseudocode" }),
  ).toBeVisible();
});

test("navigation pauses execution while preserving the workspace", async ({
  page,
}) => {
  await input(page, "3, 2, 1");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: /About Itera/ }).click();
  await page.getByRole("button", { name: /Playground/ }).click();
  await expect(
    page.getByLabel("Execution status", { exact: true }),
  ).not.toHaveText("Playing");
  await expect(page.getByLabel("Array values", { exact: true })).toHaveValue(
    "3, 2, 1",
  );
});

test("cached replay stops at completion and repeated end traverses the entire cache", async ({
  page,
}) => {
  await input(page, Array.from({ length: 12 }, (_, i) => 12 - i).join(", "));
  await end(page);
  const finalIndex = await page
    .getByLabel("Timeline", { exact: true })
    .inputValue();
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await end(page);
  await expect(page.getByLabel("Timeline", { exact: true })).toHaveValue(
    finalIndex,
  );
  await input(page, "");
  await end(page);
  await page.getByRole("button", { name: "Restart", exact: true }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByLabel("Execution status", { exact: true })).toHaveText(
    "Completed",
  );
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toHaveCount(0);
});
