import { test, expect } from "@playwright/test";

// Helper: limpia cookies antes de cada test que usa storage state
test.use({ storageState: "playwright/.auth/user.json" });

test.describe("Dashboard", () => {
  test("carga sin errores de consola ni de red", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("requestfailed", (req) => {
      // Ignorar service worker que puede fallar en headless
      if (!req.url().endsWith("/sw.js")) {
        failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
      }
    });

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /resumen/i })).toBeVisible();
    await expect(page.getByText(/Total Corners/i)).toBeVisible();
    await expect(page.getByText(/Malls/i)).toBeVisible();

    // Filtra errores conocidos (Supabase warnings de anon en dev, etc.)
    const realErrors = consoleErrors.filter(
      (e) => !/manifest|favicon|sw\.js/i.test(e)
    );
    expect(realErrors, `Console errors:\n${realErrors.join("\n")}`).toEqual([]);
    expect(failedRequests, `Failed requests:\n${failedRequests.join("\n")}`).toEqual([]);
  });

  test("muestra el donut de estados", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Distribución por estado/i)).toBeVisible();
    // El donut usa Recharts (SVG)
    await expect(page.locator(".recharts-pie").first()).toBeVisible({ timeout: 10_000 });
  });

  test("lista de últimos actualizados", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Últimos actualizados/i)).toBeVisible();
    // Al menos un corner en la lista (los 15 del seed)
    await expect(page.locator("li").filter({ hasText: /CRN-/ }).first()).toBeVisible();
  });

  test("link 'Ver todos' navega a /dashboard/corners", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /ver todos/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/corners/);
  });
});