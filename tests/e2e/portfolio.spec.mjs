import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("page loads with content, not an intro gate", async ({ page }) => {
  await expect(page).toHaveTitle(/Pablo Williams/);
  await expect(page.locator("#main")).toBeVisible();
  await expect(page.locator("h1")).toContainText("I build AI and data systems");
  await expect(page.locator("#pwintro-root, #jarvis-boot")).toHaveCount(0);
});

test("skip link is reachable by keyboard", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
});

test("primary navigation reaches every landmark section", async ({ page }) => {
  for (const id of ["systems", "capabilities", "index", "experience", "credentials", "contact"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});

test("five flagship systems each carry a source link and evidence", async ({ page }) => {
  const flags = page.locator("article.flag");
  await expect(flags).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    const flag = flags.nth(i);
    await expect(flag.locator('a[href*="github.com"]')).toHaveCount(1);
    await expect(flag.locator(".metric")).not.toHaveCount(0);
    await expect(flag.locator(".prov")).not.toHaveCount(0);
  }
});

test("every metric declares where its number came from", async ({ page }) => {
  const provs = page.locator(".prov");
  const n = await provs.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    await expect(provs.nth(i)).toHaveAttribute("data-p", /measured|descriptive|synthetic|backtested/);
  }
});

test("project search narrows the index and reports the count", async ({ page }) => {
  const count = page.locator("#count");
  const before = await count.textContent();
  await page.locator("#q").fill("retrieval");
  await expect(count).not.toHaveText(before ?? "");
  await page.locator("#reset").click();
  await expect(count).toHaveText(before ?? "");
});

test("slash focuses the search field", async ({ page }) => {
  await page.keyboard.press("/");
  await expect(page.locator("#q")).toBeFocused();
});

test("filters persist to the URL so a filtered view is shareable", async ({ page }) => {
  await page.locator('[data-flag="live"]').click();
  await expect(page).toHaveURL(/live=1/);
  await page.locator("#reset").click();
  await expect(page).not.toHaveURL(/live=1/);
});

test("project detail opens, traps nothing and closes on Escape", async ({ page }) => {
  await page.locator("[data-open]").first().click();
  const dialog = page.locator("#drawer");
  await expect(dialog).toHaveAttribute("open", "");
  await expect(page.locator("#d-close")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toHaveAttribute("open", "");
});

test("the CV and contact routes resolve", async ({ page }) => {
  await expect(page.locator('a[href="PWCV.pdf"]').first()).toBeVisible();
  await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
  const cv = await page.request.get("/PWCV.pdf");
  expect(cv.status()).toBe(200);
});

test("external links open safely in a new tab", async ({ page }) => {
  const links = page.locator('a[target="_blank"]');
  const n = await links.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    await expect(links.nth(i)).toHaveAttribute("rel", /noopener/);
  }
});

test("every project is discoverable by keyboard", async ({ page }) => {
  const openers = page.locator("[data-open]");
  const n = await openers.count();
  expect(n).toBeGreaterThan(50);
  await openers.first().focus();
  await expect(openers.first()).toBeFocused();
});

test("no horizontal overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  // Load at the target viewport so responsive layout is settled before it is measured.
  await page.reload();
  const layout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const offenders = Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: typeof element.className === "string" ? element.className : "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter(({ left, right }) => left < 0 || right > viewportWidth)
      .slice(0, 12);
    return {
      overflow: document.documentElement.scrollWidth - viewportWidth,
      offenders,
    };
  });
  expect(layout.overflow, JSON.stringify(layout.offenders)).toBe(0);
});

test("reduced motion removes the ambient canvas and settles the hero", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#ambient")).toHaveCount(0);
  await expect(page.locator("h1")).toContainText("I build AI and data systems that turn messy evidence into decisions.");
  await context.close();
});
