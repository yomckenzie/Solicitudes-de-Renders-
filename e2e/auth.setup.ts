// =====================================================================
// CornerMaster — Playwright setup
// Loguea con el usuario de prueba y guarda la sesión.
// Luego todos los specs la reutilizan vía storageState.
// =====================================================================

import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "playwright/.auth/user.json";

export async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: /ingresar/i }).click();
  // El signIn redirige a /dashboard tras éxito
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

setup("authenticate as test user", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Faltan variables TEST_USER_EMAIL y TEST_USER_PASSWORD.\n" +
      "Copiá .env.test.example a .env.test y completá las credenciales."
    );
  }

  await loginAs(page, email, password);

  // Verificación mínima: estamos en el dashboard
  await expect(page).toHaveURL(/\/dashboard/);

  // Sanity: debe haber al menos un KPI visible
  await expect(page.getByText(/Total Corners/i)).toBeVisible({ timeout: 10_000 });

  await page.context().storageState({ path: AUTH_FILE });
});