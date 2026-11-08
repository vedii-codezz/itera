import { test, expect } from "@playwright/test";
const pages = ["Playground", "Race Mode", "Algorithm Library", "About Itera"];
test("Phase 5.5 themes, navigation, registry actions and visual captures", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const theme of ["dark", "light"]) {
    if (theme === "light")
      await page.getByRole("button", { name: "Switch to light theme" }).click();
    const expected =
      theme === "dark" ? "rgb(11, 11, 14)" : "rgb(241, 237, 230)";
    expect(
      await page
        .locator("html")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe(expected);
    for (const name of pages) {
      await page
        .getByRole("navigation")
        .getByRole("button", { name, exact: true })
        .click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `docs/media/phase55-${info.project.name}-${name.split(" ")[0].toLowerCase()}-${theme}.png`,
        fullPage: true,
      });
      if (name === "Algorithm Library") {
        await page
          .getByRole("button", { name: "Inspect Quick Sort", exact: true })
          .click();
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(
          "Quick Sort",
        );
        await page.screenshot({
          path: `docs/media/phase55-${info.project.name}-detail-${theme}.png`,
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "Play in Playground", exact: true })
          .click();
        await expect(page.getByLabel("Algorithm", { exact: true })).toHaveValue(
          "quick-sort",
        );
      }
    }
  }
  expect(errors).toEqual([]);
});
test("320px and tablet contain all screens and preserve focus navigation", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of pages) {
      await page
        .getByRole("navigation")
        .getByRole("button", { name, exact: true })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Algorithm Library", exact: true })
      .click();
    await page.getByLabel("Filter algorithms").fill("binary");
    await expect(page.locator(".algorithm-card")).toHaveCount(1);
    await page
      .getByRole("button", { name: "Open Binary Search in Playground" })
      .click();
    await expect(page.getByLabel("Algorithm", { exact: true })).toHaveValue(
      "binary-search",
    );
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "Algorithm Library", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Inspect Kadane’s Algorithm", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
