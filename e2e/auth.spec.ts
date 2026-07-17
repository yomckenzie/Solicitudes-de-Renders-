import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("redirige a /login cuando no hay sesión", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /ingresar/i })).toBeVisible();
  });

  test("muestra error con credenciales inválidas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("noexiste@cornerMaster.test");
    await page.getByLabel("Contraseña").fill("password-equivocada-123");
    await page.getByRole("button", { name: /ingresar/i }).click();
    await expect(page.getByText(/incorrectos/i)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("login válido redirige al dashboard", async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await page.getByRole("button", { name: /ingresar/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });

  test("logout limpia la sesión", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Total Corners/i)).toBeVisible();
    await page.getByRole("button", { name: /cerrar sesión/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});