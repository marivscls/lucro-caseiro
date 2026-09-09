// Local-only browser verification; all external requests are intercepted.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");
loadEnvFile(path.join(__dirname, "../.env"));
const base = process.env.VALIDATION_PREVIEW_URL || "http://localhost:8091";
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
const out = path.resolve(__dirname, "../../../docs/form-validation");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      const errors = [];
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
        if (p === "/subscription/profile")
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
            enabled: true,
            brandId: "lucro-caseiro",
            whatsapp: null,
            customization: null,
          };
        return route.fulfill({ json: result, headers });
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(base + "/products");
      await page.waitForLoadState("networkidle");
      await page
        .getByRole("button", { name: "Cadastrar primeiro produto", exact: true })
        .waitFor({ timeout: 45000 });
      await page
        .getByRole("button", { name: "Cadastrar primeiro produto", exact: true })
        .click();
      await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
      await page.getByText("Informe o nome do produto.", { exact: true }).waitFor();
      const name = page.getByLabel("Nome do produto, obrigatório", { exact: true });
      await page.waitForFunction(() =>
        document.activeElement?.getAttribute("aria-label")?.includes("Nome do produto"),
      );
      await page.screenshot({
        path: path.join(out, `product-required-${width}.png`),
        fullPage: true,
      });
      console.log(width, (await page.locator("body").innerText()).slice(-1800));
      await name.fill("Produto de teste");
      await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
      await page.waitForFunction(
        () => document.activeElement?.getAttribute("aria-label") === "Escolher categoria",
      );
      if ((await name.inputValue()) !== "Produto de teste") throw new Error("Draft lost");
      await page.getByRole("button", { name: "Escolher categoria", exact: true }).click();
      await page.getByRole("button", { name: "Usar categoria", exact: true }).click();
      await page
        .getByText("Digite uma categoria ou escolha uma das opções.", { exact: true })
        .waitFor();
      const category = page.getByPlaceholder("Digite uma categoria nova", {
        exact: true,
      });
      if ((await category.boundingBox())?.width < 120)
        throw new Error("Category field collapsed");
      await category.fill("Presentes de teste");
      await page.getByRole("button", { name: "Usar categoria", exact: true }).click();
      await page.getByRole("button", { name: "Cadastrar produto", exact: true }).click();
      await page.waitForFunction(() =>
        document.activeElement?.getAttribute("aria-label")?.startsWith("Preço de venda"),
      );
      if (writes.length)
        throw new Error("Invalid form reached the API: " + writes.join(", "));
      if (errors.length) throw new Error(errors.join("\n"));
      console.log(
        `PASS ${width}: empty form blocked, all required errors shown, focus moved from name to category, draft preserved.`,
      );
      await page.goto(base + "/materials");
      await page
        .getByRole("button", { name: /Novo material/ })
        .first()
        .waitFor();
      await page
        .getByRole("button", { name: /Novo material/ })
        .first()
        .click();
      await page.getByRole("button", { name: "Salvar material", exact: true }).click();
      await page.getByText("Informe o nome do material.", { exact: true }).waitFor();
      await page.screenshot({
        path: path.join(out, `material-required-${width}.png`),
        fullPage: true,
      });
      if (writes.length || errors.length)
        throw new Error(
          "Material validation failed: " + [...writes, ...errors].join(", "),
        );
      console.log(`PASS ${width}: material creation blocked with inline feedback.`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
