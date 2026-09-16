import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("publishes a specific title and main heading", async ({ page }) => {
  await expect(page).toHaveTitle(/Pablo Williams/);
  await expect(page.locator("main h1")).toBeVisible();
});

test("opens directly without an intro gate", async ({ page }) => {
  await expect(page.locator("#pwintro-root, #jarvis-boot")).toHaveCount(0);
  await expect(page.locator("main")).toBeVisible();
});

test("skip link points to the main landmark", async ({ page }) => {
  await expect(page.locator("a.skip-link")).toHaveAttribute("href", "#main");
  await expect(page.locator("main#main")).toHaveCount(1);
});

test("every primary navigation hash resolves", async ({ page }) => {
  const hrefs = await page.locator("nav[aria-label='Primary'] a[href^='#']").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(5);
  for (const href of hrefs) await expect(page.locator(href)).toHaveCount(1);
});

test("CV download points to a published PDF", async ({ page, request }) => {
  const link = page.locator("a[href='PWCV.pdf']");
  await expect(link).toHaveAttribute("download", "PWCV.pdf");
  const response = await request.get("/PWCV.pdf");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/pdf");
});

test("featured work exposes live and source links", async ({ page }) => {
  const first = page.locator("#work .live-card").first();
  await expect(first).toBeVisible();
  await expect(first.locator("a.go")).toHaveAttribute("href", /^https:\/\//);
  await expect(first.locator("a.src")).toHaveAttribute("href", /^https:\/\/github\.com\//);
});

test("research filter changes the visible set", async ({ page }) => {
  const buttons = page.locator("#research [data-filter]");
  expect(await buttons.count()).toBeGreaterThan(1);
  const cards = page.locator("#research-grid .r-card");
  const total = await cards.count();
  await buttons.nth(1).click();
  await expect.poll(async () => cards.evaluateAll((nodes) => nodes.filter((node) => getComputedStyle(node).display !== "none").length)).toBeLessThan(total);
});

test("command palette opens from the documented shortcut", async ({ page }) => {
  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
  await expect(page.locator("#palette-modal")).toBeVisible();
  await expect(page.locator("#palette-input")).toBeFocused();
});

test("contact section provides email, LinkedIn and GitHub", async ({ page }) => {
  await expect(page.locator("#contact a[href^='mailto:']")).toHaveCount(1);
  await expect(page.locator("#contact a[href*='linkedin.com']")).toHaveCount(1);
  await expect(page.locator("#contact a[href*='github.com']")).toHaveCount(1);
});

test("mobile menu expands accessibly", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  const toggle = page.locator(".menu-toggle");
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#nav-list")).toHaveClass(/is-open/);
});

test("mobile layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
});

test("reduced motion leaves core content usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("#work .live-card").first()).toBeVisible();
});
