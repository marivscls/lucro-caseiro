// Local-only browser verification; all external requests are intercepted.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");
loadEnvFile(path.join(__dirname, "../.env"));
const base = process.env.VALIDATION_PREVIEW_URL || "http://localhost:8093";
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
const scenario = process.env.CATALOG_SCENARIO || "populated";
const out = path.resolve(__dirname, "../../../docs/catalog-ui-validation");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of scenario === "populated" ? [320, 390, 500, 768, 1440] : [390]) {
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
            JSON.stringify({ catalog: { dismissed: true } }),
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
        let result = pageData();
        if (p === "/products")
          result = pageData(
            Array.from({ length: scenario === "empty" ? 0 : 18 }, (_, index) => ({
              id: "product-" + index,
              userId: id,
              name: ["Bolo de chocolate", "Brigadeiro artesanal", "Bolo de cenoura"][
                index % 3
              ],
              category: "Doces",
              salePrice: 25,
              costPrice: 10,
              publicEnabled: index < 17,
              isActive: true,
              variations: [],
              addOns: [],
              photoUrl: null,
            })),
          );
        else if (p === "/orders/services")
          result = pageData(
            Array.from({ length: scenario === "empty" ? 0 : 4 }, (_, index) => ({
              id: "service-" + index,
              userId: id,
              name: "Decoração de festas",
              durationMinutes: 60,
              defaultPrice: 150,
              active: true,
              publicEnabled: true,
            })),
          );
        else if (p === "/materials")
          result = pageData(
            Array.from({ length: scenario === "empty" ? 0 : 16 }, (_, index) => ({
              id: `material-${index}`,
              userId: id,
              name: index === 0 ? "Morango" : `Farinha ${index}`,
              unit: "kg",
              stockQuantity: index === 0 ? 1 : 10,
              stockAlertThreshold: 1,
              costPerUnit: 10,
              contentPerUnit: null,
              contentUnit: null,
              notes: null,
              icon: null,
              createdAt: "2026-01-01T00:00:00Z",
            })),
          );
        else if (p === "/subscription/profile")
          result = {
            id,
            userId: id,
            name: "Teste",
            businessName: "Ateliê",
            businessType: "crafts",
            plan: "professional",
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
            enabled: scenario !== "disabled",
            brandId: "lucro-caseiro",
            whatsapp: null,
            customization: null,
          };
        return route.fulfill({ json: result, headers });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.setDefaultNavigationTimeout(120000);
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base + "/catalog", { waitUntil: "domcontentloaded" });
      await page.getByTestId("catalog-hero-wrapper").waitFor({ timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      await page.getByRole("tab", { name: /Produtos,/ }).waitFor();
      await page.screenshot({
        path: path.join(out, "catalog-" + scenario + "-" + width + ".png"),
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow) throw new Error("Horizontal overflow at " + width);
      const art = await page.getByTestId("catalog-hero-illustration").boundingBox();
      const hero = await page.getByTestId("catalog-hero-wrapper").boundingBox();
      if (
        !art ||
        art.width < 100 ||
        art.x < hero.x ||
        art.x + art.width > hero.x + hero.width + 1
      )
        throw new Error("Illustration bounds at " + width);
      await page
        .getByRole("button", { name: "Mais opções do catálogo", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Fechar mais opções", exact: true })
        .last()
        .click();
      await page
        .getByRole("button", { name: "Fechar mais opções", exact: true })
        .last()
        .waitFor({ state: "hidden" });
      await page
        .getByRole("tab", { name: /Serviços,/ })
        .evaluate((el) => el.scrollIntoView({ block: "center" }));
      await page.getByRole("tab", { name: /Serviços,/ }).click();
      if (scenario === "empty")
        await page
          .getByText("Cadastre serviços para escolher quais aparecem na vitrine.", {
            exact: true,
          })
          .waitFor();
      else await page.getByText("Decoração de festas", { exact: true }).first().waitFor();
      await page.getByRole("tab", { name: /Produtos,/ }).click();
      await page.getByRole("button", { name: "Organizar", exact: true }).click();
      await page.getByRole("button", { name: "Concluir", exact: true }).waitFor();
      if (scenario === "disabled") {
        await page.getByText("Link desativado", { exact: true }).waitFor();
        if (
          !(await page
            .getByRole("button", { name: "Ver como cliente", exact: true })
            .isDisabled())
        )
          throw new Error("Preview should be disabled");
      }
      await page.screenshot({
        path: path.join(out, "catalog-content-" + scenario + "-" + width + ".png"),
      });
      if (errors.length) throw new Error(errors.join("\n"));
      if (writes.length) throw new Error("Unexpected writes: " + writes.join(","));
      console.log(
        JSON.stringify({
          width,
          scenario,
          heroHeight: hero.height,
          illustrationWidth: art.width,
          overflow,
          checks: ["illustration", "menu", "tabs", "organize"],
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
