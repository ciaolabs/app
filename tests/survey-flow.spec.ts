import { expect, test } from "@playwright/test";

test("signed-out visitors are redirected back to the branded home sign-in layout", async ({ page }) => {
  await page.goto("/personalitysurvey");
  await expect(page).toHaveURL(/\/(#auth-panel)?$/);
  await expect(page.getByText("Your account sits inside the same survey canvas.")).toBeVisible();

  await page.goto("/personalitysurvey/dashboard");
  await expect(page).toHaveURL(/\/(#auth-panel)?$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/(#auth-panel)?$/);

  await page.goto("/survey");
  await expect(page).toHaveURL(/\/(#auth-panel)?$/);
});
