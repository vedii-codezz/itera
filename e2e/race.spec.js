import { test, expect } from "@playwright/test";
let errors;
const race = (page) =>
  page.getByRole("region", { name: "Race workspace", exact: true });
const lane = (page, label) =>
  race(page).getByRole("region", {
    name: `Algorithm ${label} lane`,
    exact: true,
  });
async function input(page, text) {
  await race(page).getByLabel("Race array values", { exact: true }).fill(text);
  await race(page)
    .getByRole("button", { name: "Apply input", exact: true })
    .click();
}
async function finish(page) {
  await race(page)
    .getByRole("button", { name: "Finish race", exact: true })
    .click();
  await expect(
    race(page).getByLabel("Race status", { exact: true }),
  ).toHaveText("Completed");
}
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await page.getByRole("button", { name: /^Race Mode/ }).click();
  await expect(
    race(page).getByRole("heading", { name: "Algorithm Race" }),
  ).toBeVisible();
  await expect(
    race(page).getByLabel("Race status", { exact: true }),
  ).toHaveText("Ready");
});
test.afterEach(() => expect(errors).toEqual([]));
test("sorting choices, operation comparison, real final summary and identical algorithms", async ({
  page,
}) => {
  const root = race(page);
  for (const label of ["Algorithm A", "Algorithm B"])
    await expect(
      root.getByLabel(label, { exact: true }).locator("option"),
    ).toHaveCount(4);
  await input(page, "3, 2, 1");
  await finish(page);
  await expect(root.getByLabel("Comparison summary status")).toHaveText(
    "Final results",
  );
  await expect(root.locator('[data-metric="swaps"]')).toContainText("3");
  await expect(root.locator('[data-metric="swaps"]')).toContainText("1");
  await expect(
    root.getByText("Both algorithms produced the same sorted output.", {
      exact: true,
    }),
  ).toBeVisible();
  await root
    .getByRole("button", { name: "Operation Comparison", exact: true })
    .click();
  await expect(
    root.getByRole("button", { name: "Operation Comparison", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await root
    .getByLabel("Algorithm A", { exact: true })
    .selectOption("insertion-sort");
  await root
    .getByLabel("Algorithm B", { exact: true })
    .selectOption("merge-sort");
  await finish(page);
  await expect(lane(page, "A").getByTestId("metric-writes")).toContainText("5");
  await expect(lane(page, "A").getByTestId("metric-swaps")).toHaveCount(0);
  await expect(root.locator('[data-metric="swaps"]')).toHaveCount(0);
  await root
    .getByLabel("Algorithm A", { exact: true })
    .selectOption("quick-sort");
  await root
    .getByLabel("Algorithm B", { exact: true })
    .selectOption("quick-sort");
  await input(page, "2, -1, 2, 0");
  await finish(page);
  await expect(root.locator(".race-result")).toContainText("[-1, 0, 2, 2]");
  await expect(lane(page, "A").getByTestId("metric-comparisons")).toHaveText(
    await lane(page, "B").getByTestId("metric-comparisons").textContent(),
  );
});
test("one clock supports pause rewind step speed seek resume finish and cached restart", async ({
  page,
}) => {
  const root = race(page);
  await root.getByRole("button", { name: "Start race", exact: true }).click();
  await expect(
    root.getByLabel("Race timeline", { exact: true }),
  ).not.toHaveValue("0");
  await root.getByRole("button", { name: "Pause race", exact: true }).click();
  const position = await root
    .getByLabel("Race timeline", { exact: true })
    .inputValue();
  const left = await lane(page, "A")
      .getByLabel("Lane explanation")
      .textContent(),
    right = await lane(page, "B").getByLabel("Lane explanation").textContent();
  await root
    .getByRole("button", { name: "Previous race step", exact: true })
    .click();
  await root
    .getByRole("button", { name: "Next race step", exact: true })
    .click();
  await expect(root.getByLabel("Race timeline", { exact: true })).toHaveValue(
    position,
  );
  await expect(lane(page, "A").getByLabel("Lane explanation")).toHaveText(left);
  await expect(lane(page, "B").getByLabel("Lane explanation")).toHaveText(
    right,
  );
  await root.getByLabel("Race speed", { exact: true }).fill("4");
  await root.getByRole("button", { name: "Resume race", exact: true }).click();
  await root.getByLabel("Race timeline", { exact: true }).fill("0");
  await expect(root.getByLabel("Race status", { exact: true })).toHaveText(
    "Ready",
  );
  await finish(page);
  const final = await root
    .getByLabel("Race timeline", { exact: true })
    .inputValue();
  await root.getByRole("button", { name: "Restart race", exact: true }).click();
  await expect(root.getByLabel("Race timeline", { exact: true })).toHaveValue(
    "0",
  );
  await finish(page);
  await expect(root.getByLabel("Race timeline", { exact: true })).toHaveValue(
    final,
  );
});
test("edits and selection switches stop old sessions and preserve helpful validation", async ({
  page,
}) => {
  const root = race(page);
  await root.getByRole("button", { name: "Start race", exact: true }).click();
  await root.getByLabel("Race array values", { exact: true }).fill("1,,2");
  await root.getByRole("button", { name: "Apply input", exact: true }).click();
  await expect(root.getByRole("alert")).toContainText("whole numbers");
  await expect(
    root.getByRole("button", { name: /^(Start|Resume) race$/ }),
  ).toBeDisabled();
  await input(page, "9, 2");
  await root.getByRole("button", { name: "Start race", exact: true }).click();
  await root
    .getByLabel("Algorithm A", { exact: true })
    .selectOption("merge-sort");
  await root
    .getByLabel("Algorithm B", { exact: true })
    .selectOption("insertion-sort");
  await expect(root.getByLabel("Race status", { exact: true })).toHaveText(
    "Ready",
  );
  await expect(lane(page, "A").getByTestId("element-0")).toHaveAttribute(
    "data-value",
    "9",
  );
  await expect(lane(page, "B").getByTestId("element-0")).toHaveAttribute(
    "data-value",
    "9",
  );
  await root.getByLabel("Race length", { exact: true }).fill("49");
  await input(page, "4, 1");
  await expect(lane(page, "A").getByTestId("element-0")).toHaveAttribute(
    "data-value",
    "4",
  );
  await root.getByLabel("Race length", { exact: true }).fill("12");
  await root
    .getByRole("button", { name: "Generate input", exact: true })
    .click();
  await expect(root.getByLabel("Race timeline", { exact: true })).toHaveValue(
    "0",
  );
  await root.getByRole("button", { name: "Reset input", exact: true }).click();
  await expect(
    root.getByLabel("Race array values", { exact: true }),
  ).toHaveValue("8, 3, 6, 1, 5, 2, 7, 4");
  await input(page, "");
  await finish(page);
  await expect(root.locator(".race-result")).toContainText("[]");
});
test("shared value scale, dense local scrolling and responsive stacking", async ({
  page,
}, info) => {
  const root = race(page);
  await root
    .getByLabel("Algorithm A", { exact: true })
    .selectOption("insertion-sort");
  await input(page, "-1, -9");
  for (let i = 0; i < 3; i++)
    await root
      .getByRole("button", { name: "Next race step", exact: true })
      .click();
  await expect(
    lane(page, "A").getByTestId("element-1").locator("rect"),
  ).toHaveAttribute("height", "20");
  await expect(
    lane(page, "B").getByTestId("element-1").locator("rect"),
  ).toHaveAttribute("height", "20");
  await input(page, Array.from({ length: 48 }, (_, i) => 48 - i).join(", "));
  const a = await lane(page, "A").boundingBox(),
    b = await lane(page, "B").boundingBox();
  if (info.project.name === "desktop") {
    expect(b.x).toBeGreaterThan(a.x);
    expect(Math.abs(b.y - a.y)).toBeLessThan(2);
  } else expect(b.y).toBeGreaterThan(a.y + a.height);
  for (const label of ["A", "B"]) {
    await expect(
      lane(page, label).locator('[data-testid^="element-"]'),
    ).toHaveCount(48);
    const scroll = lane(page, label).getByRole("region", {
      name: "Scrollable algorithm visualization",
    });
    expect(await scroll.evaluate((n) => n.scrollWidth > n.clientWidth)).toBe(
      true,
    );
  }
  const scroll = lane(page, "A").getByRole("region", {
    name: "Scrollable algorithm visualization",
  });
  await scroll.focus();
  await page.keyboard.press("ArrowRight");
  await expect(root.getByLabel("Race timeline", { exact: true })).toHaveValue(
    "0",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("themes motion navigation and screenshots retain the paired workspace", async ({
  page,
}, info) => {
  const root = race(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await root.getByRole("button", { name: "Start race", exact: true }).click();
  await expect(
    lane(page, "A").locator(".snapshot-visualization"),
  ).toHaveAttribute("data-animate", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    lane(page, "A").locator(".snapshot-visualization"),
  ).toHaveAttribute("data-animate", "false");
  await page.getByRole("button", { name: /^Playground/ }).click();
  await page.getByRole("button", { name: /^Race Mode/ }).click();
  await expect(root.getByLabel("Race status", { exact: true })).not.toHaveText(
    "Running",
  );
  await expect(
    root.getByLabel("Race array values", { exact: true }),
  ).toHaveValue("8, 3, 6, 1, 5, 2, 7, 4");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await root
    .getByRole("button", { name: "Next race step", exact: true })
    .click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `docs/media/phase5-${info.project.name}.png`,
    fullPage: true,
  });
});
