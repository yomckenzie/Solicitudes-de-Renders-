import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

// Estos tests requieren rol superadmin o gerente.
// Se saltan automáticamente si el usuario de prueba es supervisor.
test.describe("Admin (requiere superadmin o gerente)", () => {
  test.beforeEach(async ({ page }) => {
    // Detectar el rol del usuario actual desde la barra lateral
    await page.goto("/dashboard");
    const sidebarText = await page.locator("aside").innerText().catch(() => "");

    if (!/superadmin|gerente/i.test(sidebarText)) {
      test.skip(true, "Usuario actual no es superadmin ni gerente. Skipping admin tests.");
      return;
    }
  });

  test("Malls/Tiendas visible en sidebar y carga", async ({ page }) => {
    await page.getByRole("link", { name: /malls\/tiendas/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/malls/);
    await expect(page.getByRole("heading", { name: /malls y tiendas/i })).toBeVisible();
    // El seed trae 8 malls
    await expect(page.getByText(/MALL-/)).toHaveCount(8, { timeout: 10_000 });
  });

  test("form de crear mall funciona", async ({ page }) => {
    await page.goto("/dashboard/malls");

    const idInput = page.locator("input[name='id']").first();
    await idInput.fill("MALL-TEST");

    const nombreInputs = page.locator("input[name='nombre']");
    await nombreInputs.first().fill("Mall de Prueba E2E");

    const ciudadInputs = page.locator("input[name='ciudad']");
    await ciudadInputs.first().fill("Ciudad Test");

    await page.getByRole("button", { name: /agregar mall/i }).click();

    // Espera a que aparezca en la lista
    await expect(page.getByText("Mall de Prueba E2E")).toBeVisible({ timeout: 10_000 });
  });

  test("Usuarios visible y lista existe", async ({ page }) => {
    await page.getByRole("link", { name: /usuarios/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/users/);
    await expect(page.getByRole("heading", { name: /usuarios/i })).toBeVisible();
    // Al menos debe estar el usuario logueado
    await expect(page.locator("table")).toBeVisible();
  });

  test("Configuración carga", async ({ page }) => {
    await page.getByRole("link", { name: /configuración/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    await expect(page.getByText(/catálogos del sistema/i)).toBeVisible();
  });
});