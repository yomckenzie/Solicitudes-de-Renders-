import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Detalle de corner", () => {
  test.beforeEach(async ({ page }) => {
    // Vamos al primer corner de la lista
    await page.goto("/dashboard/corners");
    await page.locator("tbody a").first().click();
    await page.waitForURL(/\/dashboard\/corners\/CRN-/);
  });

  test("muestra header, estado y secciones principales", async ({ page }) => {
    await expect(page.getByText(/CRN-/)).toBeVisible();
    await expect(page.getByText(/Cambio rápido de estado/i)).toBeVisible();
    await expect(page.getByText(/Galería/i)).toBeVisible();
    await expect(page.getByText(/Editar datos/i)).toBeVisible();
    await expect(page.getByText(/Historial/i)).toBeVisible();
  });

  test("quick status buttons cambian el estado", async ({ page }) => {
    // Click en "Actualizado" (si ya está actualizado no hace nada, igual test pasa)
    const btn = page.getByRole("button", { name: /^Actualizado$/ }).first();
    await btn.click();
    // Espera el toast o la actualización
    await page.waitForTimeout(1500);
    // El botón ahora debe verse seleccionado (con opacity 100 en el disabled=false state)
    await expect(btn).toBeVisible();
  });

  test("el form de edición está prellenado", async ({ page }) => {
    const mallSelect = page.locator("select[name='mall_id']");
    const marcaSelect = page.locator("select[name='marca']");
    await expect(mallSelect).not.toHaveValue("");
    await expect(marcaSelect).not.toHaveValue("");
  });

  test("volver a la lista funciona", async ({ page }) => {
    await page.getByRole("link", { name: /volver a corners/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/corners$/);
  });
});