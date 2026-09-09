// Local-only browser verification; all external requests are intercepted.
const {
  chromium,
} = require("C:/Users/maria/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvFile } = require("node:process");
loadEnvFile(path.join(__dirname, "../../apps/mobile/.env"));
const base = process.env.VALIDATION_PREVIEW_URL || "http://localhost:8094";
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
    name: "Mariana Vasconcelos",
    onboarding_completed: true,
    business_onboarding: {
      version: 1,
      status: "completed",
      answers: {
        name: "Mariana Vasconcelos",
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
const out = path.resolve(__dirname, ".");
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1440, 320]) {
      const context = await browser.newContext({
        viewport: { width, height: 1100 },
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      const errors = [];
      const writes = [];
      const checkoutRequests = [];
      let failCheckout = false;
      await context.addInitScript(
        ({ session, key, id }) => {
          window.__paymentUrls = [];
          window.open = (url) => {
            window.__paymentUrls.push(url);
            return null;
          };
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
        if (p === "/payments/stripe/checkout") {
          checkoutRequests.push(route.request().postDataJSON());
          await new Promise((resolve) => setTimeout(resolve, 400));
          return route.fulfill(
            failCheckout
              ? { status: 503, json: { message: "Checkout indisponível" }, headers }
              : {
                  json: { url: "https://checkout.example.invalid/test-session" },
                  headers,
                },
          );
        }
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
            name: "Mariana Vasconcelos",
            businessName: "Meu negócio",
            businessType: "",
            plan: "free",
            planExpiresAt: "2030-01-01T00:00:00Z",
            createdAt: "2026-01-01T00:00:00Z",
            phone: null,
          };
        else if (p === "/subscription/limits")
          result = {
            maxSalesPerMonth: 30,
            maxClients: 20,
            maxRecipes: 5,
            maxPackaging: 3,
            maxProducts: 15,
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
      await page.goto(`${base}/plans`);
      await page
        .getByText("Escolha seu plano", { exact: true })
        .waitFor({ timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(out, `plans-light-${width}.png`) });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow) throw new Error(`Overflow at ${width}`);
      const button = page.getByRole("button", {
        name: "Continuar para pagamento",
        exact: true,
      });
      const bounds = await button.boundingBox();
      if (bounds.y + bounds.height > 750) throw new Error("Primary action below fold");
      for (const tier of ["essential", "professional"]) {
        await page
          .getByRole("button", {
            name: tier === "essential" ? "Ver plano Essencial" : "Ver plano Profissional",
            exact: true,
          })
          .click();
        for (const period of ["monthly", "annual"]) {
          await page
            .getByRole("button", {
              name: period === "monthly" ? "Mensal" : "Anual",
              exact: true,
            })
            .click();
          if (period === "annual")
            await page.screenshot({
              path: path.join(out, `plans-${tier}-annual-${width}.png`),
            });
          const before = checkoutRequests.length;
          await button.click();
          await page
            .getByRole("button", { name: "Abrindo pagamento...", exact: true })
            .waitFor();
          if (
            !(await page.getByRole("button", { name: "Anual", exact: true }).isDisabled())
          )
            throw new Error("Period not locked during checkout");
          await page.waitForFunction(
            (count) => window.__paymentUrls.length === count,
            before + 1,
          );
          await button.waitFor();
          if (
            checkoutRequests.length !== before + 1 ||
            checkoutRequests.at(-1).tier !== tier ||
            checkoutRequests.at(-1).period !== period
          )
            throw new Error("Wrong checkout selection");
          if (
            await page
              .getByRole("button", { name: "Desbloquear Profissional", exact: true })
              .count()
          )
            throw new Error("Intermediate paywall still present");
        }
      }
      if (width === 390) {
        failCheckout = true;
        await button.click();
        await page
          .getByText("Não foi possível abrir o checkout da Stripe. Tente novamente.", {
            exact: true,
          })
          .waitFor();
        await page.getByRole("button", { name: "OK", exact: true }).click();
        failCheckout = false;
        const opened = await page.evaluate(() => window.__paymentUrls.length);
        await button.click();
        await page.waitForFunction(
          (count) => window.__paymentUrls.length === count,
          opened + 1,
        );
        await button.waitFor();
      }
      await page.getByText("Seu uso atual", { exact: true }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(out, `plans-usage-${width}.png`) });
      await page.evaluate(() => localStorage.setItem("themeMode", "dark"));
      await page.reload();
      await page.getByText("Escolha seu plano", { exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(out, `plans-dark-${width}.png`) });
      console.log(
        `PASS ${width}: no overflow; primary action visible; usage rendered; all four plan/period combinations open payment directly; loading locks choices; error retry verified at 390px; dark theme renders.`,
      );
      if (errors.length) throw new Error(errors.join("\n"));
      if (writes.length) throw new Error("Unexpected writes: " + writes.join(", "));
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
