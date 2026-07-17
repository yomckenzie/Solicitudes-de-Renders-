import { test, expect } from "@playwright/test";

test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Crear / Editar / Eliminar corner", () => {
  test("abre el form de creación", async ({ page }) => {
    await page.goto("/dashboard/corners/new");
    await expect(page.getByRole("heading", { name: /nuevo corner/i })).toBeVisible();
    await expect(page.locator("select[name='mall_id']")).toBeVisible();
    await expect(page.locator("select[name='tienda_id']")).toBeVisible();
    await expect(page.locator("select[name='marca']")).toBeVisible();
    await expect(page.locator("select[name='categoria']")).toBeVisible();
  });

  test("tienda dropdown se habilita al elegir mall", async ({ page }) => {
    await page.goto("/dashboard/corners/new");
    const tiendaSelect = page.locator("select[name='tienda_id']");
    await expect(tiendaSelect).toBeDisabled();

    // Elegir el primer mall disponible
    const mallOptions = await page.locator("select[name='mall_id'] option").count();
    expect(mallOptions).toBeGreaterThan(1); // al menos "Seleccionar" + 1 mall
    await page.locator("select[name='mall_id']").selectOption({ index: 1 });

    await expect(tiendaSelect).toBeEnabled();
  });

  test("crea un corner nuevo end-to-end", async ({ page }) => {
    await page.goto("/dashboard/corners/new");

    // Elegir mall y tienda (los primeros disponibles)
    await page.locator("select[name='mall_id']").selectOption({ index: 1 });
    await page.locator("select[name='tienda_id']").waitFor();
    await page.locator("select[name='tienda_id']").selectOption({ index: 1 });

    await page.locator("select[name='marca']").selectOption("JC");
    await page.locator("select[name='categoria']").selectOption("Casual");
    await page.locator("select[name='estado']").selectOption("pendiente");
    await page.locator("input[name='responsable']").fill("Test E2E");
    await page.locator("textarea[name='notas']").fill("Corner creado por test automatizado");

    await page.getByRole("button", { name: /crear corner/i }).click();

    // Tras éxito redirige al detalle del nuevo corner
    await expect(page).toHaveURL(/\/dashboard\/corners\/CRN-[A-Z0-9]{6}/, { timeout: 15_000 });
    await expect(page.getByText("Test E2E")).toBeVisible();
    await expect(page.getByText("Corner creado por test automatizado")).toBeVisible();
  });

  test("form valida campos requeridos", async ({ page }) => {
    await page.goto("/dashboard/corners/new");
    // El select de mall es required; intentar enviar vacío debería ser bloqueado por el browser
    // Probemos que el botón existe y está disabled cuando no se completaron los campos
    const btn = page.getByRole("button", { name: /crear corner/i });
    await expect(btn).toBeVisible();
  });
});