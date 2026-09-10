// Local-only browser verification; all external requests are intercepted.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");
loadEnvFile(path.join(__dirname, "../.env"));
const base = process.env.VALIDATION_PREVIEW_URL || "http://127.0.0.1:8094";
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
const out = path.resolve(__dirname, "../../../docs/home-ui-validation");
fs.mkdirSync(out, { recursive: true });
const root = path.resolve(__dirname, "../dist-home-review");
const server = require("node:http").createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, base).pathname);
  let file = path.resolve(root, "." + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
    file = path.join(root, "index.html");
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".ttf": "font/ttf",
  };
  res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
  res.end(fs.readFileSync(file));
});
const today = new Date().toLocaleDateString("en-CA");
const product = {
  id: "00000000-0000-4000-8000-000000000010",
  userId: id,
  name: "Caixa de brigadeiros",
  description: null,
  category: "Doces",
  photoUrl: null,
  extraPhotos: [],
  code: null,
  salePrice: 48.5,
  saleUnit: "unit",
  costPrice: 20,
  recipeId: null,
  stockQuantity: 1,
  stockAlertThreshold: 3,
  isComposite: false,
  variations: [],
  isActive: true,
  publicEnabled: true,
  createdAt: new Date().toISOString(),
};
const order = {
  id: "00000000-0000-4000-8000-000000000020",
  userId: id,
  title: "Entrega da Ana",
  clientId: null,
  clientName: "Ana",
  deliveryDate: today,
  deliveryTime: "16:00",
  status: "pending",
  appointmentStatus: null,
  serviceId: null,
  serviceName: null,
  serviceAddOnIds: [],
  serviceAddOnNames: [],
  amount: 120,
  deposit: 30,
  saleId: null,
  createdAt: new Date().toISOString(),
};
const sale = {
  id: "00000000-0000-4000-8000-000000000030",
  userId: id,
  status: "pending",
  total: 100,
  paidAmount: 25,
  soldAt: new Date().toISOString(),
  clientId: null,
  clientName: "Ana",
  paymentMethod: "pix",
  items: [],
  notes: null,
};
const summary = {
  totalIncome: 48.5,
  totalExpenses: 219.8,
  fixedExpenses: 0,
  variableExpenses: 219.8,
  profit: -171.3,
  period: today.slice(0, 7),
};
const checks = [];
(async () => {
  await new Promise((resolve) => server.listen(8094, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    for (const scenario of [
      { width: 390 },
      { width: 320 },
      { width: 320, textScale: 1.5 },
      { width: 1440 },
      { width: 390, service: true },
      { width: 390, empty: true },
      { width: 390, failure: true },
    ]) {
      const context = await browser.newContext({
        viewport: { width: scenario.width, height: 900 },
        reducedMotion: "reduce",
        serviceWorkers: "block",
        colorScheme: "light",
      });
      const localUser = structuredClone(user);
      localUser.user_metadata.business_onboarding.answers = {
        name: "Mariana",
        business: "Meu negócio",
        segment: scenario.service ? "services" : "craft",
        stage: "selling",
        goal: "orders",
        channels: ["whatsapp"],
      };
      const localSession = { ...session, user: localUser };
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
        { session: localSession, key: `sb-${authHost.split(".")[0]}-auth-token`, id },
      );
      const page = await context.newPage();
      const errors = [];
      const requests = [];
      page.on("pageerror", (e) => {
        errors.push(e.message);
        console.error("Browser error", e.stack);
      });
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === base) return route.continue();
        if (route.request().method() === "OPTIONS")
          return route.fulfill({ status: 204, headers });
        if (url.pathname.startsWith("/auth/v1/user"))
          return route.fulfill({ json: localUser, headers });
        if (url.pathname.startsWith("/auth/v1/token"))
          return route.fulfill({ json: localSession, headers });
        const p = url.pathname.replace("/api/v1", "");
        requests.push(p);
        let result = pageData();
        if (p === "/subscription/profile")
          result = {
            id,
            userId: id,
            name: "Mariana",
            businessType: scenario.service ? "services" : "crafts",
            plan: "professional",
            planExpiresAt: "2030-01-01T00:00:00Z",
            createdAt: "2026-01-01T00:00:00Z",
            phone: null,
          };
        else if (p === "/subscription/limits")
          result = {
            maxSalesPerMonth: null,
            maxClients: null,
            maxProducts: null,
            maxRecipes: null,
            maxPackaging: null,
            maxSuppliers: null,
            currentSalesThisMonth: 2,
            currentClients: 1,
            currentProducts: 1,
            currentRecipes: 0,
            currentPackaging: 0,
            currentSuppliers: 0,
          };
        else if (p === "/products")
          result = pageData(scenario.empty || scenario.service ? [] : [product]);
        else if (p === `/products/${product.id}`) result = product;
        else if (p === "/products/low-stock")
          result = scenario.empty || scenario.service ? [] : [product];
        else if (p === "/products/velocity") result = { days: 30, fast: [], slow: [] };
        else if (p === "/orders")
          result = {
            items: scenario.empty
              ? []
              : [
                  {
                    ...order,
                    title: scenario.service ? "Atendimento da Ana" : order.title,
                  },
                ],
          };
        else if (p === "/orders/summary")
          result = { totalOrders: 1, totalAmount: 120, received: 30, toReceive: 90 };
        else if (p === "/sales/summary/today")
          result = {
            totalAmount: scenario.empty ? 0 : 48.5,
            totalSales: scenario.empty ? 0 : 2,
            averageTicket: 24.25,
          };
        else if (p === "/sales") result = pageData(scenario.empty ? [] : [sale]);
        else if (p === `/sales/${sale.id}`) result = sale;
        else if (p === "/insights")
          result = {
            totalRevenue: 169.75,
            totalSales: 4,
            monthlyRevenue: [],
            topProducts: [],
            topClients: [],
          };
        else if (p === "/finance")
          result = pageData(
            scenario.empty
              ? []
              : [
                  {
                    id: "income",
                    type: "income",
                    amount: 48.5,
                    isFixed: false,
                    date: today,
                    description: "Recebimento de venda",
                    category: "sale",
                  },
                  {
                    id: "expense",
                    type: "expense",
                    amount: 219.8,
                    isFixed: false,
                    date: today,
                    description: "Compra de materiais",
                    category: "other",
                  },
                ],
          );
        else if (p === "/finance/summary")
          result = scenario.empty
            ? { ...summary, totalIncome: 0, totalExpenses: 0 }
            : summary;
        else if (p === "/goals/prolabore")
          result = {
            config: scenario.empty ? null : { monthlyProlaboreGoal: 2000 },
            progress: {
              currentRevenue: 169.75,
              requiredRevenue: 8850,
              remainingRevenue: 8680.25,
              progressPct: 2,
              reached: false,
              period: today.slice(0, 7),
            },
          };
        if (scenario.failure && (p.startsWith("/finance") || p === "/goals/prolabore"))
          return route.fulfill({
            status: 403,
            json: { message: "Falha simulada" },
            headers,
          });
        return route.fulfill({ json: result, headers });
      });
      await page.goto(base + "/tabs");
      await page.getByText("Ações rápidas", { exact: true }).waitFor();
      await page
        .getByText(
          scenario.failure
            ? "Não foi possível carregar sua meta."
            : scenario.empty
              ? "Definir meta"
              : "Editar meta",
          { exact: true },
        )
        .waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (scenario.textScale) {
        await page.evaluate((scale) => {
          const text = [...document.querySelectorAll('[dir="auto"]')]
            .map((element) => ({ element, style: getComputedStyle(element) }))
            .filter(({ style }) => style.fontFamily.includes("Manrope"))
            .map(({ element, style }) => ({
              element,
              size: parseFloat(style.fontSize),
              line: parseFloat(style.lineHeight),
            }));
          for (const { element, size, line } of text) {
            element.style.fontSize = `${size * scale}px`;
            if (Number.isFinite(line)) element.style.lineHeight = `${line * scale}px`;
          }
        }, scenario.textScale);
      }
      const body = await page.locator("body").innerText();
      if (!body.includes("Seu dia") || !body.includes("A receber"))
        throw new Error("Missing home section");
      if (scenario.failure && body.includes("Saldo dos lançamentos"))
        throw new Error("Unavailable finance displayed as a balance");
      if (scenario.empty && body.includes("Repor:"))
        throw new Error("Invented stock warning");
      if (scenario.service && !body.includes("Agendar atendimento"))
        throw new Error("Service shortcut missing");
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
        throw new Error("Horizontal overflow");
      const name = `home-${scenario.width}${scenario.textScale ? "-large-text" : scenario.service ? "-services" : scenario.empty ? "-empty" : scenario.failure ? "-error" : ""}`;
      await page.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
      await page.getByText("Meta do mês", { exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(out, name + "-bottom.png"),
        fullPage: true,
      });
      if (
        scenario.width === 390 &&
        !scenario.failure &&
        !scenario.empty &&
        !scenario.service
      ) {
        await page.getByRole("button", { name: /Entrega da Ana/ }).click();
        await page
          .getByText("Alterar informações da encomenda", { exact: true })
          .waitFor();
        await page.goto(base + "/tabs");
        await page.getByRole("button", { name: "Anotar despesa", exact: true }).click();
        try {
          await page
            .getByText("Novo lançamento", { exact: true })
            .waitFor({ timeout: 10000 });
        } catch (error) {
          console.error(
            "Expense navigation",
            page.url(),
            await page.locator("body").innerText(),
            errors,
            requests,
          );
          throw error;
        }
        await page.getByText("Registrar lançamento", { exact: true }).waitFor();
        await page.goto(base + "/tabs");
        await page.getByRole("button", { name: /Repor: Caixa de brigadeiros/ }).click();
        try {
          await page
            .getByText("Detalhes do produto", { exact: true })
            .waitFor({ timeout: 10000 });
        } catch (error) {
          console.error(
            "Product navigation",
            page.url(),
            await page.locator("body").innerText(),
            errors,
            requests,
          );
          throw error;
        }
      }
      if (scenario.service) {
        await page
          .getByRole("button", { name: "Agendar atendimento", exact: true })
          .click();
        await page.getByText("Novo atendimento", { exact: true }).waitFor();
      }
      if (errors.length) throw new Error(errors.join("\n"));
      checks.push({ ...scenario, passed: true, requests: [...new Set(requests)] });
      console.log("PASS", name);
      await context.close();
    }
    fs.writeFileSync(path.join(out, "checks.json"), JSON.stringify(checks, null, 2));
    console.log("PASS", checks.length, "scenarios");
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
