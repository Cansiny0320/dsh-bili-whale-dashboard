import { test, expect } from "@playwright/test";
test("approved desktop layout keeps summary, diary, review and persona information aligned", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("");
  await expect(page.locator(".stat")).toHaveCount(5);
  const metrics = await page
    .locator(".stat")
    .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().top));
  expect(new Set(metrics).size).toBe(1);
  await page.goto("diaries");
  await expect(
    page.locator(".diary-index").getByRole("button", { name: "给你的日记", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".diary-index").getByLabel("搜索日记")).toBeVisible();
  await page.goto("reviews");
  await expect(page.locator(".review-card").first()).toBeVisible();
  const row = page.locator(".review-card").first();
  const source = await row.locator(".review-source").boundingBox();
  const reply = await row.locator(".reply-content").boundingBox();
  const action = await row.locator(".review-actions").boundingBox();
  expect(reply!.x).toBeGreaterThan(source!.x + source!.width);
  expect(action!.x).toBeGreaterThan(reply!.x + reply!.width);
  expect(Math.abs(source!.y - reply!.y)).toBeLessThan(50);
  await page.goto("persona");
  await expect(page.getByLabel("人设正文", { exact: true })).toBeVisible();
  const document = await page.locator(".persona-document").boundingBox();
  const preferences = await page.locator(".persona-preferences").boundingBox();
  expect(preferences!.x).toBeGreaterThan(document!.x + document!.width);
  expect(Math.abs(document!.y - preferences!.y)).toBeLessThan(10);
  expect(document!.y + document!.height).toBeLessThan(850);
  await expect(page.getByLabel("别人叫她什么")).not.toBeVisible();
});
