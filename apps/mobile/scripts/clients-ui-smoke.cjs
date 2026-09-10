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
const scenario = process.env.CLIENTS_SCENARIO || "populated";
const out = path.resolve(__dirname, "../../../docs/clients-ui-validation");
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
            JSON.stringify({ clients: { dismissed: true } }),
          );
        },
        { scenario, id },
      );
      const writes = [];
      let client = {
        id: "client-1",
        userId: id,
        name: "Paula Andrade",
        phone: "11990001005",
        address: "Alameda Santos, 301",
        birthday: "1997-08-16",
        notes: "Prefere receber novidades pelo WhatsApp.",
        tags: ["corporativo"],
        totalSpent: 84,
        createdAt: "2025-01-01T00:00:00Z",
        nextContactAt: null,
        nextContactReason: null,
        nextContactNotes: null,
      };
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
        if (p === "/clients/client-1") {
          if (route.request().method() === "PATCH")
            client = { ...client, ...route.request().postDataJSON() };
          return route.fulfill({ json: client, headers });
        }
        if (p === "/clients") {
          if (route.request().method() === "POST")
            return route.fulfill({
              json: { ...client, ...route.request().postDataJSON(), id: "client-new" },
              headers,
            });
          const search = url.searchParams.get("search");
          return route.fulfill({
            json: pageData(
              search && !client.phone.includes(search.replace(/\D/g, "")) ? [] : [client],
            ),
            headers,
          });
        }
        let result = pageData();
        if (p === "/materials")
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
      await page.goto(base + "/tabs/clients?clientId=client-1", {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });
      await page
        .getByRole("button", { name: "Editar cliente", exact: true })
        .waitFor({ timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(out, "detail-" + scenario + "-" + width + ".png"),
      });
      await page.getByRole("button", { name: "Editar cliente", exact: true }).click();
      await page.getByRole("dialog", { name: "Editar cliente", exact: true }).waitFor();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(out, "edit-" + scenario + "-" + width + ".png"),
      });
      await page
        .getByRole("button", { name: "Abrir calendário de aniversário", exact: true })
        .click();
      await page.getByRole("button", { name: "17/08/1997", exact: true }).click();
      if (
        (await page
          .getByRole("textbox", { name: "Data de nascimento", exact: true })
          .inputValue()) !== "17/08/1997"
      )
        throw Error("Calendar selection failed");
      await page.getByRole("button", { name: "Próximo contato", exact: true }).click();
      await page
        .getByRole("textbox", { name: "Motivo do próximo contato", exact: true })
        .fill("Confirmar encomenda");
      await page.getByRole("button", { name: "Próximo contato", exact: true }).click();
      await page
        .getByRole("textbox", { name: "Nome do cliente", exact: true })
        .fill("Paula Andrade Silva");
      await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
      await page
        .getByRole("dialog", { name: "Editar cliente", exact: true })
        .waitFor({ state: "hidden" });
      if (
        client.name !== "Paula Andrade Silva" ||
        client.nextContactReason !== "Confirmar encomenda"
      )
        throw Error("Edit payload mismatch");
      await page
        .getByRole("button", { name: "Voltar para clientes", exact: true })
        .click();
      await page.getByRole("button", { name: "+ Novo cliente", exact: true }).click();
      await page.getByRole("dialog", { name: "Novo cliente", exact: true }).waitFor();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(out, "new-" + scenario + "-" + width + ".png"),
      });
      await page.getByRole("button", { name: "Cadastrar cliente", exact: true }).click();
      await page.getByText("Informe o nome do cliente.", { exact: true }).waitFor();
      if (writes.filter((p) => p === "/clients").length)
        throw Error("Invalid form submitted");
      await page
        .getByRole("textbox", { name: "Nome do cliente", exact: true })
        .fill("Cliente de teste");
      await page
        .getByRole("textbox", { name: "Telefone", exact: true })
        .fill("21988887777");
      await page.getByRole("button", { name: "Cadastrar cliente", exact: true }).click();
      await page
        .getByRole("dialog", { name: "Novo cliente", exact: true })
        .waitFor({ state: "hidden" });
      if (!writes.includes("/clients")) throw Error("Create not submitted");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow || errors.length) throw Error(JSON.stringify({ overflow, errors }));
      console.log(
        JSON.stringify({
          width,
          scenario,
          checks: [
            "detail",
            "edit",
            "contact-toggle",
            "save",
            "create",
            "required-name",
            "phone-mask",
          ],
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
