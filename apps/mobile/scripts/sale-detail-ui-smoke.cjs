// Local-only browser verification; all external requests are intercepted.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");
loadEnvFile(path.join(__dirname, "../.env"));
const base = process.env.VALIDATION_PREVIEW_URL || "http://localhost:8090";
const authHost = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL).hostname;
const id = "00000000-0000-4000-8000-000000000099";
const user = {
  id,
  aud: "authenticated",
  role: "authenticated",
  email: "validation@example.invalid",
  created_at: "2026-01-01T00:00:00Z",
  app_metadata: {},
  user_metadata: {
    name: "Teste",
    onboarding_completed: true,
    business_onboarding: {
      version: 1,
      status: "completed",
      answers: {
        name: "Teste",
        segment: "craft",
        stage: "starting",
        goal: "money",
        channels: [],
      },
    },
  },
};
const token = [
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
  Buffer.from(
    JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 86400 }),
  ).toString("base64url"),
  "test-signature",
].join(".");
const session = {
  access_token: token,
  refresh_token: "local-test-only",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  user,
};
const pageData = (items = []) => ({
  items,
  total: items.length,
  page: 1,
  limit: 100,
  totalPages: 1,
});
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "*",
};
const scenario = process.env.SALES_SCENARIO || "populated";
const out = path.resolve(__dirname, "../../../docs/sale-detail-ui-validation");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of scenario === "populated" ? [320, 390, 482, 1440] : [390]) {
      const context = await browser.newContext({
        viewport: { width, height: 844 },
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      const errors = [];
      await context.addInitScript(
        ({ scenario, id }) => {
          localStorage.setItem("themeMode", scenario === "dark" ? "dark" : "light");
          localStorage.setItem(
            `screen-guidance:v1:${id}`,
            JSON.stringify({ sales: { dismissed: true } }),
          );
        },
        { scenario, id },
      );
      const writes = [];
      await context.addInitScript(
        ({ session, key, id }) => {
          localStorage.setItem(key, JSON.stringify(session));
          localStorage.setItem(
            "onboarding-state",
            JSON.stringify({
              state: {
                completed: true,
                completedUserIds: [id],
                pendingUserIds: [],
                gettingStartedDismissedUserIds: [id],
                gettingStartedStartedUserIds: [],
                gettingStartedCompletedUserIds: [],
                currentStep: 0,
              },
              version: 0,
            }),
          );
        },
        { session, key: `sb-${authHost.split(".")[0]}-auth-token`, id },
      );
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === base) return route.continue();
        if (route.request().method() === "OPTIONS")
          return route.fulfill({ status: 204, headers });
        if (url.hostname === authHost)
          return route.fulfill({
            json: url.pathname.endsWith("/user") ? user : session,
            headers,
          });
        if (!url.pathname.startsWith("/api/v1")) return route.abort();
        const p = url.pathname.replace("/api/v1", "");
        if (
          !["GET", "OPTIONS"].includes(route.request().method()) &&
          !p.includes("analytics")
        )
          writes.push(p);
        if (p.startsWith("/products/"))
          return route.fulfill({
            json: { id: p.split("/").pop(), name: "Marmita", photoUrl: null },
            headers,
          });
        const sale = {
          id: "sale-1",
          userId: id,
          clientId: null,
          clientName:
            scenario === "long"
              ? "Maria Aparecida dos Santos Oliveira — encomendas para eventos"
              : null,
          paymentMethod: "pix",
          status:
            scenario === "pending"
              ? "pending"
              : scenario === "cancelled"
                ? "cancelled"
                : "paid",
          total: scenario === "long" ? 2390 : 24.25,
          subtotal: scenario === "long" ? 2400 : 24.25,
          discount: scenario === "long" ? 10 : 0,
          soldAt: "2026-09-10T02:53:00Z",
          createdAt: "2026-09-10T02:53:00Z",
          notes:
            scenario === "long"
              ? "Entregar na portaria. Separar as embalagens e identificar os sabores para cada convidado."
              : null,
          items: Array.from(
            { length: scenario === "long" ? 5 : scenario === "empty" ? 0 : 1 },
            (_, i) => ({
              id: "item-" + i,
              productId: "product-" + i,
              productName:
                scenario === "long"
                  ? "Marmita artesanal de frango com legumes e arroz integral para eventos"
                  : "Marmita",
              productPhotoUrl: null,
              quantity: 1,
              unitPrice: scenario === "long" ? 480 : 24.25,
              subtotal: scenario === "long" ? 480 : 24.25,
            }),
          ),
        };
        if (p === "/sales/sale-1") return route.fulfill({ json: sale, headers });
        if (p === "/sales") return route.fulfill({ json: pageData([sale]), headers });
        if (p === "/sales/summary/today")
          return route.fulfill({
            json: { totalSales: 1, totalAmount: sale.total, averageTicket: sale.total },
            headers,
          });
        let result = pageData();
        if (p === "/subscription/profile")
          result = {
            id,
            userId: id,
            name: "Teste",
            businessName: "Ateliê",
            businessType: "crafts",
            plan: "free",
            planExpiresAt: "2030-01-01T00:00:00Z",
            createdAt: "2026-01-01T00:00:00Z",
            phone: null,
          };
        else if (p === "/subscription/limits")
          result = {
            maxSalesPerMonth: null,
            maxClients: null,
            maxRecipes: null,
            maxPackaging: null,
            maxProducts: null,
            maxSuppliers: null,
            currentSalesThisMonth: 0,
            currentClients: 0,
            currentRecipes: 0,
            currentPackaging: 0,
            currentProducts: 0,
            currentSuppliers: 0,
          };
        else if (
          p.includes("low-stock") ||
          p.includes("recurring") ||
          p.includes("/orders/services")
        )
          result = [];
        else if (p.includes("analytics")) result = { allowed: false };
        else if (p === "/catalog/settings")
          result = {
            userId: id,
            slug: "teste-local",
            enabled: true,
            brandId: "lucro-caseiro",
            whatsapp: null,
            customization: null,
          };
        return route.fulfill({ json: result, headers });
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base + "/tabs/sales?saleId=sale-1");
      const dialog = page.getByRole("dialog", { name: "Detalhes da venda", exact: true });
      await dialog.waitFor({ timeout: 45000 }).catch(async (error) => {
        console.log((await page.locator("body").innerText()).slice(-5000), errors);
        await page.screenshot({ path: path.join(out, "failure.png") });
        throw error;
      });
      await dialog.getByText("Total da venda", { exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(out, "detail-" + scenario + "-" + width + ".png"),
      });
      const overflow = await dialog.evaluate(
        (el) =>
          [...el.querySelectorAll("*")].filter(
            (n) =>
              n.getBoundingClientRect().width &&
              n.getBoundingClientRect().right > el.getBoundingClientRect().right + 2,
          ).length,
      );
      if (overflow || errors.length) throw Error(JSON.stringify({ overflow, errors }));
      if (scenario === "cancelled") {
        if (
          await dialog.getByRole("button", { name: "Recibo em PDF", exact: true }).count()
        )
          throw Error("Cancelled sale has receipt actions");
      } else {
        await dialog.getByRole("button", { name: "Recibo em PDF", exact: true }).click();
        await page
          .getByText("Seu recibo profissional", { exact: false })
          .waitFor({ timeout: 10000 });
      }
      console.log(
        JSON.stringify({
          width,
          scenario,
          checks: ["detail", "no-overflow", "no-runtime-errors", "receipt-visibility"],
          writes,
        }),
      );
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
