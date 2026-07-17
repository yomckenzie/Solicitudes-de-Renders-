import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Lista de corners", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/corners");
  });

  test("carga la lista con la tabla visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /corners/i }).first()).toBeVisible();
    // El seed carga 15 corners. Al menos debe haber uno.
    await expect(page.getByText(/CRN-/)).toHaveCount(15, { timeout: 10_000 });
  });

  test("filtro por marca JC funciona", async ({ page }) => {
    await page.locator("select").nth(1).selectOption("JC");
    await expect(page).toHaveURL(/marca=JC/);
    // Cada fila visible debe tener marca JC
    const cells = await page.locator("tbody tr td:nth-child(2)").allInnerTexts();
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach((c) => expect(c.trim()).toBe("JC"));
  });

  test("filtro por estado pendiente", async ({ page }) => {
    await page.locator("select").nth(3).selectOption("pendiente");
    await expect(page).toHaveURL(/estado=pendiente/);
    const badges = await page.locator("tbody tr").locator("text=Pendiente").count();
    expect(badges).toBeGreaterThan(0);
  });

  test("búsqueda libre por texto", async ({ page }) => {
    await page.getByPlaceholder(/buscar/i).fill("Andino");
    await page.waitForTimeout(500); // debounce del router
    await expect(page).toHaveURL(/q=Andino/);
    const rows = await page.locator("tbody tr").count();
    expect(rows).toBeGreaterThan(0);
  });

  test("botón limpiar resetea los filtros", async ({ page }) => {
    await page.locator("select").nth(1).selectOption("JC");
    await expect(page).toHaveURL(/marca=JC/);
    await page.getByRole("button", { name: /limpiar/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/corners$/);
  });

  test("link al detalle navega correctamente", async ({ page }) => {
    const firstLink = page.locator("tbody a").first();
    const cornerId = await firstLink.innerText();
    await firstLink.click();
    await expect(page).toHaveURL(/\/dashboard\/corners\/CRN-/);
    await expect(page.getByText(cornerId.trim()).first()).toBeVisible();
  });
});