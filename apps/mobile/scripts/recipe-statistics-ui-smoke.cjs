// Local-only browser verification; all external requests are intercepted.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");
loadEnvFile(path.join(__dirname, "../.env"));
const base = process.env.VALIDATION_PREVIEW_URL || "http://localhost:8083";
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
        segment: "food",
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
const scenario = process.env.RECIPE_STATS_SCENARIO || "populated";
const out = path.resolve(__dirname, "../../../docs/recipe-statistics-ui-validation");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of process.env.RECIPE_STATS_WIDTH
      ? [Number(process.env.RECIPE_STATS_WIDTH)]
      : scenario === "populated"
        ? [320, 390, 500, 1440]
        : [390]) {
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
            JSON.stringify({ materials: { dismissed: true } }),
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
        if (p === "/recipes") {
          if (scenario === "error")
            return route.fulfill({
              status: 500,
              json: { message: "Local test error" },
              headers,
            });
          if (scenario === "loading")
            await new Promise((resolve) => setTimeout(resolve, 8000));
          result = pageData(
            scenario === "empty"
              ? []
              : [
                  ["Marmita frango com legumes", 1.12, 110],
                  ["Massa de coxinha", 0.38, 95],
                  ["Bolo de pote morango com chocolate", 6.15, 75],
                  ["Brownie intenso", 0.32, 10],
                  ["Brigadeiro tradicional", 250, 5],
                  ["Receita sem produto", 25, null],
                  ["Massa base", 50, null],
                ].map(([name, cost, sale], index) => ({
                  id: `r${index}`,
                  userId: id,
                  name,
                  category: "Doces",
                  instructions: null,
                  yieldQuantity: 10,
                  yieldUnit: "un",
                  totalCost: cost * 10,
                  costPerUnit: cost,
                  ingredients: [],
                  photoUrl: null,
                  createdAt: "2026-01-01T00:00:00Z",
                })),
          );
        }
        if (p === "/products")
          result = pageData(
            [110, 95, 75, 10, 5].map((salePrice, index) => ({
              id: `p${index}`,
              userId: id,
              name: `Produto ${index}`,
              recipeId: `r${index}`,
              salePrice,
              isActive: true,
            })),
          );
        if (p === "/subscription/profile")
          result = {
            id,
            userId: id,
            name: "Teste",
            businessName: "Ateliê",
            businessType: "food",
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
            enabled: true,
            brandId: "lucro-caseiro",
            whatsapp: null,
            customization: null,
          };
        return route.fulfill({ json: result, headers });
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base + "/recipes");
      await page
        .getByRole("button", { name: "Estatísticas de receitas", exact: true })
        .waitFor({ timeout: 120000 });
      await page
        .getByRole("button", { name: "Estatísticas de receitas", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      if (scenario === "empty")
        await dialog.getByText("Margem ainda indisponível", { exact: true }).waitFor();
      else if (scenario === "error")
        await dialog
          .getByText("Não foi possível carregar as estatísticas", { exact: true })
          .waitFor({ timeout: 30000 });
      else if (scenario !== "loading")
        await dialog.getByText("Margem negativa", { exact: true }).waitFor();
      if (scenario === "loading")
        await dialog.getByRole("progressbar", { name: "Carregando" }).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(out, `statistics-${scenario}-${width}.png`),
      });
      const overflow = await dialog.evaluate((root) =>
        [...root.querySelectorAll("*")]
          .filter((e) => {
            const s = getComputedStyle(e);
            return (
              s.overflowX !== "hidden" &&
              e.scrollWidth > e.clientWidth + 1 &&
              e.clientWidth > 0
            );
          })
          .map((e) => e.textContent?.slice(0, 80)),
      );
      if (overflow.length)
        throw new Error(`Overflow at ${width}: ${JSON.stringify(overflow)}`);
      if (!["empty", "error", "loading"].includes(scenario)) {
        await dialog
          .getByText("Brigadeiro tradicional", { exact: true })
          .scrollIntoViewIfNeeded();
        const name = dialog.getByText("Bolo de pote morango com chocolate", {
          exact: true,
        });
        const clipped = await name.evaluate(
          (e) => e.scrollWidth > e.clientWidth || e.scrollHeight > e.clientHeight,
        );
        if (clipped) throw new Error("Recipe name clipped");
        const color = await dialog
          .getByText("-R$ 245,00", { exact: true })
          .evaluate((e) => getComputedStyle(e).color);
        if (color !== (scenario === "dark" ? "rgb(232, 143, 143)" : "rgb(176, 69, 69)"))
          throw new Error(`Wrong loss color: ${color}`);
      }
      await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      await page
        .getByRole("button", { name: "Estatísticas de receitas", exact: true })
        .click();
      await dialog.waitFor();
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      if (errors.length) throw new Error(errors.join("\n"));
      if (writes.length) throw new Error(`Unexpected writes: ${writes}`);
      console.log(
        JSON.stringify({
          scenario,
          width,
          overflow: false,
          checks: ["render", "close", "reopen", "escape", "no writes"],
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
