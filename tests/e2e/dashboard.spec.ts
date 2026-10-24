import { test, expect } from "@playwright/test";
import path from "node:path";
test("six pages render without runtime errors and fit narrow screens", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [route, title] of [
    ["", "概览"],
    ["diaries", "日记"],
    ["reviews", "待审回复"],
    ["persona", "人设与偏好"],
    ["schedule", "作息与监听"],
    ["settings", "设置"],
  ]) {
    await page.goto(route!);
    await expect(page.getByRole("heading", { name: title!, exact: true })).toBeVisible();
    await expect(page.locator('main[data-loaded="true"]')).toBeVisible();
    if (route === "diaries") await expect(page.locator(".markdown")).toBeVisible();
    await page.screenshot({
      path: path.resolve(`outputs/${route || "overview"}-desktop.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["", "diaries", "reviews", "persona", "schedule", "settings"]) {
    await page.goto(route);
    await expect(page.locator('main[data-loaded="true"]')).toBeVisible();
    if (route === "diaries") await expect(page.locator(".markdown")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: path.resolve(`outputs/${route || "overview"}-mobile.png`),
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
test("settings persist, independent persona text persists, and diaries remain distinct", async ({
  page,
}) => {
  await page.goto("settings");
  await page.getByRole("tab", { name: "会话", exact: true }).click();
  await page.getByLabel("会话轮换周期（天）").fill("7");
  await page.getByRole("button", { name: "保存设置", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
  await page.reload();
  await page.getByRole("tab", { name: "会话", exact: true }).click();
  await expect(page.getByLabel("会话轮换周期（天）")).toHaveValue("7");
  await page.goto("persona");
  await page.getByLabel("角色名称", { exact: true }).fill("测试鲸鱼娘");
  await page.getByRole("button", { name: "保存称呼", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
  await page.getByLabel("人设正文", { exact: true }).fill("保持好奇，清楚表达自己的想法。");
  await page.getByRole("button", { name: "保存人设正文", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "人设正文已保存" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("角色名称", { exact: true })).toHaveValue("测试鲸鱼娘");
  await expect(page.getByLabel("人设正文", { exact: true })).toHaveValue(
    "保持好奇，清楚表达自己的想法。",
  );
  await page.goto("diaries");
  await expect(page.locator(".markdown")).toContainText("潮汐");
  await expect(page.locator(".diary-heading time")).toHaveText(/^\d{4}-\d{2}-\d{2}$/);
  await expect(page.locator(".diary-heading h2")).toHaveText("潮汐与小小的光");
  await page.locator(".file-details summary").click();
  await page.getByLabel("显示原文", { exact: true }).check();
  await expect(page.locator(".raw-diary")).toContainText(" · 潮汐与小小的光");
  await page.getByLabel("显示原文", { exact: true }).uncheck();
  await page.locator(".file-details summary").click();
  await page.getByRole("button", { name: "私人日记", exact: true }).click();
  await expect(page.locator(".markdown")).toContainText("留给自己的话");
  await page.getByLabel("搜索日记").fill("不存在的文字");
  await expect(page.getByText("没有找到这段文字。")).toBeVisible();
});
test("approval requires explicit confirmation and cannot be repeated", async ({ page }) => {
  await page.goto("reviews");
  await expect(page.locator(".review-card")).toHaveCount(2);
  await page.getByRole("button", { name: "模拟批准", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "再看一看" }).click();
  await expect(page.locator(".review-card")).toHaveCount(2);
  await page.getByRole("button", { name: "模拟批准", exact: true }).first().click();
  await page.getByRole("button", { name: "确认批准", exact: true }).click();
  await expect(page.locator(".review-card")).toHaveCount(1);
  await expect(page.getByRole("status")).toContainText("未向 B 站发送");
  await page.reload();
  await expect(page.locator(".review-card")).toHaveCount(1);
  await expect(page.locator(".operation-list")).toContainText("模拟发送");
});
test("multiline preferences stay editable and saving another group preserves unsaved input", async ({
  page,
}) => {
  await page.goto("persona");
  await page.locator(".aliases-panel summary").click();
  const aliases = page.getByLabel("别人叫她什么");
  await aliases.fill("小鲸鱼");
  await aliases.press("End");
  await aliases.press("Enter");
  await aliases.pressSequentially("whale");
  await expect(aliases).toHaveValue("小鲸鱼\nwhale");
  await page.goto("settings");
  await page.getByLabel("每日分享额度").fill("4");
  await page.getByRole("tab", { name: "会话", exact: true }).click();
  await page.getByLabel("会话轮换周期（天）").fill("9");
  await page.getByRole("button", { name: "保存设置", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
  await page.getByRole("tab", { name: "分享与推送", exact: true }).click();
  await expect(page.getByLabel("每日分享额度")).toHaveValue("4");
});
