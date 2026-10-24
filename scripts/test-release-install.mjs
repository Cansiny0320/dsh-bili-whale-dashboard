import { expect } from "@playwright/test";
import fs from "node:fs";

export async function installReleaseInDsh(page, spec, origin) {
  await page.getByRole("button", { name: "继续", exact: true }).click();
  await page.getByRole("button", { name: "继续", exact: true }).waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  await page.getByRole("button", { name: "关闭", exact: true }).waitFor({ state: "hidden" });
  fs.writeFileSync("outputs/dsh-install-ui.txt", await page.locator("body").innerText());
  await page.screenshot({ path: "outputs/dsh-install-start.png", fullPage: true });
  await page.getByRole("button", { name: "插件", exact: true }).click();
  await page.getByRole("button", { name: "添加插件", exact: true }).click();
  await page.getByRole("dialog").getByRole("textbox").first().fill(spec);
  await page.getByRole("dialog").getByRole("button", { name: "安装", exact: true }).click();
  await page.getByRole("button", { name: "立即启用", exact: true }).click({ timeout: 120000 });
  if (!(await page.getByRole("button", { name: /^设置/ }).isVisible()))
    await page.getByRole("button", { name: "账号菜单", exact: true }).click();
  await page.getByText("设置", { exact: true }).click();
  await page.getByText("鲸鱼娘后台", { exact: true }).first().click();
  const link = page.getByRole("link", { name: "打开鲸鱼娘后台", exact: true });
  await expect(link).toBeVisible();
  const popupPromise = page.waitForEvent("popup");
  await link.click();
  const popup = await popupPromise;
  await expect(popup.locator('main[data-loaded="true"]')).toBeVisible();
  expect(popup.url()).toBe(origin + "/whale-dashboard/");
  await popup.close();
  await page.screenshot({ path: "outputs/dsh-release-entry.png", fullPage: true });
  await page.route("**/dsh-bili/api/settings", (route) =>
    route.fulfill({ status: 404, body: "Missing" }),
  );
  await page.getByText("养鱼", { exact: true }).first().click();
  await page.getByText("鲸鱼娘后台", { exact: true }).first().click();
  await expect(page.getByRole("status")).toContainText("请先在 DSH 中安装并启用");
  await page.unroute("**/dsh-bili/api/settings");
  await page.getByRole("button", { name: "重新检查", exact: true }).click();
  await expect(link).toBeVisible();
  console.log(
    "PASS DSH UI tarball install, activation, dashboard entry and missing-original guidance",
  );
}
