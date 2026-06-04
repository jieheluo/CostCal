import { expect, test } from "@playwright/test";

test("runs the MVP flow through workbench and Excel exports", async ({ page }) => {
  await page.goto("/imports");
  await expect(page.getByRole("heading", { name: "Import Data" })).toBeVisible();

  await page.goto("/materials");
  await expect(page.getByRole("heading", { name: "材料与供应商价格" })).toBeVisible();

  await page.goto("/workbench");
  await expect(page.getByRole("heading", { name: "封装成本测算" })).toBeVisible();

  await page.getByLabel("产品名称").fill("QFN Acceptance Product");
  await page.getByLabel("版本").fill("A");
  await page.getByRole("button", { name: "创建项目" }).click();
  await expect(page.getByText("项目已创建")).toBeVisible();

  await page.getByLabel("主材价格").fill("120");
  await page.getByLabel("辅材用量").fill("6");
  await page.getByLabel("辅材单价").fill("0.5");
  await page.getByLabel("制程单颗费用").fill("0.02");
  await page.getByLabel("制造费用批次金额").fill("500");
  await page.getByLabel("制造费用产出K").fill("10");

  await page.getByRole("button", { name: "切换供应商" }).click();
  await expect(page.getByText("当前供应商：Alternative Supplier")).toBeVisible();

  await page.getByRole("button", { name: "刷新估算" }).click();
  await expect(page.getByTestId("total-cost")).toHaveText("193");

  await page.getByRole("button", { name: "生成正式结果" }).click();
  await expect(page.getByTestId("formal-result")).toContainText("v1");

  const internalDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "下载内部明细" }).click();
  expect((await internalDownload).suggestedFilename()).toBe("internal-detail.xlsx");

  const quoteDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "下载简化报价" }).click();
  expect((await quoteDownload).suggestedFilename()).toBe("simplified-quotation.xlsx");
});
