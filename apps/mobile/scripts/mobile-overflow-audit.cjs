// Local-only browser verification; all external requests are intercepted.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");
loadEnvFile(path.join(__dirname, "../.env"));
const base = process.env.VALIDATION_PREVIEW_URL || "http://localhost:8097";
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
const scenario = process.env.CATALOG_SCENARIO || "populated";
let failures = 0;
const out = path.resolve(
  __dirname,
  process.env.AUDIT_OUTPUT || "../../../tmp/mobile-overflow",
);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of (process.env.FORM_WIDTHS || "320,390,500")
      .split(",")
      .map(Number)) {
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
          if (session) localStorage.setItem(key, JSON.stringify(session));
          localStorage.setItem(
            "onboarding-state",
            JSON.stringify({
              state: {
                completed: !!session,
                completedUserIds: session ? [id] : [],
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
        {
          session: process.env.AUDIT_PUBLIC === "1" ? null : session,
          key: `sb-${authHost.split(".")[0]}-auth-token`,
          id,
        },
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
              locationMode: "business",
              variations: [],
              addOns: [],
              packages: [],
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
            enabled: scenario !== "disabled",
            brandId: "lucro-caseiro",
            whatsapp: null,
            customization: null,
          };
        if (p.includes("templates"))
          result = [
            { id: "classico", name: "Clássico" },
            { id: "minimalista", name: "Minimalista" },
          ];

        if (process.env.FORM_EDITS === "1") {
          const fixtures = {
            packaging: {
              id: "pack-1",
              userId: id,
              name: "Caixa kraft P",
              type: "box",
              unitCost: 1.4,
              supplier: null,
              supplierId: null,
              stockQuantity: 20,
              stockAlertThreshold: 2,
              createdAt: "2026-08-01T00:00:00Z",
            },
            recipes: {
              id: "recipe-1",
              userId: id,
              name: "Brigadeiro gourmet",
              category: "Doces",
              yieldQuantity: 30,
              yieldUnit: "unidades",
              instructions: "",
              ingredients: [],
              totalCost: 10,
              costPerUnit: 0.33,
              createdAt: "2026-08-01T00:00:00Z",
            },
            purchases: {
              id: "purchase-1",
              userId: id,
              description: "Pedido do fornecedor",
              category: "material",
              amount: 125,
              paymentStatus: "pending",
              paymentMethod: "pix",
              purchasedAt: "2026-08-01",
              dueDate: "2026-09-20",
              supplierId: null,
              items: [],
              createdAt: "2026-08-01T00:00:00Z",
            },
            labels: {
              id: "label-1",
              userId: id,
              name: "Rótulo de brigadeiro",
              templateId: "minimalista",
              productId: "product-0",
              data: { productName: "Brigadeiro gourmet" },
              createdAt: "2026-08-01T00:00:00Z",
            },
          };
          const kind = p.split("/")[1];
          if (fixtures[kind] && !p.includes("templates"))
            result =
              p.split("/").length === 2 ? pageData([fixtures[kind]]) : fixtures[kind];
        }

        if (p === "/finance/summary")
          result = {
            totalIncome: 123456.78,
            totalExpenses: 23456.78,
            fixedExpenses: 20000,
            variableExpenses: 3456.78,
            profit: 100000,
            period: "2026-09",
          };
        if (p === "/sales/summary/today")
          result = {
            totalSales: 0,
            totalRevenue: 0,
            totalProfit: 0,
            count: 0,
            totalAmount: 0,
          };
        if (p === "/orders/summary")
          result = { totalOrders: 0, totalAmount: 0, received: 0, toReceive: 0 };
        if (p === "/insights")
          result = {
            months: 6,
            totalRevenue: 123456.78,
            totalSales: 20,
            monthlyRevenue: [],
            topProducts: [],
            topClients: [],
          };
        if (p === "/suppliers/overview")
          result = {
            month: {
              totalAmount: 0,
              purchaseCount: 0,
              supplierCount: 0,
              planningStatus: "none",
            },
            items: [],
          };
        if (p.includes("/analytics/admin"))
          result = {
            generatedAt: new Date().toISOString(),
            installations: { total: 0, last7Days: 0, last30Days: 0, linkedToUser: 0 },
            signups: { total: 0, last30Days: 0 },
            activation: {
              activatedUsers: 0,
              eligibleWithin7Days: 0,
              activatedWithin7Days: 0,
              rateWithin7DaysPercent: null,
            },
            active: {
              installations: { day1: 0, day7: 0, day30: 0 },
              users: { day1: 0, day7: 0, day30: 0 },
            },
            retention: {
              day1: { eligible: 0, retained: 0, percent: null },
              day7: { eligible: 0, retained: 0, percent: null },
              day30: { eligible: 0, retained: 0, percent: null },
            },
            screenUsage: [],
            featureUsage: [],
            funnel: [],
            versionAdoption: [],
            behaviorRetention: [],
          };
        if (p === "/products/velocity") result = { days: 30, fast: [], slow: [] };
        return route.fulfill({ json: result, headers });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.setDefaultNavigationTimeout(120000);
      page.on("pageerror", (error) => errors.push(error.message));

      const routes = (
        process.env.AUDIT_ROUTES ||
        "tabs,tabs/finance,tabs/clients,tabs/agenda,tabs/more,tabs/materials,tabs/new-sale,tabs/sales,products,recurring-expenses,packaging,quotes,materials,purchases,recipes,labels,catalog,pricing,pricing-complete,fiado,suppliers,services,settings,support,plans,insights,buy-materials,retail,operations,admin-metrics,onboarding,reset-password,(auth)/login,(auth)/register"
      ).split(",");
      for (const route of routes) {
        errors.length = 0;
        try {
          await page.goto(base + "/" + route, { waitUntil: "networkidle" });
          await page.getByRole("button").first().waitFor({ timeout: 120000 });
          await page
            .getByText("Preparando seu espaço", { exact: true })
            .waitFor({ state: "hidden" });
          await page.evaluate(() => document.fonts.ready);
          const snapshot = async (state) => {
            const issues = await page.evaluate(() => {
              const issues = [];
              for (const el of document.querySelectorAll("div,span,button")) {
                if (
                  !el.textContent.trim() ||
                  el.children.length ||
                  !el.getClientRects().length ||
                  el.closest('[aria-hidden="true"]')
                )
                  continue;
                const r = el.getBoundingClientRect();
                if (!r.width || !r.height) continue;
                const s = getComputedStyle(el);
                if (s.visibility === "hidden") continue;
                // Decorative label thumbnails intentionally abbreviate their miniature text.
                if (parseFloat(s.fontSize) <= 9) {
                  let decorative = false;
                  for (
                    let parent = el.parentElement;
                    parent;
                    parent = parent.parentElement
                  ) {
                    if (getComputedStyle(parent).pointerEvents === "none")
                      decorative = true;
                  }
                  if (decorative) continue;
                }
                const problems = [];
                if (
                  el.scrollWidth > el.clientWidth + 2 ||
                  el.scrollHeight > el.clientHeight + 2
                )
                  problems.push("text clipped");
                if (r.left < -2 || r.right > innerWidth + 2)
                  problems.push("outside screen");
                for (
                  let p = el.parentElement;
                  p && p !== document.body;
                  p = p.parentElement
                ) {
                  const ps = getComputedStyle(p),
                    pr = p.getBoundingClientRect();
                  if (
                    ["hidden", "auto", "scroll"].includes(ps.overflowX) &&
                    (r.left < pr.left - 2 || r.right > pr.right + 2)
                  ) {
                    problems.push("ancestor clips horizontally");
                    break;
                  }
                }
                if (problems.length)
                  issues.push({
                    text: el.textContent,
                    problems,
                    x: Math.round(r.x),
                    y: Math.round(r.y),
                    w: Math.round(r.width),
                  });
              }
              return issues;
            });
            const name =
              route.replaceAll("/", "-").replaceAll(/[()]/g, "") +
              "-" +
              width +
              "-" +
              state;
            await page.screenshot({
              path: path.join(out, name + ".png"),
              animations: "disabled",
            });
            if (issues.length || errors.length) failures++;
            fs.writeFileSync(
              path.join(out, name + ".json"),
              JSON.stringify(
                {
                  route,
                  width,
                  state,
                  url: page.url(),
                  issues,
                  errors,
                  body: await page.locator("body").innerText(),
                },
                null,
                2,
              ),
            );
            console.log(JSON.stringify({ route, width, state, issues, errors }));
          };
          await snapshot("screen");
          if (process.env.AUDIT_BOTTOM === "1") {
            await page.evaluate(() => {
              for (const node of document.querySelectorAll("div")) {
                if (["auto", "scroll"].includes(getComputedStyle(node).overflowY))
                  node.scrollTop = node.scrollHeight;
              }
            });
            await snapshot("bottom");
            await page.evaluate(() => {
              for (const node of document.querySelectorAll("div")) {
                if (["auto", "scroll"].includes(getComputedStyle(node).overflowY))
                  node.scrollTop = 0;
              }
            });
          }
          if (process.env.AUDIT_FORMS === "1") {
            const names = {
              products: "+ Novo produto",
              "recurring-expenses": "+ Novo gasto fixo",
              packaging: "Cadastrar embalagem",
              quotes: "Novo orçamento",
              materials: "+ Novo material",
              purchases: "Adicionar compra",
              recipes: "Cadastrar receita",
              labels: "Nova etiqueta",
              "tabs/finance": "Novo lançamento",
            };
            const name = names[route];
            if (name) {
              const button = page.getByRole("button", { name, exact: true }).last();
              if (await button.count()) {
                await button.click();
                await page.getByRole("dialog").last().waitFor();
                await snapshot("form");
                if (route === "tabs/finance") {
                  await page.getByRole("button", { name: "Saída", exact: true }).click();
                  await snapshot("expense");
                }
                const dialog = page.getByRole("dialog").last();
                await dialog.evaluate((el) => {
                  for (const node of el.querySelectorAll("div")) {
                    if (["auto", "scroll"].includes(getComputedStyle(node).overflowY))
                      node.scrollTop = node.scrollHeight;
                  }
                });
                await snapshot("form-bottom");
              }
            }
          }
        } catch (error) {
          failures++;
          console.log(JSON.stringify({ route, width, error: String(error), errors }));
        }
      }
      await context.close();
    }
    if (process.env.AUDIT_STRICT === "1" && failures)
      throw new Error(failures + " snapshots with clipping or runtime errors");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
