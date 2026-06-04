import { expect, test } from "@playwright/test";

test("creates a project, edits costs, switches supplier, estimates, and formalizes", async ({ page }) => {
  await page.goto("/workbench");

  await page.getByLabel("产品名称").fill("QFN Demo Product");
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
});
