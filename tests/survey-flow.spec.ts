import { expect, test } from "@playwright/test";

test("signed-out visitors are returned to the branded home page from protected survey routes", async ({ page }) => {
  await page.goto("/personalitysurvey");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("main").getByRole("link", { name: "Start a survey" }).first()).toBeVisible();

  await page.goto("/personalitysurvey/dashboard");
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/survey");
  await expect(page).toHaveURL(/\/$/);
});
